import {api, type MediaItem, type EpisodeItem} from "./api-service";

interface SeasonData {
  id: number;
  season_number: number;
  episode_count: number;
  name: string;
}

class MediaService {
  async fetchMediaDetail(mediaId: number): Promise<MediaItem | null> {
    try {
      const response = await api.getMediaDetail(mediaId);
      return response.ok ? response.data : null;
    } catch (error) {
      console.error("[media-service] fetchMediaDetail error:", error);
      return null;
    }
  }

  async fetchMediaSeasons(mediaId: number): Promise<SeasonData[]> {
    try {
      const response = await api.getMediaSeasons(mediaId);
      return response.ok ? (response.data as any).seasons || [] : [];
    } catch (error) {
      console.error("[media-service] fetchMediaSeasons error:", error);
      return [];
    }
  }

  async fetchMediaList(page: number, pageSize: number, filters?: Record<string, string>): Promise<MediaItem[]> {
    try {
      const response = await api.getMedia(page, pageSize, filters);
      return response.ok ? response.data : [];
    } catch (error) {
      console.error("[media-service] fetchMediaList error:", error);
      return [];
    }
  }

  async fetchSeasonEpisodes(seasonId: number): Promise<EpisodeItem[]> {
    try {
      const response = await api.getSeasonEpisodes(seasonId);
      return response.ok ? response.data : [];
    } catch (error) {
      console.error("[media-service] fetchSeasonEpisodes error:", error);
      return [];
    }
  }

  async fetchSeason(seasonId: number): Promise<any> {
    try {
      const response = await api.getSeason(seasonId);
      return response.ok ? response.data : null;
    } catch (error) {
      console.error("[media-service] fetchSeason error:", error);
      return null;
    }
  }

  async fetchEpisodeComments(episodeId: number, page: number = 1): Promise<any> {
    try {
      const response = await api.getComments('episode', episodeId, page);
      return response.ok ? response.data : { comments: [], total: 0, page, pages: 0 };
    } catch (error) {
      console.error("[media-service] fetchEpisodeComments error:", error);
      return { comments: [], total: 0, page, pages: 0 };
    }
  }

  async fetchMediaComments(mediaId: number, page: number = 1): Promise<any> {
    try {
      const response = await api.getMediaComments(mediaId);
      return response.ok ? response.data : { comments: [], total: 0, page, pages: 0 };
    } catch (error) {
      console.error("[media-service] fetchMediaComments error:", error);
      return { comments: [], total: 0, page, pages: 0 };
    }
  }
}

export const mediaService = new MediaService();
