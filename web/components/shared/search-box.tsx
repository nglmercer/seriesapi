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
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">{ICONS.search}</span>
          <input
            class="w-full pl-12 pr-4 py-3 bg-primary border border-border rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all shadow-sm"
            type="text"
            name="q"
            value={inputValue}
            placeholder={i18next.t("search.placeholder", { defaultValue: "Search for movies, series, anime..." })}
            onInput={handleInput}
          />
        </div>
        <button class="px-8 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent-hover transition-all shadow-md" type="submit">{i18next.t("search.button", { defaultValue: "Search" })}</button>
      </form>
    </div>
  );
}