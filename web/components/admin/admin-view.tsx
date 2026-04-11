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

type AdminTab = "media" | "genres" | "reports" | "users" | "roles";

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
  }, [currentPage, filters, searchQuery, currentTab]);

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
    <div class="container mx-auto px-5 py-10">
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div class="tabs tabs-boxed bg-base-300/50 p-1.5 rounded-2xl border border-base-content/5">
          <button 
            class={`tab tab-lg font-black transition-all rounded-xl h-12 px-8 ${currentTab === 'media' ? "tab-active bg-primary text-primary-content shadow-lg shadow-primary/20" : "hover:bg-base-content/5"}`} 
            onClick={() => setCurrentTab("media")}
          >
            {i18next.t("admin.media_mgmt")}
          </button>
          <button 
            class={`tab tab-lg font-black transition-all rounded-xl h-12 px-8 ${currentTab === 'genres' ? "tab-active bg-primary text-primary-content shadow-lg shadow-primary/20" : "hover:bg-base-content/5"}`} 
            onClick={() => setCurrentTab("genres")}
          >
            {i18next.t("admin.genres_mgmt")}
          </button>
          <button 
            class={`tab tab-lg font-black transition-all rounded-xl h-12 px-8 ${currentTab === 'reports' ? "tab-active bg-primary text-primary-content shadow-lg shadow-primary/20" : "hover:bg-base-content/5"}`} 
            onClick={() => setCurrentTab("reports")}
          >
            {i18next.t("admin.reports_mgmt")}
          </button>
          <button 
            class={`tab tab-lg font-black transition-all rounded-xl h-12 px-8 ${currentTab === 'users' ? "tab-active bg-primary text-primary-content shadow-lg shadow-primary/20" : "hover:bg-base-content/5"}`} 
            onClick={() => setCurrentTab("users")}
          >
            {i18next.t("admin.users_mgmt", "Users")}
          </button>
          <button 
            class={`tab tab-lg font-black transition-all rounded-xl h-12 px-8 ${currentTab === 'roles' ? "tab-active bg-primary text-primary-content shadow-lg shadow-primary/20" : "hover:bg-base-content/5"}`} 
            onClick={() => setCurrentTab("roles")}
          >
            {i18next.t("admin.roles_mgmt", "Roles")}
          </button>
        </div>
      </div>

      {currentTab === "genres" && <AdminGenresView />}
      {currentTab === "reports" && <AdminReportsView />}
      {currentTab === "users" && <AdminUsersView />}
      {currentTab === "roles" && <AdminRolesView />}
      {currentTab === "media" && (
        <div class="card bg-base-100 border border-base-content/10 shadow-2xl overflow-hidden rounded-3xl">
          <div class="card-body p-0">
            <div class="p-8 border-b border-base-content/5 flex flex-col lg:flex-row gap-6 items-center justify-between bg-base-200/40">
              <div class="form-control w-full max-w-lg">
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/30 group-focus-within:text-primary transition-colors">{ICONS.search}</span>
                  <input
                    class="input input-bordered w-full pl-12 h-12 rounded-2xl bg-base-100 border-base-content/10 focus:border-primary focus:outline-none transition-all shadow-sm font-medium"
                    type="text"
                    placeholder="Search media..."
                    value={searchQuery}
                    onInput={(e) => { setSearchQuery((e.target as HTMLInputElement).value); setCurrentPage(1); }}
                    onKeyDown={(e) => { if (e.key === "Enter") fetchMedia(); }}
                  />
                </div>
              </div>
              <div class="flex items-center gap-3 w-full lg:w-auto">
                <button 
                  class={`btn btn-outline h-12 rounded-2xl border-base-content/10 px-6 font-black transition-all group ${showFilters ? "btn-primary bg-primary/10 border-primary/20 text-primary" : "hover:bg-base-content/5"}`} 
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <span class="opacity-50 group-hover:opacity-100 transition-opacity">{ICONS.filter}</span>
                  {i18next.t("admin.filters")}
                </button>
                <button 
                  class="btn btn-primary h-12 px-8 rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all border-none flex-1 lg:flex-none" 
                  onClick={handleAddMedia}
                >
                  {i18next.t("admin.add_new_media")}
                </button>
              </div>
            </div>

            {showFilters && (
              <div class="p-8 bg-base-200/20 border-b border-base-content/5 animate-modal-slide-up">
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
        </div>
      )}
    </div>
  );
}

export function AdminBulkBar({ selectedCount, onAction }: { selectedCount: number; onAction: (action: string) => void }) {
  if (selectedCount === 0) return null;

  return (
    <div class="bg-primary text-primary-content p-4 px-8 flex items-center justify-between animate-modal-slide-up">
      <div class="flex items-center gap-6">
        <div class="flex flex-col">
          <span class="text-xs font-black uppercase tracking-widest opacity-60">Bulk Actions</span>
          <strong class="text-xl font-black">{selectedCount} selected</strong>
        </div>
        <div class="divider divider-horizontal border-primary-content/20 mx-0"></div>
        <button class="btn btn-ghost btn-sm bg-primary-content/10 hover:bg-primary-content/20 font-black rounded-lg border-none text-primary-content" onClick={() => onAction("bulk-edit")}>
          Bulk Edit
        </button>
      </div>
      <button class="btn btn-ghost btn-sm font-black rounded-lg text-primary-content hover:bg-primary-content/10 border-none" onClick={() => onAction("cancel")}>
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
      <div class="flex flex-col items-center justify-center py-24 text-center">
        <div class="text-6xl mb-6 opacity-20">📭</div>
        <h3 class="text-xl font-black text-base-content/40 tracking-tight">No results found</h3>
        <p class="text-base-content/30 text-sm mt-2 font-medium">Try adjusting your search or filters</p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div class="overflow-x-auto">
      <table class="table table-lg w-full">
        <thead>
          <tr class="bg-base-200/20 text-base-content/40 border-b border-base-content/5">
            <th class="w-16">
              <input
                class="checkbox checkbox-primary checkbox-sm rounded-lg"
                type="checkbox"
                checked={selectedIds.size === media.length && media.length > 0}
                onChange={onToggleSelectAll}
              />
            </th>
            <th class="text-[10px] font-black uppercase tracking-widest">{i18next.t("admin.media_info", "Media Info")}</th>
            <th class="text-[10px] font-black uppercase tracking-widest">{i18next.t("admin.status", "Status")}</th>
            <th class="text-right text-[10px] font-black uppercase tracking-widest">{i18next.t("admin.actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-base-content/5">
          {media.map(item => (
            <tr key={item.id} class={`hover:bg-base-200/40 transition-colors group ${selectedIds.has(item.id) ? "bg-primary/5" : ""}`}>
              <td>
                <input
                  class="checkbox checkbox-primary checkbox-sm rounded-lg"
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => onToggleSelect(item.id)}
                />
              </td>
              <td>
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-3">
                    <span class="text-base font-black text-base-content tracking-tight">{item.title}</span>
                    <span class="badge badge-outline badge-xs font-black uppercase tracking-widest py-2 border-base-content/10 opacity-60">{item.content_type}</span>
                  </div>
                  <span class="text-[11px] font-black uppercase tracking-widest opacity-30">ID: {item.id}</span>
                </div>
              </td>
              <td>
                <span class={`badge font-black uppercase tracking-widest text-[10px] py-2 border-none ${
                  item.status === 'ongoing' ? 'bg-success/10 text-success' : 
                  item.status === 'completed' ? 'bg-primary/10 text-primary' : 
                  'bg-base-content/10 text-base-content/50'
                }`}>
                  {item.status}
                </span>
              </td>
              <td>
                <div class="flex items-center justify-end gap-2">
                  <button class="btn btn-ghost btn-sm font-black rounded-xl text-[11px] h-9 px-4 hover:bg-primary/10 hover:text-primary transition-all" onClick={() => onQuickEdit(item)}>
                    Quick Edit
                  </button>
                  <button class="btn btn-ghost btn-sm font-black rounded-xl text-[11px] h-9 px-4 hover:bg-primary/10 hover:text-primary transition-all" onClick={() => onEditMedia(item.id)}>
                    Manage
                  </button>
                  <button class="btn btn-ghost btn-sm font-black rounded-xl text-[11px] h-9 px-4 hover:bg-error/10 hover:text-error transition-all" onClick={() => onDeleteMedia(item.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div class="flex items-center justify-between p-8 bg-base-200/40 border-t border-base-content/5">
        <button   
          class="btn btn-outline btn-sm h-10 px-6 rounded-xl border-base-content/10 font-black hover:bg-base-content/5 transition-all disabled:opacity-30"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ← Previous
        </button>
        <div class="text-xs font-black uppercase tracking-widest text-base-content/30">
          Page <span class="text-primary opacity-100">{currentPage}</span> of <span class="text-base-content opacity-100">{totalPages}</span> — <span class="text-base-content opacity-100">{totalItems} items</span>
        </div>
        <button
          class="btn btn-outline btn-sm h-10 px-6 rounded-xl border-base-content/10 font-black hover:bg-base-content/5 transition-all disabled:opacity-30"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next →
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
          <div class="p-4 card border border-border rounded-xl flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-1">
              <span class="text-lg font-bold text-primary">{g.name}</span>
              <span class="text-xs text-text-secondary">ID: {g.id}</span>
              <span class="text-xs text-text-secondary">Slug: {g.slug}</span>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-ghost btn-sm font-black rounded-xl text-[11px] h-9 px-4 hover:bg-primary/10 hover:text-primary transition-all" onClick={() => handleEdit(g.id, g.name)}>{i18next.t("admin.edit")}</button>
              <button class="btn btn-ghost btn-sm font-black rounded-xl text-[11px] h-9 px-4 hover:bg-error/10 hover:text-error transition-all" onClick={() => handleDelete(g.id)}>{i18next.t("admin.delete")}</button>
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

export function AdminUsersView() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [uRes, rRes] = await Promise.all([
      api.getUsers(),
      api.getRoles()
    ]);
    if (uRes.ok) setUsers(uRes.data);
    if (rRes.ok) setRoles(rRes.data);
    setLoading(false);
  }

  async function handleEdit(user: any) {
    const data = await ui.form<any>(i18next.t("admin.edit_user", "Edit User"), [
      { label: i18next.t("admin.display_name", "Display Name"), name: "display_name", type: "text", value: user.display_name || user.username },
      { label: i18next.t("admin.email", "Email"), name: "email", type: "text", value: user.email },
      { 
        label: i18next.t("admin.role", "Role"), 
        name: "role", 
        type: "select", 
        value: user.role,
        options: roles.map(r => ({ label: r.name, value: r.name }))
      },
      { label: i18next.t("admin.is_active", "Is Active"), name: "is_active", type: "checkbox", value: !!user.is_active },
      { label: i18next.t("admin.password_hint", "New Password (leave empty to keep current)"), name: "password", type: "text" }
    ]);

    if (data) {
      const res = await api.updateUser(user.id, data);
      if (res.ok) {
        ui.toast(i18next.t("admin.user_updated", "User updated successfully"), "success");
        await loadData();
      }
    }
  }

  async function handleDelete(id: number) {
    if (await ui.confirm(i18next.t("admin.delete_user_confirm", "Are you sure you want to delete this user?"))) {
      const res = await api.deleteUser(id);
      if (res.ok) {
        await loadData();
      }
    }
  }

  if (loading) return (
    <div class="flex items-center justify-center p-20">
      <div class="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div class="bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-6">
      <h2 class="text-2xl font-bold text-primary mb-8">{i18next.t("admin.manage_users", "Manage Users")}</h2>
      <div class="overflow-x-auto">
        <table class="table table-lg w-full">
          <thead>
            <tr class="bg-base-200/20">
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} class="hover:bg-base-200/40">
                <td>{u.id}</td>
                <td>
                  <div class="font-bold">{u.username}</div>
                  <div class="text-xs opacity-50">{u.display_name}</div>
                </td>
                <td>{u.email}</td>
                <td><span class="badge badge-outline">{u.role}</span></td>
                <td>
                  <span class={`badge ${u.is_active ? 'badge-success' : 'badge-error'}`}>
                    {u.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td class="text-right">
                  <div class="flex justify-end gap-2">
                    <button class="btn btn-ghost btn-sm" onClick={() => handleEdit(u)}>{i18next.t("admin.edit")}</button>
                    <button class="btn btn-ghost btn-sm text-error" onClick={() => handleDelete(u.id)}>{i18next.t("admin.delete")}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminRolesView() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    setLoading(true);
    const res = await api.getRoles();
    if (res.ok) {
      setRoles(res.data);
    }
    setLoading(false);
  }

  async function handleAdd() {
    const data = await ui.form<any>(i18next.t("admin.add_role", "Add Role"), [
      { label: i18next.t("admin.role_name", "Role Name"), name: "name", type: "text" },
      { label: i18next.t("admin.description", "Description"), name: "description", type: "text" }
    ]);

    if (data?.name) {
      const res = await api.createRole(data);
      if (res.ok) {
        await fetchRoles();
      }
    }
  }

  async function handleEdit(role: any) {
    if (role.is_default) {
      ui.toast(i18next.t("admin.cannot_edit_default_role", "Cannot edit default roles"), "error");
      return;
    }

    const data = await ui.form<any>(i18next.t("admin.edit_role", "Edit Role"), [
      { label: i18next.t("admin.role_name", "Role Name"), name: "name", type: "text", value: role.name },
      { label: i18next.t("admin.description", "Description"), name: "description", type: "text", value: role.description }
    ]);

    if (data) {
      const res = await api.updateRole(role.id, data);
      if (res.ok) {
        await fetchRoles();
      }
    }
  }

  async function handleDelete(role: any) {
    if (role.is_default) {
      ui.toast(i18next.t("admin.cannot_delete_default_role", "Cannot delete default roles"), "error");
      return;
    }

    if (await ui.confirm(i18next.t("admin.delete_role_confirm", "Are you sure you want to delete this role?"))) {
      const res = await api.deleteRole(role.id);
      if (res.ok) {
        await fetchRoles();
      }
    }
  }

  if (loading) return (
    <div class="flex items-center justify-center p-20">
      <div class="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div class="bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-6">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold text-primary">{i18next.t("admin.manage_roles", "Manage Roles")}</h2>
        <button class="btn btn-primary" onClick={handleAdd}>{i18next.t("admin.add_role", "Add Role")}</button>
      </div>
      <div class="overflow-x-auto">
        <table class="table table-lg w-full">
          <thead>
            <tr class="bg-base-200/20">
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Type</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(r => (
              <tr key={r.id} class="hover:bg-base-200/40">
                <td>{r.id}</td>
                <td class="font-bold">{r.name}</td>
                <td>{r.description}</td>
                <td>
                  {r.is_default ? (
                    <span class="badge badge-info text-[10px] font-black uppercase tracking-widest">Default</span>
                  ) : (
                    <span class="badge badge-ghost text-[10px] font-black uppercase tracking-widest">Custom</span>
                  )}
                </td>
                <td class="text-right">
                  {!r.is_default && (
                    <div class="flex justify-end gap-2">
                      <button class="btn btn-ghost btn-sm" onClick={() => handleEdit(r)}>{i18next.t("admin.edit")}</button>
                      <button class="btn btn-ghost btn-sm text-error" onClick={() => handleDelete(r)}>{i18next.t("admin.delete")}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}