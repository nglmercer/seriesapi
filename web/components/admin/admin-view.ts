import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { api, type MediaItem } from "../../services/api-service";
import i18next from "../../utils/i18n";
import { ui } from "../../utils/ui";
import { ICONS } from "../../utils/icons";
import { toggleTheme } from "../../utils/dom";
import type { MediaFiltersState } from "../media/media-filters";

// Register components
import "./admin-genres-view";
import "./admin-reports-view";
import "./admin-bulk-bar";
import "./admin-media-list";
import "../shared/search-box";
import "../shared/app-pagination";
import "../media/media-filters";

@customElement("admin-view")
export class AdminView extends LitElement {
  static override styles = css`
    :host { display: block; }
    .container { max-width: 1400px; margin: 0 auto; padding: 24px; }
    .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 20px; }
    .admin-header h1 { font-size: 32px; font-weight: 900; margin: 0; letter-spacing: -1px; background: linear-gradient(135deg, var(--accent-color), #ff7675); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .admin-nav { display: flex; gap: 8px; background: var(--bg-secondary); padding: 6px; border-radius: 12px; border: 1px solid var(--border-color); }
    .nav-btn { padding: 10px 20px; border-radius: 8px; border: none; background: transparent; color: var(--text-secondary); font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 14px; display: flex; align-items: center; gap: 8px; }
    .nav-btn.active { background: var(--bg-primary); color: var(--accent-color); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .nav-btn:hover:not(.active) { color: var(--text-primary); background: rgba(0,0,0,0.03); }
    .media-controls { display: flex; gap: 12px; align-items: center; margin-bottom: 24px; flex-wrap: wrap; }
    .search-wrapper { flex: 1; min-width: 300px; }
    .filter-btn { padding: 12px 20px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.2s; }
    .filter-btn:hover { background: var(--bg-primary); border-color: var(--accent-color); }
    .filter-btn.active { border-color: var(--accent-color); background: rgba(255, 71, 87, 0.05); color: var(--accent-color); }
    .primary-btn { padding: 12px 24px; border-radius: 10px; border: none; background: var(--accent-color); color: white; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(255, 71, 87, 0.2); }
    .primary-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255, 71, 87, 0.3); }
    .filters-drawer { margin-bottom: 24px; animation: slideDown 0.3s ease-out; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `;

  @state() private mediaList: MediaItem[] = [];
  @state() private searchQuery = "";
  @state() private filters: Partial<MediaFiltersState> = {};
  @state() private currentTab: "media" | "genres" | "reports" = "media";
  @state() private editingMediaId: number | null = null;
  @state() private showFilters = false;
  @state() private selectedIds: Set<number> = new Set();
  @state() private currentPage = 1;
  @state() private pageSize = 20;
  @state() private totalItems = 0;

  override async connectedCallback() {
    super.connectedCallback();
    await this.fetchMedia();
  }

  private async fetchMedia() {
    const filters: Record<string, string> = {};
    Object.entries(this.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        filters[key] = String(value);
      }
    });
    if (this.searchQuery) filters.q = this.searchQuery;

    const res = await api.getMedia(this.currentPage, this.pageSize, filters);
    if (res.ok) {
      this.mediaList = res.data;
      const meta = res.meta as { total?: number } | undefined;
      this.totalItems = meta?.total ?? res.data.length;
    }
  }

  private toggleSelect(id: number) {
    const newSelected = new Set(this.selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    this.selectedIds = newSelected;
  }

  private toggleSelectAll() {
    if (this.selectedIds.size === this.mediaList.length && this.mediaList.length > 0) {
      this.selectedIds = new Set();
    } else {
      this.selectedIds = new Set(this.mediaList.map(m => m.id));
    }
  }

  override render() {
    if (this.editingMediaId) {
      return html`
        <admin-content-manager 
          .mediaId=${this.editingMediaId}
          @back=${() => { this.editingMediaId = null; this.fetchMedia(); }}
        ></admin-content-manager>
      `;
    }

    return html`
      <div class="container">
        <div class="admin-header">
          <div class="admin-nav">
            <button class="nav-btn ${this.currentTab === 'media' ? 'active' : ''}" @click=${() => this.currentTab = "media"}>
              ${i18next.t("admin.media_mgmt")}
            </button>
            <button class="nav-btn ${this.currentTab === 'genres' ? 'active' : ''}" @click=${() => this.currentTab = "genres"}>
              ${i18next.t("admin.genres_mgmt")}
            </button>
            <button class="nav-btn ${this.currentTab === 'reports' ? 'active' : ''}" @click=${() => this.currentTab = "reports"}>
              ${i18next.t("admin.reports_mgmt")}
            </button>
          </div>
        </div>

        ${this.renderTabContent()}
      </div>
    `;
  }

  private renderTabContent() {
    switch (this.currentTab) {
      case "genres": return html`<admin-genres-view></admin-genres-view>`;
      case "reports": return html`<admin-reports-view></admin-reports-view>`;
      default: return this.renderMediaMgmt();
    }
  }

  private renderMediaMgmt() {
    return html`
      <div class="media-mgmt">
        <div class="media-controls">
          <div class="search-wrapper">
            <search-box 
              .query=${this.searchQuery}
              @search=${(e: CustomEvent<string>) => { this.searchQuery = e.detail; this.currentPage = 1; this.fetchMedia(); }}
            ></search-box>
          </div>
          <button class="filter-btn ${this.showFilters ? 'active' : ''}" @click=${() => this.showFilters = !this.showFilters}>
            ${ICONS.filter} ${i18next.t("admin.filters")}
          </button>
          <button class="primary-btn" @click=${() => this.handleAddMedia()}>
            ${i18next.t("admin.add_new_media")}
          </button>
        </div>

        ${this.showFilters ? html`
          <div class="filters-drawer">
            <media-filters 
              .state=${this.filters}
              @filter-change=${(e: CustomEvent<Partial<MediaFiltersState>>) => { this.filters = e.detail; this.currentPage = 1; this.fetchMedia(); }}
            ></media-filters>
          </div>
        ` : ""}

        ${this.selectedIds.size > 0 ? html`
          <admin-bulk-bar 
            .selectedCount=${this.selectedIds.size}
            @action=${(e: CustomEvent<string>) => this.handleBulkAction(e.detail)}
          ></admin-bulk-bar>
        ` : ""}

        <admin-media-list 
          .media=${this.mediaList}
          .selectedIds=${this.selectedIds}
          .currentPage=${this.currentPage}
          .pageSize=${this.pageSize}
          .totalItems=${this.totalItems}
          @toggle-select=${(e: CustomEvent<number>) => this.toggleSelect(e.detail)}
          @toggle-select-all=${() => this.toggleSelectAll()}
          @edit-media=${(e: CustomEvent<number>) => this.editingMediaId = e.detail}
          @delete-media=${(e: CustomEvent<number>) => this.handleDeleteMedia(e.detail)}
          @page-change=${(e: CustomEvent<number>) => { this.currentPage = e.detail; this.fetchMedia(); }}
        ></admin-media-list>
      </div>
    `;
  }

  private async handleAddMedia() {
    const data = await ui.form<Partial<MediaItem>>(i18next.t("admin.add_new_media"), [
        { label: i18next.t("admin.form_title"), name: "title", type: "text", width: "100%" },
        { 
            label: i18next.t("admin.form_type"), name: "content_type", type: "select", width: "50%",
            options: [
                { label: "Serie", value: "serie" },
                { label: "Anime", value: "anime" },
                { label: "Movie", value: "movie" },
                { label: "Short", value: "short" }
            ]
        },
        { label: i18next.t("admin.form_status"), name: "status", type: "select", width: "50%",
            options: [
                { label: i18next.language === 'es' ? "En emisión" : "Ongoing", value: "ongoing" },
                { label: i18next.language === 'es' ? "Finalizado" : "Completed", value: "completed" },
                { label: i18next.language === 'es' ? "Próximamente" : "Upcoming", value: "upcoming" }
            ]
        }
    ]);
    if (data) {
        const res = await api.createMedia(data);
        if (res.ok) await this.fetchMedia();
    }
  }

  private async handleDeleteMedia(id: number) {
    if (await ui.confirm(i18next.t("admin.delete_confirm"))) {
      const res = await api.deleteMedia(id);
      if (res.ok) await this.fetchMedia();
    }
  }

  private async handleBulkAction(action: string) {
    if (action === "cancel") {
      this.selectedIds = new Set();
      return;
    }

    if (this.selectedIds.size === 0) return;

    if (action === "bulk-edit") {
      const data = await ui.form<{ actionType: string; status?: string; tags?: string }>(i18next.t("admin.bulk_edit"), [
        { 
          label: i18next.t("admin.action_type"), name: "actionType", type: "select", width: "100%",
          options: [
            { label: i18next.t("admin.change_status"), value: "status" },
            { label: i18next.t("admin.add_tag"), value: "add_tag" },
            { label: i18next.t("admin.replace_tags"), value: "replace_tags" },
            { label: i18next.t("admin.clear_tags"), value: "clear_tags" }
          ]
        },
        { 
          label: i18next.t("admin.new_status"), name: "status", type: "select", width: "100%",
          options: [
            { label: i18next.language === 'es' ? "En emisión" : "Ongoing", value: "ongoing" },
            { label: i18next.language === 'es' ? "Finalizado" : "Completed", value: "completed" },
            { label: i18next.language === 'es' ? "Próximamente" : "Upcoming", value: "upcoming" }
          ]
        },
        { label: i18next.t("admin.tags_comma"), name: "tags", type: "text", width: "100%" }
      ]);

      if (data) {
        const ids = Array.from(this.selectedIds);
        const bulkData: any = { ids };
        
        if (data.actionType === "status") {
          bulkData.status = data.status;
        } else if (data.actionType === "add_tag") {
          bulkData.tagAction = "add";
          bulkData.tags = data.tags?.split(",").map(t => t.trim()).filter(Boolean);
        } else if (data.actionType === "replace_tags") {
          bulkData.tagAction = "replace";
          bulkData.tags = data.tags?.split(",").map(t => t.trim()).filter(Boolean);
        } else if (data.actionType === "clear_tags") {
          bulkData.tagAction = "clear";
        }

        await api.bulkUpdateMedia(bulkData);
        this.selectedIds = new Set();
        await this.fetchMedia();
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "admin-view": AdminView;
  }
}


