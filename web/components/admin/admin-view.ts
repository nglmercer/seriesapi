import { api, type MediaItem } from "../../services/api-service";
import i18next from "../../utils/i18n";
import { h } from "../../utils/dom";
import { ui } from "../../utils/ui";
import { AdminMediaForm } from "./admin-media-form";
import { AdminContentManager } from "./admin-content-manager";
import { AdminBulkBar } from "./admin-bulk-bar";
import { AdminMediaList } from "./admin-media-list";
import { AppPagination } from "../shared/app-pagination";
import { MediaFilters } from "../media/media-filters";
import type { MediaFiltersState } from "../media/media-filters";

//not delete import its necesary for load and register, when import types or use for types never register the component
//its necesary allways import the component to use it
import "./admin-genres-view";
import "./admin-reports-view";
import "./admin-bulk-bar";
import "./admin-media-list";
import "../shared/search-box";
import "../shared/app-pagination";

export class AdminView extends HTMLElement {
  private mediaList: MediaItem[] = [];
  private searchQuery = "";
  private filters: Partial<MediaFiltersState> = {};
  private currentTab: "media" | "genres" | "reports" = "media";
  private editingMediaId: number | null = null;
  private showFilters = false;
  private selectedIds: Set<number> = new Set();
  
  // Pagination
  private currentPage = 1;
  private pageSize = 20;
  private totalItems = 0;

  async connectedCallback() {
    await this.fetchMedia();
    this.render();
  }

  private async fetchMedia() {
    const filters: Record<string, string> = {};
    
    // Map filters to strings for the API
    Object.entries(this.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        filters[key] = String(value);
      }
    });

    if (this.searchQuery) filters.q = this.searchQuery;

    const res = await api.getMedia(this.currentPage, this.pageSize, filters);
    if (res.ok) {
      this.mediaList = res.data;
      // The API returns pagination info in 'meta'
      const meta = res.meta as { total?: number } | undefined;
      this.totalItems = meta?.total ?? res.data.length;
    }
  }

  private toggleSelect(id: number) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.render();
  }

  private toggleSelectAll() {
    if (this.selectedIds.size === this.mediaList.length && this.mediaList.length > 0) {
      this.selectedIds.clear();
    } else {
      this.mediaList.forEach(m => this.selectedIds.add(m.id));
    }
    this.render();
  }

  private async handleBulkAction(action: string) {
    if (action === "cancel") {
      this.selectedIds.clear();
      this.render();
      return;
    }

    if (this.selectedIds.size === 0) return;

    if (action === "bulk-edit") {
      const fields = [
        { 
          label: i18next.t("admin.action_type", { defaultValue: "Action Type" }), 
          name: "actionType", 
          type: "select", 
          options: [
            { label: i18next.t("admin.change_status", { defaultValue: "Change Status" }), value: "status" },
            { label: i18next.t("admin.add_tag", { defaultValue: "Add Tag" }), value: "add_tag" },
            { label: i18next.t("admin.replace_tags", { defaultValue: "Replace Tags" }), value: "replace_tags" },
            { label: i18next.t("admin.clear_tags", { defaultValue: "Clear Tags" }), value: "clear_tags" }
          ]
        },
        { 
          label: i18next.t("admin.value", { defaultValue: "Value" }), 
          name: "value", 
          type: "text",
          placeholder: i18next.t("admin.bulk_value_placeholder", { defaultValue: "Status or Tags..." })
        }
      ];

      const resModal = await ui.form<{ actionType: string, value: string }>(
        i18next.t("admin.bulk_edit_title", { count: this.selectedIds.size, defaultValue: `Bulk Edit (${this.selectedIds.size} items)` }),
        fields
      );

      if (!resModal) return;

      const ids = Array.from(this.selectedIds);
      let status: string | undefined;
      let tags: string[] | undefined;
      let tagAction: "add" | "replace" | "clear" | undefined;

      if (resModal.actionType === "status") {
        status = resModal.value;
      } else if (resModal.actionType === "add_tag") {
        tags = [resModal.value];
        tagAction = "add";
      } else if (resModal.actionType === "replace_tags") {
        tags = resModal.value.split(",").map(s => s.trim()).filter(Boolean);
        tagAction = "replace";
      } else if (resModal.actionType === "clear_tags") {
        tags = [];
        tagAction = "clear";
      }

      const res = await api.bulkUpdateMedia({ ids, status, tags, tagAction });
      if (res.ok) {
        ui.toast(i18next.t("admin.bulk_success", { defaultValue: "Bulk update successful" }));
        this.selectedIds.clear();
        await this.fetchMedia();
        this.render();
      }
    }
  }

  private handleFiltersChange(e: CustomEvent<MediaFiltersState>) {
    this.filters = e.detail;
    this.currentPage = 1;
    this.fetchMedia().then(() => this.render());
  }

  private async handleSearch(e: CustomEvent<string>) {
    this.searchQuery = e.detail || "";
    this.currentPage = 1;
    await this.fetchMedia();
    this.render();
  }

  private async handlePageChange(e: CustomEvent<number>) {
    this.currentPage = e.detail;
    await this.fetchMedia();
    this.render();
  }

  private async handleItemAction(e: CustomEvent<{ action: string, id: number }>) {
    const { action, id } = e.detail;
    const item = this.mediaList.find(m => m.id === id);
    if (!item) return;

    if (action === "content_mgr") {
      this.openContentManager(id);
    } else if (action === "edit") {
      this.openEditMedia(item);
    } else if (action === "delete") {
      this.handleDeleteMedia(id);
    }
  }

  private openEditMedia(media: MediaItem | null) {
    AdminMediaForm.open(media, async () => {
      await this.fetchMedia();
      this.render();
    });
  }

  private openContentManager(id: number) {
    this.editingMediaId = id;
    this.render();
  }

  private async handleDeleteMedia(id: number) {
    if (await ui.confirm(i18next.t("admin.delete_confirm"))) {
      await api.deleteMedia(id);
      await this.fetchMedia();
      this.render();
    }
  }

  render() {
    this.innerHTML = "";
    const container = h("div", { className: "container" });

    if (this.editingMediaId) {
        const mgr = document.createElement("admin-content-manager") as AdminContentManager;
        mgr.setMedia(this.editingMediaId);
        mgr.addEventListener("back", () => {
           this.editingMediaId = null;
           this.render();
        });
        container.appendChild(mgr);
        this.appendChild(container);
        return;
    }

    const nav = h("div", { className: "admin-tabs", style: "display: flex; gap: 20px; border-bottom: 2px solid var(--border-color); margin-bottom: 20px;" },
      h("button", {
        className: this.currentTab === 'media' ? 'active' : '',
        onclick: () => { this.currentTab = 'media'; this.currentPage = 1; this.render(); },
        style: `border-radius:0; border:none; background:transparent; cursor:pointer; padding: 10px; ${this.currentTab === 'media' ? 'border-bottom: 3px solid var(--accent-color)' : ''}`
      }, i18next.t("admin.media")),
      h("button", {
        className: this.currentTab === 'genres' ? 'active' : '',
        onclick: () => { this.currentTab = 'genres'; this.render(); },
        style: `border-radius:0; border:none; background:transparent; cursor:pointer; padding: 10px; ${this.currentTab === 'genres' ? 'border-bottom: 3px solid var(--accent-color)' : ''}`
      }, i18next.t("admin.genres")),
      h("button", {
        className: this.currentTab === 'reports' ? 'active' : '',
        onclick: () => { this.currentTab = 'reports'; this.render(); },
        style: `border-radius:0; border:none; background:transparent; cursor:pointer; padding: 10px; ${this.currentTab === 'reports' ? 'border-bottom: 3px solid var(--accent-color)' : ''}`
      }, i18next.t("admin.reports", { defaultValue: "Reports" }))
    );

    let content;
    if (this.currentTab === 'media') {
      const bulkBar = document.createElement("admin-bulk-bar") as AdminBulkBar;
      bulkBar.selectedCount = this.selectedIds.size;
      bulkBar.addEventListener("bulk-action", (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        this.handleBulkAction(customEvent.detail);
      });

      const mediaList = document.createElement("admin-media-list") as AdminMediaList;
      mediaList.data = { list: this.mediaList, selected: this.selectedIds };
      mediaList.addEventListener("toggle-select", (e: Event) => {
        const customEvent = e as CustomEvent<number>;
        this.toggleSelect(customEvent.detail);
      });
      mediaList.addEventListener("toggle-select-all", () => this.toggleSelectAll());
      mediaList.addEventListener("item-action", (e: Event) => {
        this.handleItemAction(e as CustomEvent<{ action: string, id: number }>);
      });

      const pagination = document.createElement("app-pagination") as AppPagination;
      pagination.info = { page: this.currentPage, pageSize: this.pageSize, total: this.totalItems };
      pagination.addEventListener("page-change", (e: Event) => {
        this.handlePageChange(e as CustomEvent<number>);
      });

      const searchBox = h("search-box", { 
        placeholder: i18next.t("admin.search_placeholder"),
        buttonText: i18next.t("admin.search"),
        query: this.searchQuery,
        showResults: false, 
        style: "flex: 1;"
      });
      searchBox.addEventListener("search", (e: Event) => {
        this.handleSearch(e as CustomEvent<string>);
      });

      content = h("div", {},
        h("div", { style: "display:flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 20px;" },
          h("div", { style: "display:flex; align-items: center; gap: 10px; flex: 1; max-width: 600px;" },
            searchBox,
            h("button", { 
               onclick: () => { this.showFilters = !this.showFilters; this.render(); },
               className: this.showFilters ? "active" : "",
               style: "height: 48px; padding: 0 16px; display: flex; align-items: center; gap: 8px; font-weight: 600;"
            }, 
              h("span", { innerHTML: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>', style: "display:flex; align-items:center;" }),
              i18next.t("admin.filters", { defaultValue: "Filters" })
            )
          ),
          h("button", { onclick: () => this.openEditMedia(null), className: "primary", style: "height: 48px; border-radius: 10px; font-weight: 600;" }, i18next.t("admin.new_entry"))
        ),
        bulkBar,
        this.showFilters ? h("div", { style: "margin-bottom: 20px;" },
           (() => {
             const filterEl = document.createElement("media-filters") as MediaFilters;
             Object.assign(filterEl, this.filters);
             filterEl.addEventListener("filters-change", (e: Event) => {
               this.handleFiltersChange(e as CustomEvent<MediaFiltersState>);
             });
             return filterEl;
           })()
        ) : null,
        mediaList,
        pagination
      );
    } else if (this.currentTab === 'genres') {
      content = h("admin-genres-view");
    } else if (this.currentTab === 'reports') {
      content = document.createElement("admin-reports-view");
    }

    container.appendChild(nav);
    if (content) container.appendChild(content);
    this.appendChild(container);
  }
}

customElements.define("admin-view", AdminView);


