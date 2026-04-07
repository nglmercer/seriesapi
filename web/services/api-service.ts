import i18next from "../utils/i18n";
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
  original_language?: string;
  status: string;
  release_date: string | null;
  end_date: string | null;
  runtime_minutes: number | null;
  total_episodes: number | null;
  total_seasons: number | null;
  score: number;
  score_count: number;
  popularity: number;
  age_rating: string | null;
  is_adult: boolean;
  poster_url: string;
  
  // Localized fields
  title: string;
  tagline: string | null;
  synopsis: string | null;
  synopsis_short: string | null;
  translation_id?: number | null;

  genres?: (Genres | string)[];
  
  // Legacy fields for compatibility
  type?: string;
  year?: number;
  poster?: string;
  banner?: string;
  rating?: number;
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

export interface SeasonItem {
  id: number;
  media_id: number;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  end_date: string | null;
  score: number;
  score_count: number;
  
  // Localized fields
  name: string | null;
  synopsis: string | null;
  translation_id?: number | null;
}

export interface EpisodeItem {
  id: number;
  media_id: number;
  season_id: number | null;
  episode_number: number;
  absolute_number: number | null;
  episode_type: string;
  air_date: string | null;
  runtime_minutes: number | null;
  score: number;
  score_count: number;
  
  // Localized fields
  title: string | null;
  synopsis: string | null;
  translation_id?: number | null;
  
  still_url?: string;
}

class ApiClient {
  private getLocale() {
    return i18next.language || "es";
  }

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
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), locale: this.getLocale() });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    }
    return this.request(`/media?${params}`);
  }

  getMediaDetail(id: number): Promise<ApiResponse<MediaItem>> {
    return this.request(`/media/${id}?locale=${this.getLocale()}`);
  }

  getMediaSeasons(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/seasons?locale=${this.getLocale()}`);
  }

  getMediaEpisodes(mediaId: number, season?: number): Promise<ApiResponse<unknown>> {
    const params = new URLSearchParams({ locale: this.getLocale() });
    if (season !== undefined) params.set("season", String(season));
    return this.request(`/media/${mediaId}/episodes?${params}`);
  }

  getMediaCredits(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/credits?locale=${this.getLocale()}`);
  }

  getMediaImages(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/images?locale=${this.getLocale()}`);
  }

  getMediaVideos(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/videos?locale=${this.getLocale()}`);
  }

  getMediaRelated(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/related?locale=${this.getLocale()}`);
  }

  getMediaComments(mediaId: number): Promise<ApiResponse<unknown>> {
    return this.request(`/media/${mediaId}/comments?locale=${this.getLocale()}`);
  }

  getPeople(page = 1, pageSize = 20): Promise<ApiResponse<PeopleItem[]>> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), locale: this.getLocale() });
    return this.request(`/people?${params}`);
  }

  getPeopleDetail(id: number): Promise<ApiResponse<PeopleItem>> {
    return this.request(`/people/${id}?locale=${this.getLocale()}`);
  }

  getPeopleCredits(personId: number): Promise<ApiResponse<unknown[]>> {
    return this.request(`/people/${personId}/credits?locale=${this.getLocale()}`);
  }

  getGenres(): Promise<ApiResponse<unknown[]>> {
    return this.request(`/genres?locale=${this.getLocale()}`);
  }

  getGenreMedia(slug: string, page = 1): Promise<ApiResponse<unknown>> {
    return this.request(`/genres/${slug}?page=${page}&locale=${this.getLocale()}`);
  }

  getCollections(): Promise<ApiResponse<unknown[]>> {
    return this.request("/collections");
  }

  getCollectionDetail(slug: string): Promise<ApiResponse<unknown>> {
    return this.request(`/collections/${slug}`);
  }

  search(query: string, type?: string): Promise<ApiResponse<unknown[]>> {
    const params = new URLSearchParams({ q: query, locale: this.getLocale() });
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

  getMediaRelations(mediaId: number): Promise<ApiResponse<unknown[]>> {
    return this.request(`/media/${mediaId}/related?locale=${this.getLocale()}`);
  }

  createMediaRelation(data: { sourceId: number; relatedId: number; type: string }): Promise<ApiResponse<void>> {
    return this.request(`/media/${data.sourceId}/related`, {
      method: "POST",
      body: JSON.stringify({ relatedId: data.relatedId, type: data.type }),
    });
  }

  deleteMediaRelation(mediaId: number, relationId: number): Promise<ApiResponse<void>> {
    return this.request(`/media/${mediaId}/related/${relationId}`, {
      method: "DELETE",
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
  
  reportIssue(data: { entity_type: string; entity_id: number; report_type: string; locale?: string; message?: string }): Promise<ApiResponse<void>> {
    return this.request("/reports", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getReports(): Promise<ApiResponse<any[]>> {
    return this.request("/reports");
  }
}

export const api = new ApiClient();