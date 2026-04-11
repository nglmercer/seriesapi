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
      <div>
        <h3 class="mb-5 text-xl font-semibold">{i18next.t("reports.title", { defaultValue: "Report an Issue" })}</h3>
        <form onSubmit={submitReport}>
          <select 
            class="w-full mb-4 p-[10px] rounded-lg border border-border bg-secondary text-primary outline-none focus:ring-2 focus:ring-accent"
            value={reportType} 
            onChange={(e) => setReportType((e.target as HTMLSelectElement).value)}
          >
            <option value="missing_translation">{i18next.t("reports.missing_translation", { defaultValue: "Missing Translation" })}</option>
            <option value="incorrect_information">{i18next.t("reports.incorrect_information", { defaultValue: "Incorrect Information" })}</option>
            <option value="missing_fields">{i18next.t("reports.missing_fields", { defaultValue: "Missing Fields (e.g. synopsis)" })}</option>
            <option value="other">{i18next.t("reports.other", { defaultValue: "Other" })}</option>
          </select>
          <textarea
            class="w-full min-h-[100px] mb-5 p-[10px] rounded-lg border border-border bg-secondary text-primary resize-y outline-none focus:ring-2 focus:ring-accent"
            value={reportMessage}
            onInput={(e) => setReportMessage((e.target as HTMLTextAreaElement).value)}
            placeholder={i18next.t("reports.optional_message", { defaultValue: "Optional message..." })}
          />
          <div class="flex justify-end gap-3">
            <button 
              type="button" 
              class="px-5 py-[10px] rounded-lg border border-border bg-transparent text-primary cursor-pointer hover:bg-secondary transition-colors" 
              onClick={close}
            >
              {i18next.t("common.cancel", { defaultValue: "Cancel" })}
            </button>
            <button 
              type="submit" 
              class="px-5 py-[10px] rounded-lg border-none bg-accent text-white cursor-pointer font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-hover transition-colors" 
              disabled={reported}
            >
              {reported ? i18next.t("reports.submitted", { defaultValue: "Submitted" }) : i18next.t("common.submit", { defaultValue: "Submit" })}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}