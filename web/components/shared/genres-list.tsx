import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from "../../services/api-service";
import i18next from "../../utils/i18n";
import styles from './genres-list.module.css';

interface GenreItem {
  id: number;
  slug: string;
  name: string;
  count?: number;
}

interface GenresListProps {
  onGenreSelect?: (slug: string) => void;
}

export function GenresList({ onGenreSelect }: GenresListProps) {
  const [items, setItems] = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await api.getGenres();
    if (res.ok) {
      setItems(res.data as GenreItem[]);
    }
    setLoading(false);
  }

  function handleClick(slug: string) {
    if (onGenreSelect) {
      onGenreSelect(slug);
    }
  }

  if (loading) return <div class={styles.loading}>{i18next.t("media.loading", "Loading...")}</div>;

  return (
    <div class={styles.list}>
      {items.map(item => (
        <div class={styles.tag} onClick={() => handleClick(item.slug)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}