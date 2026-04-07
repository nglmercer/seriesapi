import { initializeDatabase, getDrizzle } from "../src/init";
import { DbManager } from "./lib/db-manager";
import { MalService } from "./lib/mal-service";

/**
 * Script to import anime info from MyAnimeList into the database.
 * 
 * Subcommands:
 *   bun run import:mal single <name|url>
 *   bun run import:mal search <query> [limit]
 *   bun run import:mal season <year> <season> [type]
 *   bun run import:mal bulk <name1,name2,id1,id2...>
 */

class MalImporter {
  // Track already processed MAL IDs in this session to avoid redundant work
  private processedMalIds = new Set<number>();

  constructor(
    private dbManager: DbManager,
    private malService: MalService
  ) {}

  /**
   * Import a single anime by name, URL, or MAL ID.
   */
  async importSingle(target: string | number): Promise<number | null> {
    const targetStr = target.toString();
    const isUrl = targetStr.startsWith("http");
    const isId = !isNaN(Number(targetStr)) && !isUrl;
    
    // If it's a MAL ID, check if we already have it in DB before fetching
    if (isId) {
        const malId = Number(targetStr);
        if (this.processedMalIds.has(malId)) {
            console.log(`[mal] Already processed in this session: MAL ID ${malId}`);
            return null;
        }
        const existingId = await this.dbManager.getMediaIdByMalId(malId);
        if (existingId) {
            console.log(`[mal] Already exists in DB: MAL ID ${malId} (Media ID: ${existingId})`);
            this.processedMalIds.add(malId);
            return existingId;
        }
    }

    // Fetch data
    let malData;
    if (isId) {
        // mal-scraper's getInfoFromURL also handles IDs if passed correctly, 
        // but it's safer to construct the URL or use search if needed.
        // Actually getInfoFromURL works with just the ID if we provide the base URL.
        malData = await this.malService.fetchInfo(`https://myanimelist.net/anime/${targetStr}`);
    } else {
        malData = await this.malService.fetchInfo(targetStr);
    }
    
    if (!malData || !malData.id) {
      console.error(`[mal] No anime found for: ${targetStr}`);
      return null;
    }

    if (this.processedMalIds.has(malData.id)) {
      console.log(`[mal] Already processed in this session: ${malData.title}`);
      return null;
    }

    const existingId = await this.dbManager.getMediaIdByMalId(malData.id);
    if (existingId) {
      console.log(`[mal] Already exists in DB: ${malData.title} (ID: ${existingId})`);
      this.processedMalIds.add(malData.id);
      return existingId;
    }

    console.log(`[mal] Indexing: ${malData.title}...`);
    const mediaId = await this.dbManager.saveMedia(malData);
    
    this.processedMalIds.add(malData.id);
    console.log(`[mal] Indexed: ${malData.title} (Media ID: ${mediaId})`);
    return mediaId;
  }

  /**
   * Import from an array of strings or numbers.
   */
  async importBatch(targets: (string | number)[]): Promise<void> {
    console.log(`[mal] Batch importing ${targets.length} items...`);
    for (const target of targets) {
        await this.importSingle(target);
    }
  }

  /**
   * Search and import top results.
   */
  async importSearch(query: string, limit: number = 5): Promise<void> {
    console.log(`[mal] Searching for: ${query} (limit ${limit})...`);
    const results = await this.malService.search(query, limit);
    
    for (const res of results) {
      const malId = parseInt(res.id, 10);
      
      if (this.processedMalIds.has(malId)) {
        console.log(`[mal] Skipping (already processed): ${res.name}`);
        continue;
      }

      const existingId = await this.dbManager.getMediaIdByMalId(malId);
      if (existingId) {
        console.log(`[mal] Skipping (already exists): ${res.name}`);
        this.processedMalIds.add(malId);
        continue;
      }
      
      await this.importSingle(res.name);
    }
  }

  /**
   * Import all anime from a specific season.
   */
  async importSeason(year: number, season: string, type?: string): Promise<void> {
    console.log(`[mal] Fetching season: ${year} ${season}...`);
    const allAnime = await this.malService.fetchSeason(year, season, type);

    console.log(`[mal] Found ${allAnime.length} anime in this season.`);
    
    for (const anime of allAnime) {
      if (!anime.link) continue;

      const idMatch = anime.link.match(/\/anime\/(\d+)/);
      if (idMatch) {
        const malId = parseInt(idMatch[1]!, 10);
        if (this.processedMalIds.has(malId)) {
            console.log(`[mal] Skipping (already processed): ${anime.title}`);
            continue;
        }
        const existingId = await this.dbManager.getMediaIdByMalId(malId);
        if (existingId) {
            console.log(`[mal] Skipping (already exists): ${anime.title}`);
            this.processedMalIds.add(malId);
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
    console.error("Usage: bun run import:mal <single|search|season|bulk> [args...]");
    process.exit(1);
  }

  await initializeDatabase();
  const drizzle = getDrizzle();
  
  const dbManager = new DbManager(drizzle);
  const malService = new MalService();

  // Load existing lookups and initialize caches
  await dbManager.initCaches();
  await dbManager.seedLookups();

  const importer = new MalImporter(dbManager, malService);

  try {
    switch (command) {
      case "single": {
        const target = args[1];
        if (!target) throw new Error("Missing name, URL, or ID");
        await importer.importSingle(target);
        break;
      }
      case "bulk": {
        const input = args[1];
        if (!input) throw new Error("Missing comma-separated list of targets");
        const targets = input.split(",").map(t => {
            const trimmed = t.trim();
            return isNaN(Number(trimmed)) ? trimmed : Number(trimmed);
        });
        await importer.importBatch(targets);
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
