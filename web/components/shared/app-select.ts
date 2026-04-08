import { h } from "../../utils/dom";

export class AppSelect extends HTMLElement {
  private _value = "";
  private _options: { label: string; value: any }[] = [];
  private _name = "";

  get value() { return (this.querySelector("select") as HTMLSelectElement)?.value || this._value; }
  set value(val: string) { this._value = val; this.render(); }
  
  set options(val: { label: string; value: any }[]) { this._options = val; this.render(); }
  set name(val: string) { this._name = val; this.render(); }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = "";
    const select = h("select", {
      name: this._name,
      style: "width: 100%; height: 48px; padding: 0 16px; border-radius: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 14px; font-weight: 500; appearance: none; cursor: pointer; transition: all 0.2s;"
    }, 
      ...this._options.map(opt => h("option", { 
        value: opt.value, 
        selected: String(opt.value) === String(this._value) 
      }, opt.label))
    );

    select.addEventListener("focus", () => {
        select.style.borderColor = "var(--accent-color)";
        select.style.boxShadow = "0 0 0 2px rgba(255, 71, 87, 0.1)";
    });
    select.addEventListener("blur", () => {
        select.style.borderColor = "var(--border-color)";
        select.style.boxShadow = "none";
    });

    this.appendChild(select);
  }
}

customElements.define("app-select", AppSelect);
