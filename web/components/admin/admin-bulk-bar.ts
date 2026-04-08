import { h } from "../../utils/dom";
import i18next from "../../utils/i18n";

export class AdminBulkBar extends HTMLElement {
  private _selectedCount = 0;

  get selectedCount(): number {
    return this._selectedCount;
  }

  set selectedCount(val: number) {
    this._selectedCount = val;
    this.render();
  }

  private onAction(action: string) {
    this.dispatchEvent(new CustomEvent("bulk-action", { detail: action }));
  }

  render() {
    this.innerHTML = "";
    if (this._selectedCount === 0) return;

    const container = h("div", { 
      className: "bulk-actions", 
      style: "background: var(--accent-color); color: white; padding: 12px 24px; border-radius: 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; box-shadow: 0 8px 30px rgba(255, 71, 87, 0.3); animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);" 
    },
      h("div", { style: "display: flex; align-items: center; gap: 20px;" },
        h("div", { style: "display: flex; flex-direction: column;" },
          h("strong", { style: "font-size: 16px;" }, i18next.t("admin.selected_count", { count: this._selectedCount, defaultValue: `${this._selectedCount} selected` })),
          h("span", { style: "font-size: 11px; opacity: 0.8; text-transform: uppercase; font-weight: 700;" }, "Bulk Actions")
        ),
        h("div", { style: "height: 30px; width: 1px; background: rgba(255,255,255,0.2);" }),
        h("div", { style: "display: flex; gap: 8px;" },
          h("button", { 
            onclick: () => this.onAction("status"),
            style: "background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;"
          }, i18next.t("admin.change_status", { defaultValue: "Status" })),
          h("button", { 
            onclick: () => this.onAction("add_tag"),
            style: "background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;"
          }, i18next.t("admin.add_tag", { defaultValue: "Add Tag" })),
          h("button", { 
            onclick: () => this.onAction("replace_tags"),
            style: "background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;"
          }, i18next.t("admin.replace_tags", { defaultValue: "Replace" })),
          h("button", { 
            onclick: () => this.onAction("clear_tags"),
            style: "background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;"
          }, i18next.t("admin.clear_tags", { defaultValue: "Clear" }))
        )
      ),
      h("button", { 
        onclick: () => this.onAction("cancel"),
        style: "background: transparent; border: 1px solid rgba(255,255,255,0.4); color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;"
      }, i18next.t("admin.cancel", { defaultValue: "Cancel" }))
    );

    this.appendChild(container);
  }
}

customElements.define("admin-bulk-bar", AdminBulkBar);
