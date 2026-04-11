import { h } from 'preact';
import { useState } from 'preact/hooks';
import { api } from "../../services/api-service";
import { eventBus } from "../../utils/events";
import i18next from "../../utils/i18n";
import { ICONS } from "../../utils/icons";

interface SearchBoxProps {
  query?: string;
  onSearch?: (query: string) => void;
}

export function SearchBox({ query = "", onSearch }: SearchBoxProps) {
  const [inputValue, setInputValue] = useState(query);

  function handleSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const q = formData.get("q") as string || "";
    if (q.trim()) {
      eventBus.emit("search", { query: q });
      if (onSearch) onSearch(q);
    }
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    setInputValue(target.value);
  }

  return (
    <div class="w-full max-w-2xl mx-auto">
      <form class="flex flex-col sm:flex-row gap-3" onSubmit={handleSubmit}>
        <div class="relative flex-1">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40">{ICONS.search}</span>
          <input
            class="input input-bordered w-full pl-12 h-14 rounded-2xl bg-base-100 border-base-content/10 focus:border-primary focus:outline-none transition-all shadow-sm"
            type="text"
            name="q"
            value={inputValue}
            placeholder={i18next.t("search.placeholder", { defaultValue: "Search for movies, series, anime..." })}
            onInput={handleInput}
          />
        </div>
        <button class="btn btn-primary h-14 px-10 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" type="submit">
          {i18next.t("search.button", { defaultValue: "Search" })}
        </button>
      </form>
    </div>
  );
}