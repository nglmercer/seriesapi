const API_BASE = "/api/v1";

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  meta?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export interface MediaItem {
  id: number;
  type: string;
  title: string;
  originalTitle?: string;
  year?: number;
  poster?: string;
  banner?: string;
  status?: string;
  rating?: number;
  genres?: string[];
  synopsis?: string;
  episodes?: number;
  duration?: number;
}

export interface PeopleItem {
  id: number;
  name: string;
  originalName?: string;
  image?: string;
  occupation?: string;
}

export interface EpisodeItem {
  id: number;
  mediaId: number;
  seasonNumber: number;
  number: number;
  title: string;
  synopsis?: string;
  airDate?: string;
  runtime?: number;
  thumbnail?: string;
}

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    return res.json() as Promise<ApiResponse<T>>;
  }

  getMedia(page = 1, pageSize = 20, filters?: Record<string, string>): Promise<ApiResponse<MediaItem[]>> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    }
    return this.request(`/media?${params}`);
  }

  getMediaDetail(id: number): Promise<ApiResponse<MediaItem>> {
    return this.request(`/media/${id}`);
  }

  getMediaSeasons(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/seasons`);
  }

  getMediaEpisodes(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/episodes`);
  }

  getMediaCredits(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/credits`);
  }

  getMediaImages(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/images`);
  }

  getMediaVideos(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/videos`);
  }

  getMediaRelated(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/related`);
  }

  getMediaComments(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/comments`);
  }

  getPeople(page = 1, pageSize = 20): Promise<ApiResponse<PeopleItem[]>> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return this.request(`/people?${params}`);
  }

  getPeopleDetail(id: number): Promise<ApiResponse<PeopleItem>> {
    return this.request(`/people/${id}`);
  }

  getPeopleCredits(personId: number): Promise<ApiResponse<unknown[]>> {
    return this.request(`/people/${personId}/credits`);
  }

  getGenres(): Promise<ApiResponse<unknown[]>> {
    return this.request("/genres");
  }

  getGenreMedia(slug: string, page = 1): Promise<ApiResponse<unknown>> {
    return this.request(`/genres/${slug}?page=${page}`);
  }

  getCollections(): Promise<ApiResponse<unknown[]>> {
    return this.request("/collections");
  }

  getCollectionDetail(slug: string): Promise<ApiResponse<unknown>> {
    return this.request(`/collections/${slug}`);
  }

  search(query: string, type?: string): Promise<ApiResponse<unknown[]>> {
    const params = new URLSearchParams({ q: query });
    if (type) params.set("type", type);
    return this.request(`/search?${params}`);
  }

  getEpisode(id: number): Promise<ApiResponse<EpisodeItem>> {
    return this.request(`/episodes/${id}`);
  }

  getEpisodeCredits(episodeId: number): Promise<ApiResponse<unknown[]>> {
    return this.request(`/episodes/${episodeId}/credits`);
  }

  getEpisodeImages(episodeId: number): Promise<ApiResponse<unknown[]>> {
    return this.request(`/episodes/${episodeId}/images`);
  }

  getSeason(id: number): Promise<ApiResponse<unknown>> {
    return this.request(`/seasons/${id}`);
  }

  getSeasonEpisodes(seasonId: number): Promise<ApiResponse<EpisodeItem[]>> {
    return this.request(`/seasons/${seasonId}/episodes`);
  }

  getSeasonImages(seasonId: number): Promise<ApiResponse<unknown[]>> {
    return this.request(`/seasons/${seasonId}/images`);
  }

  postComment(data: {
    entity_type: string;
    entity_id: number;
    display_name: string;
    body: string;
    locale?: string;
    contains_spoilers?: boolean;
    parent_id?: number;
  }): Promise<ApiResponse<unknown>> {
    return this.request("/comments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();