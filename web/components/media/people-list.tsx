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

  if (loading) return <div class="loading">Loading...</div>;

  return (
    <div>
      <div class="list">
        {items.map(item => (
          <div class="person" onClick={() => handleCardClick(item)}>
            <img class="avatar" src={item.image || ""} alt={item.name} loading="lazy" />
            <div class="info">
              <div class="name">{item.name}</div>
              <div class="occupation">{item.occupation || "Unknown"}</div>
            </div>
          </div>
        ))}
      </div>
      <div class="pagination">
        <button disabled={page <= 1} onClick={() => handlePageChange(-1)}>Prev</button>
        <span>Page {page} of {Math.ceil(totalItems / pageSize)}</span>
        <button disabled={page * pageSize >= totalItems} onClick={() => handlePageChange(1)}>Next</button>
      </div>
    </div>
  );
}