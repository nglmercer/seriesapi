import { describe, it, expect } from "bun:test";
import { handleEpisodeDetail, handleEpisodeCredits, handleEpisodeImages, handleEpisodeComments } from "../../src/api/routes/episodes";
import { handleMediaList, handleMediaDetail, handleMediaSeasons, handleMediaEpisodes, handleMediaCredits, handleMediaVideos, handleMediaRelated, handleMediaImages, handleMediaComments } from "../../src/api/routes/media";
import { handlePeopleList, handlePersonDetail, handlePersonCredits } from "../../src/api/routes/people";
import { handleSearch } from "../../src/api/routes/search";
import { handleSeasonDetail, handleSeasonEpisodes, handleSeasonImages } from "../../src/api/routes/seasons";
import { Database } from "sqlite-napi";

import { sqliteNapi } from "../../src/core/driver";
import { ApiContext } from "../../src/api/context";

// A dummy db that throws on any query
const failingDb = {
  query: () => {
    throw new Error("Simulated DB Error");
  },
  run: () => {
    throw new Error("Simulated DB Error");
  }
} as unknown as Database;

const failingDrizzle = sqliteNapi(failingDb);

describe("Error Handling in Routes", () => {
  const req = new Request("http://localhost/");

  it("should handle errors in episodes routes", () => {
    const ctx = new ApiContext(req, failingDrizzle, failingDb);
    expect(handleEpisodeDetail(ctx, 1).status).toBe(500);
    expect(handleEpisodeCredits(ctx, 1).status).toBe(500);
    expect(handleEpisodeImages(ctx, 1).status).toBe(500);
    expect(handleEpisodeComments(ctx, 1).status).toBe(500);
  });

  it("should handle errors in media routes", () => {
    const ctx = new ApiContext(req, failingDrizzle, failingDb);
    expect(handleMediaList(ctx).status).toBe(500);
    expect(handleMediaDetail(ctx, 1).status).toBe(500);
    expect(handleMediaSeasons(ctx, 1).status).toBe(500);
    expect(handleMediaEpisodes(ctx, 1).status).toBe(500);
    expect(handleMediaCredits(ctx, 1).status).toBe(500);
    expect(handleMediaVideos(ctx, 1).status).toBe(500);
    expect(handleMediaRelated(ctx, 1).status).toBe(500);
    expect(handleMediaImages(ctx, 1).status).toBe(500);
    expect(handleMediaComments(ctx, 1).status).toBe(500);
  });

  it("should handle errors in people routes", () => {
    const ctx = new ApiContext(req, failingDrizzle, failingDb);
    expect(handlePeopleList(ctx).status).toBe(500);
    expect(handlePersonDetail(ctx, 1).status).toBe(500);
    expect(handlePersonCredits(ctx, 1).status).toBe(500);
  });

  it("should handle errors in search routes", () => {
    const searchReq = new Request("http://localhost/?q=test");
    const ctx = new ApiContext(searchReq, failingDrizzle, failingDb);
    expect(handleSearch(ctx).status).toBe(500);
  });

  it("should handle errors in seasons routes", () => {
    const ctx = new ApiContext(req, failingDrizzle, failingDb);
    expect(handleSeasonDetail(ctx, 1).status).toBe(500);
    expect(handleSeasonEpisodes(ctx, 1).status).toBe(500);
    expect(handleSeasonImages(ctx, 1).status).toBe(500);
  });
});


