import { createORM, WhereBuilder } from "./builder";
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
} from "./schema";
import { toSlug, CONTENT_TYPE_MAP, STATUS_MAP } from "./utils";

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
	getSummary() {
		return {
			media: this.catalogoIdMap.size,
			seasons: this.seasonIdMap.size,
		};
	}
}