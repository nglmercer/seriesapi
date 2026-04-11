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
    <div class="max-w-[1200px] mx-auto">
      <div class="flex items-center gap-2 mb-8 text-accent font-bold cursor-pointer hover:underline" onClick={handleBack}>
        {ICONS.back}
        {i18next.t("common.back", "Back to Explorer")}
      </div>

      <div class="flex flex-col lg:flex-row gap-10">
        <div class="w-full lg:w-80 shrink-0">
          <WikiInfobox media={media} />
        </div>

        <div class="flex-1">
          <div class="flex items-center justify-between mb-8">
            <h1 class="text-4xl font-extrabold text-primary">{media.title}</h1>
            <div class="flex items-center gap-4">
              <button class="p-2 text-text-secondary hover:text-error transition-colors" onClick={() => setShowReportModal(true)} title="Report Issue">
                {ICONS.report}
              </button>
            </div>
          </div>

          <div class="mb-10 p-6 bg-secondary/50 rounded-2xl border border-border shadow-sm">
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
            <div class="mb-12">
              <h2 class="text-2xl font-bold text-primary mb-6 pb-2 border-b-2 border-accent w-fit">{i18next.t("media.synopsis", "Synopsis")}</h2>
              <div class="text-lg text-text-secondary leading-relaxed">{media.synopsis}</div>
            </div>
          ) : null}

          {uniqueSeasons.length > 0 ? (
            <div class="mb-12">
              <h2 class="text-2xl font-bold text-primary mb-6 pb-2 border-b-2 border-accent w-fit">{i18next.t("media.seasons", "Seasons")}</h2>
              <div class="mb-6">
                <select class="px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent transition-all" onChange={handleSeasonChange}>
                  <option value="">{i18next.t("media.all_seasons", "All Seasons")}</option>
                  {uniqueSeasons.map(s => (
                    <option value={s.season_number}>{s.name || `Season ${s.season_number}`}</option>
                  ))}
                </select>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {uniqueSeasons.filter(s => selectedSeason === null || s.season_number === selectedSeason).map(s => (
                  <div class="p-5 bg-secondary border border-border rounded-xl cursor-pointer transition-all hover:border-accent hover:shadow-md flex flex-col gap-1" onClick={() => handleSeasonClick(s.id)}>
                    <span class="text-lg font-bold text-primary">{s.name || `Season ${s.season_number}`}</span>
                    <span class="text-sm text-text-secondary">{s.episode_count} episodes</span>
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