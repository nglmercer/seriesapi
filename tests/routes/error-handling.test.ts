import { describe, it, expect } from "bun:test";
import { handleEpisodeDetail, handleEpisodeCredits, handleEpisodeImages, handleEpisodeComments } from "../../src/api/routes/episodes";
import { handleMediaList, handleMediaDetail, handleMediaSeasons, handleMediaEpisodes, handleMediaCredits, handleMediaVideos, handleMediaRelated, handleMediaImages, handleMediaComments } from "../../src/api/routes/media";
import { handlePeopleList, handlePersonDetail, handlePersonCredits } from "../../src/api/routes/people";
import { handleSearch } from "../../src/api/routes/search";
import { handleSeasonDetail, handleSeasonEpisodes, handleSeasonImages } from "../../src/api/routes/seasons";
import { Database } from "sqlite-napi";

import { sqliteNapi } from "../../src/core/driver";
import { mock } from "bun:test";

// A dummy db that throws on any query
const failingDb = {
  query: () => {
    throw new Error("Simulated DB Error");
  },
  run: () => {
    throw new Error("Simulated DB Error");
  }
} as unknown as Database;

mock.module("../../src/init", () => {
  return {
    getDrizzle: () => sqliteNapi(failingDb)
  }
});

describe("Error Handling in Routes", () => {
  const req = new Request("http://localhost/");

  it("should handle errors in episodes routes", () => {
    expect(handleEpisodeDetail(req, failingDb, 1).status).toBe(500);
    expect(handleEpisodeCredits(req, failingDb, 1).status).toBe(500);
    expect(handleEpisodeImages(req, failingDb, 1).status).toBe(500);
    expect(handleEpisodeComments(req, failingDb, 1).status).toBe(500);
  });

  it("should handle errors in media routes", () => {
    expect(handleMediaList(req, failingDb).status).toBe(500);
    expect(handleMediaDetail(req, failingDb, 1).status).toBe(500);
    expect(handleMediaSeasons(req, failingDb, 1).status).toBe(500);
    expect(handleMediaEpisodes(req, failingDb, 1).status).toBe(500);
    expect(handleMediaCredits(req, failingDb, 1).status).toBe(500);
    expect(handleMediaVideos(req, failingDb, 1).status).toBe(500);
    expect(handleMediaRelated(req, failingDb, 1).status).toBe(500);
    expect(handleMediaImages(req, failingDb, 1).status).toBe(500);
    expect(handleMediaComments(req, failingDb, 1).status).toBe(500);
  });

  it("should handle errors in people routes", () => {
    expect(handlePeopleList(req, failingDb).status).toBe(500);
    expect(handlePersonDetail(req, failingDb, 1).status).toBe(500);
    expect(handlePersonCredits(req, failingDb, 1).status).toBe(500);
  });

  it("should handle errors in search routes", () => {
    const searchReq = new Request("http://localhost/?q=test");
    expect(handleSearch(searchReq, failingDb).status).toBe(500);
  });

  it("should handle errors in seasons routes", () => {
    expect(handleSeasonDetail(req, failingDb, 1).status).toBe(500);
    expect(handleSeasonEpisodes(req, failingDb, 1).status).toBe(500);
    expect(handleSeasonImages(req, failingDb, 1).status).toBe(500);
  });
});
