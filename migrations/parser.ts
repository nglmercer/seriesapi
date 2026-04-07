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
export { extractValues, cleanValue };
