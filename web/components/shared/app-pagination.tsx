import { h } from 'preact';
import styles from './app-pagination.module.css';

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
    <div class={styles.paginationContainer}>
      <button
        class={styles.paginationBtn}
        disabled={currentPage <= 1}
        onClick={handlePrev}
      >
        ←
      </button>

      <div class={styles.infoText}>
        <span class={styles.currentPage}>{currentPage}</span>
        <span class={styles.totalItems}>{totalItems} items</span>
      </div>

      <button
        class={styles.paginationBtn}
        disabled={currentPage >= totalPages}
        onClick={handleNext}
      >
        →
      </button>
    </div>
  );
}