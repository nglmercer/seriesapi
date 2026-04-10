import { h } from 'preact';
import i18next from "../../utils/i18n";

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
    <div class="pagination-container">
      <button
        class="pagination-btn prev-btn"
        disabled={currentPage <= 1}
        onClick={handlePrev}
      >
        ←
      </button>

      <div class="info-text">
        <span class="current-page">{currentPage}</span>
        <span class="total-items">{totalItems} items</span>
      </div>

      <button
        class="pagination-btn next-btn"
        disabled={currentPage >= totalPages}
        onClick={handleNext}
      >
        →
      </button>
    </div>
  );
}