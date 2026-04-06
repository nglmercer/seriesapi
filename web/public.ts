import "./components/index";
import { h, toggleTheme } from "./utils/dom";

class PublicApp extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  private render() {
    this.innerHTML = "";
    
    const header = h("header", { style: "padding: 20px 0; border-bottom: 1px solid var(--border-color); background: var(--header-bg);" },
      h("div", { className: "container", style: "display:flex; justify-content: space-between; align-items:center;" },
        h("a", { href: "/", style: "font-size: 24px; font-weight: 800; color: var(--accent-color); letter-spacing: -1px;" }, "EXPLORER"),
        h("div", { style: "display:flex; gap: 20px; align-items:center;" },
           h("button", { onclick: () => toggleTheme(), style: "border:none; background:transparent; font-size:20px;" }, "🌗"),
           h("a", { href: "/admin", style: "font-weight: 600; font-size: 14px;" }, "Admin Panel")
        )
      )
    );

    const hero = h("section", { style: "padding: 60px 0; text-align:center; background: var(--bg-secondary);" },
        h("div", { className: "container" },
            h("h1", { style: "font-size: 48px; margin-bottom: 10px;" }, "Discover Your Next Favorite Anime"),
            h("p", { style: "color: var(--text-secondary); max-width: 600px; margin: 0 auto 30px;" }, "Explore thousands of series and movies with detailed information, images, and community ratings."),
            h("div", { style: "max-width: 600px; margin: 0 auto;" },
                h("search-box", { onsearch: (e: any) => console.log(e.detail) })
            )
        )
    );

    const main = h("main", { className: "container", style: "padding: 40px 0;" },
        h("div", { style: "display: grid; grid-template-columns: 250px 1fr; gap: 40px;" },
            h("aside", {}, 
                h("h3", { style: "margin-bottom: 20px;" }, "Filters"),
                h("media-filters")
            ),
            h("div", {},
                h("div", { style: "display:flex; justify-content: space-between; align-items: center; margin-bottom: 20px;" },
                    h("h2", {}, "Latest Releases"),
                    h("span", { style: "color: var(--text-secondary);" }, "Showing 2,450 results")
                ),
                h("media-list")
            )
        )
    );

    this.appendChild(header);
    this.appendChild(hero);
    this.appendChild(main);
  }
}

customElements.define("public-app", PublicApp);
document.body.appendChild(document.createElement("public-app"));
