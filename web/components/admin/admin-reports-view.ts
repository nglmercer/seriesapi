import { html, LitElement, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { api } from "../../services/api-service";

@customElement("admin-reports-view")
export class AdminReportsView extends LitElement {
  static override styles = css`
    :host { display: block; padding: 20px; }
    .card { background: var(--bg-secondary); border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid var(--border-color); }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .type { font-weight: bold; padding: 4px 8px; border-radius: 4px; background: var(--accent); color: white; font-size: 12px; text-transform: uppercase; }
    .meta { color: var(--text-secondary); font-size: 12px; }
    .message { margin-top: 8px; white-space: pre-wrap; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border-color); }
    th { color: var(--text-secondary); font-weight: 500; font-size: 14px; }
  `;

  @state() reports: any[] = [];
  @state() loading = true;

  override connectedCallback() {
    super.connectedCallback();
    this.load();
  }

  async load() {
    this.loading = true;
    const res = await api.getReports();
    if (res.ok && res.data) {
      this.reports = res.data;
    }
    this.loading = false;
  }

  override render() {
    if (this.loading) return html`<div>Loading reports...</div>`;
    
    if (!this.reports.length) {
      return html`
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
          No reports found.
        </div>
      `;
    }

    return html`
      <h2>User Reports</h2>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Entity</th>
              <th>Locale</th>
              <th>Message</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${this.reports.map(r => html`
              <tr>
                <td>#${r.id}</td>
                <td><span class="type" style="background: ${r.report_type === 'missing_translation' ? '#ff9f43' : 'var(--accent)'}">${r.report_type.replace('_', ' ')}</span></td>
                <td>${r.entity_type} ${r.entity_id}</td>
                <td>${r.locale || '-'}</td>
                <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${r.message || '-'}</td>
                <td><span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${r.status === 'resolved' ? '#1dd1a1' : 'var(--bg-secondary)'}">${r.status}</span></td>
                <td class="meta">${new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }
}
