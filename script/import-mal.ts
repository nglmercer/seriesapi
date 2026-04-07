import malScraper  from "mal-scraper";
import type { 
  AnimeDataModel, 
  SearchResultsDataModel, 
  SeasonDataModel, 
  SeasonalDataModel 
} from "mal-scraper";
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
} from "../src/schema";
import { initializeDatabase, getDrizzle } from "../src/init";
import { toSlug } from "../migrations/utils";
import type { SqliteNapiAdapter } from "../src/core/driver";

/**
 * Script to import anime info from MyAnimeList into the database.
 * 
 * Subcommands:
 *   bun run import:mal single <name|url>
 *   bun run import:mal search <query> [limit]
 *   bun run import:mal season <year> <season> [type]
 */

class MalImporter {
  constructor(private drizzle: SqliteNapiAdapter) {}

  /**
   * Ensure lookup tables are seeded.
   */
  async seedLookups() {
    const types = this.drizzle.select(contentTypesTable).all();
    if (types.length === 0) {
      console.log("[mal] Seeding content types...");
      const defaultTypes = [
        { id: 1, slug: "movie", label: "Movie" },
        { id: 2, slug: "series", label: "Series" },
        { id: 3, slug: "anime", label: "Anime" },
        { id: 4, slug: "manga", label: "Manga" },
        { id: 5, slug: "ova", label: "OVA" },
        { id: 6, slug: "special", label: "Special" },
        { id: 7, slug: "ona", label: "ONA" },
      ];
      for (const t of defaultTypes) this.drizzle.insert(contentTypesTable).values(t).run();
    }

    const langs = this.drizzle.select(languagesTable).all();
    if (langs.length === 0) {
      console.log("[mal] Seeding languages...");
      const defaultLangs = [
        { id: 1, code: "en", name: "English", native_name: "English" },
        { id: 2, code: "es", name: "Spanish", native_name: "Español" },
        { id: 3, code: "ja", name: "Japanese", native_name: "日本語" },
        { id: 4, code: "pt", name: "Portuguese", native_name: "Português" },
      ];
      for (const l of defaultLangs) this.drizzle.insert(languagesTable).values(l).run();
    }
  }

  /**
   * Check if an anime exists in the DB.
   */
  async exists(malId: number): Promise<number | null> {
    const existing = this.drizzle.select(mediaTable)
      .where("external_ids LIKE ?", [`%"mal":${malId}%`])
      .get() as { id: number } | undefined;
    return existing?.id ?? null;
  }

  /**
   * Import a single anime by name or URL.
   */
  async importSingle(nameOrUrl: string): Promise<number | null> {
    console.log(`[mal] Fetching info for: ${nameOrUrl}...`);
    let malData: AnimeDataModel;
    try {
      if (nameOrUrl.startsWith("http")) {
        malData = await malScraper.getInfoFromURL(nameOrUrl);
      } else {
        malData = await malScraper.getInfoFromName(nameOrUrl);
      }
    } catch (err) {
      console.error(`[mal] Error fetching ${nameOrUrl}:`, err);
      return null;
    }

    if (!malData || !malData.id) {
      console.error(`[mal] No anime found for: ${nameOrUrl}`);
      return null;
    }

    const existingId = await this.exists(malData.id);
    if (existingId) {
      console.log(`[mal] Already exists: ${malData.title} (ID: ${existingId})`);
      return existingId;
    }

    return this.saveToDb(malData);
  }

  /**
   * Save a fully-fetched anime data model to the DB.
   */
  private async saveToDb(malData: AnimeDataModel): Promise<number> {
    const now = new Date().toISOString();
    const slug = toSlug(malData.title);

    // 1. Content type
    const animeType = this.drizzle.select(contentTypesTable)
      .where("slug = ?", ["anime"])
      .get() as { id: number } | undefined;
    const contentTypeId = animeType?.id ?? 3;

    // 2. Parse status
    let status = "unknown";
    if (malData.status?.toLowerCase().includes("finished")) status = "completed";
    else if (malData.status?.toLowerCase().includes("currently airing")) status = "ongoing";
    else if (malData.status?.toLowerCase().includes("not yet aired")) status = "upcoming";

    // 3. Parse dates
    let releaseDate = null;
    let endDate = null;
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
        const gSlug = toSlug(genreName);
        let genre = this.drizzle.select(genresTable).where("slug = ?", [gSlug]).get() as { id: number } | undefined;
        
        if (!genre) {
          const gRes = this.drizzle.insert(genresTable).values({ slug: gSlug }).run();
          const gId = Number(gRes.lastInsertRowid);
          this.drizzle.insert(genreTranslationsTable).values({
            genre_id: gId,
            locale: "en",
            name: genreName,
          }).run();
          genre = { id: gId };
        }

        const existingAss = this.drizzle.select(mediaGenresTable)
            .where("media_id = ? AND genre_id = ?", [mediaId, genre.id])
            .get();
        if (!existingAss) {
            this.drizzle.insert(mediaGenresTable).values({
                media_id: mediaId,
                genre_id: genre.id,
            }).run();
        }
      }
    }

    // 8. Studios
    if (malData.studios && Array.isArray(malData.studios)) {
      for (const studioName of malData.studios) {
        let studio = this.drizzle.select(studiosTable).where("name = ?", [studioName]).get() as { id: number } | undefined;
        
        if (!studio) {
          const sRes = this.drizzle.insert(studiosTable).values({ name: studioName }).run();
          studio = { id: Number(sRes.lastInsertRowid) };
        }

        const existingAss = this.drizzle.select(mediaStudiosTable)
            .where("media_id = ? AND studio_id = ?", [mediaId, studio.id])
            .get();
        if (!existingAss) {
            this.drizzle.insert(mediaStudiosTable).values({
                media_id: mediaId,
                studio_id: studio.id,
                is_main: 1,
            }).run();
        }
      }
    }

    console.log(`[mal] Indexed: ${malData.title} (Media ID: ${mediaId})`);
    return mediaId;
  }

  /**
   * Search and import top results.
   */
  async importSearch(query: string, limit: number = 5) {
    console.log(`[mal] Searching for: ${query} (limit ${limit})...`);
    const results: SearchResultsDataModel[] = await malScraper.getResultsFromSearch(query);
    
    const toImport = results.slice(0, limit);
    for (const res of toImport) {
      const malId = parseInt(res.id, 10);
      const existingId = await this.exists(malId);
      if (existingId) {
        console.log(`[mal] Skipping (already exists): ${res.name}`);
        continue;
      }
      await this.importSingle(res.name);
    }
  }

  /**
   * Import all anime from a specific season.
   */
  async importSeason(year: number, season: string, type?: string) {
    console.log(`[mal] Fetching season: ${year} ${season}...`);
    // Need to cast season string to valid Seasons type
    const seasonData: SeasonDataModel = await malScraper.getSeason(year, season as any, type as any);
    
    // SeasonDataModel has keys like TV, Movies, OVAs, etc.
    const allAnime: SeasonalDataModel[] = [];
    if (type) {
        // If type specified, seasonData is actually an array
        allAnime.push(...(seasonData as unknown as SeasonalDataModel[]));
    } else {
        // Otherwise it's an object with arrays
        const data = seasonData as Record<string, SeasonalDataModel[]>;
        if (data.TV) allAnime.push(...data.TV);
        if (data.Movies) allAnime.push(...data.Movies);
        if (data.OVAs) allAnime.push(...data.OVAs);
        if (data.ONAs) allAnime.push(...data.ONAs);
    }

    console.log(`[mal] Found ${allAnime.length} anime in this season.`);
    
    for (const anime of allAnime) {
      if (!anime.link) continue;
      // SeasonalDataModel doesn't have an ID, we use the link
      // Link looks like: https://myanimelist.net/anime/54595/Mushoku_Tensei_II__Isekai_Ittara_Honki_Dasu
      const idMatch = anime.link.match(/\/anime\/(\d+)/);
      if (idMatch) {
        const malId = parseInt(idMatch[1]!, 10);
        const existingId = await this.exists(malId);
        if (existingId) {
            console.log(`[mal] Skipping (already exists): ${anime.title}`);
            continue;
        }
      }
      // Import by URL to be precise
      await this.importSingle(anime.link!);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.error("Usage: bun run import:mal <single|search|season> [args...]");
    process.exit(1);
  }

  await initializeDatabase();
  const importer = new MalImporter(getDrizzle());
  await importer.seedLookups();

  try {
    switch (command) {
      case "single": {
        const target = args[1];
        if (!target) throw new Error("Missing name or URL");
        await importer.importSingle(target);
        break;
      }
      case "search": {
        const query = args[1];
        const limit = args[2] ? parseInt(args[2], 10) : 5;
        if (!query) throw new Error("Missing search query");
        await importer.importSearch(query, limit);
        break;
      }
      case "season": {
        const year = parseInt(args[1] || "0", 10);
        const season = args[2] || "";
        const type = args[3] || "";
        if (isNaN(year) || !season) throw new Error("Usage: season <year> <season> [type]");
        await importer.importSeason(year, season, type);
        break;
      }
      default:
        // Fallback for backward compatibility: if first arg is not a command, assume single
        await importer.importSingle(command);
        break;
    }
  } catch (err: any) {
    console.error(`[mal] Fatal error: ${err.message}`);
    process.exit(1);
  }

  console.log("[mal] Import finished.");
  process.exit(0);
}

main().catch(err => {
  console.error("[mal] Unexpected error:", err);
  process.exit(1);
});
