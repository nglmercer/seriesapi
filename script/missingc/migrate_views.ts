import { Database } from "sqlite-napi";

const db = new Database("anima.db");

console.log("Applying migrations for view_count...");

try {
  db.run("ALTER TABLE media ADD COLUMN view_count INTEGER DEFAULT 0;");
  console.log("Added view_count to media");
} catch (e) {
  console.log("media.view_count might exist:", e);
}

try {
  db.run("ALTER TABLE seasons ADD COLUMN view_count INTEGER DEFAULT 0;");
  console.log("Added view_count to seasons");
} catch (e) {
  console.log("seasons.view_count might exist:", e);
}

try {
  db.run("ALTER TABLE episodes ADD COLUMN view_count INTEGER DEFAULT 0;");
  console.log("Added view_count to episodes");
} catch (e) {
  console.log("episodes.view_count might exist:", e);
}

console.log("Done!");
