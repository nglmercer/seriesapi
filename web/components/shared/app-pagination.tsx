import { h } from 'preact';

interface AppPaginationProps {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

export function AppPagination({
  currentPage = 1,
  pageSize = 20,
  totalItems = 0,
  onPageChange
}: AppPaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  function handlePrev() {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  }

  function handleNext() {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  }

  return (
    <div class="flex items-center justify-center gap-4 p-6">
      <button
        class="px-4 py-2 bg-secondary border border-border rounded-lg text-primary text-sm cursor-pointer transition-all hover:bg-accent hover:border-accent hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={currentPage <= 1}
        onClick={handlePrev}
      >
        ←
      </button>

      <div class="flex items-center gap-2 text-sm text-text-secondary">
        <span class="font-bold text-primary">{currentPage}</span>
        <span class="opacity-70">{totalItems} items</span>
      </div>

      <button
        class="px-4 py-2 bg-secondary border border-border rounded-lg text-primary text-sm cursor-pointer transition-all hover:bg-accent hover:border-accent hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={currentPage >= totalPages}
        onClick={handleNext}
      >
        →
      </button>
    </div>
  );
}