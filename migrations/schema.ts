export interface MediaRow {
	id?: number;
	content_type_id: number;
	slug: string;
	original_title: string;
	original_language: string;
	status: string;
	created_at: string;
	updated_at: string;
}

export interface MediaTranslationRow {
	id?: number;
	media_id: number;
	locale: string;
	title: string;
	synopsis: string | null;
}

export interface ImageRow {
	id?: number;
	entity_type: string;
	entity_id: number;
	image_type: "poster" | "backdrop";
	url: string;
	is_primary: number;
	created_at: string;
}

export interface SeasonRow {
	id?: number;
	media_id: number;
	season_number: number;
	created_at: string;
	updated_at: string;
}

export interface SeasonTranslationRow {
	id?: number;
	season_id: number;
	locale: string;
	name: string;
}

export interface EpisodeRow {
	id?: number;
	media_id: number;
	season_id: number;
	episode_number: number;
	created_at: string;
	updated_at: string;
}

export interface EpisodeTranslationRow {
	id?: number;
	episode_id: number;
	locale: string;
	title: string;
	synopsis: string | null;
}

export interface GenreRow {
	id?: number;
	slug: string;
}

export interface GenreTranslationRow {
	id?: number;
	genre_id: number;
	locale: string;
	name: string;
}

export interface MediaGenreRow {
	media_id: number;
	genre_id: number;
}

export interface ContentTypeRow {
	id?: number;
	slug: string;
	label: string;
}

export interface LanguageRow {
	id?: number;
	code: string;
	name: string;
	native_name: string;
}