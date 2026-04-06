import { api, type Genres } from "./api-service";
import { h } from "../utils/dom";
import { ui } from "../utils/ui";

export class AdminGenresView extends HTMLElement {
  private genres: Genres[] = [];

  async connectedCallback() {
    await this.fetchGenres();
    this.render();
  }

  private async fetchGenres() {
    const res = await api.getGenres();
    if (res.ok) {
      this.genres = res.data as Genres[];
    }
  }

  private async handleAdd() {
    const name = await ui.prompt("Genre Name:");
    if (name) {
      const res = await api.createGenre(name);
      if (res.ok) {
        await this.fetchGenres();
        this.render();
      } else {
        await ui.alert("Error creating genre");
      }
    }
  }

  private async handleEdit(id: string | number, oldName: string) {
    const newName = await ui.prompt("New Name:", oldName);
    if (newName && newName !== oldName) {
      const res = await api.updateGenre(id, newName);
      if (res.ok) {
        await this.fetchGenres();
        this.render();
      } else {
        await ui.alert("Error updating genre");
      }
    }
  }

  private async handleDelete(id: string | number) {
    if (await ui.confirm("Are you sure you want to delete this genre?")) {
      const res = await api.deleteGenre(id);
      if (res.ok) {
        await this.fetchGenres();
        this.render();
      } else {
        await ui.alert("Error deleting genre");
      }
    }
  }

  render() {
    this.innerHTML = "";
    const list = h("div", { className: "genres-grid", style: "display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top:20px;" },
      ...this.genres.map(g => h("div", { className: "card", style: "margin:0;" },
        h("div", { style: "display: flex; flex-direction: column; gap: 4px;" },
          h("strong", {}, g.name),
          h("small", { style: "color: var(--text-secondary);" }, `id: ${g.id}`),
          h("small", { style: "color: var(--text-secondary);" }, `slug: ${g.slug}`),
          h("div", { style: "display: flex; gap: 8px; margin-top: 10px;" },
            h("button", { onclick: () => this.handleEdit(g.id, g.name) }, "Edit"),
            h("button", { onclick: () => this.handleDelete(g.id), className: "danger" }, "Del")
          )
        )
      ))
    );

    this.appendChild(h("div", {},
      h("div", { style: "display:flex; justify-content: space-between; align-items: center;" },
        h("h2", {}, "Manage Genres"),
        h("button", { onclick: () => this.handleAdd(), className: "primary" }, "+ New Genre")
      ),
      list
    ));
  }
}

customElements.define("admin-genres-view", AdminGenresView);
