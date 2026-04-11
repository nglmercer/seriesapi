import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api, type Genres, type Tag } from "../../services/api-service";
import i18next from "../../utils/i18n";
import styles from './media-filters.module.css';

export interface MediaFiltersState {
  type: string;
  status: string;
  genre: string;
  tag: string;
  year_from: string;
  year_to: string;
  score_from: string;
  sort_by: string;
}

interface MediaFiltersProps {
  state?: Partial<MediaFiltersState>;
  onFilterChange?: (filters: MediaFiltersState) => void;
}

export function MediaFilters({ state: initialState = {}, onFilterChange }: MediaFiltersProps) {
  const [type, setType] = useState(initialState.type || "");
  const [status, setStatus] = useState(initialState.status || "");
  const [genre, setGenre] = useState(initialState.genre || "");
  const [tag, setTag] = useState(initialState.tag || "");
  const [year_from, setYearFrom] = useState(initialState.year_from || "");
  const [year_to, setYearTo] = useState(initialState.year_to || "");
  const [score_from, setScoreFrom] = useState(initialState.score_from || "");
  const [sort_by, setSortBy] = useState(initialState.sort_by || "popularity");
  const [genres, setGenres] = useState<Genres[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    loadGenres();
    loadTags();
  }, []);

  async function loadGenres() {
    const res = await api.getGenres();
    if (res.ok) {
      setGenres(res.data);
    }
  }

  async function loadTags() {
    const res = await api.getTags();
    if (res.ok) {
      setTags(res.data);
    }
  }

  function emitChange() {
    if (onFilterChange) {
      onFilterChange({ type, status, genre, tag, year_from, year_to, score_from, sort_by });
    }
  }

  function handleReset() {
    setType("");
    setStatus("");
    setGenre("");
    setTag("");
    setYearFrom("");
    setYearTo("");
    setScoreFrom("");
    setSortBy("popularity");
    emitChange();
  }

  const currentYear = new Date().getFullYear();

  return (
    <div class={styles.filtersContainer}>
      <div class={styles.filtersGrid}>
        <div class={styles.filterGroup}>
          <label>{i18next.t("filters.type", "Type")}</label>
          <select value={type} onChange={(e) => { setType((e.target as HTMLSelectElement).value); emitChange(); }}>
            <option value="">{i18next.t("filters.all", "All")}</option>
            <option value="anime">Anime</option>
            <option value="series">{i18next.t("filters.series", "Series")}</option>
            <option value="movie">{i18next.t("filters.movie", "Movie")}</option>
            <option value="ova">OVA</option>
            <option value="ona">ONA</option>
            <option value="special">{i18next.t("filters.special", "Special")}</option>
          </select>
        </div>

        <div class={styles.filterGroup}>
          <label>{i18next.t("filters.status", "Status")}</label>
          <select value={status} onChange={(e) => { setStatus((e.target as HTMLSelectElement).value); emitChange(); }}>
            <option value="">{i18next.t("filters.all", "All")}</option>
            <option value="ongoing">{i18next.t("filters.ongoing", "Ongoing")}</option>
            <option value="completed">{i18next.t("filters.completed", "Completed")}</option>
            <option value="upcoming">{i18next.t("filters.upcoming", "Upcoming")}</option>
            <option value="tba">TBA</option>
          </select>
        </div>

        <div class={styles.filterGroup}>
          <label>{i18next.t("filters.genre", "Genre")}</label>
          <select value={genre} onChange={(e) => { setGenre((e.target as HTMLSelectElement).value); emitChange(); }}>
            <option value="">{i18next.t("filters.any", "Any")}</option>
            {genres.map(g => (
              <option key={g.id} value={g.slug}>{g.name}</option>
            ))}
          </select>
        </div>

        <div class={styles.filterGroup}>
          <label>{i18next.t("filters.tag", "Tag")}</label>
          <select value={tag} onChange={(e) => { setTag((e.target as HTMLSelectElement).value); emitChange(); }}>
            <option value="">{i18next.t("filters.any", "Any")}</option>
            {tags.map(t => (
              <option key={t.id} value={t.slug}>{t.label}</option>
            ))}
          </select>
        </div>

        <div class={styles.filterGroup}>
          <label>{i18next.t("filters.year_range", "Year Range")}</label>
          <div style="display: flex; gap: 8px;">
            <input
              type="number"
              placeholder={i18next.t("filters.from", "From")}
              min="1900"
              max={currentYear}
              value={year_from}
              onInput={(e) => { setYearFrom((e.target as HTMLInputElement).value); emitChange(); }}
            />
            <input
              type="number"
              placeholder={i18next.t("filters.to", "To")}
              min="1900"
              max={currentYear}
              value={year_to}
              onInput={(e) => { setYearTo((e.target as HTMLInputElement).value); emitChange(); }}
            />
          </div>
        </div>

        <div class={styles.filterGroup}>
          <label>{i18next.t("filters.score", "Min Score")}</label>
          <select value={score_from} onChange={(e) => { setScoreFrom((e.target as HTMLSelectElement).value); emitChange(); }}>
            <option value="">{i18next.t("filters.any", "Any")}</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(s => (
              <option key={s} value={String(s)}>{s}+</option>
            ))}
          </select>
        </div>

        <div class={styles.filterGroup}>
          <label>{i18next.t("filters.sort_by", "Sort By")}</label>
          <select value={sort_by} onChange={(e) => { setSortBy((e.target as HTMLSelectElement).value); emitChange(); }}>
            <option value="popularity">{i18next.t("filters.popularity", "Popularity")}</option>
            <option value="release_date">{i18next.t("filters.date", "Date")}</option>
            <option value="score">{i18next.t("filters.score", "Score")}</option>
            <option value="title">{i18next.t("filters.title", "Title")}</option>
          </select>
        </div>
      </div>

      <div class={styles.actions}>
        <button class={styles.btnReset} onClick={handleReset}>
          {i18next.t("filters.reset", "Reset")}
        </button>
      </div>
    </div>
  );
}