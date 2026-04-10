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
      await api.deleteMediaRelation(id);
      await fetchData();
    }
  }

  return (
    <div class="container">
      <button class="back-btn" onClick={onBack}>
        {ICONS.back} Back
      </button>

      <div class="card">
        <div class="admin-tabs">
          <button
            class={`tab-btn ${currentTab === "episodes" ? "active" : ""} ${!media || ["movie", "short"].includes(media.content_type) ? "disabled" : ""}`}
            onClick={() => setCurrentTab("episodes")}
            disabled={!media || ["movie", "short"].includes(media.content_type)}
          >
            Episodes
          </button>
          <button
            class={`tab-btn ${currentTab === "relations" ? "active" : ""}`}
            onClick={() => setCurrentTab("relations")}
          >
            Relations
          </button>
        </div>

        <div class="content-grid">
          <div>
            <div class="seasons-grid">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Seasons</h3>
                <button class="primary" onClick={handleAddSeason}>+</button>
              </div>
              {seasons.map(s => (
                <div
                  class={`card ${selectedSeasonId === s.id ? 'active' : ''}`}
                  onClick={() => fetchEpisodes(s.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 800, fontSize: '14px' }}>S{s.season_number}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {s.name || "No title"}
                      </span>
                    </div>
                    <button
                      class="edit-btn"
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
              <div class="episodes-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Episodes</h3>
                  <button class="primary" onClick={handleAddEpisode} disabled={!selectedSeasonId}>+</button>
                </div>
                {!selectedSeasonId ? (
                  <div class="empty-state">
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>👈</div>
                    <p style={{ fontWeight: 700 }}>Select a season</p>
                  </div>
                ) : (
                  <div class="episodes-grid">
                    {episodes.map(ep => (
                      <div class="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                          <div class="episode-badge">E{ep.episode_number}</div>
                          <span style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ep.title || "No title"}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button class="edit-btn" onClick={() => handleEditEpisode(ep)}>Edit</button>
                          <button class="danger" onClick={() => handleDeleteEpisode(ep.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                    {episodes.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '10px' }}>
                        No episodes added yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div class="relations-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Relations and Trilogies</h3>
                  <button class="primary" onClick={handleAddRelation}>+ Add Relation</button>
                </div>
                <div class="relations-grid">
                  {relations.map(rel => (
                    <div class="card">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span class="badge">{rel.relation_type}</span>
                          {rel.related_type && <span class="type-label">{rel.related_type}</span>}
                        </div>
                        <strong style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {rel.related_title || `Media ID: ${rel.related_media_id}`}
                        </strong>
                      </div>
                      <button class="danger" onClick={() => handleDeleteRelation(rel.id)}>
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