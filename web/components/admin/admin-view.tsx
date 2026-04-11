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
import { AdminContentManager } from "./admin-content-manager";

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
      <AdminContentManager
        mediaId={editingMediaId}
        onBack={() => { setEditingMediaId(null); fetchMedia(); }}
      />
    );
  }

  return (
    <div class="container mx-auto px-5 py-8">
      <div class="mb-8">
        <div class="flex gap-2 p-1 bg-secondary rounded-xl w-fit">
          <button class={`px-6 py-2.5 text-sm font-bold rounded-lg cursor-pointer transition-all ${currentTab === 'media' ? "bg-primary text-accent shadow-sm" : "text-text-secondary hover:text-primary"}`} onClick={() => setCurrentTab("media")}>
            {i18next.t("admin.media_mgmt")}
          </button>
          <button class={`px-6 py-2.5 text-sm font-bold rounded-lg cursor-pointer transition-all ${currentTab === 'genres' ? "bg-primary text-accent shadow-sm" : "text-text-secondary hover:text-primary"}`} onClick={() => setCurrentTab("genres")}>
            {i18next.t("admin.genres_mgmt")}
          </button>
          <button class={`px-6 py-2.5 text-sm font-bold rounded-lg cursor-pointer transition-all ${currentTab === 'reports' ? "bg-primary text-accent shadow-sm" : "text-text-secondary hover:text-primary"}`} onClick={() => setCurrentTab("reports")}>
            {i18next.t("admin.reports_mgmt")}
          </button>
        </div>
      </div>

      {currentTab === "genres" && <AdminGenresView />}
      {currentTab === "reports" && <AdminReportsView />}
      {currentTab === "media" && (
        <div class="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          <div class="p-6 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between bg-secondary/30">
            <div class="flex-1 w-full max-w-md">
              <div class="relative">
                <input
                  class="w-full pl-4 pr-4 py-2.5 bg-primary border border-border rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onInput={(e) => { setSearchQuery((e.target as HTMLInputElement).value); setCurrentPage(1); }}
                  onKeyDown={(e) => { if (e.key === "Enter") fetchMedia(); }}
                />
              </div>
            </div>
            <div class="flex items-center gap-3 w-full md:w-auto">
              <button class={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-bold transition-all shadow-sm ${showFilters ? "bg-accent/10 border-accent text-accent" : "bg-primary border-border text-text-secondary hover:text-primary"}`} onClick={() => setShowFilters(!showFilters)}>
                {ICONS.filter} {i18next.t("admin.filters")}
              </button>
              <button class="px-6 py-2.5 bg-accent text-white font-bold rounded-xl hover:bg-accent-hover transition-all shadow-md flex-1 md:flex-none" onClick={handleAddMedia}>
                {i18next.t("admin.add_new_media")}
              </button>
            </div>
          </div>

          {showFilters && (
            <div class="p-6 bg-secondary/10 border-b border-border">
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
      <div class="text-center py-10 text-text-secondary">
        No results found
      </div>
    );
  }

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div>
      <div class="flex flex-col">
        {media.map(item => (
          <div class={`flex items-center gap-4 p-4 border-b border-border hover:bg-secondary/20 transition-colors ${selectedIds.has(item.id) ? "bg-accent/5" : ""}`}>
            <div class="shrink-0">
              <input
                class="w-5 h-5 accent-accent"
                type="checkbox"
                checked={selectedIds.has(item.id)}
                onChange={() => onToggleSelect(item.id)}
              />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <div class="text-sm font-bold text-primary truncate">{item.title}</div>
                <div class="px-2 py-0.5 bg-secondary border border-border rounded text-[10px] font-bold uppercase tracking-wider text-text-secondary">{item.content_type}</div>
              </div>
              <div class="text-xs text-text-secondary flex gap-3">
                <span>ID: {item.id}</span>
                <span class="capitalize">{item.status}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button class="px-3 py-1.5 bg-secondary text-primary text-xs font-bold rounded border border-border hover:bg-border transition-all" onClick={() => onQuickEdit(item)}>
                Quick Edit
              </button>
              <button class="px-3 py-1.5 bg-secondary text-primary text-xs font-bold rounded border border-border hover:bg-border transition-all" onClick={() => onEditMedia(item.id)}>
                Manage
              </button>
              <button class="px-3 py-1.5 bg-secondary text-error text-xs font-bold rounded border border-border hover:bg-error hover:text-white transition-all" onClick={() => onDeleteMedia(item.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div class="flex items-center justify-between p-6 bg-secondary/10">
        <button   
          class="px-4 py-2 bg-primary border border-border rounded-lg text-sm font-bold text-text-secondary hover:text-primary disabled:opacity-40 transition-all shadow-sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ←
        </button>
        <div class="text-sm font-bold text-text-secondary">
          <span class="text-accent">{currentPage}</span> / <span class="text-primary">{totalItems} items</span>
        </div>
        <button
          class="px-4 py-2 bg-primary border border-border rounded-lg text-sm font-bold text-text-secondary hover:text-primary disabled:opacity-40 transition-all shadow-sm"
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
    <div class="bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-6">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold text-primary">{i18next.t("admin.manage_genres")}</h2>
        <button class="px-6 py-2.5 bg-accent text-white font-bold rounded-xl hover:bg-accent-hover transition-all shadow-md" onClick={handleAdd}>{i18next.t("admin.new_genre")}</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {genres.map(g => (
          <div class="p-4 bg-secondary/50 border border-border rounded-xl flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-1">
              <span class="text-lg font-bold text-primary">{g.name}</span>
              <span class="text-xs text-text-secondary">ID: {g.id}</span>
              <span class="text-xs text-text-secondary">Slug: {g.slug}</span>
            </div>
            <div class="flex items-center gap-2">
              <button class="flex-1 px-3 py-1.5 bg-primary text-primary text-xs font-bold rounded border border-border hover:bg-border transition-all" onClick={() => handleEdit(g.id, g.name)}>{i18next.t("admin.edit")}</button>
              <button class="flex-1 px-3 py-1.5 bg-primary text-error text-xs font-bold rounded border border-border hover:bg-error hover:text-white transition-all" onClick={() => handleDelete(g.id)}>{i18next.t("admin.delete")}</button>
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

  if (loading) return (
    <div class="flex items-center justify-center p-20">
      <div class="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!reports.length) {
    return (
      <div class="bg-card border border-border rounded-2xl shadow-xl p-10 text-center text-text-secondary">
        No reports found.
      </div>
    );
  }

  return (
    <div class="bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-6">
      <h2 class="text-2xl font-bold text-primary mb-8">User Reports</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-secondary/50">
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border">ID</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border">Type</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border">Entity</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border">Locale</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border">Message</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border">Status</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border">Date</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr class="hover:bg-secondary/20 transition-colors border-b border-border last:border-0">
                <td class="px-4 py-4 text-sm font-medium text-text-secondary">#{r.id}</td>
                <td class="px-4 py-4">
                  <span class={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white ${r.report_type === 'missing_translation' ? 'bg-orange-500' : 'bg-accent'}`}>
                    {r.report_type.replace('_', ' ')}
                  </span>
                </td>
                <td class="px-4 py-4 text-sm font-semibold text-primary">{r.entity_type} {r.entity_id}</td>
                <td class="px-4 py-4 text-sm text-text-secondary">{r.locale || '-'}</td>
                <td class="px-4 py-4 text-sm text-text-secondary max-w-[300px] truncate" title={r.message}>
                  {r.message || '-'}
                </td>
                <td class="px-4 py-4">
                  <span class={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${r.status === 'resolved' ? 'bg-success text-white' : 'bg-secondary text-text-secondary'}`}>
                    {r.status}
                  </span>
                </td>
                <td class="px-4 py-4 text-sm text-text-secondary whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}