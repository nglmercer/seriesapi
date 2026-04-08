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
      .media-admin-list { 
        display: grid; 
        gap: 12px; 
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }
      .admin-card {
        display: flex; 
        align-items: center; 
        gap: 16px;
        padding: 10px 16px;
        border-radius: 12px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        transition: all 0.2s ease;
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        overflow: hidden;
      }
      .admin-card:hover {
        border-color: var(--accent-color);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .admin-card.selected {
        border: 2px solid var(--accent-color); 
        background: var(--bg-secondary); 
      }
      .card-main { 
        display: flex; 
        align-items: center; 
        gap: 16px; 
        flex: 1; 
        min-width: 0; 
        overflow: hidden;
      }
      .card-info { 
        flex: 1; 
        min-width: 0; 
        overflow: hidden;
      }
      .card-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
        width: 100%;
      }
      .card-title {
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        min-width: 0;
      }
      .card-meta { 
        color: var(--text-secondary); 
        font-size: 12px; 
        display: flex; 
        gap: 8px; 
        align-items: center;
        flex-wrap: wrap;
        width: 100%;
      }
      .card-actions { 
        display: flex; 
        gap: 8px; 
        flex-shrink: 0; 
        align-items: center;
      }
      .card-actions button {
        padding: 6px 12px;
        font-size: 13px;
        border-radius: 6px;
        font-weight: 600;
        white-space: nowrap;
      }
      
      @media (max-width: 768px) {
        .admin-card { 
          flex-direction: column; 
          align-items: stretch; 
          gap: 10px; 
          padding: 12px; 
        }
        .card-main { gap: 12px; }
        .card-meta .meta-hide-mobile { display: none; }
        .card-actions { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 6px; 
          border-top: 1px solid var(--border-color); 
          padding-top: 10px;
          margin-top: 2px;
          width: 100%;
        }
        .card-actions button { 
          padding: 8px; 
          font-size: 12px; 
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .card-actions button.danger {
          grid-column: span 2;
        }
      }
    `);
    this.appendChild(style);

    const header = h("div", { 
      style: "margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);" 
    },
      h("div", { style: "display: flex; align-items: center; gap: 12px;" },
        h("input", { 
          type: "checkbox", 
          id: "select-all-cb",
          style: "width: 16px; height: 16px; cursor: pointer;",
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
              style: "width: 18px; height: 18px; cursor: pointer; flex-shrink: 0;",
              onclick: (e: Event) => e.stopPropagation(),
              onchange: () => this.onSelect(item.id)
            }),
            
            h("img", {
              src: item.poster_url || "/placeholder-poster.png",
              style: "width: 48px; height: 72px; object-fit: cover; border-radius: 6px; background: var(--bg-secondary); flex-shrink: 0;",
              onerror: (e: Event) => { (e.target as HTMLImageElement).src = "/placeholder-poster.png"; }
            }),

            h("div", { 
              className: "card-info",
              onclick: () => this.onSelect(item.id), 
              style: "cursor: pointer;" 
            },
              h("div", { className: "card-title-row" },
                h("span", { className: "card-title" }, item.title),
                !item.translation_id ? h("span", { 
                  style: "background: var(--error-color); color: white; font-size: 9px; padding: 2px 4px; border-radius: 4px; font-weight: bold; text-transform: uppercase; flex-shrink: 0;" 
                }, i18next.t("admin.missing_translation", { defaultValue: "MISSING" })) : null
              ),
              h("div", { className: "card-meta" }, 
                h("span", { style: "font-weight: 700; color: var(--accent-color); font-size: 11px;" }, item.content_type.toUpperCase()),
                h("span", { className: "meta-hide-mobile", style: "opacity: 0.3" }, "|"),
                h("span", { className: "meta-hide-mobile" }, `ID: ${item.id}`),
                h("span", { className: "meta-hide-mobile", style: "opacity: 0.3" }, "|"),
                h("span", { className: "meta-hide-mobile" }, `Slug: ${item.slug}`),
                h("span", { style: "opacity: 0.3" }, "|"),
                h("span", { 
                  style: `font-weight: 600; color: ${item.status === 'completed' ? '#10b981' : '#f59e0b'}; font-size: 11px;` 
                }, item.status)
              )
            )
          ),
          
          h("div", { className: "card-actions" },
            h("button", { 
              onclick: (e: Event) => { e.stopPropagation(); this.onAction("content_mgr", item.id); }
            }, i18next.t("admin.content_mgr", { defaultValue: "Content" })),
            h("button", { 
              onclick: (e: Event) => { e.stopPropagation(); this.onAction("edit", item.id); }
            }, i18next.t("admin.edit", { defaultValue: "Info" })),
            h("button", { 
              onclick: (e: Event) => { e.stopPropagation(); this.onAction("delete", item.id); }, 
              className: "danger", 
              style: "background: var(--error-color); color:white;" 
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
