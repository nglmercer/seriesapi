import { h } from 'preact';
import { useState } from 'preact/hooks';
import { api } from "../../services/api-service";
import i18next from "../../utils/i18n";
import { Modal } from "./Modal";

interface ReportModalProps {
  entityType?: string;
  entityId?: number;
  open?: boolean;
  onClose?: () => void;
}

export function ReportModal({ entityType = "", entityId = 0, open = false, onClose }: ReportModalProps) {
  const [reportType, setReportType] = useState("missing_translation");
  const [reportMessage, setReportMessage] = useState("");
  const [reported, setReported] = useState(false);

  async function submitReport(e: Event) {
    e.preventDefault();
    if (reported || !entityType || !entityId) return;

    const res = await api.reportIssue({
      entity_type: entityType,
      entity_id: entityId,
      report_type: reportType,
      locale: i18next.language,
      message: reportMessage
    });

    if (res.ok) {
      setReported(true);
      if (onClose) onClose();
      alert(i18next.t("media.report_requested") || "Report submitted successfully! Thank you.");
    }
  }

  function close() {
    if (onClose) onClose();
  }

  if (!open) return null;

  return (
    <Modal onClose={close}>
      <div class="report-modal-content">
        <style dangerouslySetInnerHTML={{ __html: `
          .report-modal-content h3 { margin-bottom: 20px; font-size: 1.25rem; }
          .report-modal-content select { width: 100%; margin-bottom: 16px; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); }
          .report-modal-content textarea { width: 100%; min-height: 100px; margin-bottom: 20px; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); resize: vertical; }
          .report-modal-content .actions { display: flex; justify-content: flex-end; gap: 12px; }
          .report-modal-content .btn-cancel { padding: 10px 20px; border-radius: 8px; border: 1px solid var(--border-color); background: transparent; color: var(--text-primary); cursor: pointer; }
          .report-modal-content .btn-submit { padding: 10px 20px; border-radius: 8px; border: none; background: var(--accent-color, #3366cc); color: white; cursor: pointer; font-weight: 600; }
          .report-modal-content .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        ` }} />
        <h3>{i18next.t("reports.title", { defaultValue: "Report an Issue" })}</h3>
        <form onSubmit={submitReport}>
          <select value={reportType} onChange={(e) => setReportType((e.target as HTMLSelectElement).value)}>
            <option value="missing_translation">{i18next.t("reports.missing_translation", { defaultValue: "Missing Translation" })}</option>
            <option value="incorrect_information">{i18next.t("reports.incorrect_information", { defaultValue: "Incorrect Information" })}</option>
            <option value="missing_fields">{i18next.t("reports.missing_fields", { defaultValue: "Missing Fields (e.g. synopsis)" })}</option>
            <option value="other">{i18next.t("reports.other", { defaultValue: "Other" })}</option>
          </select>
          <textarea
            value={reportMessage}
            onInput={(e) => setReportMessage((e.target as HTMLTextAreaElement).value)}
            placeholder={i18next.t("reports.optional_message", { defaultValue: "Optional message..." })}
          />
          <div class="actions">
            <button type="button" class="btn-cancel" onClick={close}>{i18next.t("common.cancel", { defaultValue: "Cancel" })}</button>
            <button type="submit" class="btn-submit" disabled={reported}>
              {reported ? i18next.t("reports.submitted", { defaultValue: "Submitted" }) : i18next.t("common.submit", { defaultValue: "Submit" })}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}