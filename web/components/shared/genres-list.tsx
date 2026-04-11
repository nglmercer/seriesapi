import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from "../../services/api-service";
import i18next from "../../utils/i18n";

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

  if (loading) return <div class="p-5 text-center text-secondary">{i18next.t("media.loading", "Loading...")}</div>;

  return (
    <div class="flex flex-wrap gap-2">
      {items.map(item => (
        <div 
          class="inline-flex items-center px-[14px] py-[6px] bg-secondary border border-border rounded-full text-[13px] text-primary cursor-pointer transition-all duration-200 hover:bg-accent hover:border-accent hover:text-white" 
          onClick={() => handleClick(item.slug)}
        >
          {item.name}
        </div>
      ))}
    </div>
  );
}