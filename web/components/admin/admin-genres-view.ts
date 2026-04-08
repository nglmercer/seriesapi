import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { api, type Genres } from "../../services/api-service";
import i18next from "../../utils/i18n";
import { ui } from "../../utils/ui";

@customElement("admin-genres-view")
export class AdminGenresView extends LitElement {
  static override styles = css`
    :host { display: block; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header h2 { margin: 0; font-size: 24px; font-weight: 900; color: var(--text-primary); }
    .genres-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
    .genre-card { 
      background: var(--bg-secondary); 
      border: 1px solid var(--border-color); 
      border-radius: 12px; 
      padding: 16px; 
      transition: all 0.2s;
    }
    .genre-card:hover { border-color: var(--accent-color); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .genre-info { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
    .genre-name { font-size: 16px; font-weight: 800; color: var(--text-primary); }
    .genre-meta { font-size: 12px; color: var(--text-secondary); font-family: monospace; }
    .actions { display: flex; gap: 8px; }
    button { 
      padding: 8px 16px; 
      border-radius: 8px; 
      border: 1px solid var(--border-color); 
      background: var(--bg-primary); 
      color: var(--text-primary); 
      font-weight: 700; 
      font-size: 13px; 
      cursor: pointer; 
      transition: all 0.2s; 
    }
    button:hover { background: var(--bg-secondary); border-color: var(--accent-color); }
    button.primary { background: var(--accent-color); color: white; border: none; box-shadow: 0 4px 12px rgba(255, 71, 87, 0.2); }
    button.primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(255, 71, 87, 0.3); }
    button.danger { color: #ff4757; }
    button.danger:hover { background: #ff4757; color: white; border-color: #ff4757; }
  `;

  @state() private genres: Genres[] = [];

  override async connectedCallback() {
    super.connectedCallback();
    await this.fetchGenres();
  }

  private async fetchGenres() {
    const res = await api.getGenres();
    if (res.ok) {
      this.genres = res.data as Genres[];
    }
  }

  private async handleAdd() {
    const data = await ui.editor<{ name: string }>("genre", null, i18next.t("admin.new_genre"));
    if (data?.name) {
      const res = await api.createGenre(data.name);
      if (res.ok) {
        await this.fetchGenres();
      } else {
        await ui.alert("Error creating genre");
      }
    }
  }

  private async handleEdit(id: string | number, oldName: string) {
    const data = await ui.editor<{ name: string }>("genre", { name: oldName });
    if (data?.name && data.name !== oldName) {
      const res = await api.updateGenre(id, data.name);
      if (res.ok) {
        await this.fetchGenres();
      } else {
        await ui.alert("Error updating genre");
      }
    }
  }

  private async handleDelete(id: string | number) {
    if (await ui.confirm(i18next.t("admin.delete_genre_confirm"))) {
      const res = await api.deleteGenre(id);
      if (res.ok) {
        await this.fetchGenres();
      } else {
        await ui.alert("Error deleting genre");
      }
    }
  }

  override render() {
    return html`
      <div class="header">
        <h2>${i18next.t("admin.manage_genres")}</h2>
        <button class="primary" @click=${this.handleAdd}>${i18next.t("admin.new_genre")}</button>
      </div>

      <div class="genres-grid">
        ${this.genres.map(g => html`
          <div class="genre-card">
            <div class="genre-info">
              <span class="genre-name">${g.name}</span>
              <span class="genre-meta">ID: ${g.id}</span>
              <span class="genre-meta">Slug: ${g.slug}</span>
            </div>
            <div class="actions">
              <button @click=${() => this.handleEdit(g.id, g.name)}>${i18next.t("admin.edit")}</button>
              <button class="danger" @click=${() => this.handleDelete(g.id)}>${i18next.t("admin.delete")}</button>
            </div>
          </div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "admin-genres-view": AdminGenresView;
  }
}
