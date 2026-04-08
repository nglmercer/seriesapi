import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import i18next from "../../utils/i18n";
import { ICONS } from "../../utils/icons";
import { type RelationItem } from "../../services/api-service";

@customElement("admin-relation-list")
export class AdminRelationList extends LitElement {
  static override styles = css`
    :host { display: block; }
    .relations-container { display: block; }
    .relations-grid { 
      display: grid; 
      gap: 12px; 
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
    }
    .card { 
      margin: 0; 
      padding: 16px; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      border: 1px solid var(--border-color); 
      background: var(--bg-primary); 
      border-radius: 12px; 
      transition: all 0.2s; 
    }
    .badge { 
      text-transform: uppercase; 
      font-size: 9px; 
      font-weight: 900; 
      background: var(--accent-color); 
      color: white; 
      padding: 2px 6px; 
      border-radius: 4px; 
      letter-spacing: 0.5px; 
    }
    .type-label { 
      font-size: 11px; 
      font-weight: 700; 
      color: var(--text-secondary); 
      background: var(--bg-secondary); 
      padding: 2px 6px; 
      border-radius: 4px; 
    }
    .primary { 
      height: 32px; 
      padding: 0 12px; 
      border-radius: 8px; 
      font-weight: 700; 
      font-size: 13px;
      background: var(--accent-color);
      color: white;
      border: none;
      cursor: pointer;
    }
    .danger { 
      width: 32px; 
      height: 32px; 
      padding: 0; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      background: rgba(239, 68, 68, 0.1); 
      color: #ef4444; 
      border-radius: 8px; 
      cursor: pointer; 
      border: none; 
    }
  `;

  @property({ type: Array }) relations: RelationItem[] = [];

  override render() {
    return html`
      <div class="relations-container">
        <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:15px;">
          <h3 style="margin:0; font-size:18px; font-weight:800;">
            ${i18next.t("admin.relations_and_trilogies", { defaultValue: "Relations and Trilogies" })}
          </h3>
          <button class="primary" @click=${() => this.dispatchEvent(new CustomEvent("add-relation"))}>
            ${i18next.t("admin.add_relation", { defaultValue: "+ Add Relation" })}
          </button>
        </div>
        <div class="relations-grid">
          ${this.relations.map(rel => html`
            <div class="card">
              <div style="display:flex; flex-direction:column; gap:4px; min-width:0; flex:1;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="badge">${rel.relation_type}</span>
                  ${rel.related_type ? html`<span class="type-label">${rel.related_type}</span>` : ""}
                </div>
                <strong style="font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${rel.related_title || `Media ID: ${rel.related_media_id}`}
                </strong>
              </div>
              <button class="danger" @click=${() => this.dispatchEvent(new CustomEvent("delete-relation", { detail: rel.id }))}>
                ${ICONS.trash}
              </button>
            </div>
          `)}
          ${this.relations.length === 0 ? html`
            <div style="text-align:center; padding: 30px; color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius:12px; grid-column: 1 / -1;">
              ${i18next.t("admin.no_relations_added", { defaultValue: "No relations added yet." })}
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "admin-relation-list": AdminRelationList;
  }
}
