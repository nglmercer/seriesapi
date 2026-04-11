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
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div 
        class="group flex items-center gap-3 mb-10 text-base-content/50 font-black uppercase tracking-widest text-xs cursor-pointer hover:text-primary transition-all duration-300" 
        onClick={handleBack}
      >
        <span class="p-2 bg-base-200 rounded-xl group-hover:bg-primary group-hover:text-primary-content transition-colors">
          {ICONS.back}
        </span>
        {i18next.t("common.back", "Back to Explorer")}
      </div>

      <div class="flex flex-col lg:flex-row gap-12">
        <div class="w-full lg:w-80 shrink-0">
          <WikiInfobox media={media} />
        </div>

        <div class="flex-1">
          <div class="flex items-start justify-between mb-10 gap-6">
            <div>
              <div class="flex items-center gap-3 mb-3">
                <span class="badge badge-primary badge-sm font-black uppercase tracking-widest">{media.content_type || media.type}</span>
                <span class="badge badge-ghost badge-sm font-bold uppercase tracking-wider opacity-50">{media.status}</span>
              </div>
              <h1 class="text-5xl font-black text-base-content tracking-tighter leading-none mb-4">{media.title}</h1>
              {media.original_title && media.original_title !== media.title && (
                <p class="text-lg font-medium text-base-content/40 italic">{media.original_title}</p>
              )}
            </div>
            <button 
              class="btn btn-circle btn-ghost btn-sm text-base-content/20 hover:text-error transition-colors" 
              onClick={() => setShowReportModal(true)} 
              title="Report Issue"
            >
              {ICONS.report}
            </button>
          </div>

          <div class="mb-12">
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
            <div class="mb-16">
              <h2 class="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 flex items-center gap-4">
                {i18next.t("media.synopsis", "Synopsis")}
                <span class="h-px bg-primary/20 flex-1"></span>
              </h2>
              <div class="text-lg text-base-content/70 leading-relaxed font-medium">
                {media.synopsis}
              </div>
            </div>
          ) : null}

          {uniqueSeasons.length > 0 ? (
            <div class="mb-16">
              <div class="flex items-center justify-between mb-8">
                <h2 class="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-4 flex-1">
                  {i18next.t("media.seasons", "Seasons")}
                  <span class="h-px bg-primary/20 flex-1"></span>
                </h2>
                <div class="ml-6">
                  <select 
                    class="select select-bordered select-sm bg-base-200 border-base-content/10 focus:border-primary rounded-xl font-bold" 
                    onChange={handleSeasonChange}
                  >
                    <option value="">{i18next.t("media.all_seasons", "All Seasons")}</option>
                    {uniqueSeasons.map(s => (
                      <option value={s.season_number}>{s.name || `Season ${s.season_number}`}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {uniqueSeasons.filter(s => selectedSeason === null || s.season_number === selectedSeason).map(s => (
                  <div 
                    key={s.id}
                    class="group p-6 bg-base-200 border border-base-content/5 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-base-300 hover:border-primary/30 hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-primary/5 flex items-center justify-between" 
                    onClick={() => handleSeasonClick(s.id)}
                  >
                    <div class="flex flex-col gap-1">
                      <span class="text-lg font-black text-base-content group-hover:text-primary transition-colors tracking-tight">
                        {s.name || `Season ${s.season_number}`}
                      </span>
                      <span class="text-[10px] font-black uppercase tracking-widest text-base-content/30 italic">
                        {s.episode_count} episodes
                      </span>
                    </div>
                    <div class="p-2 bg-base-300 rounded-xl group-hover:bg-primary group-hover:text-primary-content transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div class="pt-8 border-t border-base-content/5">
            <h2 class="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-10 flex items-center gap-4">
              {i18next.t("media.community", "Community")}
              <span class="h-px bg-primary/20 flex-1"></span>
            </h2>
            <CommentsSection entityType="media" entityId={media.id} />
          </div>
        </div>
      </div>
    </div>
  );
}