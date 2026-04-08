import { h } from "../../utils/dom";
import i18next from "../../utils/i18n";
import { type EpisodeItem } from "../../services/api-service";

export class AdminEpisodeList extends HTMLElement {
  private _episodes: EpisodeItem[] = [];
  private _seasonId: number | null = null;

  set data(val: { episodes: EpisodeItem[], seasonId: number | null }) {
    this._episodes = val.episodes;
    this._seasonId = val.seasonId;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = "";
    
    if (!this._seasonId) {
      this.appendChild(h("div", { 
        className: "card", 
        style: "text-align:center; padding: 40px; color: var(--text-secondary); background: var(--bg-secondary); border-radius:12px; border: 1px dashed var(--border-color);" 
      },
        h("div", { style: "font-size: 32px; margin-bottom: 12px;" }, "👈"),
        h("p", { style: "font-weight:700;" }, i18next.t("admin.select_season_desc"))
      ));
      return;
    }

    const container = h("div", { className: "episodes-container" },
      h("div", { style: "display:flex; justify-content: space-between; align-items:center; margin-bottom:15px;" },
        h("h3", { style: "margin:0; font-size:18px; font-weight:800;" }, i18next.t("admin.episodes")),
        h("button", { 
          className: "primary", 
          style: "height:32px; padding:0 12px; border-radius:8px; font-weight:700; font-size:13px;",
          onclick: () => this.dispatchEvent(new CustomEvent("add-episode"))
        }, i18next.t("admin.add_episode"))
      ),
      h("div", { 
        className: "episodes-grid", 
        style: "display: flex; flex-direction: column; gap: 8px;" 
      },
        ...this._episodes.map(ep => h("div", { 
          className: "card", 
          style: "margin:0; padding:12px; display:flex; justify-content: space-between; align-items:center; border: 1px solid var(--border-color); background: var(--bg-primary); border-radius:10px; transition: all 0.2s;" 
        },
          h("div", { style: "display:flex; align-items:center; gap:12px; min-width:0; flex:1;" },
            h("div", { style: "font-weight:800; font-size:14px; color:var(--accent-color); background:rgba(255, 71, 87, 0.1); padding:4px 8px; border-radius:6px; min-width:45px; text-align:center;" }, `E${ep.episode_number}`),
            h("span", { style: "font-weight:600; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" }, ep.title || i18next.t("admin.no_title"))
          ),
          h("div", { style: "display:flex; gap: 8px; flex-shrink:0;" },
            h("button", { 
              onclick: () => this.dispatchEvent(new CustomEvent("edit-episode", { detail: ep })), 
              style: "padding:6px 10px; font-size:12px; font-weight:700; border: 1px solid var(--border-color); border-radius:6px; cursor:pointer;" 
            }, i18next.t("admin.edit")),
            h("button", { 
              onclick: () => this.dispatchEvent(new CustomEvent("delete-episode", { detail: ep.id })), 
              className: "danger", 
              style: "padding:6px 10px; font-size:12px; font-weight:700; background:var(--error-color); color:white; border-radius:6px; cursor:pointer; border:none;" 
            }, i18next.t("admin.delete"))
          )
        )),
        this._episodes.length === 0 ? h("div", { 
          style: "text-align:center; padding: 20px; color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius:10px;" 
        }, i18next.t("admin.no_episodes_found", { defaultValue: "No episodes added yet" })) : null
      )
    );

    this.appendChild(container);
  }
}

customElements.define("admin-episode-list", AdminEpisodeList);
