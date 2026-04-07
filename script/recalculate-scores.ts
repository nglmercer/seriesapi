import { getDrizzle, initializeDatabase } from "../src/init";
import { mediaTable, seasonsTable, episodesTable, ratingsTable } from "../src/schema";

interface AggregateRating {
  entity_id: number;
  avgScore: number;
  count: number;
}

async function run() {
  await initializeDatabase();
  const drizzle = getDrizzle();

  console.log("🚀 Starting recalculation of all aggregate scores...");

  const updateEntities = async (
    type: "media" | "season" | "episode",
    table: typeof mediaTable | typeof seasonsTable | typeof episodesTable
  ) => {
    console.log(`\n📦 Processing ${type} ratings...`);
    
    const results = drizzle.query<AggregateRating>(
      `SELECT entity_id, avg(score) as avgScore, count(id) as count 
       FROM ratings 
       WHERE entity_type = ? 
       GROUP BY entity_id`
    ).all([type]);

    let updatedCount = 0;
    for (const r of results) {
      const avg = Math.round(r.avgScore * 10) / 10;
      
      drizzle.update(table)
        .set({ score: avg, score_count: r.count })
        .where("id = ?", [r.entity_id])
        .run();
      
      updatedCount++;
      if (updatedCount % 10 === 0) {
        process.stdout.write(".");
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} ${type}(s)`);
  };

  try {
    await updateEntities("media", mediaTable);
    await updateEntities("season", seasonsTable);
    await updateEntities("episode", episodesTable);

    console.log("\n✨ Recalculation complete.");
  } catch (error) {
    console.error("\n❌ Recalculation failed:", error);
  } finally {
    process.exit(0);
  }
}

run();
