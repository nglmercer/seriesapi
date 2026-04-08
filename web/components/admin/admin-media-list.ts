import { h } from "../../utils/dom";
import i18next from "../../utils/i18n";
import type { MediaItem } from "../../services/api-service";

export class AdminMediaList extends HTMLElement {
  private _mediaList: MediaItem[] = [];
  private _selectedIds: Set<number> = new Set();

  get data(): { list: MediaItem[], selected: Set<number> } {
    return { list: this._mediaList, selected: this._selectedIds };
  }

  set data(val: { list: MediaItem[], selected: Set<number> }) {
    this._mediaList = val.list;
    this._selectedIds = val.selected;
    this.render();
  }

  private onSelect(id: number) {
    this.dispatchEvent(new CustomEvent("toggle-select", { detail: id }));
  }

  private onSelectAll() {
    this.dispatchEvent(new CustomEvent("toggle-select-all"));
  }

  private onAction(action: string, id: number) {
    this.dispatchEvent(new CustomEvent("item-action", { detail: { action, id } }));
  }

  render() {
    this.innerHTML = "";
    if (this._mediaList.length === 0) {
      this.appendChild(h("div", { style: "text-align: center; padding: 40px; color: var(--text-secondary);" }, 
        i18next.t("admin.no_results", { defaultValue: "No results found" })
      ));
      return;
    }

    const style = h("style", {}, `
      .media-admin-list { display: grid; gap: 12px; }
      .admin-card {
        display: flex; 
        align-items: center; 
        gap: 16px;
        padding: 12px 16px;
        border-radius: 12px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        transition: all 0.2s ease;
      }
      .admin-card.selected {
        border: 2px solid var(--accent-color); 
        background: var(--bg-secondary); 
        transform: translateX(4px);
      }
      .card-main { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; }
      .card-info { flex: 1; min-width: 0; }
      .card-meta { 
        color: var(--text-secondary); 
        font-size: 13px; 
        display: flex; 
        gap: 8px; 
        flex-wrap: wrap; 
        margin-top: 4px;
      }
      .card-actions { display: flex; gap: 8px; flex-shrink: 0; }
      
      @media (max-width: 768px) {
        .admin-card { flex-direction: column; align-items: stretch; gap: 12px; padding: 16px; }
        .card-main { align-items: flex-start; }
        .card-meta .meta-hide-mobile { display: none; }
        .card-actions { justify-content: flex-end; border-top: 1px solid var(--border-color); pt: 12px; margin-top: 4px; padding-top: 12px; }
        .card-actions button { flex: 1; padding: 10px; font-size: 12px; }
      }
    `);
    this.appendChild(style);

    const header = h("div", { 
      style: "margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);" 
    },
      h("div", { style: "display: flex; align-items: center; gap: 12px;" },
        h("input", { 
          type: "checkbox", 
          id: "select-all-cb",
          style: "width: 18px; height: 18px; cursor: pointer;",
          checked: this._selectedIds.size === this._mediaList.length && this._mediaList.length > 0,
          onchange: () => this.onSelectAll()
        }),
        h("label", { 
          for: "select-all-cb",
          style: "font-size: 14px; font-weight: 600; color: var(--text-primary); cursor: pointer;" 
        }, i18next.t("admin.select_all", { defaultValue: "Select All" }))
      ),
      h("span", { style: "font-size: 12px; color: var(--text-secondary);" }, 
        i18next.t("admin.showing_count", { count: this._mediaList.length, defaultValue: `Showing ${this._mediaList.length} items` })
      )
    );

    const listContainer = h("div", { className: "media-admin-list" },
      ...this._mediaList.map(item => {
        const isSelected = this._selectedIds.has(item.id);
        return h("div", { 
          className: `admin-card ${isSelected ? 'selected' : ''}`, 
        },
          h("div", { className: "card-main" },
            h("input", { 
              type: "checkbox", 
              checked: isSelected,
              style: "width: 20px; height: 20px; cursor: pointer; flex-shrink: 0;",
              onclick: (e: Event) => e.stopPropagation(),
              onchange: () => this.onSelect(item.id)
            }),
            
            h("img", {
              src: item.poster_url || "/placeholder-poster.png",
              style: "width: 50px; height: 75px; object-fit: cover; border-radius: 6px; background: var(--bg-secondary); flex-shrink: 0;",
              onerror: (e: Event) => { (e.target as HTMLImageElement).src = "/placeholder-poster.png"; }
            }),

            h("div", { 
              className: "card-info",
              onclick: () => this.onSelect(item.id), 
              style: "cursor: pointer;" 
            },
              h("div", { style: "display:flex; align-items:center; gap:8px; margin-bottom: 2px;" },
                h("strong", { style: "font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;" }, item.title),
                !item.translation_id ? h("span", { 
                  style: "background: var(--error-color); color: white; font-size: 9px; padding: 2px 4px; border-radius: 4px; font-weight: bold; text-transform: uppercase; flex-shrink: 0;" 
                }, i18next.t("admin.missing_translation", { defaultValue: "MISSING" })) : null
              ),
              h("div", { className: "card-meta" }, 
                h("span", { style: "font-weight: 700; color: var(--accent-color);" }, item.content_type.toUpperCase()),
                h("span", { className: "meta-hide-mobile", style: "opacity: 0.5" }, "|"),
                h("span", { className: "meta-hide-mobile" }, `ID: ${item.id}`),
                h("span", { style: "opacity: 0.5" }, "|"),
                h("span", { className: "meta-hide-mobile" }, `Slug: ${item.slug}`),
                h("span", { className: "meta-hide-mobile", style: "opacity: 0.5" }, "|"),
                h("span", { 
                  style: `font-weight: 600; color: ${item.status === 'completed' ? '#10b981' : '#f59e0b'}` 
                }, item.status)
              )
            )
          ),
          
          h("div", { className: "card-actions" },
            h("button", { 
              onclick: (e: Event) => { e.stopPropagation(); this.onAction("content_mgr", item.id); },
              style: "padding: 8px 12px; font-size: 13px;"
            }, i18next.t("admin.content_mgr", { defaultValue: "Content" })),
            h("button", { 
              onclick: (e: Event) => { e.stopPropagation(); this.onAction("edit", item.id); },
              style: "padding: 8px 12px; font-size: 13px;"
            }, i18next.t("admin.edit", { defaultValue: "Info" })),
            h("button", { 
              onclick: (e: Event) => { e.stopPropagation(); this.onAction("delete", item.id); }, 
              className: "danger", 
              style: "background: var(--error-color); color:white; padding: 8px 12px; font-size: 13px;" 
            }, i18next.t("admin.delete", { defaultValue: "Delete" }))
          )
        );
      })
    );

    this.appendChild(header);
    this.appendChild(listContainer);
  }
}

customElements.define("admin-media-list", AdminMediaList);
