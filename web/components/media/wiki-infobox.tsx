import { h } from 'preact';
import type { MediaItem } from "../../services/api-service";

interface WikiInfoboxProps {
  media: MediaItem | null;
}

export function WikiInfobox({ media }: WikiInfoboxProps) {
  if (!media) return null;

  return (
    <div class="bg-secondary border border-border rounded-lg overflow-hidden shadow-sm">
      <div class="p-3 px-4 bg-accent text-white text-base font-bold text-center leading-tight">{media.title}</div>

      <div class="p-3 bg-primary">
        <img class="w-full h-auto rounded-md block shadow-sm" src={media.poster_url || media.poster} alt={media.title} />
      </div>

      <table class="w-full border-collapse">
        {media.original_title || media.originalTitle ? (
          <tr class="border-b border-border last:border-none">
            <td class="p-2 px-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider bg-secondary w-2/5">Original Title</td>
            <td class="p-2 px-3 text-sm text-primary">{media.original_title || media.originalTitle}</td>
          </tr>
        ) : null}

        {media.content_type || media.type ? (
          <tr class="border-b border-border last:border-none">
            <td class="p-2 px-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider bg-secondary w-2/5">Type</td>
            <td class="p-2 px-3 text-sm text-primary uppercase">{media.content_type || media.type}</td>
          </tr>
        ) : null}

        {media.release_date || media.year ? (
          <tr class="border-b border-border last:border-none">
            <td class="p-2 px-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider bg-secondary w-2/5">Release</td>
            <td class="p-2 px-3 text-sm text-primary">{media.release_date || media.year}</td>
          </tr>
        ) : null}

        {media.status ? (
          <tr class="border-b border-border last:border-none">
            <td class="p-2 px-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider bg-secondary w-2/5">Status</td>
            <td class="p-2 px-3 text-sm text-primary">{media.status}</td>
          </tr>
        ) : null}

        {media.score || media.rating ? (
          <tr class="border-b border-border last:border-none">
            <td class="p-2 px-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider bg-secondary w-2/5">Score</td>
            <td class="p-2 px-3 text-sm text-primary">★ {media.score || media.rating}/10</td>
          </tr>
        ) : null}
      </table>

      {media.synopsis ? (
        <div class="p-3 px-4 border-t border-border">
          <div class="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">Synopsis</div>
          <div class="text-sm leading-relaxed text-primary">{media.synopsis}</div>
        </div>
      ) : null}
    </div>
  );
}