import { h } from 'preact';
import type { MediaItem } from "../../services/api-service";

interface WikiInfoboxProps {
  media: MediaItem | null;
}

export function WikiInfobox({ media }: WikiInfoboxProps) {
  if (!media) return null;

  return (
    <div class="infobox">
      <div class="infobox-title">{media.title}</div>

      <div class="infobox-image">
        <img src={media.poster_url || media.poster} alt={media.title} />
      </div>

      <table class="infobox-data">
        {media.original_title || media.originalTitle ? (
          <tr>
            <td class="infobox-label">Original Title</td>
            <td class="infobox-value">{media.original_title || media.originalTitle}</td>
          </tr>
        ) : null}

        {media.content_type || media.type ? (
          <tr>
            <td class="infobox-label">Type</td>
            <td class="infobox-value">{media.content_type || media.type}</td>
          </tr>
        ) : null}

        {media.release_date || media.year ? (
          <tr>
            <td class="infobox-label">Release</td>
            <td class="infobox-value">{media.release_date || media.year}</td>
          </tr>
        ) : null}

        {media.status ? (
          <tr>
            <td class="infobox-label">Status</td>
            <td class="infobox-value">{media.status}</td>
          </tr>
        ) : null}

        {media.score || media.rating ? (
          <tr>
            <td class="infobox-label">Score</td>
            <td class="infobox-value">★ {media.score || media.rating}/10</td>
          </tr>
        ) : null}
      </table>

      {media.synopsis ? (
        <div class="infobox-section">
          <div class="infobox-section-title">Synopsis</div>
          <div class="infobox-section-content">{media.synopsis}</div>
        </div>
      ) : null}
    </div>
  );
}