import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { mediaService } from "../../services/media-service";
import { eventBus } from "../../utils/events";
import type { MediaItem } from "../../services/api-service";

interface MediaListProps {
  mediaList?: MediaItem[];
}

export function MediaList({ mediaList: externalList }: MediaListProps) {
  const [items, setItems] = useState<MediaItem[]>(externalList || []);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeTimeout = useRef<number | null>(null);

  useEffect(() => {
    setupResizeObserver();
    calculatePageSize();
    if (!externalList && items.length === 0) {
      load();
    }
    return () => {
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (externalList !== undefined) {
      setItems(externalList);
    }
  }, [externalList]);

  function setupResizeObserver() {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
      resizeTimeout.current = setTimeout(() => {
        const oldPageSize = pageSize;
        calculatePageSize();
        if (oldPageSize !== pageSize && !externalList) {
          setPage(1);
          load();
        }
      }, 300) as unknown as number;
    });
    observer.observe(containerRef.current);
  }

  function calculatePageSize() {
    const containerWidth = containerRef.current?.getBoundingClientRect().width || window.innerWidth;
    const minItemWidth = 180;
    const gap = 20;
    const itemsPerRow = Math.floor((containerWidth + gap) / (minItemWidth + gap)) || 1;
    const targetElements = 20;
    const availableHeight = window.innerHeight - (containerRef.current?.getBoundingClientRect().top || 250);
    const itemHeight = 350;
    const minRowsToFill = Math.max(1, Math.ceil((availableHeight - 100) / itemHeight));
    const idealRows = Math.round(targetElements / itemsPerRow);
    const finalRows = Math.max(minRowsToFill, idealRows);
    setPageSize(itemsPerRow * finalRows);
  }

  async function load() {
    setLoading(true);
    try {
      const result = await mediaService.fetchMediaList(page, pageSize, filters);
      setItems(result.items);
      setTotalPages(result.pages);
    } catch (err) {
      console.error("[media-list] load error:", err);
      setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  function goToPage(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
      load();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleMediaClick(id: number) {
    eventBus.emit("media-select", { id });
  }

  function renderPagination() {
    if (totalPages <= 1) return null;

    const pages = [];
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div class="col-span-full flex justify-center items-center gap-2 py-5">
        <button 
          class="px-3.5 py-2 bg-secondary border border-border rounded-md text-[13px] text-primary cursor-pointer transition-all hover:bg-accent hover:border-accent hover:text-white disabled:opacity-40 disabled:cursor-not-allowed" 
          disabled={page === 1} 
          onClick={() => goToPage(page - 1)}
        >
          &lt;
        </button>
        {pages.map(p => (
          <button 
            class={`px-3.5 py-2 border rounded-md text-[13px] cursor-pointer transition-all hover:bg-accent hover:border-accent hover:text-white ${p === page ? "bg-accent border-accent text-white" : "bg-secondary border-border text-primary"}`} 
            onClick={() => goToPage(p)}
          >
            {p}
          </button>
        ))}
        <button 
          class="px-3.5 py-2 bg-secondary border border-border rounded-md text-[13px] text-primary cursor-pointer transition-all hover:bg-accent hover:border-accent hover:text-white disabled:opacity-40 disabled:cursor-not-allowed" 
          disabled={page === totalPages} 
          onClick={() => goToPage(page + 1)}
        >
          &gt;
        </button>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 py-5">
        {Array(pageSize).fill(0).map((_, i) => (
          <div class="bg-card border border-border rounded-lg overflow-hidden">
            <div class="w-full aspect-[2/3] bg-gradient-to-r from-secondary via-primary to-secondary bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"></div>
            <div class="h-5 m-3 bg-gradient-to-r from-secondary via-primary to-secondary bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
            <div class="h-3.5 mx-3 mb-3 w-[60%] bg-gradient-to-r from-secondary via-primary to-secondary bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <div class="col-span-full text-center py-16 text-text-secondary">No items found</div>;
  }

  const visibleItems = items.slice(0, pageSize);

  return (
    <div ref={containerRef} class={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 py-5 ${loading ? "opacity-70 pointer-events-none" : ""}`}>
      {visibleItems.map(item => (
        <div class="bg-card border border-border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl" onClick={() => handleMediaClick(item.id)}>
          <img class="w-full aspect-[2/3] object-cover block" src={item.poster_url || item.image_url} alt={item.title} loading="lazy" />
          <div class="p-3 text-sm font-semibold text-primary truncate">{item.title}</div>
          <div class="px-3 pb-3 text-xs text-text-secondary">
            {item.content_type} | {item.status || ""}
          </div>
        </div>
      ))}
      {renderPagination()}
    </div>
  );
}