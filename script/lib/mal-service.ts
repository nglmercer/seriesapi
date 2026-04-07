import malScraper from "mal-scraper";
import type { 
  AnimeDataModel, 
  SearchResultsDataModel, 
  SeasonDataModel, 
  SeasonalDataModel 
} from "mal-scraper";

export class MalService {
  /**
   * Fetch full info for an anime by name or URL.
   */
  async fetchInfo(nameOrUrl: string): Promise<AnimeDataModel | null> {
    try {
      if (nameOrUrl.startsWith("http")) {
        return await malScraper.getInfoFromURL(nameOrUrl);
      } else {
        return await malScraper.getInfoFromName(nameOrUrl);
      }
    } catch (err) {
      console.error(`[mal] Error fetching ${nameOrUrl}:`, err);
      return null;
    }
  }

  /**
   * Search for anime and return top results.
   */
  async search(query: string, limit: number = 5): Promise<SearchResultsDataModel[]> {
    try {
      const results: SearchResultsDataModel[] = await malScraper.getResultsFromSearch(query);
      return results.slice(0, limit);
    } catch (err) {
      console.error(`[mal] Error searching for ${query}:`, err);
      return [];
    }
  }

  /**
   * Fetch all anime from a specific season.
   */
  async fetchSeason(year: number, season: string, type?: string): Promise<SeasonalDataModel[]> {
    try {
      const seasonData: SeasonDataModel = await malScraper.getSeason(year, season as any, type as any);
      const allAnime: SeasonalDataModel[] = [];
      
      if (type) {
        allAnime.push(...(seasonData as unknown as SeasonalDataModel[]));
      } else {
        const data = seasonData as Record<string, SeasonalDataModel[]>;
        if (data.TV) allAnime.push(...data.TV);
        if (data.Movies) allAnime.push(...data.Movies);
        if (data.OVAs) allAnime.push(...data.OVAs);
        if (data.ONAs) allAnime.push(...data.ONAs);
      }
      return allAnime;
    } catch (err) {
      console.error(`[mal] Error fetching season ${year} ${season}:`, err);
      return [];
    }
  }
}
