import { h } from "../../utils/dom";
import i18next from "../../utils/i18n";
import { type SeasonItem } from "../../services/api-service";

export class AdminSeasonList extends HTMLElement {
  private _seasons: SeasonItem[] = [];
  private _selectedId: number | null = null;

  set data(val: { seasons: SeasonItem[], selectedId: number | null }) {
    this._seasons = val.seasons;
    this._selectedId = val.selectedId;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = "";
    
    const container = h("div", { className: "seasons-container" },
      h("div", { style: "display:flex; justify-content: space-between; align-items:center; margin-bottom:15px;" },
        h("h3", { style: "margin:0; font-size:18px; font-weight:800;" }, i18next.t("admin.seasons")),
        h("button", { 
          className: "primary", 
          style: "width:32px; height:32px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:8px;",
          onclick: () => this.dispatchEvent(new CustomEvent("add-season"))
        }, "+")
      ),
      h("div", { 
        className: "seasons-grid", 
        style: "display: flex; flex-direction: column; gap: 8px;" 
      },
        ...this._seasons.map(s => {
          const isSelected = this._selectedId === s.id;
          return h("div", { 
            className: `card ${isSelected ? 'active' : ''}`, 
            style: `margin:0; padding: 12px; cursor: pointer; border: 1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'}; background: ${isSelected ? 'rgba(255, 71, 87, 0.05)' : 'var(--bg-primary)'}; transition: all 0.2s;`,
            onclick: () => this.dispatchEvent(new CustomEvent("select-season", { detail: s.id }))
          },
            h("div", { style: "display:flex; justify-content: space-between; align-items:center;" },
              h("div", { style: "display:flex; flex-direction:column; gap:2px;" },
                h("span", { style: "font-weight:800; font-size:14px;" }, `S${s.season_number}`),
                h("span", { style: "font-size:12px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px;" }, s.name || i18next.t("admin.no_title"))
              ),
              h("button", { 
                style: "padding:6px; background:var(--bg-secondary); border:none; border-radius:6px; cursor:pointer;",
                onclick: (e: Event) => { e.stopPropagation(); this.dispatchEvent(new CustomEvent("edit-season", { detail: s })); }
              }, h("span", { innerHTML: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' }))
            )
          );
        })
      )
    );

    this.appendChild(container);
  }
}

customElements.define("admin-season-list", AdminSeasonList);
