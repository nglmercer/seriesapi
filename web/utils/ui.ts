import { h, render } from 'preact';
import i18next from "i18next";
import { FormContent, type FormField } from "../components/shared/FormContent";
import { Modal } from "../components/shared/Modal";

export type FormTemplateName = "media" | "season" | "episode" | "genre";

const FORM_TEMPLATES: Record<FormTemplateName, (data?: any) => FormField[]> = {
  media: (data) => [
    { label: i18next.t("admin.form_title"), name: "title", type: "text", value: data?.title, width: "100%" },
    { label: i18next.t("admin.form_original_title"), name: "original_title", type: "text", value: data?.original_title, width: "50%" },
    { label: i18next.t("admin.form_slug"), name: "slug", type: "text", value: data?.slug, width: "50%" },
    { 
      label: i18next.t("admin.form_type"), name: "content_type", type: "select", value: data?.content_type, width: "50%",
      options: [
        { label: "Serie", value: "serie" },
        { label: "Anime", value: "anime" },
        { label: "Movie", value: "movie" },
        { label: "Short", value: "short" }
      ]
    },
    { 
      label: i18next.t("admin.form_status"), name: "status", type: "select", value: data?.status, width: "50%",
      options: [
        { label: i18next.language === 'es' ? "En emisión" : "Ongoing", value: "ongoing" },
        { label: i18next.language === 'es' ? "Finalizado" : "Completed", value: "completed" },
        { label: i18next.language === 'es' ? "Próximamente" : "Upcoming", value: "upcoming" }
      ]
    },
    { label: i18next.language === 'es' ? "Fecha Estreno" : "Release Date", name: "release_date", type: "date", value: data?.release_date, width: "50%" },
    { label: i18next.language === 'es' ? "Fecha Fin" : "End Date", name: "end_date", type: "date", value: data?.end_date, width: "50%" },
    { label: i18next.language === 'es' ? "Duración (min)" : "Runtime (min)", name: "runtime_minutes", type: "number", value: data?.runtime_minutes, width: "33%" },
    { label: i18next.language === 'es' ? "Total Episodios" : "Total Episodes", name: "total_episodes", type: "number", value: data?.total_episodes, width: "33%" },
    { label: i18next.language === 'es' ? "Total Temporadas" : "Total Seasons", name: "total_seasons", type: "number", value: data?.total_seasons, width: "33%" },
    { label: i18next.t("admin.form_poster_url"), name: "poster_url", type: "text", value: data?.poster_url, width: "50%" },
    { label: i18next.language === 'es' ? "URL Imagen (Fondo)" : "Image URL (Banner)", name: "image_url", type: "text", value: data?.image_url, width: "50%" },
    { label: "Tagline", name: "tagline", type: "text", value: data?.tagline, width: "100%" },
    { label: i18next.t("admin.form_synopsis"), name: "synopsis", type: "textarea", value: data?.synopsis, width: "100%" },
    { label: i18next.language === 'es' ? "Sinopsis Corta" : "Short Synopsis", name: "synopsis_short", type: "textarea", value: data?.synopsis_short, width: "100%" },
    { label: i18next.language === 'es' ? "Es para adultos" : "Is Adult", name: "is_adult", type: "checkbox", value: data?.is_adult, width: "100%" },
  ],
  season: (data) => [
    { label: i18next.t("admin.season_number"), name: "season_number", type: "number", value: data?.season_number, width: "50%" },
    { label: i18next.t("admin.season_title"), name: "name", type: "text", value: data?.name || "", width: "50%" },
    { label: i18next.language === 'es' ? "Fecha Inicio" : "Air Date", name: "air_date", type: "date", value: data?.air_date, width: "50%" },
    { label: i18next.language === 'es' ? "Fecha Fin" : "End Date", name: "end_date", type: "date", value: data?.end_date, width: "50%" },
    { label: i18next.t("admin.form_synopsis"), name: "synopsis", type: "textarea", value: data?.synopsis, width: "100%" }
  ],
  episode: (data) => [
    { label: i18next.t("admin.episode_number"), name: "episode_number", type: "number", value: data?.episode_number, width: "33%" },
    { label: i18next.language === 'es' ? "Nº Absoluto" : "Absolute №", name: "absolute_number", type: "number", value: data?.absolute_number, width: "33%" },
    { label: i18next.language === 'es' ? "Título" : "Title", name: "title", type: "text", value: data?.title, width: "33%" },
    { 
      label: i18next.language === 'es' ? "Tipo" : "Type", name: "episode_type", type: "select", value: data?.episode_type || "regular", width: "33%",
      options: [
        { label: "Regular", value: "regular" },
        { label: "Special", value: "special" },
        { label: "Recap", value: "recap" },
        { label: "OVA", value: "ova" }
      ]
    },
    { label: i18next.language === 'es' ? "Fecha Air" : "Air Date", name: "air_date", type: "date", value: data?.air_date, width: "33%" },
    { label: i18next.language === 'es' ? "Duración" : "Runtime", name: "runtime_minutes", type: "number", value: data?.runtime_minutes, width: "33%" },
    { label: i18next.t("admin.episode_synopsis"), name: "synopsis", type: "textarea", value: data?.synopsis || "", width: "100%" }
  ],
  genre: (data) => [
    { label: i18next.t("admin.genre_name"), name: "name", type: "text", value: data?.name, width: "100%" }
  ]
};

/**
 * UI Utilities for async alerts and prompts.
 */
class UI {
  private static renderModal(content: any, wide = false): { close: () => void } {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const close = () => {
      render(null, container);
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };

    render(h(Modal, { 
      onClose: close, 
      className: wide ? "max-w-[800px]" : "max-w-[420px]",
      children: content
    }), container);

    return { close };
  }

  static alert(message: string, title = "Notice"): Promise<void> {
    return new Promise((resolve) => {
      const { close } = this.renderModal(
        h('div', { class: "flex flex-col gap-6" }, [
          h('h3', { class: "text-xl font-black text-base-content" }, title),
          h('p', { class: "text-base-content/60" }, message),
          h('div', { class: "flex justify-end" }, [
            h('button', { 
              class: "btn btn-primary h-12 px-8 rounded-xl font-black",
              onClick: () => { close(); resolve(); }
            }, "OK")
          ])
        ])
      );
    });
  }

  static toast(message: string, type: "success" | "error" | "info" = "info") {
    const toastContainer = document.createElement("div");
    toastContainer.className = `fixed bottom-6 right-6 p-4 px-6 rounded-xl font-bold text-white z-[10000] shadow-xl animate-modalSlideUp ${
      type === 'success' ? 'bg-success' : type === 'error' ? 'bg-error' : 'bg-info'
    }`;
    toastContainer.textContent = message;
    document.body.appendChild(toastContainer);

    setTimeout(() => {
      toastContainer.style.opacity = "0";
      toastContainer.style.transform = "translateY(20px)";
      toastContainer.style.transition = "all 0.3s ease";
      setTimeout(() => {
        if (document.body.contains(toastContainer)) {
          document.body.removeChild(toastContainer);
        }
      }, 300);
    }, 3000);
  }

  static prompt(message: string, defaultValue = "", title = "Prompt"): Promise<string | null> {
    return new Promise((resolve) => {
      let inputVal = defaultValue;
      
      const confirm = () => {
        close();
        resolve(inputVal);
      };

      const cancel = () => {
        close();
        resolve(null);
      };

      const { close } = this.renderModal(
        h('div', { class: "flex flex-col gap-6" }, [
          h('h3', { class: "text-xl font-black text-base-content" }, title),
          h('p', { class: "text-base-content/60" }, message),
          h('input', {
            type: "text",
            class: "input input-bordered w-full h-12 bg-base-200 border-base-content/5 focus:border-primary focus:outline-none transition-all rounded-xl font-medium",
            value: defaultValue,
            onInput: (e: any) => inputVal = e.target.value,
            onKeyDown: (e: any) => {
              if (e.key === "Enter") confirm();
              if (e.key === "Escape") cancel();
            }
          }),
          h('div', { class: "flex justify-end gap-3" }, [
            h('button', { class: "btn btn-ghost", onClick: cancel }, "Cancel"),
            h('button', { class: "btn btn-primary", onClick: confirm }, "Confirm")
          ])
        ])
      );
    });
  }

  static confirm(message: string, title = "Confirm Action"): Promise<boolean> {
    return new Promise((resolve) => {
      const { close } = this.renderModal(
        h('div', { class: "flex flex-col gap-6" }, [
          h('h3', { class: "text-xl font-black text-base-content" }, title),
          h('p', { class: "text-base-content/60" }, message),
          h('div', { class: "flex justify-end gap-3" }, [
            h('button', { class: "btn btn-ghost", onClick: () => { close(); resolve(false); } }, "No"),
            h('button', { class: "btn btn-error", onClick: () => { close(); resolve(true); } }, "Yes, Proceed")
          ])
        ])
      );
    });
  }

  static editor<T>(templateName: FormTemplateName, data?: any, title?: string): Promise<T | null> {
    const fields = FORM_TEMPLATES[templateName](data);
    const defaultTitle = title || i18next.t(`admin.edit_${templateName}`, { defaultValue: `Edit ${templateName}` });
    return this.form<T>(defaultTitle, fields);
  }

  static form<T>(title: string, fields: FormField[]): Promise<T | null> {
    return new Promise((resolve) => {
      const { close } = this.renderModal(
        h(FormContent, {
          title,
          fields,
          onSave: (data) => { close(); resolve(data as T); },
          onCancel: () => { close(); resolve(null); }
        }),
        true
      );
    });
  }
}

window.alert = (message: any) => {
  if (typeof message === "string")
    UI.alert(message);
  else if (message instanceof Error)
    UI.alert(message.message);
  else
    UI.alert(JSON.stringify(message));
};

export const ui = UI;
