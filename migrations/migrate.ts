import { readFileSync, existsSync } from "fs";
import { parseSQLFile } from "./parser";
import { Seeder } from "./seeder";
import type { Catalogo, Capitulo, Temporada, Categoria, Asignacion } from "./types";

export interface MediaInput {
	oldId: number;
	title: string;
	contentType: number;
	status: number;
	posterUrl?: string;
	backdropUrl?: string;
	synopsis?: string;
	trailerUrl?: string | null;
	nsfw: number;
}

export interface SeasonInput {
	oldId: number;
	mediaOldId: number;
	seasonNumber: number;
	title?: string;
}

export interface EpisodeInput {
	oldId: number;
	mediaOldId: number;
	seasonOldId: number;
	episodeNumber: number;
	title?: string;
	synopsis?: string;
}

export interface GenreInput {
	oldId: number;
	name: string;
}

export interface GenreAssignmentInput {
	mediaOldId: number;
	genreOldId: number;
}

export interface MigrationData {
	media: MediaInput[];
	seasons: SeasonInput[];
	episodes: EpisodeInput[];
	genres: GenreInput[];
	genreAssignments: GenreAssignmentInput[];
}

export async function runMigration(data: MigrationData) {
	const seeder = new Seeder();

	await seeder.seedLookupTables();
	await seeder.seedCategoriesGeneric(data.genres);
	await seeder.seedMediaGeneric(data.media);
	await seeder.seedSeasonsGeneric(data.seasons);
	await seeder.seedEpisodesGeneric(data.episodes);
	await seeder.seedGenreAssignmentsGeneric(data.genreAssignments);

	const summary = seeder.getSummary();
	console.log("\n[migrate] Done!");
	console.log(
		`  media: ${summary.media} | seasons: ${summary.seasons}`,
	);
}

function convertLegacyData(
	catalogos: Catalogo[],
	capitulos: Capitulo[],
	temporadas: Temporada[],
	categorias: Categoria[],
	asignaciones: Asignacion[],
): MigrationData {
	const genreMap = new Map<number, string>();
	for (const cat of categorias) {
		genreMap.set(cat.idCategoria, cat.nombreCategoria);
	}

	const mediaData: MediaInput[] = catalogos
		.filter(c => c.nombreCatalogo && c.nombreCatalogo.length >= 2)
		.map(c => ({
			oldId: c.idCatalogo,
			title: c.nombreCatalogo,
			contentType: c.tipoCatalogo,
			status: c.estadoCatalogo,
			posterUrl: c.imagenPortadaCatalogo?.length > 5 ? c.imagenPortadaCatalogo : undefined,
			backdropUrl: c.imagenFondoCatalogo?.length > 5 ? c.imagenFondoCatalogo : undefined,
			synopsis: c.descripcionCatalogo || undefined,
			trailerUrl: c.trailerCatalogo,
			nsfw: c.nsfwCatalogo,
		}));

	const seasonData: SeasonInput[] = temporadas.map(s => ({
		oldId: s.idTemporada,
		mediaOldId: s.idAnime,
		seasonNumber: s.numero,
		title: s.titulo || undefined,
	}));

	const episodeData: EpisodeInput[] = capitulos.map(e => ({
		oldId: e.idCapitulo,
		mediaOldId: e.idAnime,
		seasonOldId: e.idTemporada,
		episodeNumber: e.numero,
		title: e.titulo || undefined,
		synopsis: e.descripcion || undefined,
	}));

	const genreData: GenreInput[] = Array.from(genreMap.entries()).map(([id, name]) => ({
		oldId: id,
		name,
	}));

	const assignmentData: GenreAssignmentInput[] = asignaciones.map(a => ({
		mediaOldId: a.catalogoAsignacionCategoria,
		genreOldId: a.categoriaAsignacionCategoria,
	}));

	return {
		media: mediaData,
		seasons: seasonData,
		episodes: episodeData,
		genres: genreData,
		genreAssignments: assignmentData,
	};
}

export async function runLegacyMigration(sqlFilePath: string) {
	if (!existsSync(sqlFilePath)) {
		console.error(`[migrate] File not found: ${sqlFilePath}`);
		return;
	}

	console.log("[migrate] Reading SQL file...");
	const { catalogos, capitulos, temporadas, categorias, asignaciones } =
		parseSQLFile(readFileSync(sqlFilePath, "utf-8"));

	console.log(`\n[migrate] Summary of parsed data:`);
	console.log(`  - ${catalogos.length} catalogos, ${capitulos.length} capitulos`);
	console.log(
		`  - ${temporadas.length} temporadas, ${categorias.length} categorias, ${asignaciones.length} asignaciones`,
	);

	const normalized = convertLegacyData(
		catalogos,
		capitulos,
		temporadas,
		categorias,
		asignaciones,
	);

	await runMigration(normalized);
}

const sqlPath = process.argv[2] || "sql_koinima.sql";
runLegacyMigration(sqlPath).catch(console.error);