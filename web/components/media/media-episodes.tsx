import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { mediaService } from "../../services/media-service";
import { eventBus } from "../../utils/events";
import { ICONS } from "../../utils/icons";
import { EmptyState } from "../shared/empty-state";
import { RatingWidget } from "../shared/rating-widget";
import { CommentsSection } from "../shared/comments-section";
import i18next from "../../utils/i18n";
import type { MediaItem, EpisodeItem } from "../../services/api-service";

interface Season {
  id: number;
  season_number: number;
  name?: string | null;
}

interface MediaEpisodesProps {
  mediaId?: number | null;
  seasonId?: number | null;
}

export function MediaEpisodes({ mediaId, seasonId }: MediaEpisodesProps) {
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    load();
  }, [seasonId]);

  async function load() {
    if (!seasonId || !mediaId) return;
    setLoading(true);

    try {
      const [episodesData, mediaData, seasonData] = await Promise.all([
        mediaService.fetchSeasonEpisodes(seasonId),
        mediaService.fetchMediaDetail(mediaId),
        mediaService.fetchSeason(seasonId)
      ]);
      setEpisodes(episodesData);
      setMedia(mediaData);
      setSeason(seasonData as Season | null);
    } catch (err) {
      console.error("[media-episodes] load error:", err);
      setError(true);
    }
    setLoading(false);
  }

  function handleBack() {
    eventBus.emit("back", undefined);
  }

  if (loading) return <div class="loading">Loading episodes...</div>;
  if (error) return <EmptyState title="Error" message="Failed to load episodes." />;

  return (
    <div>
      <div class="header">
        <div class="back-link" onClick={handleBack}>
          {ICONS.back}
          Back to Series
        </div>
        <h1 class="title">
          {media?.title}
          <small>{season?.name || `Season ${season?.season_number || ''}`}</small>
        </h1>
      </div>

      <div class="episodes-list">
        {episodes.map(ep => (
          <div class="episode-card">
            <div class="episode-thumb-container">
              <img class="episode-thumb" src={ep.still_url || "https://via.placeholder.com/220x124?text=No+Thumbnail"} alt={ep.title || ''} />
            </div>
            <div class="episode-info">
              <div class="episode-title">
                <span class="episode-number">{ep.episode_number}</span>
                {ep.title}
              </div>
              <div class="episode-meta">
                {ep.air_date ? <span>{new Date(ep.air_date).toLocaleDateString()}</span> : null}
                {ep.runtime_minutes ? <span> • {ep.runtime_minutes} min</span> : null}
              </div>
              <div class="episode-synopsis">{ep.synopsis || "No synopsis available."}</div>

              <div style="margin-top: 16px;">
                <RatingWidget
                  entityType="episode"
                  entityId={ep.id}
                  average={ep.rating_average || 0}
                  count={ep.rating_count || 0}
                />
              </div>

              <details style="margin-top: 16px; background: var(--bg-primary); border-radius: 8px; border: 1px solid var(--border-color); padding: 12px;">
                <summary style="cursor: pointer; font-weight: 600; color: var(--text-primary); user-select: none;">
                  Show Comments & Chat
                </summary>
                <div style="margin-top: 12px;">
                  <CommentsSection entityType="episode" entityId={ep.id} />
                </div>
              </details>
            </div>
          </div>
        ))}
      </div>

      {episodes.length === 0 && <EmptyState title="No Episodes" message="This season has no episodes yet." />}
    </div>
  );
}