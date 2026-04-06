import { api, type MediaItem, type EpisodeItem } from "./api-service";
import { h } from "../utils/dom";
import { ui } from "../utils/ui";

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
      const data = await ui.form<{ name: string; season_number: number }>("Edit Season", [
          { label: "Season Number", name: "season_number", type: "number", value: season.season_number },
          { label: "Season Title", name: "name", type: "text", value: season.name || "" }
      ]);
      if (data) {
          await api.updateSeason(season.id, data);
          await this.fetchData();
      }
  }

  private async handleEditEpisode(ep: EpisodeItem) {
      const data = await ui.form<Partial<EpisodeItem>>("Edit Episode", [
          { label: "Number", name: "episode_number", type: "number", value: ep.episode_number },
          { label: "Title", name: "title", type: "text", value: ep.title },
          { label: "Synopsis", name: "synopsis", type: "textarea", value: ep.synopsis || "" }
      ]);
      if (data) {
          await api.updateEpisode(ep.id, data);
          if(this.selectedSeasonId) await this.fetchEpisodes(this.selectedSeasonId);
      }
  }

  private async handleDeleteEpisode(id: number) {
      if(await ui.confirm("Delete episode?")) {
          await api.deleteEpisode(id);
          if(this.selectedSeasonId) await this.fetchEpisodes(this.selectedSeasonId);
      }
  }

  private async handleAddSeason() {
      if (!this.mediaId) return;
      const data = await ui.form<{ season_number: number; title: string }>("New Season", [
          { label: "Season Number", name: "season_number", type: "number", value: this.seasons.length + 1 },
          { label: "Season Name (optional)", name: "title", type: "text" }
      ]);
      
      if (!data) return;

      const res = await api.createSeason({
          mediaId: this.mediaId,
          seasonNumber: data.season_number,
          title: data.title || undefined
      });

      if (res.ok) {
          await this.fetchData();
      }
  }

  private async handleAddEpisode() {
      if (!this.mediaId || !this.selectedSeasonId) return;
      const data = await ui.form<{ number: number; title: string; synopsis: string }>("New Episode", [
          { label: "Episode #", name: "number", type: "number", value: this.episodes.length + 1 },
          { label: "Title", name: "title", type: "text" },
          { label: "Synopsis", name: "synopsis", type: "textarea" }
      ]);
      
      if (!data) return;

      const res = await api.createEpisode({
          mediaId: this.mediaId,
          seasonId: this.selectedSeasonId,
          number: data.number,
          title: data.title || undefined,
          synopsis: data.synopsis || undefined
      });

      if (res.ok) {
          await this.fetchEpisodes(this.selectedSeasonId);
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
                h("button", { onclick: () => this.handleAddSeason(), className: "primary" }, "+")
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
                        h("span", { style: "font-weight:bold; margin-right:10px;" }, `#${ep.episode_number}`),
                        h("span", {}, ep.title)
                    ),
                    h("div", { style: "display:flex; gap: 5px;" },
                        h("button", { onclick: () => this.handleEditEpisode(ep), style: "padding:2px 6px; font-size:11px;" }, "Edit"),
                        h("button", { onclick: () => this.handleDeleteEpisode(ep.id), className: "danger", style: "padding:2px 6px; font-size:11px; background:var(--error-color); color:white;" }, "Del")
                    )
                 )),
                 h("button", { onclick: () => this.handleAddEpisode(), style: "margin-top:10px;", className: "primary" }, "+ Add Episode")
            ) : h("div", { className: "card", style: "text-align:center; color: var(--text-secondary);" }, "← Select a season on the left")
        )
    );

    const container = h("div", {}, backBtn, header, seasonsList);
    this.appendChild(container);
  }
}

customElements.define("admin-content-manager", AdminContentManager);
