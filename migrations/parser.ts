import type { Catalogo, Capitulo, Temporada, Categoria, Asignacion } from "./types";

function splitCSV(row: string): string[] {
	const result: string[] = [];
	let current = "",
		inString = false,
		stringChar = "";
	for (let i = 0; i < row.length; i++) {
		const c = row[i];
		if (!inString && (c === "'" || c === '"')) {
			inString = true;
			stringChar = c;
			current += c;
		} else if (inString && c === stringChar && row[i - 1] !== "\\") {
			inString = false;
			stringChar = "";
			current += c;
		} else if (!inString && c === "|") {
			result.push(current.trim());
			current = "";
			i += 2;
		} else if (!inString && c === ",") {
			result.push(current.trim());
			current = "";
		} else current += c;
	}
	if (current) result.push(current.trim());
	return result;
}

function extractValues(sql: string, tableName: string): string[][] {
	const rows: string[][] = [];
	const tableStart = sql.indexOf(`INSERT INTO \`${tableName}\``);
	if (tableStart === -1) return rows;
	const afterValues = sql.indexOf("VALUES", tableStart);
	if (afterValues === -1) return rows;
	let endMarker = sql.indexOf("\n--", afterValues);
	if (endMarker === -1) endMarker = sql.indexOf("\n\n", afterValues);
	if (endMarker === -1) endMarker = sql.length;
	const valuesSection = sql.slice(afterValues + 6, endMarker);
	let depth = 0,
		current = "",
		inString = false,
		stringChar = "";
	for (let i = 0; i < valuesSection.length; i++) {
		const c = valuesSection[i];
		if (!inString && (c === "'" || c === '"')) {
			inString = true;
			stringChar = c;
		} else if (inString && c === stringChar && valuesSection[i - 1] !== "\\") {
			inString = false;
			stringChar = "";
		} else if (!inString) {
			if (c === "(") {
				if (depth === 0) current = "(";
				else current += c;
				depth++;
			} else if (c === ")") {
				current += c;
				depth--;
				if (depth === 0) {
					rows.push(splitCSV(current.slice(1, -1)));
					current = "";
				}
			} else if (c === "," && depth === 1) current += "|||";
			else if (depth > 0) current += c;
		} else current += c;
	}
	return rows;
}

function cleanValue(val: string | undefined): string {
	if (!val) return "";
	val = val.trim();
	if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
	return val.replace(/''/g, "'");
}

export function parseSQLFile(sql: string) {
	const catalogos: Catalogo[] = [];
	const capitulos: Capitulo[] = [];
	const temporadas: Temporada[] = [];
	const categorias: Categoria[] = [];
	const asignaciones: Asignacion[] = [];

	for (const vals of extractValues(sql, "catalogos")) {
		if (vals.length >= 8)
			catalogos.push({
				idCatalogo: parseInt(cleanValue(vals[0])) || 0,
				nombreCatalogo: cleanValue(vals[1]),
				tipoCatalogo: parseInt(cleanValue(vals[2])) || 1,
				estadoCatalogo: parseInt(cleanValue(vals[3])) || 2,
				imagenPortadaCatalogo: cleanValue(vals[4]),
				imagenFondoCatalogo: cleanValue(vals[5]),
				descripcionCatalogo: cleanValue(vals[6]),
				nsfwCatalogo: parseInt(cleanValue(vals[7])) || 0,
				trailerCatalogo: cleanValue(vals[9]) || null,
			});
	}
	for (const vals of extractValues(sql, "capitulos")) {
		if (vals.length >= 6)
			capitulos.push({
				idCapitulo: parseInt(cleanValue(vals[0])) || 0,
				idAnime: parseInt(cleanValue(vals[1])) || 0,
				idTemporada: parseInt(cleanValue(vals[2])) || 0,
				titulo: cleanValue(vals[3]),
				numero: parseInt(cleanValue(vals[4])) || 0,
				descripcion: cleanValue(vals[5]),
			});
	}
	for (const vals of extractValues(sql, "temporadas")) {
		if (vals.length >= 4)
			temporadas.push({
				idTemporada: parseInt(cleanValue(vals[0])) || 0,
				idAnime: parseInt(cleanValue(vals[1])) || 0,
				numero: parseInt(cleanValue(vals[2])) || 0,
				titulo: cleanValue(vals[3]),
			});
	}
	for (const vals of extractValues(sql, "categorias")) {
		if (vals.length >= 2)
			categorias.push({
				idCategoria: parseInt(cleanValue(vals[0])) || 0,
				nombreCategoria: cleanValue(vals[1]),
			});
	}
	for (const vals of extractValues(sql, "asignacionescategorias")) {
		if (vals.length >= 3)
			asignaciones.push({
				catalogoAsignacionCategoria: parseInt(cleanValue(vals[1])) || 0,
				categoriaAsignacionCategoria: parseInt(cleanValue(vals[2])) || 0,
			});
	}
	return { catalogos, capitulos, temporadas, categorias, asignaciones };
}
