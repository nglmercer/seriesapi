import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { mediaService } from "../../services/media-service";
import { eventBus } from "../../utils/events";
import { ICONS } from "../../utils/icons";
import { EmptyState } from "../shared/empty-state";
import { RatingWidget } from "../shared/rating-widget";
import { CommentsSection } from "../shared/comments-section";
import { ReportModal } from "../shared/report-modal";
import { WikiInfobox } from "./wiki-infobox";
import i18next from "../../utils/i18n";
import type { MediaItem } from "../../services/api-service";

interface SeasonData {
  id: number;
  season_number: number;
  episode_count: number;
  name: string;
}

interface MediaDetailProps {
  mediaId?: number;
  media?: MediaItem | null;
  allSeasons?: SeasonData[];
}

export function MediaDetail({ mediaId = 0, media: propMedia, allSeasons: propSeasons }: MediaDetailProps) {
  const [media, setMedia] = useState<MediaItem | null>(propMedia || null);
  const [allSeasons, setAllSeasons] = useState<SeasonData[]>(propSeasons || []);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (propMedia) setMedia(propMedia);
    if (propSeasons) setAllSeasons(propSeasons);
  }, [propMedia, propSeasons]);

  function handleBack() {
    eventBus.emit("back", undefined);
  }

  function handleSeasonChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    setSelectedSeason(target.value ? parseInt(target.value, 10) : null);
  }

  function handleSeasonClick(seasonId: number) {
    eventBus.emit("season-select", { mediaId, seasonId });
  }

  if (!media) return null;

  const uniqueSeasons = allSeasons.filter((s, i, arr) =>
    arr.findIndex(x => x.season_number === s.season_number) === i
  );

  return (
    <div>
      <div class="back-link" onClick={handleBack}>
        {ICONS.back}
        Back to Explorer
      </div>

      <div class="container">
        <div class="wiki-sidebar">
          <WikiInfobox media={media} />
        </div>

        <div class="wiki-main">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <h1 class="page-title" style="margin-bottom: 0;">{media.title}</h1>
            <div style="display: flex; align-items: center; gap: 16px;">
              <button onClick={() => setShowReportModal(true)} style="background: transparent; border: none; cursor: pointer; color: var(--text-secondary);" title="Report Issue">
                {ICONS.report}
              </button>
            </div>
          </div>

          <div style="margin-bottom: 30px;">
            <RatingWidget
              entityType="media"
              entityId={media.id}
              average={media.rating_average || 0}
              count={media.rating_count || 0}
            />
          </div>

          <ReportModal
            open={showReportModal}
            entityType="media"
            entityId={media.id}
            onClose={() => setShowReportModal(false)}
          />

          {media.synopsis ? (
            <div class="section">
              <h2 class="section-title">Synopsis</h2>
              <div class="synopsis">{media.synopsis}</div>
            </div>
          ) : null}

          {uniqueSeasons.length > 0 ? (
            <div class="section">
              <h2 class="section-title">Seasons</h2>
              <div class="filter-bar">
                <select onChange={handleSeasonChange}>
                  <option value="">All Seasons</option>
                  {uniqueSeasons.map(s => (
                    <option value={s.season_number}>{s.name || `Season ${s.season_number}`}</option>
                  ))}
                </select>
              </div>
              <div class="seasons-grid">
                {uniqueSeasons.filter(s => selectedSeason === null || s.season_number === selectedSeason).map(s => (
                  <div class="season-card" onClick={() => handleSeasonClick(s.id)}>
                    <span class="season-name">{s.name || `Season ${s.season_number}`}</span>
                    <span class="season-count">{s.episode_count} episodes</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <CommentsSection entityType="media" entityId={media.id} />
        </div>
      </div>
    </div>
  );
}