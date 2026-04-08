import { h } from "../../utils/dom";

export class AppField extends HTMLElement {
    private _label = "";
    private _error = "";
    private _container: HTMLElement;
    private _contentWrapper: HTMLElement;
    private _labelElement: HTMLElement | null = null;
    private _errorElement: HTMLElement | null = null;

    constructor() {
        super();
        this._container = h("div", { 
            style: "display: flex; flex-direction: column; gap: 6px; width: 100%;" 
        });
        this._contentWrapper = h("div", { className: "field-content", style: "width: 100%;" });
        this._container.appendChild(this._contentWrapper);
    }

    set label(val: string) {
        this._label = val;
        this.updateLabel();
    }

    set error(val: string) {
        this._error = val;
        this.updateError();
    }

    connectedCallback() {
        if (!this.contains(this._container)) {
            // Move children into the content wrapper
            while (this.firstChild) {
                this._contentWrapper.appendChild(this.firstChild);
            }
            this.appendChild(this._container);
        }
        this.updateLabel();
        this.updateError();
    }

    private updateLabel() {
        if (!this._label) {
            this._labelElement?.remove();
            this._labelElement = null;
            return;
        }
        if (!this._labelElement) {
            this._labelElement = h("label", { 
                style: "font-size: 12px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; display: block;" 
            });
            this._container.prepend(this._labelElement);
        }
        this._labelElement.textContent = this._label;
    }

    private updateError() {
        if (!this._error) {
            this._errorElement?.remove();
            this._errorElement = null;
            return;
        }
        if (!this._errorElement) {
            this._errorElement = h("span", { 
                style: "font-size: 11px; color: var(--error-color); margin-top: 4px; font-weight: 600; display: block;" 
            });
            this._container.appendChild(this._errorElement);
        }
        this._errorElement.textContent = this._error;
    }
}

customElements.define("app-field", AppField);
