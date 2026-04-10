import { h } from 'preact';
import type { MediaItem } from "../../services/api-service";
import styles from './wiki-infobox.module.css';

interface WikiInfoboxProps {
  media: MediaItem | null;
}

export function WikiInfobox({ media }: WikiInfoboxProps) {
  if (!media) return null;

  return (
    <div class={styles.infobox}>
      <div class={styles.infoboxTitle}>{media.title}</div>

      <div class={styles.infoboxImage}>
        <img src={media.poster_url || media.poster} alt={media.title} />
      </div>

      <table class={styles.infoboxData}>
        {media.original_title || media.originalTitle ? (
          <tr>
            <td class={styles.infoboxLabel}>Original Title</td>
            <td class={styles.infoboxValue}>{media.original_title || media.originalTitle}</td>
          </tr>
        ) : null}

        {media.content_type || media.type ? (
          <tr>
            <td class={styles.infoboxLabel}>Type</td>
            <td class={styles.infoboxValue}>{media.content_type || media.type}</td>
          </tr>
        ) : null}

        {media.release_date || media.year ? (
          <tr>
            <td class={styles.infoboxLabel}>Release</td>
            <td class={styles.infoboxValue}>{media.release_date || media.year}</td>
          </tr>
        ) : null}

        {media.status ? (
          <tr>
            <td class={styles.infoboxLabel}>Status</td>
            <td class={styles.infoboxValue}>{media.status}</td>
          </tr>
        ) : null}

        {media.score || media.rating ? (
          <tr>
            <td class={styles.infoboxLabel}>Score</td>
            <td class={styles.infoboxValue}>★ {media.score || media.rating}/10</td>
          </tr>
        ) : null}
      </table>

      {media.synopsis ? (
        <div class={styles.infoboxSection}>
          <div class={styles.infoboxSectionTitle}>Synopsis</div>
          <div class={styles.infoboxSectionContent}>{media.synopsis}</div>
        </div>
      ) : null}
    </div>
  );
}