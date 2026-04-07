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
      },
      admin: {
        title: "SeriesAPI Admin",
        theme: "🌓 Theme",
        public_page: "Public Page",
        hi_user: "Hi, {{username}}",
        login: "Login",
        media: "Media",
        genres: "Genres",
        search: "Search",
        search_placeholder: "Search Title / ID...",
        new_entry: "+ New Entry",
        content_mgr: "Content (S/E)",
        edit: "Info",
        delete: "Del",
        delete_confirm: "Delete this media forever?",
        edit_title: "Edit: {{title}}",
        new_media_entry: "New Media Entry",
        form_title: "Title",
        form_original_title: "Original Title",
        form_slug: "Slug",
        form_type: "Type",
        form_status: "Status",
        form_genres: "Genres",
        form_synopsis: "Synopsis",
        form_poster_url: "Poster URL",
        save: "Save",
        cancel: "Cancel",
        manage_genres: "Manage Genres",
        new_genre: "New Genre",
        edit_genre: "Edit Genre",
        genre_name: "Name",
        delete_genre_confirm: "Are you sure you want to delete this genre?",
        managing: "Managing: {{title}}",
        content_mgmt_desc: "Content Management for Seasons and Episodes",
        seasons: "Seasons",
        episodes: "Episodes",
        new_season: "New Season",
        edit_season: "Edit Season",
        season_number: "Season Number",
        season_title: "Season Title",
        season_name_optional: "Season Name (optional)",
        new_episode: "New Episode",
        edit_episode: "Edit Episode",
        episode_number: "Number",
        episode_title: "Title",
        episode_synopsis: "Synopsis",
        delete_episode_confirm: "Delete episode?",
        back_to_media_list: "← Back to Media List",
        select_season_desc: "Select a season to view episodes",
        add_episode: "+ Add Episode",
        error_saving: "Error saving media",
        loading_media_info: "Loading media info..."
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
      },
      admin: {
        title: "Administración SeriesAPI",
        theme: "🌓 Tema",
        public_page: "Ver Web",
        hi_user: "Hola, {{username}}",
        login: "Iniciar Sesión",
        media: "Medios",
        genres: "Géneros",
        search: "Buscar",
        search_placeholder: "Buscar Título / ID...",
        new_entry: "+ Nueva Entrada",
        content_mgr: "Contenido (T/E)",
        edit: "Información",
        delete: "Borrar",
        delete_confirm: "¿Borrar este contenido para siempre?",
        edit_title: "Editar: {{title}}",
        new_media_entry: "Nueva Entrada de Medio",
        form_title: "Título",
        form_original_title: "Título Original",
        form_slug: "Slug",
        form_type: "Tipo",
        form_status: "Estado",
        form_genres: "Géneros",
        form_synopsis: "Sinopsis",
        form_poster_url: "URL del Póster",
        save: "Guardar",
        cancel: "Cancelar",
        manage_genres: "Gestionar Géneros",
        new_genre: "Nuevo Género",
        edit_genre: "Editar Género",
        genre_name: "Nombre",
        delete_genre_confirm: "¿Estás seguro de borrar este género?",
        managing: "Gestionando: {{title}}",
        content_mgmt_desc: "Gestión de Contenido para Temporadas y Episodios",
        seasons: "Temporadas",
        episodes: "Episodios",
        new_season: "Nueva Temporada",
        edit_season: "Editar Temporada",
        season_number: "Número de Temporada",
        season_title: "Título de Temporada",
        season_name_optional: "Nombre de Temporada (opcional)",
        new_episode: "Nuevo Episodio",
        edit_episode: "Editar Episodio",
        episode_number: "Número",
        episode_title: "Título",
        episode_synopsis: "Sinopsis",
        delete_episode_confirm: "¿Borrar episodio?",
        back_to_media_list: "← Volver a Lista",
        select_season_desc: "Selecciona una temporada para ver episodios",
        add_episode: "+ Añadir Episodio",
        error_saving: "Error al guardar medio",
        loading_media_info: "Cargando info del medio..."
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
