import { api, type MediaItem, type EpisodeItem, type SeasonItem } from "./api-service";
import i18next from "../utils/i18n";
import { h } from "../utils/dom";
import { ui } from "../utils/ui";

export class AdminContentManager extends HTMLElement {
  private mediaId: number | null = null;
  private media: MediaItem | null = null;
  private seasons: SeasonItem[] = [];
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

  private async handleEditSeason(season: SeasonItem) {
      const data = await ui.form<Partial<SeasonItem>>(i18next.t("admin.edit_season"), [
          { label: i18next.t("admin.season_number"), name: "season_number", type: "number", value: season.season_number, width: "50%" },
          { label: i18next.t("admin.season_title"), name: "name", type: "text", value: season.name || "", width: "50%" },
          { label: i18next.language === 'es' ? "Fecha Inicio" : "Air Date", name: "air_date", type: "date", value: season.air_date, width: "50%" },
          { label: i18next.language === 'es' ? "Fecha Fin" : "End Date", name: "end_date", type: "date", value: season.end_date, width: "50%" },
          { label: i18next.t("admin.form_synopsis"), name: "synopsis", type: "textarea", value: season.synopsis, width: "100%" }
      ]);
      if (data) {
          await api.updateSeason(season.id, data);
          await this.fetchData();
      }
  }

  private async handleEditEpisode(ep: EpisodeItem) {
      const data = await ui.form<Partial<EpisodeItem>>(i18next.t("admin.edit_episode"), [
          { label: i18next.t("admin.episode_number"), name: "episode_number", type: "number", value: ep.episode_number, width: "33%" },
          { label: i18next.language === 'es' ? "Nº Absoluto" : "Absolute №", name: "absolute_number", type: "number", value: ep.absolute_number, width: "33%" },
          { label: i18next.language === 'es' ? "Título" : "Title", name: "title", type: "text", value: ep.title, width: "33%" },
          { 
              label: i18next.language === 'es' ? "Tipo" : "Type", name: "episode_type", type: "select", value: ep.episode_type || "regular", width: "33%",
              options: [
                  { label: "Regular", value: "regular" },
                  { label: "Special", value: "special" },
                  { label: "Recap", value: "recap" },
                  { label: "OVA", value: "ova" }
              ]
          },
          { label: i18next.language === 'es' ? "Fecha Air" : "Air Date", name: "air_date", type: "date", value: ep.air_date, width: "33%" },
          { label: i18next.language === 'es' ? "Duración" : "Runtime", name: "runtime_minutes", type: "number", value: ep.runtime_minutes, width: "33%" },
          { label: i18next.t("admin.episode_synopsis"), name: "synopsis", type: "textarea", value: ep.synopsis || "", width: "100%" }
      ]);
      if (data) {
          await api.updateEpisode(ep.id, data);
          if(this.selectedSeasonId) await this.fetchEpisodes(this.selectedSeasonId);
      }
  }

  private async handleDeleteEpisode(id: number) {
      if(await ui.confirm(i18next.t("admin.delete_episode_confirm"))) {
          await api.deleteEpisode(id);
          if(this.selectedSeasonId) await this.fetchEpisodes(this.selectedSeasonId);
      }
  }

  private async handleAddSeason() {
      if (!this.mediaId) return;
      const data = await ui.form<any>(i18next.t("admin.new_season"), [
          { label: i18next.t("admin.season_number"), name: "seasonNumber", type: "number", value: this.seasons.length + 1, width: "50%" },
          { label: i18next.t("admin.season_title"), name: "title", type: "text", width: "50%" },
          { label: i18next.language === 'es' ? "Fecha Inicio" : "Air Date", name: "air_date", type: "date", width: "50%" }
      ]);
      
      if (!data) return;

      const res = await api.createSeason({
          mediaId: this.mediaId,
          ...data
      });

      if (res.ok) {
          await this.fetchData();
      }
  }

  private async handleAddEpisode() {
      if (!this.mediaId || !this.selectedSeasonId) return;
      const data = await ui.form<any>(i18next.t("admin.new_episode"), [
          { label: i18next.t("admin.episode_number"), name: "number", type: "number", value: this.episodes.length + 1, width: "33%" },
          { label: i18next.t("admin.episode_title"), name: "title", type: "text", width: "33%" },
          { label: i18next.language === 'es' ? "Tipo" : "Type", name: "episode_type", type: "select", value: "regular", width: "33%",
              options: [
                  { label: "Regular", value: "regular" },
                  { label: "Special", value: "special" },
                  { label: "Recap", value: "recap" },
                  { label: "OVA", value: "ova" }
              ]
          },
          { label: i18next.t("admin.episode_synopsis"), name: "synopsis", type: "textarea", width: "100%" }
      ]);
      
      if (!data) return;

      const res = await api.createEpisode({
          mediaId: this.mediaId,
          seasonId: this.selectedSeasonId,
          ...data
      });

      if (res.ok) {
          await this.fetchEpisodes(this.selectedSeasonId);
      }
  }

  render() {
    this.innerHTML = "";
    if (!this.media) {
      this.appendChild(h("div", { className: "card" }, i18next.t("admin.loading_media_info")));
      return;
    }

    const backBtn = h("button", { 
        onclick: () => this.dispatchEvent(new CustomEvent("back", { bubbles: true })),
        style: "margin-bottom: 20px;"
    }, i18next.t("admin.back_to_media_list"));

    const header = h("div", { className: "card", style: "background: var(--bg-secondary);" },
      h("h2", {}, i18next.t("admin.managing", { title: this.media.title })),
      h("p", { style: "color: var(--text-secondary);" }, i18next.t("admin.content_mgmt_desc"))
    );

    const seasonsList = h("div", { style: "display: grid; grid-template-columns: 1fr 2fr; gap: 20px;" },
        // Seasons Column
        h("div", {},
            h("div", { style: "display:flex; justify-content: space-between; align-items:center; margin-bottom:10px;" },
                h("h3", {}, i18next.t("admin.seasons")),
                h("button", { onclick: () => this.handleAddSeason(), className: "primary" }, "+")
            ),
            h("div", { className: "seasons-list", style: "display: flex; flex-direction: column; gap: 8px;" },
                ...this.seasons.map(s => h("div", { 
                    className: "card", 
                    style: `margin:0; padding: 8px; cursor: pointer; border-left: 4px solid ${this.selectedSeasonId === s.id ? 'var(--accent-color)' : 'transparent'};`,
                    onclick: () => this.fetchEpisodes(s.id)
                },
                h("div", { style: "display:flex; justify-content: space-between; align-items:center;" },
                    h("span", {}, `S${s.season_number}: ${s.name || (i18next.language === 'es' ? 'Sin Título' : 'No Title')}`),
                    h("button", { onclick: (e: Event) => { e.stopPropagation(); this.handleEditSeason(s); }, style: "padding:2px 6px; font-size:11px;" }, "✎")
                )
              ))
            )
        ),
        // Episodes Column
        h("div", {},
            h("h3", { style: "margin-bottom:10px;" }, this.selectedSeasonId ? i18next.t("admin.episodes") : i18next.t("admin.select_season_desc")),
            this.selectedSeasonId ? h("div", { className: "episodes-list", style: "display: grid; gap: 8px;" },
                 ...this.episodes.map(ep => h("div", { className: "card", style: "margin:0; padding: 8px; display:flex; justify-content: space-between; align-items:center;" },
                    h("div", {},
                        h("span", { style: "font-weight:bold; margin-right:10px;" }, `#${ep.episode_number}`),
                        h("span", {}, ep.title || (i18next.language === 'es' ? 'Sin Título' : 'No Title'))
                    ),
                    h("div", { style: "display:flex; gap: 5px;" },
                        h("button", { onclick: () => this.handleEditEpisode(ep), style: "padding:2px 6px; font-size:11px;" }, i18next.t("admin.edit")),
                        h("button", { onclick: () => this.handleDeleteEpisode(ep.id), className: "danger", style: "padding:2px 6px; font-size:11px; background:var(--error-color); color:white;" }, i18next.t("admin.delete"))
                    )
                 )),
                 h("button", { onclick: () => this.handleAddEpisode(), style: "margin-top:10px;", className: "primary" }, i18next.t("admin.add_episode"))
            ) : h("div", { className: "card", style: "text-align:center; color: var(--text-secondary);" }, `← ${i18next.t("admin.select_season_desc")}`)
        )
    );

    const container = h("div", {}, backBtn, header, seasonsList);
    this.appendChild(container);
  }
}

customElements.define("admin-content-manager", AdminContentManager);
