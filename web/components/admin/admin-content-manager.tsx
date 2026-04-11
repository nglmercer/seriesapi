import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from "../../services/api-service";
import { ui } from "../../utils/ui";
import { ICONS } from "../../utils/icons";
import i18next from "../../utils/i18n";
import type { MediaItem, SeasonItem, EpisodeItem, RelationItem } from "../../services/api-service";

interface AdminContentManagerProps {
  mediaId?: number | null;
  onBack?: () => void;
}

export function AdminContentManager({ mediaId, onBack }: AdminContentManagerProps) {
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [relations, setRelations] = useState<RelationItem[]>([]);
  const [currentTab, setCurrentTab] = useState<"episodes" | "relations">("episodes");

  useEffect(() => {
    if (mediaId) {
      fetchData();
    }
  }, [mediaId]);

  async function fetchData() {
    if (!mediaId) return;
    const [mRes, sRes, rRes] = await Promise.all([
      api.getMediaDetail(mediaId),
      api.getMediaSeasons(mediaId),
      api.getMediaRelations(mediaId)
    ]);

    if (mRes.ok) {
      setMedia(mRes.data);
      if (["movie", "short"].includes(mRes.data.content_type)) {
        setCurrentTab("relations");
      }
    }
    if (sRes.ok) setSeasons(sRes.data);
    if (rRes.ok) setRelations(rRes.data);
  }

  async function fetchEpisodes(seasonId: number) {
    setSelectedSeasonId(seasonId);
    const res = await api.getSeasonEpisodes(seasonId);
    if (res.ok) {
      setEpisodes(res.data);
    }
  }

  async function handleEditSeason(season: SeasonItem) {
    const data = await ui.editor<Partial<SeasonItem>>("season", season);
    if (data) {
      await api.updateSeason(season.id, data);
      await fetchData();
    }
  }

  async function handleEditEpisode(ep: EpisodeItem) {
    const data = await ui.editor<Partial<EpisodeItem>>("episode", ep);
    if (data) {
      await api.updateEpisode(ep.id, data);
      if (selectedSeasonId) await fetchEpisodes(selectedSeasonId);
    }
  }

  async function handleAddSeason() {
    if (!mediaId) return;
    const data = await ui.editor<{ season_number: number; name: string }>("season", {
      season_number: seasons.length + 1
    }, i18next.t("admin.new_season"));
    if (!data) return;
    const res = await api.createSeason({
      mediaId: mediaId,
      seasonNumber: data.season_number,
      title: data.name
    });
    if (res.ok) await fetchData();
  }

  async function handleAddEpisode() {
    if (!mediaId || !selectedSeasonId) return;
    const data = await ui.editor<{ episode_number: number; title: string }>("episode", {
      episode_number: episodes.length + 1
    }, i18next.t("admin.new_episode"));
    if (!data) return;
    const res = await api.createEpisode({
      mediaId: mediaId,
      seasonId: selectedSeasonId,
      number: data.episode_number,
      title: data.title
    });
    if (res.ok) await fetchEpisodes(selectedSeasonId);
  }

  async function handleDeleteEpisode(id: number) {
    if (await ui.confirm(i18next.t("admin.delete_episode_confirm"))) {
      await api.deleteEpisode(id);
      if (selectedSeasonId) await fetchEpisodes(selectedSeasonId);
    }
  }

  async function handleAddRelation() {
    if (!mediaId) return;
    const data = await ui.form<{ relatedId: number; type: string }>("New Relation", [
      { label: "Media ID", name: "relatedId", type: "number" },
      {
        label: "Type", name: "type", type: "select",
        options: [
          { label: "Sequel", value: "sequel" },
          { label: "Prequel", value: "prequel" },
          { label: "Spin-off", value: "spin_off" },
          { label: "Alternative Version", value: "alternative" },
          { label: "Side Story", value: "side_story" },
          { label: "Adaptation", value: "adaptation" },
          { label: "Summary", value: "summary" }
        ]
      }
    ]);
    if (data) {
      const res = await api.createMediaRelation({ sourceId: mediaId, ...data });
      if (res.ok) await fetchData();
      else await ui.alert("Invalid ID or error");
    }
  }

  async function handleDeleteRelation(id: number) {
    if (!mediaId) return;
    if (await ui.confirm("Delete this relation?")) {
      await api.deleteMediaRelation(mediaId, id);
      await fetchData();
    }
  }

  return (
    <div class="max-w-[1200px] mx-auto px-5 pb-10">
      <button class="inline-flex items-center gap-2 px-4 py-2.5 mb-5 bg-neutral border border-border rounded-lg text-sm font-semibold text-primary cursor-pointer transition-all hover:bg-accent hover:border-accent hover:text-white" onClick={onBack}>
        {ICONS.back} Back
      </button>

      <div class="card border border-border rounded-xl p-6">
        <div class="flex gap-1 mb-6 p-1 bg-primary/50 rounded-lg w-fit">
          <button
            class={`btn btn-dash btn-primary transition-all ${currentTab === "episodes" ? "bg-neutral text-primary shadow-sm" : "text-text-secondary"} ${(!media || ["movie", "short"].includes(media.content_type)) ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            onClick={() => setCurrentTab("episodes")}
            disabled={!media || ["movie", "short"].includes(media.content_type)}
          >
            Episodes
          </button>
          <button
            class={`btn btn-dash btn-primary transition-all cursor-pointer ${currentTab === "relations" ? "bg-neutral text-primary shadow-sm" : "text-text-secondary"}`}
            onClick={() => setCurrentTab("relations")}
          >
            Relations
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
          <div>
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center mb-4">
                <h3 class="m-0 text-lg font-extrabold">Seasons</h3>
                <button class="btn btn-outline btn-primary" onClick={handleAddSeason}>+</button>
              </div>
              {seasons.map(s => (
                <div
                  class={`p-6 bg-neutral border rounded-xl cursor-pointer transition-all hover:border-accent ${selectedSeasonId === s.id ? 'border-accent bg-accent/10' : 'border-border'}`}
                  onClick={() => fetchEpisodes(s.id)}
                >
                  <div class="flex justify-between items-center">
                    <div class="flex flex-col gap-0.5">
                      <span class="font-extrabold text-sm text-primary">S{s.season_number}</span>
                      <span class="text-xs text-text-secondary">
                        {s.name || "No title"}
                      </span>
                    </div>
                    <button
                      class="btn btn-dash btn-accent"
                      disabled={!selectedSeasonId}
                      onClick={(e) => { e.stopPropagation(); handleEditSeason(s); }}
                    >
                      {ICONS.edit}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {currentTab === "episodes" ? (
              <div class="flex-1">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="m-0 text-lg font-extrabold">Episodes</h3>
                  <button class="btn btn-outline btn-primary" onClick={handleAddEpisode} disabled={!selectedSeasonId}>+</button>
                </div>  
                {!selectedSeasonId ? (
                  <div class="flex flex-col items-center justify-center py-15 text-center text-text-secondary">
                    <div class="text-3xl mb-3">👈</div>
                    <p class="font-bold text-primary">Select a season</p>
                  </div>
                ) : (
                  <div class="flex flex-col gap-2">
                    {episodes.map(ep => (
                      <div class="flex items-center justify-between gap-3 p-3 px-4 bg-neutral border border-border rounded-xl">    
                        <div class="flex items-center gap-3 min-w-0 flex-1">
                          <div class="inline-flex items-center justify-center min-w-[36px] h-[36px] px-2.5 btn btn-soft btn-accent">E{ep.episode_number}</div>
                          <span class="font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                            {ep.title || "No title"}
                          </span>
                        </div>
                        <div class="flex gap-2 shrink-0">
                          <button class="btn btn-dash btn-accent" onClick={() => handleEditEpisode(ep)}>Edit</button>
                          <button class="btn btn-dash btn-error" onClick={() => handleDeleteEpisode(ep.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                    {episodes.length === 0 && (
                      <div class="text-center p-5 text-text-secondary border border-dashed border-border rounded-xl">
                        No episodes added yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div class="flex-1">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="m-0 text-lg font-extrabold">Relations and Trilogies</h3>
                  <button class="btn btn-soft btn-primary" onClick={handleAddRelation}>+ Add Relation</button>
                </div>
                <div class="flex flex-col gap-2">
                  {relations.map(rel => (
                    <div class="flex items-center justify-between gap-3 p-3 px-4 bg-neutral border border-border rounded-xl">
                      <div class="flex flex-col gap-1 min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                          <span class="text-[11px] font-bold tracking-wider uppercase text-text-secondary">{rel.relation_type}</span>
                          {rel.related_type && <span class="text-[11px] px-2 py-0.5 bg-neutral border border-border rounded text-text-secondary">{rel.related_type}</span>}
                        </div>
                        <strong class="text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                          {rel.related_title || `Media ID: ${rel.related_media_id}`}
                        </strong>
                      </div>
                      <button class="p-1.5 bg-primary border border-border rounded-md text-error cursor-pointer transition-all hover:bg-error hover:border-error hover:text-white" onClick={() => handleDeleteRelation(rel.id)}>
                        {ICONS.trash}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}