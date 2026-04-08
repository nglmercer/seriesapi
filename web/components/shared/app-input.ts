import { h } from "../../utils/dom";

export class AppInput extends HTMLElement {
  private _value = "";
  private _type = "text";
  private _placeholder = "";
  private _name = "";

  get value() { return (this.querySelector("input") as HTMLInputElement)?.value || this._value; }
  set value(val: string) { this._value = val; this.render(); }
  
  set type(val: string) { this._type = val; this.render(); }
  set placeholder(val: string) { this._placeholder = val; this.render(); }
  set name(val: string) { this._name = val; this.render(); }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = "";
    const input = h("input", {
      type: this._type,
      name: this._name,
      value: this._value,
      placeholder: this._placeholder,
      style: "width: 100%; height: 48px; padding: 0 16px; border-radius: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 14px; font-weight: 500; transition: all 0.2s;"
    });

    input.addEventListener("focus", () => {
        input.style.borderColor = "var(--accent-color)";
        input.style.boxShadow = "0 0 0 2px rgba(255, 71, 87, 0.1)";
    });
    input.addEventListener("blur", () => {
        input.style.borderColor = "var(--border-color)";
        input.style.boxShadow = "none";
    });

    this.appendChild(input);
  }
}

customElements.define("app-input", AppInput);
