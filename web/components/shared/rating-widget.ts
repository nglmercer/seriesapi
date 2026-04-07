import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { api } from "../../services/api-service";
import i18next from "../../utils/i18n";

@customElement("rating-widget")
export class RatingWidget extends LitElement {
  static override styles = css`
    :host { display: block; font-family: inherit; }
    .container { display: flex; align-items: center; gap: 16px; background: var(--bg-secondary); padding: 12px 20px; border-radius: 12px; border: 1px solid var(--border-color); }
    .stars { display: flex; flex-direction: row-reverse; gap: 4px; }
    .star { 
      cursor: pointer; font-size: 24px; color: var(--border-color); transition: color 0.2s, transform 0.1s; 
      user-select: none;
    }
    .star:hover, .star:hover ~ .star { color: #f1c40f; transform: scale(1.1); }
    .star.active { color: #f1c40f; }
    .info { display: flex; flex-direction: column; }
    .average { font-size: 18px; font-weight: 800; color: var(--text-primary); display: flex; align-items: baseline; gap: 4px; }
    .average span { font-size: 14px; color: var(--text-secondary); font-weight: 500; }
    .count { font-size: 12px; color: var(--text-secondary); }
    .label { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
  `;

  @property({ type: String }) entityType = "";
  @property({ type: Number }) entityId = 0;
  @property({ type: Number }) average = 0;
  @property({ type: Number }) count = 0;
  
  @state() loading = false;
  @state() userRating = 0;

  private async handleRate(score: number) {
    if (this.loading || !this.entityType || !this.entityId) return;
    this.userRating = score;
    this.loading = true;
    
    // Rating 1 to 10
    const res = await api.postRating({
      entity_type: this.entityType,
      entity_id: this.entityId,
      score
    });
    
    if (res.ok && res.data) {
      this.average = res.data.average;
      this.count = res.data.count;
    } else {
      alert("Error submitting rating.");
      this.userRating = 0;
    }
    this.loading = false;
  }

  override render() {
    return html`
      <div class="container">
        <div class="info">
          <div class="average">${this.average > 0 ? this.average.toFixed(1) : '-' } <span>/ 10</span></div>
          <div class="count">${this.count} ${i18next.t("ratings.votes", { defaultValue: "votes" })}</div>
        </div>
        
        <div style="width: 1px; height: 30px; background: var(--border-color);"></div>
        
        <div style="display: flex; flex-direction: column;">
          <div class="label">${i18next.t("ratings.rate_this", { defaultValue: "Rate this!" })}</div>
          <div class="stars" style="opacity: ${this.loading ? 0.5 : 1}">
            <!-- 10 stars using row-reverse so hovering works nicely with CSS -->
            ${[10,9,8,7,6,5,4,3,2,1].map(n => html`
              <span 
                class="star ${this.userRating && n <= this.userRating ? 'active' : ''}" 
                @click=${() => this.handleRate(n)}
              >★</span>
            `)}
          </div>
        </div>
      </div>
    `;
  }
}
