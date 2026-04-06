const API_BASE = "/api/v1";

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  meta?: Record<string, unknown>;
  params?: Record<string, unknown>;
}
export interface Genres {
  id: number | string,
  name:string,
  slug:string
}
/*
id: 47
name: "Acción"
​
slug: "acci-n"
*/
export interface MediaItem {
  id: number;
  slug: string;
  content_type: string;
  original_title: string;
  status: string;
  release_date: string | null;
  title: string;
  synopsis_short: string | null;
  score: number;
  popularity: number;
  poster_url: string;
  // Legacy fields for compatibility
  type?: string;
  year?: number;
  poster?: string;
  banner?: string;
  rating?: number;
  genres?: string[] | Genres;
  synopsis?: string;
  episodes?: number;
  duration?: number;
  originalTitle?: string;
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
  media_id: number;
  season_id: number;
  episode_number: number;
  absolute_number?: number;
  episode_type?: string;
  title: string;
  synopsis?: string;
  air_date?: string;
  runtime_minutes?: number;
  still_url?: string;
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
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), locale: "es" });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    }
    return this.request(`/media?${params}`);
  }

  getMediaDetail(id: number): Promise<ApiResponse<MediaItem>> {
    return this.request(`/media/${id}?locale=es`);
  }

  getMediaSeasons(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/seasons?locale=es`);
  }

  getMediaEpisodes(mediaId: number, season?: number): Promise<ApiResponse<unknown>> {
    const params = new URLSearchParams({ locale: "es" });
    if (season !== undefined) params.set("season", String(season));
    return this.request(`/media/${mediaId}/episodes?${params}`);
  }

  getMediaCredits(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/credits?locale=es`);
  }

  getMediaImages(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/images?locale=es`);
  }

  getMediaVideos(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/videos?locale=es`);
  }

  getMediaRelated(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/related?locale=es`);
  }

  getMediaComments(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/comments?locale=es`);
  }

  getPeople(page = 1, pageSize = 20): Promise<ApiResponse<PeopleItem[]>> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), locale: "es" });
    return this.request(`/people?${params}`);
  }

  getPeopleDetail(id: number): Promise<ApiResponse<PeopleItem>> {
    return this.request(`/people/${id}?locale=es`);
  }

  getPeopleCredits(personId: number): Promise<ApiResponse<unknown[]>> {
    return this.request(`/people/${personId}/credits?locale=es`);
  }

  getGenres(): Promise<ApiResponse<unknown[]>> {
    return this.request("/genres?locale=es");
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
    const params = new URLSearchParams({ q: query, locale: "es" });
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

  // Admin Operations
  createMedia(data: Partial<MediaItem>): Promise<ApiResponse<MediaItem>> {
    return this.request("/media", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateMedia(id: number, data: Partial<MediaItem>): Promise<ApiResponse<MediaItem>> {
    return this.request(`/media/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteMedia(id: number): Promise<ApiResponse<void>> {
    return this.request(`/media/${id}`, {
      method: "DELETE",
    });
  }

  createGenre(name: string): Promise<ApiResponse<Genres>> {
    return this.request("/genres", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  updateGenre(id: number | string, name: string): Promise<ApiResponse<Genres>> {
    return this.request(`/genres/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
  }

  deleteGenre(id: number | string): Promise<ApiResponse<void>> {
    return this.request(`/genres/${id}`, {
      method: "DELETE",
    });
  }

  assignGenre(mediaId: number, genreId: number | string): Promise<ApiResponse<void>> {
    return this.request(`/media/${mediaId}/genres`, {
      method: "POST",
      body: JSON.stringify({ genreId }),
    });
  }

  unassignGenre(mediaId: number, genreId: number | string): Promise<ApiResponse<void>> {
    return this.request(`/media/${mediaId}/genres/${genreId}`, {
      method: "DELETE",
    });
  }

  // Season Operations
  updateSeason(id: number, data: any): Promise<ApiResponse<void>> {
    return this.request(`/seasons/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteSeason(id: number): Promise<ApiResponse<void>> {
    return this.request(`/seasons/${id}`, {
      method: "DELETE",
    });
  }

  createSeason(data: { mediaId: number; seasonNumber: number; title?: string }): Promise<ApiResponse<void>> {
    return this.request("/seasons", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Episode Operations
  updateEpisode(id: number, data: any): Promise<ApiResponse<void>> {
    return this.request(`/episodes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteEpisode(id: number): Promise<ApiResponse<void>> {
    return this.request(`/episodes/${id}`, {
      method: "DELETE",
    });
  }

  createEpisode(data: { mediaId: number; seasonId: number; number: number; title?: string; synopsis?: string }): Promise<ApiResponse<void>> {
    return this.request("/episodes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();