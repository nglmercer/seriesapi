import { 
  mediaTable, 
  mediaTranslationsTable, 
  imagesTable, 
  genresTable, 
  mediaGenresTable,
  genreTranslationsTable,
  studiosTable,
  mediaStudiosTable,
  contentTypesTable,
  languagesTable
} from "../../src/schema";
import type { SqliteNapiAdapter } from "../../src/core/driver";
import type { InferRow } from "../../src/core/table";
import { toSlug } from "../../migrations/utils";
import type { AnimeDataModel } from "mal-scraper";

type MediaRow = InferRow<typeof mediaTable>;
type GenreRow = InferRow<typeof genresTable>;
type StudioRow = InferRow<typeof studiosTable>;
type ContentTypeRow = InferRow<typeof contentTypesTable>;
type LanguageRow = InferRow<typeof languagesTable>;

export class DbManager {
  private genreCache = new Map<string, number>();
  private studioCache = new Map<string, number>();
  private contentTypeCache = new Map<string, number>();
  private languageCache = new Map<string, number>();

  constructor(private drizzle: SqliteNapiAdapter) {}

  /**
   * Initialize caches from DB to avoid redundant lookups.
   */
  async initCaches(): Promise<void> {
    const genres = this.drizzle.select(genresTable).all() as GenreRow[];
    for (const g of genres) {
        if (g.id !== undefined) this.genreCache.set(g.slug, g.id);
    }

    const studios = this.drizzle.select(studiosTable).all() as StudioRow[];
    for (const s of studios) {
        if (s.id !== undefined) this.studioCache.set(s.name, s.id);
    }

    const types = this.drizzle.select(contentTypesTable).all() as ContentTypeRow[];
    for (const t of types) {
        if (t.id !== undefined) this.contentTypeCache.set(t.slug, t.id);
    }

    const langs = this.drizzle.select(languagesTable).all() as LanguageRow[];
    for (const l of langs) {
        if (l.id !== undefined) this.languageCache.set(l.code, l.id);
    }
  }

  /**
   * Ensure lookup tables are seeded.
   */
  async seedLookups(): Promise<void> {
    if (this.contentTypeCache.size === 0) {
      console.log("[db] Seeding content types...");
      const defaultTypes = [
        { id: 1, slug: "movie", label: "Movie" },
        { id: 2, slug: "series", label: "Series" },
        { id: 3, slug: "anime", label: "Anime" },
        { id: 4, slug: "manga", label: "Manga" },
        { id: 5, slug: "ova", label: "OVA" },
        { id: 6, slug: "special", label: "Special" },
        { id: 7, slug: "ona", label: "ONA" },
      ];
      for (const t of defaultTypes) {
        this.drizzle.insert(contentTypesTable).values(t).run();
        this.contentTypeCache.set(t.slug, t.id);
      }
    }

    if (this.languageCache.size === 0) {
      console.log("[db] Seeding languages...");
      const defaultLangs = [
        { id: 1, code: "en", name: "English", native_name: "English" },
        { id: 2, code: "es", name: "Spanish", native_name: "Español" },
        { id: 3, code: "ja", name: "Japanese", native_name: "日本語" },
        { id: 4, code: "pt", name: "Portuguese", native_name: "Português" },
      ];
      for (const l of defaultLangs) {
        this.drizzle.insert(languagesTable).values(l).run();
        this.languageCache.set(l.code, l.id);
      }
    }
  }

  /**
   * Check if an anime exists in the DB by MAL ID.
   */
  async getMediaIdByMalId(malId: number): Promise<number | null> {
    // Using json_extract for more robust JSON querying in SQLite
    const existing = this.drizzle.select(mediaTable)
      .where("json_extract(external_ids, '$.mal') = ?", [malId])
      .get() as MediaRow | undefined;
    return existing?.id ?? null;
  }

  /**
   * Get or create a genre by name.
   */
  async getOrCreateGenre(name: string): Promise<number> {
    const slug = toSlug(name);
    const cachedId = this.genreCache.get(slug);
    if (cachedId !== undefined) return cachedId;

    const res = this.drizzle.insert(genresTable).values({ slug }).run();
    const id = Number(res.lastInsertRowid);
    
    this.drizzle.insert(genreTranslationsTable).values({
      genre_id: id,
      locale: "en",
      name,
    }).run();

    this.genreCache.set(slug, id);
    return id;
  }

  /**
   * Get or create a studio by name.
   */
  async getOrCreateStudio(name: string): Promise<number> {
    const cachedId = this.studioCache.get(name);
    if (cachedId !== undefined) return cachedId;

    const res = this.drizzle.insert(studiosTable).values({ name }).run();
    const id = Number(res.lastInsertRowid);
    
    this.studioCache.set(name, id);
    return id;
  }

  /**
   * Save a fully-fetched anime data model to the DB.
   */
  async saveMedia(malData: AnimeDataModel): Promise<number> {
    const now = new Date().toISOString();
    const slug = toSlug(malData.title);

    // 1. Content type
    const contentTypeId = this.contentTypeCache.get("anime") ?? 3;

    // 2. Parse status
    let status = "unknown";
    if (malData.status?.toLowerCase().includes("finished")) status = "completed";
    else if (malData.status?.toLowerCase().includes("currently airing")) status = "ongoing";
    else if (malData.status?.toLowerCase().includes("not yet aired")) status = "upcoming";

    // 3. Parse dates
    let releaseDate: string | null = null;
    let endDate: string | null = null;
    if (malData.aired) {
      const dates = malData.aired.split(" to ");
      if (dates[0]) {
        try { releaseDate = new Date(dates[0]).toISOString().split('T')[0]; } catch {}
      }
      if (dates[1] && dates[1] !== "?") {
        try { endDate = new Date(dates[1]).toISOString().split('T')[0]; } catch {}
      }
    }

    // 4. Insert Media
    const res = this.drizzle.insert(mediaTable).values({
      content_type_id: contentTypeId,
      slug: `${slug}-${malData.id}`,
      original_title: malData.title,
      original_language: "ja",
      status,
      release_date: releaseDate,
      end_date: endDate,
      runtime_minutes: parseInt(malData.duration?.match(/\d+/)?.[0] ?? "0", 10),
      total_episodes: parseInt(malData.episodes ?? "0", 10),
      score: parseFloat(malData.score ?? "0"),
      popularity: parseFloat(malData.popularity?.match(/\d+/)?.[0] ?? "0"),
      age_rating: malData.rating,
      external_ids: JSON.stringify({ mal: malData.id }),
      created_at: now,
      updated_at: now,
    }).run();

    const mediaId = Number(res.lastInsertRowid);

    // 5. Translations
    this.drizzle.insert(mediaTranslationsTable).values({
      media_id: mediaId,
      locale: "en",
      title: malData.title,
      synopsis: malData.synopsis ?? null,
      synopsis_short: malData.synopsis?.substring(0, 280) ?? null,
    }).run();

    // 6. Image
    if (malData.picture) {
      this.drizzle.insert(imagesTable).values({
        entity_type: "media",
        entity_id: mediaId,
        image_type: "poster",
        url: malData.picture,
        is_primary: 1,
        source: "mal",
        source_id: malData.id.toString(),
        created_at: now,
      }).run();
    }

    // 7. Genres
    if (malData.genres && Array.isArray(malData.genres)) {
      for (const genreName of malData.genres) {
        const genreId = await this.getOrCreateGenre(genreName);
        this.drizzle.insert(mediaGenresTable).values({
          media_id: mediaId,
          genre_id: genreId,
        }).run();
      }
    }

    // 8. Studios
    if (malData.studios && Array.isArray(malData.studios)) {
      for (const studioName of malData.studios) {
        const studioId = await this.getOrCreateStudio(studioName);
        this.drizzle.insert(mediaStudiosTable).values({
          media_id: mediaId,
          studio_id: studioId,
          is_main: 1,
        }).run();
      }
    }

    return mediaId;
  }
}
