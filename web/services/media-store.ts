import { type MediaItem, type Genres } from "./api-service";
import i18next from "../utils/i18n";

type MediaListener = (items: MediaItem[]) => void;
type MediaDetailListener = (item: MediaItem | null) => void;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MediaStore {
  private listCache: Map<string, CacheEntry<MediaItem[]>> = new Map();
  private detailCache: Map<number, CacheEntry<MediaItem>> = new Map();
  private listListeners: Map<string, Set<MediaListener>> = new Map();
  private detailListeners: Map<number, Set<MediaDetailListener>> = new Map();
  private pendingFetches: Map<string, Promise<unknown>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  private getLocale(): string {
    return i18next.language || "es";
  }

  private getListKey(page: number, pageSize: number, filters?: Record<string, string>): string {
    return `${page}-${pageSize}-${JSON.stringify(filters || {})}-${this.getLocale()}`;
  }

  subscribeList(page: number, pageSize: number, filters: Record<string, string> = {}, fn: MediaListener): () => void {
    const key = this.getListKey(page, pageSize, filters);
    if (!this.listListeners.has(key)) {
      this.listListeners.set(key, new Set());
    }
    this.listListeners.get(key)!.add(fn);
    
    return () => {
      this.listListeners.get(key)?.delete(fn);
    };
  }

  subscribeDetail(id: number, fn: MediaDetailListener): () => void {
    if (!this.detailListeners.has(id)) {
      this.detailListeners.set(id, new Set());
    }
    this.detailListeners.get(id)!.add(fn);
    
    return () => {
      this.detailListeners.get(id)?.delete(fn);
    };
  }

  private notifyList(page: number, pageSize: number, filters: Record<string, string> = {}) {
    const key = this.getListKey(page, pageSize, filters);
    const cached = this.listCache.get(key);
    const listeners = this.listListeners.get(key);
    if (listeners && cached) {
      const data = Date.now() - cached.timestamp < this.CACHE_TTL ? cached.data : [];
      listeners.forEach(fn => fn(data));
    }
  }

  private notifyDetail(id: number) {
    const cached = this.detailCache.get(id);
    const listeners = this.detailListeners.get(id);
    if (listeners && cached) {
      const data = Date.now() - cached.timestamp < this.CACHE_TTL ? cached.data : null;
      listeners.forEach(fn => fn(data));
    }
  }

  getCachedList(page: number, pageSize: number, filters: Record<string, string> = {}): MediaItem[] | null {
    const key = this.getListKey(page, pageSize, filters);
    const cached = this.listCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  getCachedDetail(id: number): MediaItem | null {
    const cached = this.detailCache.get(id);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  async fetchList(page: number, pageSize: number, filters: Record<string, string> = {}): Promise<MediaItem[]> {
    const key = this.getListKey(page, pageSize, filters);
    
    if (this.pendingFetches.has(key)) {
      return (await this.pendingFetches.get(key)) as MediaItem[];
    }

    const cached = this.listCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const fetchPromise = (async () => {
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), locale: this.getLocale() });
        Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
        const res = await fetch(`/api/v1/media?${params}`);
        const json = await res.json();
        if (json.ok && json.data) {
          this.listCache.set(key, { data: json.data, timestamp: Date.now() });
          this.notifyList(page, pageSize, filters);
          return json.data;
        }
      } catch (err) {
        console.error("[media-store] fetchList error:", err);
      } finally {
        this.pendingFetches.delete(key);
      }
      return [];
    })();

    this.pendingFetches.set(key, fetchPromise);
    return fetchPromise;
  }

  async fetchDetail(id: number): Promise<MediaItem | null> {
    const cacheKey = `detail-${id}`;
    
    if (this.pendingFetches.has(cacheKey)) {
      return (await this.pendingFetches.get(cacheKey)) as MediaItem | null;
    }

    const cached = this.detailCache.get(id);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const fetchPromise = (async () => {
      try {
        const res = await fetch(`/api/v1/media/${id}?locale=${this.getLocale()}`);
        const json = await res.json();
        if (json.ok && json.data) {
          this.detailCache.set(id, { data: json.data, timestamp: Date.now() });
          this.notifyDetail(id);
          return json.data;
        }
      } catch (err) {
        console.error("[media-store] fetchDetail error:", err);
      } finally {
        this.pendingFetches.delete(cacheKey);
      }
      return null;
    })();

    this.pendingFetches.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  invalidateList(page?: number, pageSize?: number, filters?: Record<string, string>) {
    if (page !== undefined) {
      const key = this.getListKey(page, pageSize || 20, filters || {});
      this.listCache.delete(key);
      this.notifyList(page, pageSize || 20, filters || {});
    } else {
      this.listCache.clear();
    }
  }

  invalidateDetail(id: number) {
    this.detailCache.delete(id);
    this.notifyDetail(id);
  }
}

export const mediaStore = new MediaStore();