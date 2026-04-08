import { h } from "../../utils/dom";

export class AppField extends HTMLElement {
    private _label = "";
    private _error = "";

    set label(val: string) {
        this._label = val;
        this.render();
    }

    set error(val: string) {
        this._error = val;
        this.render();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        // Keep internal content (the input/select) but wrap it
        const content = Array.from(this.childNodes);
        this.innerHTML = "";
        
        const container = h("div", { 
            style: "display: flex; flex-direction: column; gap: 6px; width: 100%;" 
        },
            this._label ? h("label", { 
                style: "font-size: 13px; font-weight: 700; color: var(--text-primary); margin-left: 4px;" 
            }, this._label) : null,
            h("div", { className: "field-content", style: "width: 100%;" }, ...content),
            this._error ? h("span", { 
                style: "font-size: 11px; color: var(--error-color); margin-left: 4px; font-weight: 600;" 
            }, this._error) : null
        );

        this.appendChild(container);
    }
}

customElements.define("app-field", AppField);
