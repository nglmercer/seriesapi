import { h } from 'preact';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({ title = "No content found", message = "The requested content does not exist or has been removed." }: EmptyStateProps) {
  return (
    <div class="empty">
      <div class="empty-icon">📭</div>
      <div class="empty-title">{title}</div>
      <div class="empty-message">{message}</div>
    </div>
  );
}