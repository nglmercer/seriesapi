import {api, type MediaItem, type EpisodeItem, type SeasonItem, type SeasonsResponse, type CommentsResponse} from "./api-service";

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

  async fetchMediaSeasons(mediaId: number): Promise<SeasonItem[]> {
    try {
      const response = await api.getMediaSeasons(mediaId);
      return response.ok ? response.data.seasons || [] : [];
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
      console.error("[media-list] fetchMediaList error:", error);
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

  async fetchSeason(seasonId: number): Promise<SeasonItem | null> {
    try {
      const response = await api.getSeason(seasonId);
      return response.ok ? response.data : null;
    } catch (error) {
      console.error("[media-service] fetchSeason error:", error);
      return null;
    }
  }

  async fetchEpisodeComments(episodeId: number, page: number = 1): Promise<CommentsResponse> {
    try {
      const response = await api.getComments('episode', episodeId, page);
      if (response.ok) {
        return {
          comments: response.data || [],
          total: Number(response.meta?.total) || response.data?.length || 0,
          page,
          pages: Number(response.meta?.pages) || 0
        };
      }
      return { comments: [], total: 0, page, pages: 0 };
    } catch (error) {
      console.error("[media-service] fetchEpisodeComments error:", error);
      return { comments: [], total: 0, page, pages: 0 };
    }
  }

  async fetchMediaComments(mediaId: number, page: number = 1): Promise<CommentsResponse> {
    try {
      const response = await api.getMediaComments(mediaId, page);
      if (response.ok) {
        return {
          comments: response.data || [],
          total: Number(response.meta?.total) || response.data?.length || 0,
          page,
          pages: Number(response.meta?.pages) || 0
        };
      }
      return { comments: [], total: 0, page, pages: 0 };
    } catch (error) {
      console.error("[media-service] fetchMediaComments error:", error);
      return { comments: [], total: 0, page, pages: 0 };
    }
  }
}

export const mediaService = new MediaService();
