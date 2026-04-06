export interface Catalogo {
	idCatalogo: number;
	nombreCatalogo: string;
	tipoCatalogo: number;
	estadoCatalogo: number;
	imagenPortadaCatalogo: string;
	imagenFondoCatalogo: string;
	descripcionCatalogo: string;
	nsfwCatalogo: number;
	trailerCatalogo: string | null;
}

export interface Capitulo {
	idCapitulo: number;
	idAnime: number;
	idTemporada: number;
	titulo: string;
	numero: number;
	descripcion: string;
}

export interface Temporada {
	idTemporada: number;
	idAnime: number;
	numero: number;
	titulo: string;
}

export interface Categoria {
	idCategoria: number;
	nombreCategoria: string;
}

export interface Asignacion {
	catalogoAsignacionCategoria: number;
	categoriaAsignacionCategoria: number;
}
