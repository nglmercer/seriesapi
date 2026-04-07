import { api, type MediaItem, type Genres } from "../../services/api-service";
import i18next from "../../utils/i18n";
import { ui } from "../../utils/ui";

export class AdminMediaForm {
  static async open(media: Partial<MediaItem> | null, onSaved: () => void) {
    const resGenres = await api.getGenres();
    const allGenres = (resGenres.ok ? resGenres.data : []) as Genres[];
    
    let selectedGenreIds: number[] = [];
    if (media?.id) {
       const detail = await api.getMediaDetail(media.id);
       if(detail.ok && Array.isArray(detail.data.genres)) {
           selectedGenreIds = (detail.data.genres as any).map((g: any) => g.id);
       }
    }

    const data = await ui.form<Partial<MediaItem>>(
      media?.id ? i18next.t("admin.edit_title", { title: media.title }) : i18next.t("admin.new_media_entry"),
      [
        { label: i18next.t("admin.form_title"), name: "title", type: "text", value: media?.title, width: "100%" },
        { label: i18next.t("admin.form_original_title"), name: "original_title", type: "text", value: media?.original_title, width: "50%" },
        { label: i18next.t("admin.form_slug"), name: "slug", type: "text", value: media?.slug, width: "50%" },
        { 
          label: i18next.t("admin.form_type"), name: "content_type", type: "select", value: media?.content_type || "anime", width: "33.3%",
          options: [
            { label: "Anime", value: "anime" },
            { label: "Series", value: "series" },
            { label: i18next.language === 'es' ? "Película" : "Movie", value: "movie" },
            { label: "OVA", value: "ova" },
            { label: i18next.language === 'es' ? "Especial" : "Special", value: "special" },
            { label: i18next.language === 'es' ? "Corto" : "Short", value: "short" },
            { label: i18next.language === 'es' ? "Documental" : "Documentary", value: "documentary" }
          ]
        },
        { 
          label: i18next.t("admin.form_status"), name: "status", type: "select", value: media?.status || "ongoing", width: "33.3%",
          options: [
            { label: i18next.language === 'es' ? "En emisión" : "Ongoing", value: "ongoing" },
            { label: i18next.language === 'es' ? "Finalizado" : "Completed", value: "completed" },
            { label: i18next.language === 'es' ? "Próximamente" : "Upcoming", value: "upcoming" },
            { label: i18next.language === 'es' ? "Cancelado" : "Cancelled", value: "cancelled" }
          ]
        },
        { label: i18next.language === 'es' ? "Clasificación" : "Age Rating", name: "age_rating", type: "text", value: media?.age_rating, width: "33.3%" },
        { label: i18next.language === 'es' ? "Fecha Estreno" : "Release Date", name: "release_date", type: "date", value: media?.release_date, width: "50%" },
        { label: i18next.language === 'es' ? "Fecha Fin" : "End Date", name: "end_date", type: "date", value: media?.end_date, width: "50%" },
        { label: i18next.language === 'es' ? "Duración (min)" : "Runtime (min)", name: "runtime_minutes", type: "number", value: media?.runtime_minutes, width: "33.3%" },
        { label: i18next.language === 'es' ? "Total Episodios" : "Total Episodes", name: "total_episodes", type: "number", value: media?.total_episodes, width: "33.3%" },
        { label: i18next.language === 'es' ? "Total Temporadas" : "Total Seasons", name: "total_seasons", type: "number", value: media?.total_seasons, width: "33.3%" },
        { label: i18next.language === 'es' ? "Es Adulto" : "Is Adult", name: "is_adult", type: "checkbox", value: media?.is_adult, width: "100%" },
        { label: i18next.language === 'es' ? "Eslogan" : "Tagline", name: "tagline", type: "text", value: media?.tagline, width: "100%" },
        { label: i18next.t("admin.form_synopsis"), name: "synopsis", type: "textarea", value: media?.synopsis, width: "100%" },
        { label: i18next.language === 'es' ? "Resumen Corto" : "Short Synopsis", name: "synopsis_short", type: "textarea", value: media?.synopsis_short, width: "100%" },
        { label: i18next.t("admin.form_poster_url"), name: "poster_url", type: "text", value: media?.poster_url, width: "100%" },
      ]
    );

    if (data) {
        try {
            if (media?.id) {
                await api.updateMedia(media.id, data);
            } else {
                await api.createMedia(data);
            }
            onSaved();
        } catch (err) {
            await ui.alert(i18next.t("admin.error_saving"));
        }
    }
  }
}
