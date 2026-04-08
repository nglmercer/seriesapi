import { initializeDatabase, getDrizzle } from "../src/init";
import { DbManager } from "./lib/db-manager";
import { MalService } from "./lib/mal-service";
import fs from "fs";
import path from "path";

/**
 * Script to import anime info from MyAnimeList into the database.
 * 
 * Subcommands:
 *   bun run import:mal single <name|url>
 *   bun run import:mal search <query> [limit]
 *   bun run import:mal season <year> <season> [type]
 *   bun run import:mal bulk <name1,name2,id1,id2...>
 *   bun run import:mal bulk-file <path_to_txt_file>
 */

class MalImporter {
  // Track already processed MAL IDs in this session to avoid redundant work
  private processedMalIds = new Set<number>();
  private results = {
    success: [] as string[],
    skipped: [] as string[],
    failed: [] as string[]
  };

  constructor(
    private dbManager: DbManager,
    private malService: MalService
  ) {}

  /**
   * Import a single anime by name, URL, or MAL ID.
   */
  async importSingle(target: string | number, silent = false): Promise<number | null> {
    const targetStr = target.toString();

    try {
      // Add a small delay to avoid rate limiting/CAPTCHAs
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));

      // Fetch data
      const malData = await this.malService.fetchInfo(targetStr);
      
      if (!malData || !malData.id) {
        if (!silent) {
          console.error(`[mal] No anime found for: ${targetStr}.`);
          console.error(`[mal] If you are hitting a CAPTCHA, try passing --cookie "MALSession=your_session_id"`);
        }
        this.results.failed.push(targetStr);
        return null;
      }

      const title = malData.title || targetStr;

      if (this.processedMalIds.has(malData.id)) {
        if (!silent) console.log(`[mal] Already processed in this session: ${title}`);
        this.results.skipped.push(title);
        return null;
      }

      const existingId = await this.dbManager.getMediaIdByMalId(malData.id);
      if (existingId) {
        if (!silent) console.log(`[mal] Already exists in DB: ${title} (ID: ${existingId})`);
        this.processedMalIds.add(malData.id);
        this.results.skipped.push(title);
        return existingId;
      }

      if (!silent) console.log(`[mal] Indexing: ${title}...`);
      const mediaId = await this.dbManager.saveMedia(malData);
      
      this.processedMalIds.add(malData.id);
      if (!silent) console.log(`[mal] Indexed: ${title} (Media ID: ${mediaId})`);
      this.results.success.push(title);
      return mediaId;
    } catch (err: any) {
      if (!silent) console.error(`[mal] Error importing ${targetStr}: ${err.message}`);
      this.results.failed.push(targetStr);
      return null;
    }
  }

  /**
   * Import from an array of strings or numbers with concurrency control.
   */
  async importBatch(targets: (string | number)[], concurrency = 3): Promise<void> {
    console.log(`[mal] Batch importing ${targets.length} items (concurrency: ${concurrency})...`);
    
    const total = targets.length;
    let current = 0;

    const worker = async (target: string | number) => {
      const index = ++current;
      const targetStr = target.toString().length > 30 
        ? target.toString().substring(0, 27) + "..." 
        : target.toString();
      
      console.log(`[mal] [${index}/${total}] Processing: ${targetStr}`);
      await this.importSingle(target, true);
    };

    // Simple concurrency pool
    const pool: Promise<void>[] = [];
    for (const target of targets) {
      const p = worker(target).then(() => {
        pool.splice(pool.indexOf(p), 1);
      });
      pool.push(p);
      if (pool.length >= concurrency) {
        await Promise.race(pool);
      }
    }
    await Promise.all(pool);

    this.printSummary();
  }

  private printSummary() {
    console.log("\n" + "=".repeat(40));
    console.log("IMPORT SUMMARY");
    console.log("=".repeat(40));
    console.log(`✅ Success: ${this.results.success.length}`);
    console.log(`⏭️  Skipped: ${this.results.skipped.length}`);
    console.log(`❌ Failed:  ${this.results.failed.length}`);
    
    if (this.results.failed.length > 0) {
      console.log("\nFailed items:");
      this.results.failed.forEach(f => console.log(` - ${f}`));
    }
    console.log("=".repeat(40) + "\n");
  }

  /**
   * Search and import top results.
   */
  async importSearch(query: string, limit: number = 20): Promise<void> {
    const results = await this.malService.search(query, limit);
    console.log(`[mal] Searching for: ${query} (limit ${limit})...`, results);
    
    if (results.length === 0) {
      console.log("[mal] No results found.");
      return;
    }

    const targets = results.map(res => res.name);
    await this.importBatch(targets, 3); // Search results are often related, process one by one
  }

  /**
   * Import all anime from a specific season.
   */
  async importSeason(year: number, season: string, type?: string): Promise<void> {
    console.log(`[mal] Fetching season: ${year} ${season}...`);
    const allAnime = await this.malService.fetchSeason(year, season, type);

    console.log(`[mal] Found ${allAnime.length} anime in this season.`);
    
    const targets = allAnime
      .filter(a => !!a.link)
      .map(a => a.link!);

    await this.importBatch(targets, 3);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Basic flag parsing
  const cookies: string[] = [];
  if (process.env.MAL_COOKIE) cookies.push(process.env.MAL_COOKIE);
  let userAgent: string | undefined = process.env.MAL_USER_AGENT;
  const headers: Record<string, string> = {};
  const filteredArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--cookie" && i + 1 < args.length) {
      cookies.push(args[i + 1]!);
      i++;
    } else if (arg === "--user-agent" && i + 1 < args.length) {
      userAgent = args[i + 1]!;
      i++;
    } else if (arg === "--header" && i + 1 < args.length) {
      const h = args[i + 1]!;
      const colonIndex = h.indexOf(":");
      if (colonIndex !== -1) {
        const key = h.substring(0, colonIndex).trim();
        const value = h.substring(colonIndex + 1).trim();
        headers[key] = value;
      }
      i++;
    } else {
      filteredArgs.push(arg);
    }
  }

  const command = filteredArgs[0] as string | undefined;

  if (!command) {
    console.error("Usage: bun run import:mal <single|search|season|bulk> [args...] [--cookie \"...\"] [--user-agent \"...\"] [--header \"Key: Value\"]");
    process.exit(1);
  }

  await initializeDatabase();
  const drizzle = getDrizzle();
  
  const dbManager = new DbManager(drizzle);
  const malService = new MalService();

  for (const c of cookies) {
    malService.setCookie(c);
  }
  if (userAgent) {
    console.log(`[mal] Using custom User-Agent: ${userAgent}`);
    malService.setHeader("User-Agent", userAgent);
  }
  for (const [key, value] of Object.entries(headers)) {
    console.log(`[mal] Using custom header: ${key}`);
    malService.setHeader(key, value);
  }

  if (cookies.length > 0) {
    console.log(`[mal] Using ${cookies.length} cookie entries.`);
  }

  // Load existing lookups and initialize caches
  await dbManager.initCaches();
  await dbManager.seedLookups();

  const importer = new MalImporter(dbManager, malService);

  try {
    switch (command) {
      case "single": {
        const target = filteredArgs[1] as string | undefined;
        if (!target) throw new Error("Missing name, URL, or ID");
        await importer.importSingle(target);
        break;
      }
      case "bulk": {
        const input = filteredArgs[1] as string | undefined;
        if (!input) throw new Error("Missing comma-separated list of targets");
        const inputs = input.split(",").map(t => t.trim()).filter(Boolean);
        
        console.log(`[mal] Bulk processing ${inputs.length} search queries sequentially...`);
        for (const t of inputs) {
          console.log(`[mal] Processing search for: ${t}`);
          await importer.importSearch(t);
        }
        break;
      }
      case "search": {
        const query = filteredArgs[1] as string | undefined;
        const limit = filteredArgs[2] ? parseInt(filteredArgs[2], 10) : 5;
        if (!query) throw new Error("Missing search query");
        await importer.importSearch(query, limit);
        break;
      }
      case "season": {
        const year = parseInt(filteredArgs[1] || "0", 10);
        const season = filteredArgs[2] || "";
        const type = filteredArgs[3] || "";
        if (isNaN(year) || !season) throw new Error("Usage: season <year> <season> [type]");
        await importer.importSeason(year, season, type);
        break;
      }
      default:
        // Fallback for backward compatibility: if first arg is not a command, assume single
        await importer.importSingle(command as string);
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
