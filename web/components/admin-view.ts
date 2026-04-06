import { api, type MediaItem } from "./api-service";
import { h } from "../utils/dom";
import { ui } from "../utils/ui";
import "./admin-media-form";
import "./admin-genres-view";
import "./admin-content-manager";

export class AdminView extends HTMLElement {
  private mediaList: MediaItem[] = [];
  private searchQuery = "";
  private currentTab: "media" | "genres" = "media";
  private editingMediaId: number | null = null; // Used for Content Manager

  async connectedCallback() {
    await this.fetchMedia();
    this.render();
  }

  private async fetchMedia() {
    const res = await api.getMedia(1, 20, this.searchQuery ? { q: this.searchQuery } : {});
    if (res.ok) {
      this.mediaList = res.data;
    }
  }

  private async handleSearch(e: Event) {
    e.preventDefault();
    const query = (e.target as HTMLFormElement).querySelector("input")?.value || "";
    this.searchQuery = query;
    await this.fetchMedia();
    this.render();
  }

  private openEditMedia(media: MediaItem | null) {
    const form = document.createElement("admin-media-form") as any;
    form.setMedia(media);
    form.addEventListener("saved", async () => {
      await this.fetchMedia();
      this.render();
    });
    document.body.appendChild(form);
  }

  private openContentManager(id: number) {
    this.editingMediaId = id;
    this.render();
  }

  private async handleDeleteMedia(id: number) {
    if (await ui.confirm("Delete this media forever?")) {
      await api.deleteMedia(id);
      await this.fetchMedia();
      this.render();
    }
  }

  render() {
    this.innerHTML = "";
    const container = h("div", { className: "container" });

    if (this.editingMediaId) {
        const mgr = document.createElement("admin-content-manager") as any;
        mgr.setMedia(this.editingMediaId);
        mgr.addEventListener("back", () => {
           this.editingMediaId = null;
           this.render();
        });
        container.appendChild(mgr);
        this.appendChild(container);
        return;
    }

    const nav = h("div", { className: "admin-tabs", style: "display: flex; gap: 20px; border-bottom: 2px solid var(--border-color); margin-bottom: 20px;" },
      h("button", {
        className: this.currentTab === 'media' ? 'active' : '',
        onclick: () => { this.currentTab = 'media'; this.render(); },
        style: `border-radius:0; border:none; background:transparent; cursor:pointer; padding: 10px; ${this.currentTab === 'media' ? 'border-bottom: 3px solid var(--accent-color)' : ''}`
      }, "Media"),
      h("button", {
        className: this.currentTab === 'genres' ? 'active' : '',
        onclick: () => { this.currentTab = 'genres'; this.render(); },
        style: `border-radius:0; border:none; background:transparent; cursor:pointer; padding: 10px; ${this.currentTab === 'genres' ? 'border-bottom: 3px solid var(--accent-color)' : ''}`
      }, "Genres")
    );

    let content;
    if (this.currentTab === 'media') {
      content = h("div", {},
        h("div", { style: "display:flex; justify-content: space-between; align-items: center; margin-bottom: 20px;" },
          h("form", { onsubmit: (e: Event) => this.handleSearch(e), style: "display:flex; gap: 10px; width:100%; max-width:400px;" },
            h("input", { type: "search", placeholder: "Search Title / ID...", value: this.searchQuery }),
            h("button", { type: "submit" }, "Search")
          ),
          h("button", { onclick: () => this.openEditMedia(null), className: "primary" }, "+ New Entry")
        ),
        h("div", { className: "media-admin-list", style: "display: grid; gap: 10px;" },
          ...this.mediaList.map(item => h("div", { className: "card", style: "display: flex; justify-content: space-between; align-items: center; margin-bottom: 0;" },
            h("div", {},
              h("strong", {}, item.title),
              h("div", { style: "color:var(--text-secondary); font-size:12px;" }, `${item.content_type} | ID: ${item.id} | Slug: ${item.slug}`)
            ),
            h("div", { style: "display: flex; gap: 8px;" },
              h("button", { onclick: () => this.openContentManager(item.id) }, "Content (S/E)"),
              h("button", { onclick: () => this.openEditMedia(item) }, "Info"),
              h("button", { onclick: () => this.handleDeleteMedia(item.id), className: "danger", style: "background: var(--error-color); color:white;" }, "Del")
            )
          ))
        )
      );
    } else {
      content = h("admin-genres-view");
    }

    container.appendChild(nav);
    container.appendChild(content);
    this.appendChild(container);
  }
}

customElements.define("admin-view", AdminView);
