import { api, type MediaItem } from "../../services/api-service";
import i18next from "../../utils/i18n";
import { h } from "../../utils/dom";
import { ui } from "../../utils/ui";
import { AdminMediaForm } from "./admin-media-form";
import "./admin-genres-view";
import "./admin-reports-view";
import "./admin-content-manager";
import "../shared/search-box";
import "../media/media-filters";
import type { MediaFiltersState } from "../media/media-filters";

export class AdminView extends HTMLElement {
  private mediaList: MediaItem[] = [];
  private searchQuery = "";
  private filters: Partial<MediaFiltersState> = {};
  private currentTab: "media" | "genres" | "reports" = "media";
  private editingMediaId: number | null = null; // Used for Content Manager
  private showFilters = false;
  private selectedIds: Set<number> = new Set();

  async connectedCallback() {
    await this.fetchMedia();
    this.render();
  }

  private async fetchMedia() {
    // MediaFiltersState now uses snake_case keys matching the API
    const filters: Record<string, string> = { ...this.filters as any };
    if (this.searchQuery) filters.q = this.searchQuery;
    
    // Clean up empty values
    Object.keys(filters).forEach(k => {
      if (!filters[k]) delete filters[k];
    });

    const res = await api.getMedia(1, 40, filters);
    if (res.ok) {
      this.mediaList = res.data;
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
    if (this.selectedIds.size === 0) return;

    const ids = Array.from(this.selectedIds);
    let status: string | undefined;
    let tags: string[] | undefined;
    let tagAction: "add" | "replace" | "clear" | undefined;

    if (action === "status") {
      const resPrompt = await ui.prompt(i18next.t("admin.new_status", { defaultValue: "New Status" }), "ongoing");
      if (!resPrompt) return;
      status = resPrompt;
    } else if (action === "add_tag") {
      const tag = await ui.prompt(i18next.t("admin.tag_slug", { defaultValue: "Tag Slug" }), "");
      if (!tag) return;
      tags = [tag];
      tagAction = "add";
    } else if (action === "replace_tags") {
      const tagStr = await ui.prompt(i18next.t("admin.tags_comma", { defaultValue: "Tags (comma separated)" }), "");
      if (tagStr === null) return;
      tags = tagStr.split(",").map(s => s.trim()).filter(Boolean);
      tagAction = "replace";
    } else if (action === "clear_tags") {
      if (!await ui.confirm(i18next.t("admin.confirm_clear_tags", { defaultValue: "Are you sure you want to clear all tags for selected items?" }))) return;
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

  private handleFiltersChange(e: CustomEvent<MediaFiltersState>) {
    this.filters = e.detail;
    this.fetchMedia().then(() => this.render());
  }

  private async handleSearch(e: CustomEvent) {
    this.searchQuery = e.detail || "";
    await this.fetchMedia();
    this.render();
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
        const mgr = document.createElement("admin-content-manager") as any;
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
        onclick: () => { this.currentTab = 'media'; this.render(); },
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
      const bulkBar = this.selectedIds.size > 0 ? h("div", { 
        className: "bulk-actions", 
        style: "background: var(--accent-color); color: white; padding: 12px 20px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; animation: slideDown 0.3s ease;" 
      },
        h("div", { style: "display: flex; align-items: center; gap: 15px;" },
          h("strong", {}, i18next.t("admin.selected_count", { count: this.selectedIds.size, defaultValue: `${this.selectedIds.size} selected` })),
          h("button", { 
            onclick: () => this.handleBulkAction("status"),
            style: "background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px;"
          }, i18next.t("admin.change_status", { defaultValue: "Change Status" })),
          h("button", { 
            onclick: () => this.handleBulkAction("add_tag"),
            style: "background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px;"
          }, i18next.t("admin.add_tag", { defaultValue: "Add Tag" })),
          h("button", { 
            onclick: () => this.handleBulkAction("replace_tags"),
            style: "background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px;"
          }, i18next.t("admin.replace_tags", { defaultValue: "Replace Tags" })),
          h("button", { 
            onclick: () => this.handleBulkAction("clear_tags"),
            style: "background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px;"
          }, i18next.t("admin.clear_tags", { defaultValue: "Clear Tags" }))
        ),
        h("button", { 
          onclick: () => { this.selectedIds.clear(); this.render(); },
          style: "background: transparent; border: 1px solid rgba(255,255,255,0.5); color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px;"
        }, i18next.t("admin.cancel", { defaultValue: "Cancel" }))
      ) : null;

      content = h("div", {},
        h("div", { style: "display:flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 20px;" },
          h("div", { style: "display:flex; align-items: center; gap: 10px; flex: 1; max-width: 600px;" },
            h("search-box", { 
              placeholder: i18next.t("admin.search_placeholder"),
              buttonText: i18next.t("admin.search"),
              query: this.searchQuery,
              showResults: false, 
              onsearch: (e: CustomEvent) => this.handleSearch(e),
              style: "flex: 1;"
            }),
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
           h("media-filters", {
             ...this.filters as any,
             "onfilters-change": (e: CustomEvent) => this.handleFiltersChange(e)
           } as any)
        ) : null,
        h("div", { style: "margin-bottom: 10px; display: flex; align-items: center; gap: 10px; padding: 0 15px;" },
          h("input", { 
            type: "checkbox", 
            checked: this.selectedIds.size === this.mediaList.length && this.mediaList.length > 0,
            onchange: () => this.toggleSelectAll()
          }),
          h("span", { style: "font-size: 13px; color: var(--text-secondary);" }, i18next.t("admin.select_all", { defaultValue: "Select All" }))
        ),
        h("div", { className: "media-admin-list", style: "display: grid; gap: 10px;" },
          ...this.mediaList.map(item => h("div", { className: `card ${this.selectedIds.has(item.id) ? 'selected' : ''}`, style: `display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; ${this.selectedIds.has(item.id) ? 'border: 2px solid var(--accent-color); background: var(--bg-secondary);' : ''}` },
            h("div", { style: "display: flex; align-items: center; gap: 12px;" },
              h("input", { 
                type: "checkbox", 
                checked: this.selectedIds.has(item.id),
                onclick: (e: Event) => e.stopPropagation(),
                onchange: () => this.toggleSelect(item.id)
              }),
              h("div", { onclick: () => this.toggleSelect(item.id), style: "cursor: pointer;" },
                h("div", { style: "display:flex; align-items:center; gap:8px;" },
                  h("strong", {}, item.title),
                  !item.translation_id ? h("span", { 
                    style: "background: var(--error-color); color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase;" 
                  }, i18next.t("admin.missing_translation", { defaultValue: "MISSING " + i18next.language.toUpperCase() })) : null
                ),
                h("div", { style: "color:var(--text-secondary); font-size:12px;" }, `${item.content_type} | ID: ${item.id} | Slug: ${item.slug} | Status: ${item.status}`)
              )
            ),
            h("div", { style: "display: flex; gap: 8px;" },
              h("button", { onclick: () => this.openContentManager(item.id) }, i18next.t("admin.content_mgr")),
              h("button", { onclick: () => this.openEditMedia(item) }, i18next.t("admin.edit")),
              h("button", { onclick: () => this.handleDeleteMedia(item.id), className: "danger", style: "background: var(--error-color); color:white;" }, i18next.t("admin.delete"))
            )
          ))
        )
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

