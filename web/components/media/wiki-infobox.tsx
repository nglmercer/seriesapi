import { h } from 'preact';
import type { MediaItem } from "../../services/api-service";

interface WikiInfoboxProps {
  media: MediaItem | null;
}

export function WikiInfobox({ media }: WikiInfoboxProps) {
  if (!media) return null;

  return (
    <div class="card bg-base-200 border border-base-content/10 overflow-hidden shadow-xl sticky top-24">
      <div class="p-4 bg-primary text-primary-content text-lg font-black text-center tracking-tight leading-tight">
        {media.title}
      </div>

      <div class="p-0 overflow-hidden aspect-[2/3]">
        <img 
          class="w-full h-full object-cover block transition-transform duration-700 hover:scale-110" 
          src={media.poster_url || media.poster} 
          alt={media.title} 
        />
      </div>

      <div class="p-0">
        <table class="table table-compact w-full">
          <tbody>
            {(media.original_title || media.originalTitle) && (
              <tr class="border-base-content/5">
                <th class="bg-base-300/30 text-[10px] font-black uppercase tracking-widest text-base-content/50 w-1/3 py-3">Original</th>
                <td class="text-sm font-bold text-base-content py-3">{media.original_title || media.originalTitle}</td>
              </tr>
            )}

            {(media.content_type || media.type) && (
              <tr class="border-base-content/5">
                <th class="bg-base-300/30 text-[10px] font-black uppercase tracking-widest text-base-content/50 w-1/3 py-3">Type</th>
                <td class="text-sm font-bold text-base-content uppercase tracking-wider py-3">{media.content_type || media.type}</td>
              </tr>
            )}

            {(media.release_date || media.year) && (
              <tr class="border-base-content/5">
                <th class="bg-base-300/30 text-[10px] font-black uppercase tracking-widest text-base-content/50 w-1/3 py-3">Release</th>
                <td class="text-sm font-bold text-base-content py-3">{media.release_date || media.year}</td>
              </tr>
            )}

            {media.status && (
              <tr class="border-base-content/5">
                <th class="bg-base-300/30 text-[10px] font-black uppercase tracking-widest text-base-content/50 w-1/3 py-3">Status</th>
                <td class="text-sm font-bold text-base-content py-3">
                  <span class="badge badge-ghost badge-sm font-bold uppercase tracking-wider">{media.status}</span>
                </td>
              </tr>
            )}

            {(media.score || media.rating) && (
              <tr class="border-base-content/5">
                <th class="bg-base-300/30 text-[10px] font-black uppercase tracking-widest text-base-content/50 w-1/3 py-3">Score</th>
                <td class="text-sm font-bold text-base-content py-3">
                  <div class="flex items-center gap-1">
                    <span class="text-warning text-xs">★</span>
                    <span>{media.score || media.rating}</span>
                    <span class="text-[10px] opacity-40">/ 10</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {media.synopsis_short && (
        <div class="p-5 border-t border-base-content/5 bg-base-100/50">
          <div class="text-[10px] font-black text-base-content/40 uppercase tracking-widest mb-3">Quick Info</div>
          <div class="text-xs leading-relaxed text-base-content/70 font-medium italic">
            "{media.synopsis_short}"
          </div>
        </div>
      )}
    </div>
  );
}