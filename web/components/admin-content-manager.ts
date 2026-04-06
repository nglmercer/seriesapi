import { api,type MediaItem,type EpisodeItem } from "./api-service";
import { h } from "../utils/dom";

export class AdminContentManager extends HTMLElement {
  private mediaId: number | null = null;
  private media: MediaItem | null = null;
  private seasons: any[] = [];
  private selectedSeasonId: number | null = null;
  private episodes: EpisodeItem[] = [];

  setMedia(id: number) {
    this.mediaId = id;
    this.fetchData();
  }

  private async fetchData() {
    if (!this.mediaId) return;
    const [mRes, sRes] = await Promise.all([
      api.getMediaDetail(this.mediaId),
      api.getMediaSeasons(this.mediaId)
    ]);

    if (mRes.ok) this.media = mRes.data;
    if (sRes.ok) this.seasons = (sRes.data as any);
    
    this.render();
  }

  private async fetchEpisodes(seasonId: number) {
    this.selectedSeasonId = seasonId;
    const res = await api.getSeasonEpisodes(seasonId);
    if (res.ok) {
      this.episodes = res.data;
    }
    this.render();
  }

  private async handleEditSeason(season: any) {
      const newTitle = prompt("Season Title:", season.name || "");
      if (newTitle !== null) {
          await api.updateSeason(season.id, { name: newTitle });
          await this.fetchData();
      }
  }

  private async handleEditEpisode(ep: EpisodeItem) {
      const newTitle = prompt("Episode Title:", ep.title || "");
      if (newTitle !== null) {
          await api.updateEpisode(ep.id, { title: newTitle });
          if(this.selectedSeasonId) await this.fetchEpisodes(this.selectedSeasonId);
      }
  }

  private async handleDeleteEpisode(id: number) {
      if(confirm("Delete episode?")) {
          await api.deleteEpisode(id);
          if(this.selectedSeasonId) await this.fetchEpisodes(this.selectedSeasonId);
      }
  }

  render() {
    this.innerHTML = "";
    if (!this.media) {
      this.appendChild(h("div", { className: "card" }, "Loading media info..."));
      return;
    }

    const backBtn = h("button", { 
        onclick: () => this.dispatchEvent(new CustomEvent("back", { bubbles: true })),
        style: "margin-bottom: 20px;"
    }, "← Back to Media List");

    const header = h("div", { className: "card", style: "background: var(--bg-secondary);" },
      h("h2", {}, `Managing: ${this.media.title}`),
      h("p", { style: "color: var(--text-secondary);" }, `Content Management for Seasons and Episodes`)
    );

    const seasonsList = h("div", { style: "display: grid; grid-template-columns: 1fr 2fr; gap: 20px;" },
        // Seasons Column
        h("div", {},
            h("div", { style: "display:flex; justify-content: space-between; align-items:center; margin-bottom:10px;" },
                h("h3", {}, "Seasons"),
                h("button", { onclick: () => alert("Add Season API needed"), className: "primary" }, "+")
            ),
            h("div", { className: "seasons-list", style: "display: flex; flex-direction: column; gap: 8px;" },
                ...this.seasons.map(s => h("div", { 
                    className: "card", 
                    style: `margin:0; padding: 8px; cursor: pointer; border-left: 4px solid ${this.selectedSeasonId === s.id ? 'var(--accent-color)' : 'transparent'};`,
                    onclick: () => this.fetchEpisodes(s.id)
                },
                h("div", { style: "display:flex; justify-content: space-between; align-items:center;" },
                    h("span", {}, `S${s.season_number}: ${s.name || 'No Title'}`),
                    h("button", { onclick: (e: Event) => { e.stopPropagation(); this.handleEditSeason(s); }, style: "padding:2px 6px; font-size:11px;" }, "✎")
                )
              ))
            )
        ),
        // Episodes Column
        h("div", {},
            h("h3", { style: "margin-bottom:10px;" }, this.selectedSeasonId ? "Episodes" : "Select a season to view episodes"),
            this.selectedSeasonId ? h("div", { className: "episodes-list", style: "display: grid; gap: 8px;" },
                 ...this.episodes.map(ep => h("div", { className: "card", style: "margin:0; padding: 8px; display:flex; justify-content: space-between; align-items:center;" },
                    h("div", {},
                        h("span", { style: "font-weight:bold; margin-right:10px;" }, `#${ep.number}`),
                        h("span", {}, ep.title)
                    ),
                    h("div", { style: "display:flex; gap: 5px;" },
                        h("button", { onclick: () => this.handleEditEpisode(ep), style: "padding:2px 6px; font-size:11px;" }, "Edit"),
                        h("button", { onclick: () => this.handleDeleteEpisode(ep.id), className: "danger", style: "padding:2px 6px; font-size:11px; background:var(--error-color); color:white;" }, "Del")
                    )
                 )),
                 h("button", { style: "margin-top:10px;", className: "primary" }, "+ Add Episode")
            ) : h("div", { className: "card", style: "text-align:center; color: var(--text-secondary);" }, "← Select a season on the left")
        )
    );

    const container = h("div", {}, backBtn, header, seasonsList);
    this.appendChild(container);
  }
}

customElements.define("admin-content-manager", AdminContentManager);
