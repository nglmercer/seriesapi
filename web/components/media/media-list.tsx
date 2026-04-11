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
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 py-8">
        {Array(pageSize).fill(0).map((_, i) => (
          <div class="flex flex-col gap-4">
            <div class="skeleton w-full aspect-[2/3] rounded-2xl"></div>
            <div class="skeleton h-4 w-3/4 rounded-lg"></div>
            <div class="skeleton h-3 w-1/2 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div class="flex flex-col items-center justify-center py-32 text-center">
        <div class="text-7xl mb-6 opacity-20">📭</div>
        <h3 class="text-2xl font-black text-base-content/40 tracking-tight">No items found</h3>
        <p class="text-base-content/30 text-sm mt-2 font-medium leading-relaxed max-w-xs">
          We couldn't find any media matching your criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  const visibleItems = items.slice(0, pageSize);

  return (
    <div ref={containerRef}>
      <div class={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 py-8 transition-all duration-500 ${loading ? "opacity-50 grayscale" : ""}`}>
        {visibleItems.map(item => (
          <div 
            key={item.id}
            class="group relative flex flex-col bg-base-100 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 border border-base-content/5" 
            onClick={() => handleMediaClick(item.id)}
          >
            <div class="relative aspect-[2/3] overflow-hidden">
              <img 
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                src={item.poster_url || item.image_url} 
                alt={item.title} 
                loading="lazy" 
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <span class="badge badge-primary badge-sm font-black uppercase tracking-widest text-[9px] mb-2">{item.content_type}</span>
              </div>
            </div>
            <div class="p-4">
              <h3 class="text-sm font-black text-base-content truncate group-hover:text-primary transition-colors tracking-tight">{item.title}</h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[10px] font-black uppercase tracking-widest text-base-content/30">{item.status || "Unknown"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {renderPagination()}
    </div>
  );
}