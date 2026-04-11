import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api, type PeopleItem } from "../../services/api-service";

interface PeopleListProps {
  page?: number;
  pageSize?: number;
  onPeopleSelect?: (person: PeopleItem) => void;
}

export function PeopleList({ page: initialPage = 1, pageSize = 20, onPeopleSelect }: PeopleListProps) {
  const [page, setPage] = useState(initialPage);
  const [items, setItems] = useState<PeopleItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [page]);

  async function load() {
    setLoading(true);
    const res = await api.getPeople(page, pageSize);
    if (res.ok) {
      setItems(res.data);
      setTotalItems((res.meta?.total as number) ?? (res.params?.total as number) ?? 0);
    }
    setLoading(false);
  }

  function handleCardClick(item: PeopleItem) {
    if (onPeopleSelect) {
      onPeopleSelect(item);
    }
  }

  function handlePageChange(delta: number) {
    setPage(Math.max(1, page + delta));
  }

  if (loading) return <div class="p-10 text-center text-text-secondary">Loading...</div>;

  return (
    <div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 py-5">
        {items.map(item => (
          <div class="flex flex-col items-center p-4 bg-secondary border border-border rounded-lg cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg text-center" onClick={() => handleCardClick(item)}>
            <img class="w-20 h-20 rounded-full object-cover mb-3 bg-primary" src={item.image || ""} alt={item.name} loading="lazy" />
            <div class="w-full">
              <div class="text-sm font-bold text-primary mb-1 whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</div>
              <div class="text-xs text-text-secondary">{item.occupation || "Unknown"}</div>
            </div>
          </div>
        ))}
      </div>
      <div class="flex justify-center items-center gap-3 p-5">
        <button class="px-4 py-2 bg-secondary border border-border rounded-md text-sm text-primary cursor-pointer transition-all hover:bg-accent hover:border-accent hover:text-white disabled:opacity-40 disabled:cursor-not-allowed" disabled={page <= 1} onClick={() => handlePageChange(-1)}>Prev</button>
        <span class="text-sm">Page {page} of {Math.ceil(totalItems / pageSize)}</span>
        <button class="px-4 py-2 bg-secondary border border-border rounded-md text-sm text-primary cursor-pointer transition-all hover:bg-accent hover:border-accent hover:text-white disabled:opacity-40 disabled:cursor-not-allowed" disabled={page * pageSize >= totalItems} onClick={() => handlePageChange(1)}>Next</button>
      </div>
    </div>
  );
}