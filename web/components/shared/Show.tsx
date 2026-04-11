import { h, Fragment } from 'preact';
import type { ComponentChildren } from 'preact';

interface ShowProps {
  when: any;
  fallback?: ComponentChildren;
  children: ComponentChildren;
}

/**
 * A safe conditional renderer to avoid Preact diffing issues with && operator.
 * Ensures that the result is always a valid VNode or fallback (defaulting to null).
 */
export function Show({ when, fallback = null, children }: ShowProps) {
  if (when) return <div class="show-content">{children}</div>;
  return fallback ? <div class="show-fallback">{fallback}</div> : null;
}
