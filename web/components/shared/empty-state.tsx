import { h } from 'preact';
import styles from './empty-state.module.css';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({ title = "No content found", message = "The requested content does not exist or has been removed." }: EmptyStateProps) {
  return (
    <div class={styles.empty}>
      <div class={styles.emptyIcon}>📭</div>
      <div class={styles.emptyTitle}>{title}</div>
      <div class={styles.emptyMessage}>{message}</div>
    </div>
  );
}