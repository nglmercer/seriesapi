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
    <div class="search-container">
      <form class="search-wrapper" onSubmit={handleSubmit}>
        <div class="input-group">
          <span class="search-icon">{ICONS.search}</span>
          <input
            type="text"
            name="q"
            value={inputValue}
            placeholder={i18next.t("search.placeholder", { defaultValue: "Search for movies, series, anime..." })}
            onInput={handleInput}
          />
        </div>
        <button type="submit">{i18next.t("search.button", { defaultValue: "Search" })}</button>
      </form>
    </div>
  );
}