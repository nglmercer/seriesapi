import { render, html,type TemplateResult } from "lit";
import i18next from "i18next";
// allways import the components to use it, import types not work for register the component
import "../components/shared/app-field";
import "../components/shared/app-input";
import "../components/shared/app-select";
import { AppField } from "../components/shared/app-field";
import { AppInput } from "../components/shared/app-input";
import { AppSelect } from "../components/shared/app-select";

interface FormField {
  label: string;
  name: string;
  type: string;
  value?: any;
  options?: { label: string; value: any }[];
  width?: string;
  placeholder?: string;
}

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
 * Premium UI Utilities for async alerts and prompts.
 */
class UI {
  private static createModal(template: TemplateResult, wide = false): { close: () => void } {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease;
    `;

    const close = () => {
      overlay.style.opacity = "0";
      const modal = overlay.querySelector(".modal-card") as HTMLElement;
      if (modal) modal.style.transform = "translateY(20px)";
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, 200);
    };

    const modalTemplate = html`
      <div class="card modal-card" style="
        width: 100%;
        max-width: ${wide ? '800px' : '500px'};
        max-height: 90vh;
        overflow-y: auto;
        margin: 20px;
        padding: 32px;
        border-radius: 20px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      ">
        ${template}
      </div>
    `;

    render(modalTemplate, overlay);
    document.body.appendChild(overlay);

    return { close };
  }

  static alert(message: string, title = "Notice"): Promise<void> {
    return new Promise((resolve) => {
      const { close } = this.createModal(html`
        <h3 style="margin-top:0;">${title}</h3>
        <p style="margin-bottom: 24px; color: var(--text-secondary);">${message}</p>
        <div style="display:flex; justify-content: flex-end;">
          <button 
            class="primary"
            @click="${() => { close(); resolve(); }}"
          >OK</button>
        </div>
      `);
    });
  }

  static toast(message: string, type: "success" | "error" | "info" = "info") {
    const toastContainer = document.createElement("div");
    const toastTemplate = html`
      <div class="toast toast-${type}" style="
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 12px 24px;
        border-radius: 12px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        font-weight: 600;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideUp 0.3s ease-out;
      ">
        ${message}
      </div>
    `;

    render(toastTemplate, toastContainer);
    const toast = toastContainer.firstElementChild as HTMLElement;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
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

      const { close } = this.createModal(html`
        <h3 style="margin-top:0;">${title}</h3>
        <p style="margin-bottom: 12px; color: var(--text-secondary);">${message}</p>
        <input 
          type="text" 
          .value="${defaultValue}" 
          placeholder="Type here..."
          style="width: 100%; margin-bottom: 24px;"
          @input="${(e: InputEvent) => inputVal = (e.target as HTMLInputElement).value}"
          @keydown="${(e: KeyboardEvent) => {
            if (e.key === "Enter") confirm();
            if (e.key === "Escape") cancel();
          }}"
        />
        <div style="display:flex; justify-content: flex-end; gap: 10px;">
          <button @click="${cancel}">Cancel</button>
          <button class="primary" @click="${confirm}">Confirm</button>
        </div>
      `);
      
      setTimeout(() => {
        const input = document.querySelector(".modal-overlay input") as HTMLInputElement;
        input?.focus();
      }, 50);
    });
  }

  static confirm(message: string, title = "Confirm Action"): Promise<boolean> {
    return new Promise((resolve) => {
      const { close } = this.createModal(html`
        <h3 style="margin-top:0;">${title}</h3>
        <p style="margin-bottom: 24px; color: var(--text-secondary);">${message}</p>
        <div style="display:flex; justify-content: flex-end; gap: 10px;">
          <button @click="${() => { close(); resolve(false); }}">No</button>
          <button class="danger" @click="${() => { close(); resolve(true); }}">Yes, Proceed</button>
        </div>
      `);
    });
  }

  static editor<T>(templateName: FormTemplateName, data?: any, title?: string): Promise<T | null> {
    const fields = FORM_TEMPLATES[templateName](data);
    const defaultTitle = title || i18next.t(`admin.edit_${templateName}`, { defaultValue: `Edit ${templateName}` });
    return this.form<T>(defaultTitle, fields);
  }

  static form<T>(title: string, fields: FormField[]): Promise<T | null> {
    return new Promise((resolve) => {
      const formData: Record<string, any> = {};
      
      // Initialize form data with default values
      fields.forEach(f => {
        formData[f.name] = f.value ?? (f.type === 'checkbox' ? false : "");
      });

      const handleFieldChange = (name: string, value: any, type: string) => {
        if (type === "number") {
          formData[name] = parseFloat(value || '0');
        } else {
          formData[name] = value;
        }
      };

      const renderField = (f: FormField) => {
        let input: TemplateResult;
        
        if (f.type === "select") {
          input = html`
            <app-select
              .name="${f.name}"
              .options="${f.options || []}"
              .value="${String(f.value || '')}"
              @change="${(e: CustomEvent) => handleFieldChange(f.name, e.detail.value, f.type)}"
            ></app-select>
          `;
        } else if (f.type === "checkbox") {
          input = html`
            <input 
              type="checkbox" 
              .name="${f.name}" 
              ?checked="${!!f.value}" 
              style="width: 20px; height: 20px; cursor: pointer;"
              @change="${(e: Event) => handleFieldChange(f.name, (e.target as HTMLInputElement).checked, f.type)}"
            />
          `;
        } else if (f.type === "textarea") {
          input = html`
            <textarea 
              .name="${f.name}" 
              style="width: 100%; min-height: 100px; padding: 12px 16px; border-radius: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 14px; font-weight: 500; transition: all 0.2s; outline: none; resize: vertical;"
              @input="${(e: InputEvent) => handleFieldChange(f.name, (e.target as HTMLTextAreaElement).value, f.type)}"
            >${f.value || ""}</textarea>
          `;
        } else {
          input = html`
            <app-input
              .name="${f.name}"
              .type="${f.type}"
              .value="${String(f.value || '')}"
              .placeholder="${f.placeholder || ''}"
              @change="${(e: CustomEvent) => handleFieldChange(f.name, e.detail.value, f.type)}"
            ></app-input>
          `;
        }
        
        const isCheckbox = f.type === "checkbox";
        return html`
          <app-field 
            .label="${f.label}" 
            style="flex: 1 1 ${f.width || '100%'}; ${isCheckbox ? 'flex-direction: row-reverse; justify-content: flex-end; align-items: center; gap: 10px;' : ''}"
          >
            ${input}
          </app-field>
        `;
      };

      const { close } = this.createModal(html`
        <div class="ui-form" style="display: flex; flex-direction: column; gap: 28px;">
          <h3 style="margin: 0; font-size: 24px; font-weight: 900; border-bottom: 2px solid var(--border-color); padding-bottom: 20px; color: var(--text-primary); letter-spacing: -0.5px;">
            ${title}
          </h3>
          <div style="display: flex; flex-wrap: wrap; gap: 24px;">
            ${fields.map(f => renderField(f))}
          </div>
          <div style="display:flex; justify-content: flex-end; gap: 16px; margin-top: 12px; border-top: 2px solid var(--border-color); padding-top: 24px;">
            <button 
              style="background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); font-weight: 700; height: 48px; padding: 0 24px; border-radius: 12px;"
              @click="${() => { close(); resolve(null); }}"
            >
              ${i18next.language === 'es' ? "Cancelar" : "Cancel"}
            </button>
            <button 
              class="primary" 
              style="font-weight: 800; padding: 0 40px; height: 48px; border-radius: 12px; box-shadow: 0 4px 12px rgba(255, 71, 87, 0.2);"
              @click="${() => { close(); resolve(formData as T); }}"
            >
              ${i18next.language === 'es' ? "Guardar" : "Save"}
            </button>
          </div>
        </div>
      `, true);
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
