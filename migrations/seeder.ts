import { createORM } from "./builder";
import type {
	MediaRow,
	MediaTranslationRow,
	ImageRow,
	SeasonRow,
	SeasonTranslationRow,
	EpisodeRow,
	EpisodeTranslationRow,
	GenreRow,
	GenreTranslationRow,
	MediaGenreRow,
	ContentTypeRow,
	LanguageRow,
} from "./builder";
import type { Catalogo, Capitulo, Temporada, Categoria, Asignacion } from "./types";
import { toSlug, CONTENT_TYPE_MAP, STATUS_MAP } from "./utils";
import type { MediaInput, SeasonInput, EpisodeInput, GenreInput, GenreAssignmentInput } from "./migrate";

export class Seeder {
	private orm = createORM();
	private catalogoIdMap = new Map<number, number>();
	private seasonIdMap = new Map<number, number>();
	private catIdMap = new Map<number, number>();
	private now = new Date().toISOString();

	async seedLookupTables() {
		console.log("\n[migrate] Seeding lookup tables...");
		if (this.orm.from<ContentTypeRow>("content_types").count() === 0) {
			const types = [
				{ id: 1, slug: "movie", label: "Movie" },
				{ id: 2, slug: "series", label: "Series" },
				{ id: 3, slug: "anime", label: "Anime" },
				{ id: 4, slug: "manga", label: "Manga" },
				{ id: 5, slug: "ova", label: "OVA" },
				{ id: 6, slug: "special", label: "Special" },
				{ id: 7, slug: "ona", label: "ONA" },
			];
			for (const t of types)
				this.orm.insert<ContentTypeRow>("content_types", t).orIgnore().run();
		}

		if (this.orm.from<LanguageRow>("languages").count() === 0) {
			const langs = [
				{ id: 1, code: "en", name: "English", native_name: "English" },
				{ id: 2, code: "es", name: "Spanish", native_name: "Español" },
				{ id: 3, code: "ja", name: "Japanese", native_name: "日本語" },
				{ id: 4, code: "pt", name: "Portuguese", native_name: "Português" },
			];
			for (const l of langs)
				this.orm.insert<LanguageRow>("languages", l).orIgnore().run();
		}

		for (const g of this.orm.from<GenreRow>("genres").all()) {
			if (g.id) this.catIdMap.set(g.id, g.id);
		}
	}

	async seedCategories(categorias: Categoria[]) {
		console.log("\n[migrate] Importing categories...");
		let catSuccess = 0;
		for (const cat of categorias) {
			const slug = toSlug(cat.nombreCategoria, 30);
			const existing = this.orm
				.from<GenreRow>("genres")
				.where((w) => w.eq("slug", slug))
				.first();
			if (existing && existing.id) {
				this.catIdMap.set(cat.idCategoria, existing.id);
				catSuccess++;
				continue;
			}
			try {
				const genreId = this.orm
					.insert<GenreRow>("genres", { slug })
					.run();
				this.orm.insert<GenreTranslationRow>("genre_translations", {
					genre_id: genreId,
					locale: "es",
					name: cat.nombreCategoria,
				}).run();
				this.catIdMap.set(cat.idCategoria, genreId);
				catSuccess++;
			} catch {}
		}
		console.log(`  Total: ${catSuccess} categories`);
	}

	async seedCategoriesGeneric(genres: GenreInput[]) {
		console.log("\n[migrate] Importing genres...");
		let catSuccess = 0;
		for (const genre of genres) {
			const slug = toSlug(genre.name, 30);
			const existing = this.orm
				.from<GenreRow>("genres")
				.where((w) => w.eq("slug", slug))
				.first();
			if (existing && existing.id) {
				this.catIdMap.set(genre.oldId, existing.id);
				catSuccess++;
				continue;
			}
			try {
				const genreId = this.orm
					.insert<GenreRow>("genres", { slug })
					.run();
				this.orm.insert<GenreTranslationRow>("genre_translations", {
					genre_id: genreId,
					locale: "es",
					name: genre.name,
				}).run();
				this.catIdMap.set(genre.oldId, genreId);
				catSuccess++;
			} catch {}
		}
		console.log(`  Total: ${catSuccess} genres`);
	}

	async seedCatalogos(catalogos: Catalogo[]) {
		console.log("\n[migrate] Importing catalogos...");
		let successCount = 0,
			skipCount = 0;

		for (const cat of catalogos) {
			if (!cat.nombreCatalogo || cat.nombreCatalogo.length < 2) continue;

			const slug = toSlug(cat.nombreCatalogo) || `catalogo-${cat.idCatalogo}`;

			try {
				const existing =
					this.orm
						.from<MediaRow>("media")
						.where((w) => w.eq("slug", slug))
						.first() ??
					this.orm
						.from<MediaRow>("media")
						.where((w) => w.eq("original_title", cat.nombreCatalogo))
						.first();

				if (existing) {
					this.catalogoIdMap.set(cat.idCatalogo, existing.id);
					skipCount++;
					continue;
				}

				const mediaId = this.orm
					.insert<MediaRow>("media", {
						content_type_id: CONTENT_TYPE_MAP[cat.tipoCatalogo] ?? 3,
						slug,
						original_title: cat.nombreCatalogo,
						original_language: "ja",
						status: STATUS_MAP[cat.estadoCatalogo] ?? "unknown",
						created_at: this.now,
						updated_at: this.now,
					})
					.run();

				this.catalogoIdMap.set(cat.idCatalogo, mediaId);

				this.orm.insert<MediaTranslationRow>("media_translations", {
					media_id: mediaId,
					locale: "es",
					title: cat.nombreCatalogo,
					synopsis: cat.descripcionCatalogo || null,
				}).run();

				if (cat.imagenPortadaCatalogo?.length > 5) {
					this.orm.insert<ImageRow>("images", {
						entity_type: "media",
						entity_id: mediaId,
						image_type: "poster",
						url: cat.imagenPortadaCatalogo,
						is_primary: 1,
						created_at: this.now,
					})
						.orIgnore()
						.run();
				}

				if (cat.imagenFondoCatalogo?.length > 5) {
					this.orm.insert<ImageRow>("images", {
						entity_type: "media",
						entity_id: mediaId,
						image_type: "backdrop",
						url: cat.imagenFondoCatalogo,
						is_primary: 0,
						created_at: this.now,
					})
						.orIgnore()
						.run();
				}

				successCount++;
				if (successCount % 500 === 0)
					console.log(`  ✓ ${successCount} imported...`);
			} catch (err: unknown) {
				if (successCount < 10)
					console.log(
						`  ✗ ${cat.nombreCatalogo}: ${
							(err as Error)?.message?.substring(0, 60) || "error"
						}`,
					);
			}
		}
		console.log(`  Total: ${successCount} imported, ${skipCount} skipped`);
	}

	async seedMediaGeneric(media: MediaInput[]) {
		console.log("\n[migrate] Importing media...");
		let successCount = 0,
			skipCount = 0;

		for (const item of media) {
			if (!item.title || item.title.length < 2) continue;

			const slug = toSlug(item.title) || `media-${item.oldId}`;

			try {
				const existing =
					this.orm
						.from<MediaRow>("media")
						.where((w) => w.eq("slug", slug))
						.first() ??
					this.orm
						.from<MediaRow>("media")
						.where((w) => w.eq("original_title", item.title))
						.first();

				if (existing) {
					this.catalogoIdMap.set(item.oldId, existing.id);
					skipCount++;
					continue;
				}

				const mediaId = this.orm
					.insert<MediaRow>("media", {
						content_type_id: CONTENT_TYPE_MAP[item.contentType] ?? 3,
						slug,
						original_title: item.title,
						original_language: "ja",
						status: STATUS_MAP[item.status] ?? "unknown",
						created_at: this.now,
						updated_at: this.now,
					})
					.run();

				this.catalogoIdMap.set(item.oldId, mediaId);

				this.orm.insert<MediaTranslationRow>("media_translations", {
					media_id: mediaId,
					locale: "es",
					title: item.title,
					synopsis: item.synopsis || null,
				}).run();

				if (item.posterUrl?.length) {
					this.orm.insert<ImageRow>("images", {
						entity_type: "media",
						entity_id: mediaId,
						image_type: "poster",
						url: item.posterUrl,
						is_primary: 1,
						created_at: this.now,
					})
						.orIgnore()
						.run();
				}

				if (item.backdropUrl?.length) {
					this.orm.insert<ImageRow>("images", {
						entity_type: "media",
						entity_id: mediaId,
						image_type: "backdrop",
						url: item.backdropUrl,
						is_primary: 0,
						created_at: this.now,
					})
						.orIgnore()
						.run();
				}

				successCount++;
				if (successCount % 500 === 0)
					console.log(`  ✓ ${successCount} imported...`);
			} catch (err: unknown) {
				if (successCount < 10)
					console.log(
						`  ✗ ${item.title}: ${
							(err as Error)?.message?.substring(0, 60) || "error"
						}`,
					);
			}
		}
		console.log(`  Total: ${successCount} imported, ${skipCount} skipped`);
	}

	async seedSeasons(temporadas: Temporada[]) {
		console.log("\n[migrate] Importing seasons...");
		let seasonCount = 0;
		for (const season of temporadas) {
			const mediaId = this.catalogoIdMap.get(season.idAnime);
			if (!mediaId) continue;
			try {
				const seasonId = this.orm
					.insert<SeasonRow>("seasons", {
						media_id: mediaId,
						season_number: season.numero,
						created_at: this.now,
						updated_at: this.now,
					})
					.run();
				this.seasonIdMap.set(season.idTemporada, seasonId);
				if (season.titulo) {
					this.orm.insert<SeasonTranslationRow>("season_translations", {
						season_id: seasonId,
						locale: "es",
						name: season.titulo,
					}).run();
				}
				seasonCount++;
			} catch {}
		}
		console.log(`  Total: ${seasonCount} seasons`);
	}

	async seedSeasonsGeneric(seasons: SeasonInput[]) {
		console.log("\n[migrate] Importing seasons...");
		let seasonCount = 0;
		for (const season of seasons) {
			const mediaId = this.catalogoIdMap.get(season.mediaOldId);
			if (!mediaId) continue;
			try {
				const seasonId = this.orm
					.insert<SeasonRow>("seasons", {
						media_id: mediaId,
						season_number: season.seasonNumber,
						created_at: this.now,
						updated_at: this.now,
					})
					.run();
				this.seasonIdMap.set(season.oldId, seasonId);
				if (season.title) {
					this.orm.insert<SeasonTranslationRow>("season_translations", {
						season_id: seasonId,
						locale: "es",
						name: season.title,
					}).run();
				}
				seasonCount++;
			} catch {}
		}
		console.log(`  Total: ${seasonCount} seasons`);
	}

	async seedEpisodes(capitulos: Capitulo[]) {
		console.log("\n[migrate] Importing episodes...");
		let episodeCount = 0;
		for (const ep of capitulos) {
			const mediaId = this.catalogoIdMap.get(ep.idAnime);
			const seasonId = this.seasonIdMap.get(ep.idTemporada);
			if (!mediaId || !seasonId) continue;
			try {
				const episodeId = this.orm
					.insert<EpisodeRow>("episodes", {
						media_id: mediaId,
						season_id: seasonId,
						episode_number: ep.numero,
						created_at: this.now,
						updated_at: this.now,
					})
					.run();
				if (ep.titulo) {
					this.orm.insert<EpisodeTranslationRow>("episode_translations", {
						episode_id: episodeId,
						locale: "es",
						title: ep.titulo,
						synopsis: ep.descripcion || null,
					}).run();
				}
				episodeCount++;
				if (episodeCount % 500 === 0)
					console.log(`  ✓ ${episodeCount} imported...`);
			} catch {}
		}
		console.log(`  Total: ${episodeCount} episodes`);
	}

	async seedEpisodesGeneric(episodes: EpisodeInput[]) {
		console.log("\n[migrate] Importing episodes...");
		let episodeCount = 0;
		for (const ep of episodes) {
			const mediaId = this.catalogoIdMap.get(ep.mediaOldId);
			const seasonId = this.seasonIdMap.get(ep.seasonOldId);
			if (!mediaId || !seasonId) continue;
			try {
				const episodeId = this.orm
					.insert<EpisodeRow>("episodes", {
						media_id: mediaId,
						season_id: seasonId,
						episode_number: ep.episodeNumber,
						created_at: this.now,
						updated_at: this.now,
					})
					.run();
				if (ep.title) {
					this.orm.insert<EpisodeTranslationRow>("episode_translations", {
						episode_id: episodeId,
						locale: "es",
						title: ep.title,
						synopsis: ep.synopsis || null,
					}).run();
				}
				episodeCount++;
				if (episodeCount % 500 === 0)
					console.log(`  ✓ ${episodeCount} imported...`);
			} catch {}
		}
		console.log(`  Total: ${episodeCount} episodes`);
	}

	async seedGenreAssignments(asignaciones: Asignacion[]) {
		console.log("\n[migrate] Importing genre assignments...");
		let assignCount = 0;
		for (const assign of asignaciones) {
			const genreId = this.catIdMap.get(assign.categoriaAsignacionCategoria);
			const mediaId = this.catalogoIdMap.get(assign.catalogoAsignacionCategoria);
			if (!genreId || !mediaId) continue;
			try {
				this.orm.insert<MediaGenreRow>("media_genres", {
					media_id: mediaId,
					genre_id: genreId,
				})
					.orIgnore()
					.run();
				assignCount++;
			} catch {}
		}
		console.log(`  ✓ ${assignCount} assignments`);
	}

	async seedGenreAssignmentsGeneric(assignments: GenreAssignmentInput[]) {
		console.log("\n[migrate] Importing genre assignments...");
		let assignCount = 0;
		for (const assign of assignments) {
			const genreId = this.catIdMap.get(assign.genreOldId);
			const mediaId = this.catalogoIdMap.get(assign.mediaOldId);
			if (!genreId || !mediaId) continue;
			try {
				this.orm.insert<MediaGenreRow>("media_genres", {
					media_id: mediaId,
					genre_id: genreId,
				})
					.orIgnore()
					.run();
				assignCount++;
			} catch {}
		}
		console.log(`  ✓ ${assignCount} assignments`);
	}

	getSummary() {
		return {
			media: this.catalogoIdMap.size,
			seasons: this.seasonIdMap.size,
		};
	}
}