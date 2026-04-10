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
          <label>Type</label>
          <select value={type} onChange={(e) => { setType((e.target as HTMLSelectElement).value); emitChange(); }}>
            <option value="">All</option>
            <option value="anime">Anime</option>
            <option value="series">{i18next.language === 'es' ? 'Serie' : 'Series'}</option>
            <option value="movie">{i18next.language === 'es' ? 'Película' : 'Movie'}</option>
            <option value="ova">OVA</option>
            <option value="ona">ONA</option>
            <option value="special">{i18next.language === 'es' ? 'Especial' : 'Special'}</option>
          </select>
        </div>

        <div class={styles.filterGroup}>
          <label>Status</label>
          <select value={status} onChange={(e) => { setStatus((e.target as HTMLSelectElement).value); emitChange(); }}>
            <option value="">All</option>
            <option value="ongoing">{i18next.language === 'es' ? 'En emisión' : 'Ongoing'}</option>
            <option value="completed">{i18next.language === 'es' ? 'Finalizado' : 'Completed'}</option>
            <option value="upcoming">{i18next.language === 'es' ? 'Próximamente' : 'Upcoming'}</option>
            <option value="tba">TBA</option>
          </select>
        </div>

        <div class={styles.filterGroup}>
          <label>Genre</label>
          <select value={genre} onChange={(e) => { setGenre((e.target as HTMLSelectElement).value); emitChange(); }}>
            <option value="">All</option>
            {genres.map(g => <option value={g.slug}>{g.name}</option>)}
          </select>
        </div>

        <div class={styles.filterGroup}>
          <label>Tag</label>
          <select value={tag} onChange={(e) => { setTag((e.target as HTMLSelectElement).value); emitChange(); }}>
            <option value="">All</option>
            {tags.map(t => <option value={t.slug}>{t.label}</option>)}
          </select>
        </div>

        <div class={styles.filterGroup}>
          <label>Year Range</label>
          <div style="display: flex; gap: 8px;">
            <input
              type="number"
              placeholder={i18next.language === 'es' ? "Desde" : "From"}
              min="1900"
              max={currentYear}
              value={year_from}
              onChange={(e) => { setYearFrom((e.target as HTMLInputElement).value); emitChange(); }}
            />
            <input
              type="number"
              placeholder={i18next.language === 'es' ? "Hasta" : "To"}
              min="1900"
              max={currentYear}
              value={year_to}
              onChange={(e) => { setYearTo((e.target as HTMLInputElement).value); emitChange(); }}
            />
          </div>
        </div>

        <div class={styles.filterGroup}>
          <label>Score</label>
          <select value={score_from} onChange={(e) => { setScoreFrom((e.target as HTMLSelectElement).value); emitChange(); }}>
            <option value="">Any</option>
            <option value="9">9+ ★</option>
            <option value="8">8+ ★</option>
            <option value="7">7+ ★</option>
            <option value="6">6+ ★</option>
          </select>
        </div>

        <div class={styles.filterGroup}>
          <label>Sort By</label>
          <select value={sort_by} onChange={(e) => { setSortBy((e.target as HTMLSelectElement).value); emitChange(); }}>
            <option value="popularity">Popularity</option>
            <option value="score">Score</option>
            <option value="release_date">Date</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      <div class={styles.actions}>
        <button class={styles.btnReset} onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
}