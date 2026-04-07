import { getDrizzle } from "./src/init";
import { mediaTable, seasonsTable, episodesTable, ratingsTable } from "./src/schema";
import { initializeDatabase } from "./src/init";

async function run() {
  await initializeDatabase();
  const drizzle = getDrizzle();

  console.log("Recalculating all aggregate scores...");

  // Update Media
  const mediaRatings = drizzle.query<{ entity_id: number, avgScore: number, count: number }>(
    "SELECT entity_id, avg(score) as avgScore, count(id) as count FROM ratings WHERE entity_type = 'media' GROUP BY entity_id"
  ).all();

  for (const r of mediaRatings) {
    const avg = Math.round(r.avgScore * 10) / 10;
    drizzle.update(mediaTable)
      .set({ score: avg, score_count: r.count } as any)
      .where("id = ?", [r.entity_id])
      .run();
    console.log(`Updated media ${r.entity_id}: ${avg} (${r.count} votes)`);
  }

  // Update Seasons
  const seasonRatings = drizzle.query<{ entity_id: number, avgScore: number, count: number }>(
    "SELECT entity_id, avg(score) as avgScore, count(id) as count FROM ratings WHERE entity_type = 'season' GROUP BY entity_id"
  ).all();

  for (const r of seasonRatings) {
    const avg = Math.round(r.avgScore * 10) / 10;
    drizzle.update(seasonsTable)
      .set({ score: avg, score_count: r.count } as any)
      .where("id = ?", [r.entity_id])
      .run();
    console.log(`Updated season ${r.entity_id}: ${avg} (${r.count} votes)`);
  }

  // Update Episodes
  const episodeRatings = drizzle.query<{ entity_id: number, avgScore: number, count: number }>(
    "SELECT entity_id, avg(score) as avgScore, count(id) as count FROM ratings WHERE entity_type = 'episode' GROUP BY entity_id"
  ).all();

  for (const r of episodeRatings) {
    const avg = Math.round(r.avgScore * 10) / 10;
    drizzle.update(episodesTable)
      .set({ score: avg, score_count: r.count } as any)
      .where("id = ?", [r.entity_id])
      .run();
    console.log(`Updated episode ${r.entity_id}: ${avg} (${r.count} votes)`);
  }

  console.log("Recalculation complete.");
  process.exit(0);
}

run();
