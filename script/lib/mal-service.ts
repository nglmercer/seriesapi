import malScraper from "mal-scraper";
import type {
  AnimeDataModel,
  SearchResultsDataModel,
  SeasonDataModel,
  SeasonalDataModel
} from "mal-scraper";

export class MalService {
  private headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  };

  /**
   * Set session cookies to bypass CAPTCHA or access restricted content.
   * Can accept a full cookie string or individual values.
   */
  setCookie(cookie: string | undefined) {
    if (cookie) {
      if (this.headers['Cookie']) {
        this.headers['Cookie'] += `; ${cookie}`;
      } else {
        this.headers['Cookie'] = cookie;
      }
    }
  }

  /**
   * Add a specific header (e.g. from LocalStorage or other browser requirements).
   */
  setHeader(key: string, value: string) {
    this.headers[key] = value;
  }

  /**
   * Fetch full info for an anime by name or URL.
   */
  async fetchInfo(nameOrUrl: string): Promise<AnimeDataModel | null> {
    try {
      // NOTE: mal-scraper might not use the custom headers.
      // If it fails, we should ideally use fetch with our headers and then parse.
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
   * A more powerful fetcher that uses the provided headers.
   * This is a fallback in case mal-scraper is blocked.
   */
  async fetchRaw(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: this.headers
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (err) {
      console.error(`[mal] Raw fetch failed for ${url}:`, err);
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
