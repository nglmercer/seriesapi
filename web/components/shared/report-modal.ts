import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { api } from "../../services/api-service";
import i18next from "../../utils/i18n";

@customElement("report-modal")
export class ReportModal extends LitElement {
  static override styles = css`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.8);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal {
      background: var(--bg-primary); padding: 30px; border-radius: 12px;
      max-width: 400px; width: 100%; border: 1px solid var(--border-color);
    }
    h3 { margin-top: 0; margin-bottom: 20px; }
    form { display: flex; flex-direction: column; gap: 15px; }
    select, textarea {
      padding: 10px; border-radius: 6px; background: var(--bg-secondary);
      color: var(--text-primary); border: 1px solid var(--border-color); font-family: inherit;
    }
    textarea { min-height: 100px; resize: vertical; }
    .actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px; }
    button { padding: 10px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; }
    .btn-cancel { background: var(--bg-secondary); color: var(--text-primary); }
    .btn-submit { background: var(--accent); color: white; }
    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
  `;

  @property({ type: String }) entityType = "";
  @property({ type: Number }) entityId = 0;
  @property({ type: Boolean }) open = false;

  @state() reportType = "missing_translation";
  @state() reportMessage = "";
  @state() reported = false;

  private async submitReport(e: Event) {
    e.preventDefault();
    if (this.reported || !this.entityType || !this.entityId) return;

    const res = await api.reportIssue({
      entity_type: this.entityType,
      entity_id: this.entityId,
      report_type: this.reportType,
      locale: i18next.language,
      message: this.reportMessage
    });

    if (res.ok) {
       this.reported = true;
       this.open = false;
       this.dispatchEvent(new CustomEvent("closed", { bubbles: true, composed: true }));
       alert(i18next.t("media.report_requested") || "Report submitted successfully! Thank you.");
    }
  }

  private close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent("closed", { bubbles: true, composed: true }));
  }

  override render() {
    if (!this.open) return null;

    return html`
      <div class="overlay">
        <div class="modal">
          <h3>Report an Issue</h3>
          <form @submit=${this.submitReport}>
            <select .value=${this.reportType} @change=${(e: Event) => this.reportType = (e.target as HTMLSelectElement).value}>
              <option value="missing_translation">Missing Translation</option>
              <option value="incorrect_information">Incorrect Information</option>
              <option value="missing_fields">Missing Fields (e.g. synopsis)</option>
              <option value="other">Other</option>
            </select>
            <textarea .value=${this.reportMessage} @input=${(e: Event) => this.reportMessage = (e.target as HTMLTextAreaElement).value} placeholder="Optional message..."></textarea>
            <div class="actions">
              <button type="button" class="btn-cancel" @click=${this.close}>Cancel</button>
              <button type="submit" class="btn-submit" ?disabled=${this.reported}>
                ${this.reported ? 'Submitted' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
}
