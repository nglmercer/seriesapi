import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from "../../services/api-service";

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

  if (loading) return <div class="loading">Cargando...</div>;

  return (
    <div class="list">
      {items.map(item => (
        <div class="tag" onClick={() => handleClick(item.slug)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}