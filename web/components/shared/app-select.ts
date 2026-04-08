import { h } from "../../utils/dom";

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
      style: "width: 100%; height: 48px; padding: 0 16px; border-radius: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 14px; font-weight: 500; appearance: none; cursor: pointer; transition: all 0.2s; outline: none; background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat, repeat; background-position: right .7em top 50%, 0 0; background-size: .65em auto, 100%;"
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
