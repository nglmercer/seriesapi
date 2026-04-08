import { api, type MediaItem, type EpisodeItem, type SeasonItem, type RelationItem } from "../../services/api-service";
import i18next from "../../utils/i18n";
import { h } from "../../utils/dom";
import { ui } from "../../utils/ui";
import "./admin-season-list";
import "./admin-episode-list";
import "./admin-relation-list";

import { AdminSeasonList } from "./admin-season-list";
import { AdminEpisodeList } from "./admin-episode-list";
import { AdminRelationList } from "./admin-relation-list";

export class AdminContentManager extends HTMLElement {
  private mediaId: number | null = null;
  private media: MediaItem | null = null;
  private seasons: SeasonItem[] = [];
  private selectedSeasonId: number | null = null;
  private episodes: EpisodeItem[] = [];
  private relations: RelationItem[] = [];
  private currentTab: "episodes" | "relations" = "episodes";

  setMedia(id: number) {
    this.mediaId = id;
    this.fetchData();
  }

  private async fetchData() {
    if (!this.mediaId) return;
    const [mRes, sRes, rRes] = await Promise.all([
      api.getMediaDetail(this.mediaId),
      api.getMediaSeasons(this.mediaId),
      api.getMediaRelations(this.mediaId)
    ]);

    if (mRes.ok) {
      this.media = mRes.data;
      if (["movie", "short"].includes(this.media.content_type)) {
        this.currentTab = "relations";
      }
    }
    if (sRes.ok) this.seasons = sRes.data;
    if (rRes.ok) this.relations = rRes.data;
    
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

  // Season & Episode Handlers
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

  private async handleAddSeason() {
    if (!this.mediaId) return;
    const data = await ui.form<{ seasonNumber: number; title: string; air_date: string }>(i18next.t("admin.new_season"), [
        { label: i18next.t("admin.season_number"), name: "seasonNumber", type: "number", value: this.seasons.length + 1, width: "50%" },
        { label: i18next.t("admin.season_title"), name: "title", type: "text", width: "50%" },
        { label: i18next.language === 'es' ? "Fecha Inicio" : "Air Date", name: "air_date", type: "date", width: "50%" }
    ]);
    if (!data) return;
    const res = await api.createSeason({ mediaId: this.mediaId, ...data });
    if (res.ok) await this.fetchData();
  }

  private async handleAddEpisode() {
    if (!this.mediaId || !this.selectedSeasonId) return;
    const data = await ui.form<{ number: number; title: string; episode_type: string; synopsis: string }>(i18next.t("admin.new_episode"), [
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
    const res = await api.createEpisode({ mediaId: this.mediaId, seasonId: this.selectedSeasonId, ...data });
    if (res.ok) await this.fetchEpisodes(this.selectedSeasonId);
  }

  private async handleDeleteEpisode(id: number) {
    if(await ui.confirm(i18next.t("admin.delete_episode_confirm"))) {
        await api.deleteEpisode(id);
        if(this.selectedSeasonId) await this.fetchEpisodes(this.selectedSeasonId);
    }
  }

  private async handleAddRelation() {
      if (!this.mediaId) return;
      const data = await ui.form<{ relatedId: number; type: string }>(i18next.language === 'es' ? "Nueva Relación" : "New Relation", [
          { label: i18next.language === 'es' ? "ID del Contenido" : "Media ID", name: "relatedId", type: "number" },
          { 
              label: i18next.language === 'es' ? "Tipo" : "Type", name: "type", type: "select",
              options: [
                  { label: "Sequel", value: "sequel" },
                  { label: "Prequel", value: "prequel" },
                  { label: "Spin-off", value: "spin_off" },
                  { label: "Alternative Version", value: "alternative" },
                  { label: "Side Story", value: "side_story" },
                  { label: "Adaptation", value: "adaptation" },
                  { label: "Summary", value: "summary" }
              ]
          }
      ]);
      if (data) {
          const res = await api.createMediaRelation({ sourceId: this.mediaId, ...data });
          if (res.ok) await this.fetchData();
          else await ui.alert(i18next.language === 'es' ? "ID no válido o error" : "Invalid ID or error");
      }
  }

  private async handleDeleteRelation(id: number) {
      if (!this.mediaId) return;
      if (await ui.confirm(i18next.language === 'es' ? "¿Borrar esta relación?" : "Delete this relation?")) {
          await api.deleteMediaRelation(this.mediaId, id);
          await this.fetchData();
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
        style: "margin-bottom: 24px; padding: 10px 20px; font-weight: 700; border-radius:10px; display:flex; align-items:center; gap:8px;"
    }, h("span", { innerHTML: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>' }), i18next.t("admin.back_to_media_list"));

    const header = h("div", { className: "card", style: "background: var(--bg-secondary); margin-bottom: 24px; padding: 24px; border-radius:16px; border: 1px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.05);" },
      h("h2", { style: "margin:0 0 8px 0; font-size:24px; font-weight:900; color:var(--text-primary);" }, i18next.t("admin.managing", { title: this.media.title })),
      h("p", { style: "margin:0; color: var(--text-secondary); font-size:15px; font-weight:500;" }, i18next.t("admin.content_mgmt_desc"))
    );

    const isEpisodic = !["movie", "short"].includes(this.media.content_type);

    const tabs = h("div", { className: "admin-tabs", style: "display: flex; gap: 24px; border-bottom: 2px solid var(--border-color); margin-bottom: 24px;" },
      h("button", {
        onclick: () => { if(isEpisodic) { this.currentTab = "episodes"; this.render(); } },
        style: `border-radius:0; border:none; background:transparent; cursor:${isEpisodic ? 'pointer' : 'not-allowed'}; opacity:${isEpisodic ? '1' : '0.4'}; padding: 12px 4px; font-weight:700; font-size:15px; ${this.currentTab === 'episodes' ? 'border-bottom: 4px solid var(--accent-color); color:var(--accent-color);' : 'color:var(--text-secondary);'}`
      }, i18next.t("admin.episodes")),
      h("button", {
        onclick: () => { this.currentTab = "relations"; this.render(); },
        style: `border-radius:0; border:none; background:transparent; cursor:pointer; padding: 12px 4px; font-weight:700; font-size:15px; ${this.currentTab === 'relations' ? 'border-bottom: 4px solid var(--accent-color); color:var(--accent-color);' : 'color:var(--text-secondary);'}`
      }, i18next.language === 'es' ? "Relaciones / Trilogías" : "Relations / Trilogies")
    );

    let content;
    if (this.currentTab === "episodes" && isEpisodic) {
        const style = h("style", {}, `
            .content-grid { display: grid; grid-template-columns: 300px 1fr; gap: 24px; }
            @media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } }
        `);
        this.appendChild(style);

        const seasonList = document.createElement("admin-season-list") as AdminSeasonList;
        seasonList.data = { seasons: this.seasons, selectedId: this.selectedSeasonId };
        seasonList.addEventListener("select-season", (e: Event) => this.fetchEpisodes((e as CustomEvent<number>).detail));
        seasonList.addEventListener("add-season", () => this.handleAddSeason());
        seasonList.addEventListener("edit-season", (e: Event) => this.handleEditSeason((e as CustomEvent<SeasonItem>).detail));

        const episodeList = document.createElement("admin-episode-list") as AdminEpisodeList;
        episodeList.data = { episodes: this.episodes, seasonId: this.selectedSeasonId };
        episodeList.addEventListener("add-episode", () => this.handleAddEpisode());
        episodeList.addEventListener("edit-episode", (e: Event) => this.handleEditEpisode((e as CustomEvent<EpisodeItem>).detail));
        episodeList.addEventListener("delete-episode", (e: Event) => this.handleDeleteEpisode((e as CustomEvent<number>).detail));

        content = h("div", { className: "content-grid" }, seasonList, episodeList);
    } else if(this.currentTab === "episodes" && !isEpisodic) {
        content = h("div", { className: "card", style: "text-align:center; padding: 60px 40px; color: var(--text-secondary); border-radius:16px; border:1px solid var(--border-color); background:var(--bg-secondary);" },
            h("div", { style: "font-size: 48px; margin-bottom: 24px;" }, "🎬"),
            h("h3", { style: "font-size:20px; font-weight:800; color:var(--text-primary); margin-bottom:8px;" }, i18next.language === 'es' ? "Contenido no episódico" : "Non-episodic content"),
            h("p", { style: "font-weight:500;" }, i18next.language === 'es' ? "Las temporadas no son aplicables. Usa la pestaña 'Relaciones' para conectar secuelas o trilogías." : "Seasons are not applicable. Use the 'Relations' tab to connect sequels or trilogies.")
        );
    } else {
        const relationList = document.createElement("admin-relation-list") as AdminRelationList;
        relationList.data = this.relations;
        relationList.addEventListener("add-relation", () => this.handleAddRelation());
        relationList.addEventListener("delete-relation", (e: Event) => this.handleDeleteRelation((e as CustomEvent<number>).detail));
        content = relationList;
    }

    const mainContainer = h("div", { className: "container", style: "max-width: 1200px; margin: 0 auto; padding: 24px;" }, backBtn, header, tabs, content);
    this.appendChild(mainContainer);
  }
}

customElements.define("admin-content-manager", AdminContentManager);

