import { LitElement, html, css, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { api, type MediaItem, type EpisodeItem, type SeasonItem, type RelationItem } from "../../services/api-service";
import i18next from "../../utils/i18n";
import { ui } from "../../utils/ui";
import { ICONS } from "../../utils/icons";
import "./admin-season-list";
import "./admin-episode-list";
import "./admin-relation-list";

@customElement("admin-content-manager")
export class AdminContentManager extends LitElement {
  static override styles = css`
    :host { display: block; }
    .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
    .card { background: var(--bg-secondary); margin-bottom: 24px; padding: 24px; border-radius:16px; border: 1px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .admin-tabs { display: flex; gap: 24px; border-bottom: 2px solid var(--border-color); margin-bottom: 24px; }
    .tab-btn { border-radius:0; border:none; background:transparent; cursor:pointer; padding: 12px 4px; font-weight:700; font-size:15px; color:var(--text-secondary); }
    .tab-btn.active { border-bottom: 4px solid var(--accent-color); color:var(--accent-color); }
    .tab-btn.disabled { cursor: not-allowed; opacity: 0.4; }
    .content-grid { display: grid; grid-template-columns: 300px 1fr; gap: 24px; }
    @media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } }
    .back-btn { margin-bottom: 24px; padding: 10px 20px; font-weight: 700; border-radius:10px; display:flex; align-items:center; gap:8px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); cursor: pointer; }
  `;

  @property({ type: Number }) mediaId: number | null = null;
  @state() private media: MediaItem | null = null;
  @state() private seasons: SeasonItem[] = [];
  @state() private selectedSeasonId: number | null = null;
  @state() private episodes: EpisodeItem[] = [];
  @state() private relations: RelationItem[] = [];
  @state() private currentTab: "episodes" | "relations" = "episodes";

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has("mediaId") && this.mediaId) {
      this.fetchData();
    }
  }

  setMedia(id: number) {
    this.mediaId = id;
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
  }

  private async fetchEpisodes(seasonId: number) {
    this.selectedSeasonId = seasonId;
    const res = await api.getSeasonEpisodes(seasonId);
    if (res.ok) {
      this.episodes = res.data;
    }
  }

  // Season & Episode Handlers
  private async handleEditSeason(season: SeasonItem) {
      const data = await ui.editor<Partial<SeasonItem>>("season", season);
      if (data) {
          await api.updateSeason(season.id, data);
          await this.fetchData();
      }
  }

  private async handleEditEpisode(ep: EpisodeItem) {
      const data = await ui.editor<Partial<EpisodeItem>>("episode", ep);
      if (data) {
          await api.updateEpisode(ep.id, data);
          if(this.selectedSeasonId) await this.fetchEpisodes(this.selectedSeasonId);
      }
  }

  private async handleAddSeason() {
    if (!this.mediaId) return;
    const data = await ui.editor<{ season_number: number; name: string; air_date: string }>("season", {
        season_number: this.seasons.length + 1
    }, i18next.t("admin.new_season"));
    if (!data) return;
    const res = await api.createSeason({ 
        mediaId: this.mediaId, 
        seasonNumber: data.season_number,
        title: data.name
    });
    if (res.ok) await this.fetchData();
  }

  private async handleAddEpisode() {
    if (!this.mediaId || !this.selectedSeasonId) return;
    const data = await ui.editor<{ episode_number: number; title: string; episode_type: string; synopsis: string }>("episode", {
        episode_number: this.episodes.length + 1
    }, i18next.t("admin.new_episode"));
    if (!data) return;
    const res = await api.createEpisode({ 
        mediaId: this.mediaId, 
        seasonId: this.selectedSeasonId, 
        number: data.episode_number,
        title: data.title,
        synopsis: data.synopsis
    });
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
          else await ui.alert(i18next.language === 'es' ? "ID no válido or error" : "Invalid ID or error");
      }
  }

  private async handleDeleteRelation(id: number) {
      if (!this.mediaId) return;
      if (await ui.confirm(i18next.language === 'es' ? "¿Borrar esta relación?" : "Delete this relation?")) {
          await api.deleteMediaRelation(this.mediaId, id);
          await this.fetchData();
      }
  }

  override render() {
    if (!this.media) {
      return html`<div class="card">${i18next.t("admin.loading_media_info")}</div>`;
    }

    const isEpisodic = !["movie", "short"].includes(this.media.content_type);

    return html`
      <div class="container">
        <button class="back-btn" @click=${() => this.dispatchEvent(new CustomEvent("back", { bubbles: true }))}>
          <span>${ICONS.back}</span> ${i18next.t("admin.back_to_media_list")}
        </button>

        <div class="card">
          <h2 style="margin:0 0 8px 0; font-size:24px; font-weight:900; color:var(--text-primary);">
            ${i18next.t("admin.managing", { title: this.media.title })}
          </h2>
          <p style="margin:0; color: var(--text-secondary); font-size:15px; font-weight:500;">
            ${i18next.t("admin.content_mgmt_desc")}
          </p>
        </div>

        <div class="admin-tabs">
          <button 
            class="tab-btn ${this.currentTab === 'episodes' ? 'active' : ''} ${!isEpisodic ? 'disabled' : ''}"
            @click=${() => { if(isEpisodic) this.currentTab = "episodes"; }}
          >
            ${i18next.t("admin.episodes")}
          </button>
          <button 
            class="tab-btn ${this.currentTab === 'relations' ? 'active' : ''}"
            @click=${() => this.currentTab = "relations"}
          >
            ${i18next.language === 'es' ? "Relaciones / Trilogías" : "Relations / Trilogies"}
          </button>
        </div>

        <div class="tab-content">
          ${this.renderTabContent(isEpisodic)}
        </div>
      </div>
    `;
  }

  private renderTabContent(isEpisodic: boolean) {
    if (this.currentTab === "episodes" && isEpisodic) {
      return html`
        <div class="content-grid">
          <admin-season-list 
            .seasons=${this.seasons} 
            .selectedId=${this.selectedSeasonId}
            @select-season=${(e: CustomEvent<number>) => this.fetchEpisodes(e.detail)}
            @add-season=${this.handleAddSeason}
            @edit-season=${(e: CustomEvent<SeasonItem>) => this.handleEditSeason(e.detail)}
          ></admin-season-list>
          <admin-episode-list 
            .episodes=${this.episodes} 
            .seasonId=${this.selectedSeasonId}
            @add-episode=${this.handleAddEpisode}
            @edit-episode=${(e: CustomEvent<EpisodeItem>) => this.handleEditEpisode(e.detail)}
            @delete-episode=${(e: CustomEvent<number>) => this.handleDeleteEpisode(e.detail)}
          ></admin-episode-list>
        </div>
      `;
    } else if (this.currentTab === "episodes" && !isEpisodic) {
      return html`
        <div class="card" style="text-align:center; padding: 60px 40px; color: var(--text-secondary);">
          <div style="font-size: 48px; margin-bottom: 24px;">🎬</div>
          <h3 style="font-size:20px; font-weight:800; color:var(--text-primary); margin-bottom:8px;">
            ${i18next.language === 'es' ? "Contenido no episódico" : "Non-episodic content"}
          </h3>
          <p style="font-weight:500;">
            ${i18next.language === 'es' ? "Las temporadas no son aplicables. Usa la pestaña 'Relaciones' para conectar secuelas o trilogías." : "Seasons are not applicable. Use the 'Relations' tab to connect sequels or trilogies."}
          </p>
        </div>
      `;
    } else {
      return html`
        <admin-relation-list 
          .relations=${this.relations}
          @add-relation=${this.handleAddRelation}
          @delete-relation=${(e: CustomEvent<number>) => this.handleDeleteRelation(e.detail)}
        ></admin-relation-list>
      `;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "admin-content-manager": AdminContentManager;
  }
}

