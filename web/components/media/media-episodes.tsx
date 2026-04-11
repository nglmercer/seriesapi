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

  if (loading) return (
    <div class="flex flex-col items-center justify-center p-20 text-text-secondary gap-4">
      <div class="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      <span>{i18next.t("media.loading_episodes", "Loading episodes...")}</span>
    </div>
  );
  if (error) return <EmptyState title="Error" message="Failed to load episodes." />;

  return (
    <div class="max-w-[1200px] mx-auto">
      <div class="mb-10">
        <div class="flex items-center gap-2 mb-6 text-accent font-bold cursor-pointer hover:underline" onClick={handleBack}>
          {ICONS.back}
          {i18next.t("common.back", "Back to Series")}
        </div>
        <h1 class="text-4xl font-extrabold text-primary flex flex-col sm:flex-row sm:items-baseline gap-3">
          {media?.title}
          <span class="text-xl font-medium text-text-secondary">{season?.name || `Season ${season?.season_number || ''}`}</span>
        </h1>
      </div>

      <div class="flex flex-col gap-6">
        {episodes.map(ep => (
          <div class="flex flex-col lg:flex-row gap-6 p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div class="w-full lg:w-64 shrink-0">
              <img class="w-full aspect-video object-cover rounded-xl shadow-sm" src={ep.still_url || `https://via.placeholder.com/220x124?text=Episode+${ep.episode_number}`} alt={ep.title || ''} />
            </div>
            <div class="flex-1 flex flex-col">
              <div class="text-xl font-bold text-primary mb-2 flex items-center gap-3">
                <span class="flex items-center justify-center w-8 h-8 bg-accent text-white rounded-lg text-sm">{ep.episode_number}</span>
                {ep.title}
              </div>
              <div class="text-sm text-text-secondary mb-4 font-medium">
                {ep.air_date ? <span>{new Date(ep.air_date).toLocaleDateString()}</span> : null}
                {ep.runtime_minutes ? <span> • {ep.runtime_minutes} min</span> : null}
              </div>
              <div class="text-text-secondary leading-relaxed mb-6">{ep.synopsis || i18next.t("media.no_synopsis", "No synopsis available.")}</div>

              <div class="mt-auto">
                <RatingWidget
                  entityType="episode"
                  entityId={ep.id}
                  average={ep.rating_average || 0}
                  count={ep.rating_count || 0}
                />
              </div>

              <details class="mt-4 bg-secondary border border-border rounded-xl p-4 overflow-hidden group">
                <summary class="cursor-pointer font-bold text-primary select-none outline-none hover:text-accent transition-colors">
                  {i18next.t("media.show_comments", "Show Comments & Chat")}
                </summary>
                <div class="mt-4 pt-4 border-t border-border">
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