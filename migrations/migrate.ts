import { readFileSync, existsSync } from "fs";
import { parseSQLFile } from "./parser";

export async function runMigration(sqlFilePath: string) {
	if (!existsSync(sqlFilePath)) {
		console.error(`[migrate] File not found: ${sqlFilePath}`);
		return;
	}

	console.log("[migrate] Reading SQL file...");
	const data = parseSQLFile(readFileSync(sqlFilePath, "utf-8"));
}

