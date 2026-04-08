import { api, type MediaItem, type EpisodeItem, type SeasonItem, type RelationItem } from "../../services/api-service";
import i18next from "../../utils/i18n";
import { h } from "../../utils/dom";
import { ui } from "../../utils/ui";

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
    if (sRes.ok) this.seasons = sRes.data.seasons;
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

  // Season & Episode Handlers (unchanged logic)
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

  // Relations Handlers
  private async handleAddRelation() {
      if (!this.mediaId) return;
      const data = await ui.form<{ relatedId: number; type: string }>(i18next.language === 'es' ? "Nueva Relación (Precuela/Secuela)" : "New Relation (Prequel/Sequel)", [
          { label: i18next.language === 'es' ? "ID del Contenido Relacionado" : "Related Media ID", name: "relatedId", type: "number" },
          { 
              label: i18next.language === 'es' ? "Tipo de Relación" : "Relation Type", name: "type", type: "select",
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
        style: "margin-bottom: 20px;"
    }, i18next.t("admin.back_to_media_list"));

    const header = h("div", { className: "card", style: "background: var(--bg-secondary); margin-bottom: 20px;" },
      h("h2", {}, i18next.t("admin.managing", { title: this.media.title })),
      h("p", { style: "color: var(--text-secondary);" }, i18next.t("admin.content_mgmt_desc"))
    );

    const isEpisodic = !["movie", "short"].includes(this.media.content_type);

    const tabs = h("div", { className: "admin-tabs", style: "display: flex; gap: 20px; border-bottom: 2px solid var(--border-color); margin-bottom: 20px;" },
      h("button", {
        onclick: () => { if(isEpisodic) { this.currentTab = "episodes"; this.render(); } },
        style: `border-radius:0; border:none; background:transparent; cursor:${isEpisodic ? 'pointer' : 'not-allowed'}; opacity:${isEpisodic ? '1' : '0.4'}; padding: 10px; ${this.currentTab === 'episodes' ? 'border-bottom: 3px solid var(--accent-color)' : ''}`
      }, i18next.t("admin.episodes")),
      h("button", {
        onclick: () => { this.currentTab = "relations"; this.render(); },
        style: `border-radius:0; border:none; background:transparent; cursor:pointer; padding: 10px; ${this.currentTab === 'relations' ? 'border-bottom: 3px solid var(--accent-color)' : ''}`
      }, i18next.language === 'es' ? "Relaciones / Trilogías" : "Relations / Trilogies")
    );

    let content;
    if (this.currentTab === "episodes" && isEpisodic) {
        content = h("div", { style: "display: grid; grid-template-columns: 1fr 2fr; gap: 20px;" },
            // (Standard Episodic Content logic - same as before)
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
                            h("button", { onclick: () => { if(ep.id) this.handleDeleteEpisode(ep.id); }, className: "danger", style: "padding:2px 6px; font-size:11px; background:var(--error-color); color:white;" }, i18next.t("admin.delete"))
                        )
                     )),
                     h("button", { onclick: () => this.handleAddEpisode(), style: "margin-top:10px;", className: "primary" }, i18next.t("admin.add_episode"))
                ) : h("div", { className: "card", style: "text-align:center; color: var(--text-secondary);" }, `← ${i18next.t("admin.select_season_desc")}`)
            )
        );
    } else if(this.currentTab === "episodes" && !isEpisodic) {
        content = h("div", { className: "card", style: "text-align:center; padding: 40px; color: var(--text-secondary);" },
            h("div", { style: "font-size: 40px; margin-bottom: 20px;" }, "🎬"),
            h("h3", {}, i18next.language === 'es' ? "Contenido no episódico" : "Non-episodic content"),
            h("p", {}, i18next.language === 'es' ? "Las temporadas no son aplicables. Usa la pestaña 'Relaciones' para conectar secuelas o trilogías." : "Seasons are not applicable. Use the 'Relations' tab to connect sequels or trilogies.")
        );
    } else {
        // Relations Content
        content = h("div", {},
            h("div", { style: "display:flex; justify-content: space-between; align-items:center; margin-bottom: 20px;" },
                h("h3", {}, i18next.language === 'es' ? "Relaciones y Trilogías" : "Relations and Trilogies"),
                h("button", { onclick: () => this.handleAddRelation(), className: "primary" }, "+")
            ),
            h("div", { className: "relations-grid", style: "display: grid; gap: 12px;" },
                ...this.relations.map(rel => h("div", { className: "card", style: "margin:0; padding:12px; display:flex; justify-content: space-between; align-items:center;" },
                    h("div", {},
                        h("span", { className: "badge", style: "text-transform: uppercase; margin-right: 15px; font-size: 10px; background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px;" }, rel.relation_type),
                        h("strong", {}, rel.related_title || `Related Media ID: ${rel.related_media_id}`),
                        rel.related_type ? h("small", { style: "margin-left: 10px; color: var(--text-secondary);" }, `(${rel.related_type})`) : null
                    ),
                    h("button", { onclick: () => this.handleDeleteRelation(rel.id), className: "danger", style: "padding:2px 8px; font-size:11px; background:var(--error-color); color:white;" }, i18next.t("admin.delete"))
                )),
                this.relations.length === 0 ? h("div", { style: "text-align:center; padding: 20px; color: var(--text-secondary);" }, i18next.language === 'es' ? "No hay relaciones agregadas." : "No relations added yet.") : null
            )
        );
    }

    const container = h("div", {}, backBtn, header, tabs, content);
    this.appendChild(container);
  }

  private async handleDeleteEpisode(id: number) {
    if(await ui.confirm(i18next.t("admin.delete_episode_confirm"))) {
        await api.deleteEpisode(id);
        if(this.selectedSeasonId) await this.fetchEpisodes(this.selectedSeasonId);
    }
}
}

customElements.define("admin-content-manager", AdminContentManager);
