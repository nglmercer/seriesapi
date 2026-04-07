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
          <h3>${i18next.t("reports.title", { defaultValue: "Report an Issue" })}</h3>
          <form @submit=${this.submitReport}>
            <select .value=${this.reportType} @change=${(e: Event) => this.reportType = (e.target as HTMLSelectElement).value}>
              <option value="missing_translation">${i18next.t("reports.missing_translation", { defaultValue: "Missing Translation" })}</option>
              <option value="incorrect_information">${i18next.t("reports.incorrect_information", { defaultValue: "Incorrect Information" })}</option>
              <option value="missing_fields">${i18next.t("reports.missing_fields", { defaultValue: "Missing Fields (e.g. synopsis)" })}</option>
              <option value="other">${i18next.t("reports.other", { defaultValue: "Other" })}</option>
            </select>
            <textarea .value=${this.reportMessage} @input=${(e: Event) => this.reportMessage = (e.target as HTMLTextAreaElement).value} placeholder=${i18next.t("reports.optional_message", { defaultValue: "Optional message..." })}></textarea>
            <div class="actions">
              <button type="button" class="btn-cancel" @click=${this.close}>${i18next.t("common.cancel", { defaultValue: "Cancel" })}</button>
              <button type="submit" class="btn-submit" ?disabled=${this.reported}>
                ${this.reported ? i18next.t("reports.submitted", { defaultValue: "Submitted" }) : i18next.t("common.submit", { defaultValue: "Submit" })}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
}
