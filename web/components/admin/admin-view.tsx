import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from "../../services/api-service";
import { mediaService } from "../../services/media-service";
import i18next from "../../utils/i18n";
import { ui } from "../../utils/ui";
import { ICONS } from "../../utils/icons";
import { MediaFilters } from "../media/media-filters";
import type { MediaItem } from "../../services/api-service";
import type { MediaFiltersState } from "../media/media-filters";
import { AdminGenresView } from "./admin-genres-view";
import { AdminReportsView } from "./admin-reports-view";
import { AdminBulkBar } from "./admin-bulk-bar";
import { AdminMediaList } from "./admin-media-list";

type AdminTab = "media" | "genres" | "reports";

interface AdminViewProps {
  onBack?: () => void;
}

export function AdminView({ onBack }: AdminViewProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Partial<MediaFiltersState>>({});
  const [currentTab, setCurrentTab] = useState<AdminTab>("media");
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (currentTab === "media") {
      fetchMedia();
    }
  }, [currentPage, filters, searchQuery]);

  async function fetchMedia() {
    const filterParams: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        filterParams[key] = String(value);
      }
    });
    if (searchQuery) filterParams.q = searchQuery;

    const res = await api.getMedia(currentPage, pageSize, filterParams);
    if (res.ok) {
      setMediaList(res.data);
      const meta = res.meta as { total?: number } | undefined;
      setTotalItems(meta?.total ?? res.data.length);
    }
  }

  function toggleSelect(id: number) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  }

  function toggleSelectAll() {
    if (selectedIds.size === mediaList.length && mediaList.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(mediaList.map(m => m.id)));
    }
  }

  async function handleAddMedia() {
    const data = await ui.editor<Partial<MediaItem>>("media", null, i18next.t("admin.add_new_media"));
    if (data) {
      const res = await api.createMedia(data);
      if (res.ok) await fetchMedia();
    }
  }

  async function handleQuickEdit(item: MediaItem) {
    const data = await ui.editor<Partial<MediaItem>>("media", item);
    if (data) {
      const res = await api.updateMedia(item.id, data);
      if (res.ok) {
        ui.toast(i18next.t("admin.updated_success", { defaultValue: "Updated successfully" }), "success");
        await fetchMedia();
      }
    }
  }

  async function handleDeleteMedia(id: number) {
    if (await ui.confirm(i18next.t("admin.delete_confirm"))) {
      const res = await api.deleteMedia(id);
      if (res.ok) await fetchMedia();
    }
  }

  async function handleBulkAction(action: string) {
    if (action === "cancel") {
      setSelectedIds(new Set());
      return;
    }

    if (selectedIds.size === 0) return;

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
        const ids = Array.from(selectedIds);
        const bulkData: any = { ids };

        if (data.actionType === "status") {
          bulkData.status = data.status;
        } else if (data.actionType === "add_tag") {
          bulkData.tagAction = "add";
          bulkData.tags = data.tags?.split(",").map((t: string) => t.trim()).filter(Boolean);
        } else if (data.actionType === "replace_tags") {
          bulkData.tagAction = "replace";
          bulkData.tags = data.tags?.split(",").map((t: string) => t.trim()).filter(Boolean);
        } else if (data.actionType === "clear_tags") {
          bulkData.tagAction = "clear";
        }

        await api.bulkUpdateMedia(bulkData);
        setSelectedIds(new Set());
        await fetchMedia();
      }
    }
  }

  if (editingMediaId) {
    return (
      <admin-content-manager
        mediaId={editingMediaId}
        onBack={() => { setEditingMediaId(null); fetchMedia(); }}
      />
    );
  }

  return (
    <div class="container">
      <div class="admin-header">
        <div class="admin-nav">
          <button class={`nav-btn ${currentTab === 'media' ? 'active' : ''}`} onClick={() => setCurrentTab("media")}>
            {i18next.t("admin.media_mgmt")}
          </button>
          <button class={`nav-btn ${currentTab === 'genres' ? 'active' : ''}`} onClick={() => setCurrentTab("genres")}>
            {i18next.t("admin.genres_mgmt")}
          </button>
          <button class={`nav-btn ${currentTab === 'reports' ? 'active' : ''}`} onClick={() => setCurrentTab("reports")}>
            {i18next.t("admin.reports_mgmt")}
          </button>
        </div>
      </div>

      {currentTab === "genres" && <AdminGenresView />}
      {currentTab === "reports" && <AdminReportsView />}
      {currentTab === "media" && (
        <div class="media-mgmt">
          <div class="media-controls">
            <div class="search-wrapper">
              <div class="search-box">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onInput={(e) => { setSearchQuery((e.target as HTMLInputElement).value); setCurrentPage(1); }}
                  onKeyDown={(e) => { if (e.key === "Enter") fetchMedia(); }}
                />
              </div>
            </div>
            <button class={`filter-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
              {ICONS.filter} {i18next.t("admin.filters")}
            </button>
            <button class="primary-btn" onClick={handleAddMedia}>
              {i18next.t("admin.add_new_media")}
            </button>
          </div>

          {showFilters && (
            <div class="filters-drawer">
              <MediaFilters
                state={filters}
                onFilterChange={(f) => { setFilters(f); setCurrentPage(1); }}
              />
            </div>
          )}

          {selectedIds.size > 0 && (
            <AdminBulkBar
              selectedCount={selectedIds.size}
              onAction={handleBulkAction}
            />
          )}

          <AdminMediaList
            media={mediaList}
            selectedIds={selectedIds}
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onQuickEdit={handleQuickEdit}
            onEditMedia={setEditingMediaId}
            onDeleteMedia={handleDeleteMedia}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
}

export function AdminBulkBar({ selectedCount, onAction }: { selectedCount: number; onAction: (action: string) => void }) {
  if (selectedCount === 0) return null;

  return (
    <div class="bulk-actions">
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong style={{ fontSize: '16px' }}>
            {selectedCount} selected
          </strong>
          <span style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>Bulk Actions</span>
        </div>
        <div style={{ height: '30px', width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button class="bulk-edit-btn" onClick={() => onAction("bulk-edit")}>
            Bulk Edit
          </button>
        </div>
      </div>
      <button class="cancel-btn" onClick={() => onAction("cancel")}>
        Cancel
      </button>
    </div>
  );
}

export function AdminMediaList({
  media,
  selectedIds,
  currentPage,
  pageSize,
  totalItems,
  onToggleSelect,
  onToggleSelectAll,
  onQuickEdit,
  onEditMedia,
  onDeleteMedia,
  onPageChange
}: {
  media: MediaItem[];
  selectedIds: Set<number>;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onQuickEdit: (item: MediaItem) => void;
  onEditMedia: (id: number) => void;
  onDeleteMedia: (id: number) => void;
  onPageChange: (page: number) => void;
}) {
  if (media.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
        No results found
      </div>
    );
  }

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div>
      <div class="media-admin-list">
        {media.map(item => (
          <div class={`admin-card ${selectedIds.has(item.id) ? 'selected' : ''}`}>
            <div class="checkbox-wrapper">
              <input
                type="checkbox"
                checked={selectedIds.has(item.id)}
                onChange={() => onToggleSelect(item.id)}
              />
            </div>
            <div class="card-main">
              <div class="card-info">
                <div class="card-title-row">
                  <div class="card-title">{item.title}</div>
                  <div class="badge">{item.content_type}</div>
                </div>
                <div class="card-meta">
                  <span>ID: {item.id}</span>
                  <span>{item.status}</span>
                </div>
              </div>
            </div>
            <div class="actions">
              <button class="action-btn" onClick={() => onQuickEdit(item)}>
                Quick Edit
              </button>
              <button class="action-btn" onClick={() => onEditMedia(item.id)}>
                Manage
              </button>
              <button class="action-btn danger" onClick={() => onDeleteMedia(item.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div class="pagination-container">
        <button
          class="pagination-btn prev-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ←
        </button>
        <div class="info-text">
          <span class="current-page">{currentPage}</span>
          <span class="total-items">{totalItems} items</span>
        </div>
        <button
          class="pagination-btn next-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          →
        </button>
      </div>
    </div>
  );
}

export function AdminGenresView() {
  const [genres, setGenres] = useState<any[]>([]);

  useEffect(() => {
    fetchGenres();
  }, []);

  async function fetchGenres() {
    const res = await api.getGenres();
    if (res.ok) {
      setGenres(res.data as any[]);
    }
  }

  async function handleAdd() {
    const data = await ui.editor<{ name: string }>("genre", null, i18next.t("admin.new_genre"));
    if (data?.name) {
      const res = await api.createGenre(data.name);
      if (res.ok) {
        await fetchGenres();
      } else {
        await ui.alert("Error creating genre");
      }
    }
  }

  async function handleEdit(id: string | number, oldName: string) {
    const data = await ui.editor<{ name: string }>("genre", { name: oldName });
    if (data?.name && data.name !== oldName) {
      const res = await api.updateGenre(id, data.name);
      if (res.ok) {
        await fetchGenres();
      } else {
        await ui.alert("Error updating genre");
      }
    }
  }

  async function handleDelete(id: string | number) {
    if (await ui.confirm(i18next.t("admin.delete_genre_confirm"))) {
      const res = await api.deleteGenre(id);
      if (res.ok) {
        await fetchGenres();
      } else {
        await ui.alert("Error deleting genre");
      }
    }
  }

  return (
    <div>
      <div class="header">
        <h2>{i18next.t("admin.manage_genres")}</h2>
        <button class="primary" onClick={handleAdd}>{i18next.t("admin.new_genre")}</button>
      </div>

      <div class="genres-grid">
        {genres.map(g => (
          <div class="genre-card">
            <div class="genre-info">
              <span class="genre-name">{g.name}</span>
              <span class="genre-meta">ID: {g.id}</span>
              <span class="genre-meta">Slug: {g.slug}</span>
            </div>
            <div class="actions">
              <button onClick={() => handleEdit(g.id, g.name)}>{i18next.t("admin.edit")}</button>
              <button class="danger" onClick={() => handleDelete(g.id)}>{i18next.t("admin.delete")}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminReportsView() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await api.getReports();
    if (res.ok && res.data) {
      setReports(res.data);
    }
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;

  if (!reports.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
        No reports found.
      </div>
    );
  }

  return (
    <div>
      <h2>User Reports</h2>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Entity</th>
              <th>Locale</th>
              <th>Message</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr>
                <td>#{r.id}</td>
                <td>
                  <span class="type" style={{ background: r.report_type === 'missing_translation' ? '#ff9f43' : 'var(--accent)' }}>
                    {r.report_type.replace('_', ' ')}
                  </span>
                </td>
                <td>{r.entity_type} {r.entity_id}</td>
                <td>{r.locale || '-'}</td>
                <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.message || '-'}
                </td>
                <td>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: r.status === 'resolved' ? '#1dd1a1' : 'var(--bg-secondary)' }}>
                    {r.status}
                  </span>
                </td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}