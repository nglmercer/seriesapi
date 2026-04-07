import i18next from "i18next";
import { initLitI18n } from "lit-i18n";

const resources = {
  en: {
    translation: {
      header: {
        explorer: "EXPLORER",
        admin_panel: "Admin Panel"
      },
      hero: {
        title: "Discover Your Next Favorite Anime",
        subtitle: "Explore thousands of series and movies with detailed information, images, and community ratings.",
        search_placeholder: "Search for your favorite series or movies...",
        explore_btn: "Explore"
      },
      filters: {
        type: "Type",
        status: "Status",
        genre: "Genre",
        year_range: "Year Range",
        score: "Score",
        sort_by: "Sort By",
        reset: "Reset Filters",
        all: "All",
        any: "Any",
        popularity: "Popularity",
        date: "Date",
        title: "Title"
      },
      media: {
        latest_releases: "Latest Releases",
        explore_contents: "Explore Contents",
        personalized: "Personalized for you",
        back_to_explorer: "Back to Explorer",
        synopsis: "Synopsis",
        seasons: "Seasons",
        season: "Season",
        episodes_count: "{{count}} Episodes",
        all_seasons: "All Seasons",
        loading: "Loading..."
      },
      episodes: {
        back_to_series: "Back to Series",
        air_date: "Air Date: {{date}}",
        min: "{{count}} min",
        no_synopsis: "No synopsis available for this episode.",
        no_episodes: "This season doesn't have any episodes yet.",
        no_episodes_title: "No Episodes"
      },
      infobox: {
        original_title: "Original Title",
        type: "Type",
        release: "Release",
        status: "Status",
        score: "Score",
        synopsis_snapshot: "Synopsis Snapshot"
      }
    }
  },
  es: {
    translation: {
      header: {
        explorer: "EXPLORER",
        admin_panel: "Panel Admin"
      },
      hero: {
        title: "Descubre tu Próximo Anime Favorito",
        subtitle: "Explora miles de series y películas con información detallada, imágenes y valoraciones de la comunidad.",
        search_placeholder: "Busca tus series o películas favoritas...",
        explore_btn: "Explorar"
      },
      filters: {
        type: "Tipo",
        status: "Estado",
        genre: "Género",
        year_range: "Rango de Años",
        score: "Puntuación",
        sort_by: "Ordenar por",
        reset: "Limpiar Filtros",
        all: "Todos",
        any: "Cualquiera",
        popularity: "Popularidad",
        date: "Fecha",
        title: "Título"
      },
      media: {
        latest_releases: "Últimos Lanzamientos",
        explore_contents: "Explorar Contenido",
        personalized: "Personalizado para ti",
        back_to_explorer: "Volver al Explorador",
        synopsis: "Sinopsis",
        seasons: "Temporadas",
        season: "Temporada",
        episodes_count: "{{count}} Episodios",
        all_seasons: "Todas las temporadas",
        loading: "Cargando..."
      },
      episodes: {
        back_to_series: "Volver a la Serie",
        air_date: "Fecha: {{date}}",
        min: "{{count}} min",
        no_synopsis: "Sinopsis no disponible para este episodio.",
        no_episodes: "Esta temporada aún no tiene episodios.",
        no_episodes_title: "Sin Episodios"
      },
      infobox: {
        original_title: "Título Original",
        type: "Tipo",
        release: "Lanzamiento",
        status: "Estado",
        score: "Puntuación",
        synopsis_snapshot: "Resumen de Sinopsis"
      }
    }
  }
};

i18next.use(initLitI18n).init({
  resources,
  lng: localStorage.getItem("lang") || "es",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export default i18next;
export { i18next };
