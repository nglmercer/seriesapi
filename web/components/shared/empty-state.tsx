import { h } from 'preact';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({ title = "No content found", message = "The requested content does not exist or has been removed." }: EmptyStateProps) {
  return (
    <div class="flex flex-col items-center justify-center p-15 px-5 text-center">
      <div class="text-5xl mb-4 opacity-60">📭</div>
      <div class="text-xl font-bold text-primary mb-2">{title}</div>
      <div class="text-sm text-text-secondary max-w-[400px]">{message}</div>
    </div>
  );
}