import { getDrizzle } from "../src/init";
import type { SqliteNapiAdapter, PreparedQuery } from "../src/core/driver";

export type SQLValue = string | number | null | undefined;
export type Row = { [key: string]: SQLValue };

export interface DB {
	query<T = Row>(sql: string): PreparedQuery<T>;
}

type Op = "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IS NULL" | "IS NOT NULL";

interface Condition {
	column: string;
	op: Op;
	value?: SQLValue;
}

export class WhereBuilder {
	private conditions: Condition[] = [];

	eq(column: string, value: SQLValue) { this.conditions.push({ column, op: "=", value }); return this; }
	neq(column: string, value: SQLValue) { this.conditions.push({ column, op: "!=", value }); return this; }
	gt(column: string, value: SQLValue) { this.conditions.push({ column, op: ">", value }); return this; }
	lt(column: string, value: SQLValue) { this.conditions.push({ column, op: "<", value }); return this; }
	like(column: string, value: string) { this.conditions.push({ column, op: "LIKE", value }); return this; }
	isNull(column: string) { this.conditions.push({ column, op: "IS NULL" }); return this; }
	isNotNull(column: string) { this.conditions.push({ column, op: "IS NOT NULL" }); return this; }

	build(): { sql: string; params: SQLValue[] } {
		if (this.conditions.length === 0) return { sql: "", params: [] };
		const params: SQLValue[] = [];
		const parts = this.conditions.map(c => {
			if (c.op === "IS NULL" || c.op === "IS NOT NULL") return `${c.column} ${c.op}`;
			params.push(c.value!);
			return `${c.column} ${c.op} ?`;
		});
		return { sql: `WHERE ${parts.join(" AND ")}`, params };
	}
}

export class TableQuery<T = Row> {
	private _where = new WhereBuilder();
	private _limit?: number;
	private _orderBy?: string;
	private _columns: string[] = ["*"];

	constructor(private db: DB, private table: string) {}

	select(...columns: string[]) { this._columns = columns; return this; }
	where(fn: (w: WhereBuilder) => void) { fn(this._where); return this; }
	limit(n: number) { this._limit = n; return this; }
	orderBy(col: string, dir: "ASC" | "DESC" = "ASC") { this._orderBy = `${col} ${dir}`; return this; }

	private build() {
		const { sql: whereSql, params } = this._where.build();
		const parts = [
			`SELECT ${this._columns.join(", ")} FROM ${this.table}`,
			whereSql,
			this._orderBy ? `ORDER BY ${this._orderBy}` : "",
			this._limit !== undefined ? `LIMIT ${this._limit}` : "",
		].filter(Boolean);
		return { sql: parts.join(" "), params };
	}

	first(): T | undefined {
		this._limit = 1;
		const { sql, params } = this.build();
		return this.db.query<T>(sql).get(params);
	}

	all(): T[] {
		const { sql, params } = this.build();
		return this.db.query<T>(sql).all(params);
	}

	exists(): boolean {
		return this.first() !== undefined;
	}

	count(): number {
		this._columns = ["COUNT(*) as n"];
		const { sql, params } = this.build();
		const row = this.db.query<{ n: number }>(sql).get(params);
		return row?.n ?? 0;
	}
}

type ConflictStrategy = "IGNORE" | "REPLACE" | "FAIL";

export class InsertBuilder<T = Row> {
	private _conflict: ConflictStrategy = "FAIL";

	constructor(private db: DB, private table: string, private data: Partial<T>) {}

	orIgnore() { this._conflict = "IGNORE"; return this; }
	orReplace() { this._conflict = "REPLACE"; return this; }

	run(): number {
		const data = this.data as Record<string, SQLValue | undefined>;
		const keys = Object.keys(data).filter(k => data[k] !== undefined);
		const vals = keys.map(k => data[k] as SQLValue);
		const placeholders = keys.map(() => "?").join(", ");
		const modifier = this._conflict !== "FAIL" ? `OR ${this._conflict} ` : "";
		const sql = `INSERT ${modifier}INTO ${this.table} (${keys.join(", ")}) VALUES (${placeholders})`;
		const result = this.db.query(sql).run(vals);
		return Number(result.lastInsertRowid);
	}
}

export class UpsertBuilder<T = Row> {
	constructor(
		private db: DB,
		private table: string,
		private data: Partial<T>,
		private conflictCols: (keyof T)[],
	) {}

	run(): number {
		const data = this.data as Record<string, SQLValue | undefined>;
		const keys = Object.keys(data).filter(k => data[k] !== undefined);
		const vals = keys.map(k => data[k] as SQLValue);
		const placeholders = keys.map(() => "?").join(", ");
		const updateParts = keys
			.filter(k => !this.conflictCols.includes(k as keyof T))
			.map(k => `${k} = excluded.${k}`)
			.join(", ");
		const conflict = `ON CONFLICT(${this.conflictCols.join(", ")}) DO ${updateParts ? `UPDATE SET ${updateParts}` : "NOTHING"}`;
		const sql = `INSERT INTO ${this.table} (${keys.join(", ")}) VALUES (${placeholders}) ${conflict}`;
		const result = this.db.query(sql).run(vals);
		return Number(result.lastInsertRowid);
	}
}

export class UpdateBuilder<T = Row> {
	private _where = new WhereBuilder();

	constructor(private db: DB, private table: string, private data: Partial<T>) {}

	where(fn: (w: WhereBuilder) => void) { fn(this._where); return this; }

	run(): number {
		const data = this.data as Record<string, SQLValue | undefined>;
		const keys = Object.keys(data).filter(k => data[k] !== undefined);
		const setParts = keys.map(k => `${k} = ?`).join(", ");
		const setVals = keys.map(k => data[k] as SQLValue);
		const { sql: whereSql, params: whereParams } = this._where.build();
		const sql = `UPDATE ${this.table} SET ${setParts} ${whereSql}`.trim();
		this.db.query(sql).run([...setVals, ...whereParams]);
		return 0;
	}
}

export class DeleteBuilder {
	private _where = new WhereBuilder();

	constructor(private db: DB, private table: string) {}

	where(fn: (w: WhereBuilder) => void) { fn(this._where); return this; }

	run() {
		const { sql: whereSql, params } = this._where.build();
		const sql = `DELETE FROM ${this.table} ${whereSql}`.trim();
		this.db.query(sql).run(params);
	}
}

export class ORM {
	constructor(private db: DB) {}

	from<T = Row>(table: string) {
		return new TableQuery<T>(this.db, table);
	}

	insert<T = Row>(table: string, data: Partial<T>) {
		return new InsertBuilder<T>(this.db, table, data);
	}

	upsert<T = Row>(table: string, data: Partial<T>, conflictCols: (keyof T)[]) {
		return new UpsertBuilder<T>(this.db, table, data, conflictCols);
	}

	update<T = Row>(table: string, data: Partial<T>) {
		return new UpdateBuilder<T>(this.db, table, data);
	}

	delete(table: string) {
		return new DeleteBuilder(this.db, table);
	}
}

export function createORM(): ORM {
	return new ORM(getDrizzle());
}