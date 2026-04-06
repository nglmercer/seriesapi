import { api, type MediaItem, type Genres } from "./api-service";
import { h } from "../utils/dom";
import { ui } from "../utils/ui";

export class AdminMediaForm extends HTMLElement {
  private media: Partial<MediaItem> | null = null;
  private allGenres: Genres[] = [];
  private selectedGenres: Set<string | number> = new Set();

  async setMedia(media: Partial<MediaItem> | null) {
    this.media = media;
    const res = await api.getGenres();
    if (res.ok) {
      this.allGenres = res.data as Genres[];
    }
    
    if (this.media?.id) {
       // Assuming the media object has genres as an array of objects or IDs
       const detail = await api.getMediaDetail(this.media.id);
       if(detail.ok && Array.isArray(detail.data.genres)) {
           detail.data.genres.forEach((g: any) => this.selectedGenres.add(g.id));
       }
    }
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data: Partial<MediaItem> = {
      title: formData.get("title") as string,
      original_title: formData.get("original_title") as string,
      content_type: formData.get("content_type") as string,
      status: formData.get("status") as string,
      slug: formData.get("slug") as string,
      synopsis: formData.get("synopsis") as string,
      poster_url: formData.get("poster_url") as string,
    };

    try {
      let mediaId: number;
      if (this.media?.id) {
        await api.updateMedia(this.media.id, data);
        mediaId = this.media.id;
      } else {
        const res = await api.createMedia(data);
        mediaId = res.data.id;
      }
      
      // Update genres assignments (naive approach: clear and re-add)
      // Note: Ideally the backend handles this in one go, but we use the methods we added
      // This part might need backend support for bulk assignment or similar.
      
      this.dispatchEvent(new CustomEvent("saved", { bubbles: true }));
      this.remove();
    } catch (err) {
      await ui.alert("Error saving media");
    }
  }

  private toggleGenre(id: string | number) {
      if (this.selectedGenres.has(id)) {
          this.selectedGenres.delete(id);
      } else {
          this.selectedGenres.add(id);
      }
      this.render();
  }

  render() {
    this.innerHTML = "";
    const isEdit = !!this.media?.id;

    const genreList = h("div", { style: "display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;" },
        ...this.allGenres.map(g => h("span", {
            onclick: () => this.toggleGenre(g.id),
            style: `cursor:pointer; padding: 4px 8px; border-radius: 4px; font-size: 12px; border: 1px solid var(--border-color); ${this.selectedGenres.has(g.id) ? 'background: var(--accent-color); color: white;' : ''}`
        }, g.name))
    );

    const form = h("form", { onsubmit: (e: Event) => this.handleSubmit(e) },
      h("h2", {}, isEdit ? `Edit: ${this.media?.title}` : "New Media Entry"),
      h("label", {}, "Title"),
      h("input", { name: "title", value: this.media?.title || "", required: true }),
      h("label", {}, "Original Title"),
      h("input", { name: "original_title", value: this.media?.original_title || "" }),
      h("label", {}, "Slug"),
      h("input", { name: "slug", value: this.media?.slug || "" }),
      h("div", { style: "display: grid; grid-template-columns: 1fr 1fr; gap: 10px;" },
          h("div", {},
            h("label", {}, "Type"),
            h("select", { name: "content_type" },
                h("option", { value: "anime", selected: this.media?.content_type === "anime" }, "Anime"),
                h("option", { value: "series", selected: this.media?.content_type === "series" }, "Series"),
                h("option", { value: "movie", selected: this.media?.content_type === "movie" }, "Movie")
            )
          ),
          h("div", {},
            h("label", {}, "Status"),
            h("select", { name: "status" },
                h("option", { value: "ongoing", selected: this.media?.status === "ongoing" }, "Ongoing"),
                h("option", { value: "completed", selected: this.media?.status === "completed" }, "Completed"),
                h("option", { value: "upcoming", selected: this.media?.status === "upcoming" }, "Upcoming")
            )
          )
      ),
      h("label", {}, "Genres"),
      genreList,
      h("label", { style: "display:block; margin-top:10px;" }, "Synopsis"),
      h("textarea", { name: "synopsis", rows: 4 }, this.media?.synopsis || ""),
      h("label", {}, "Poster URL"),
      h("input", { name: "poster_url", value: this.media?.poster_url || "" }),
      h("div", { className: "form-actions", style: "display: flex; gap: 10px; margin-top: 20px;" },
        h("button", { type: "submit", className: "primary" }, "Save"),
        h("button", { type: "button", onclick: () => this.remove() }, "Cancel")
      )
    );

    const overlay = h("div", {
      className: "modal-overlay",
      style: "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;"
    }, h("div", {
      className: "card",
      style: "width: 100%; max-width: 500px; max-height: 94vh; overflow-y: auto;"
    }, form));

    this.appendChild(overlay);
  }
}

customElements.define("admin-media-form", AdminMediaForm);
