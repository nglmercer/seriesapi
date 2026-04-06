import { api,type MediaItem } from "./api-service";
import { h } from "../utils/dom";

export class MediaList extends HTMLElement {
  private items: MediaItem[] = [];
  private loading = false;
  private page = 1;

  async connectedCallback() {
    await this.load();
  }

  async load() {
    this.loading = true;
    this.render();
    const res = await api.getMedia(this.page, 20);
    if (res.ok) {
      this.items = res.data;
    }
    this.loading = false;
    this.render();
  }

  render() {
    this.innerHTML = "";
    if (this.loading) {
      this.appendChild(h("div", { className: "card", style: "text-align:center" }, "Loading..."));
      return;
    }

    const grid = h("div", { 
      style: "display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; padding: 20px 0;" 
    }, ...this.items.map(item => h("div", { 
        className: "card", 
        style: "cursor: pointer; transition: transform 0.2s;",
        onclick: () => this.dispatchEvent(new CustomEvent("media-select", { detail: item, bubbles: true }))
      },
      h("img", { 
        src: item.poster_url, 
        style: "width: 100%; height: 260px; object-fit: cover; border-radius: 4px;" 
      }),
      h("div", { style: "margin-top: 10px; font-weight: bold;" }, item.title),
      h("div", { style: "font-size: 12px; color: var(--text-secondary);" }, `${item.content_type} | ${item.status}`)
    )));

    this.appendChild(grid);
  }
}

customElements.define("media-list", MediaList);