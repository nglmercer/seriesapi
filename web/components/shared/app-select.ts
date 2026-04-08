import { h } from "../../utils/dom";
import { CHEVRON_DOWN_ICON } from "../../utils/icons";

export class AppSelect extends HTMLElement {
  private _value = "";
  private _options: { label: string; value: any }[] = [];
  private _name = "";
  private _initialized = false;

  get value() { return (this.querySelector("select") as HTMLSelectElement)?.value || this._value; }
  set value(val: string) { this._value = val; if(this._initialized) this.render(); }
  
  set options(val: { label: string; value: any }[]) { this._options = val; if(this._initialized) this.render(); }
  set name(val: string) { this._name = val; if(this._initialized) this.render(); }

  connectedCallback() {
    this._initialized = true;
    this.render();
  }

  render() {
    this.innerHTML = "";
    const select = h("select", {
      name: this._name,
      style: `width: 100%; height: 48px; padding: 0 16px; border-radius: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 14px; font-weight: 500; appearance: none; cursor: pointer; transition: all 0.2s; outline: none; background-image: url('${CHEVRON_DOWN_ICON}'); background-repeat: no-repeat, repeat; background-position: right .7em top 50%, 0 0; background-size: .65em auto, 100%;`
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
