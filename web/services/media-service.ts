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

  async fetchMediaList(page: number, pageSize: number, filters?: Record<string, string>, offset?: number): Promise<{ items: MediaItem[], total: number, pages: number, offset: number }> {
    try {
      const response = await api.getMedia(page, pageSize, filters, offset);
      if (response.ok) {
        return {
          items: response.data || [],
          total: Number(response.meta?.total) || response.data?.length || 0,
          pages: Number(response.meta?.pages) || Number(response.meta?.total) || 0,
          offset: Number(response.meta?.offset) || 0,
        };
      }
      return { items: [], total: 0, pages: 1, offset: 0 };
    } catch (error) {
      console.error("[media-list] fetchMediaList error:", error);
      return { items: [], total: 0, pages: 1, offset: 0 };
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
