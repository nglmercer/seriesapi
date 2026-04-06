/**
 * SQLite NAPI - Drizzle Driver Adapter
 * 
 * Provides a Drizzle-compatible driver for sqlite-napi
 * Allows using sqlite-napi with Drizzle query builder patterns
 */

import { Database as SqliteNapiDatabase, type QueryResult } from "sqlite-napi";
import type { AnySQLiteTable, SQLiteTable, InferRow } from "./table";

// ============================================
// Query Builder Types
// ============================================

export interface SelectQuery {
  table: string;
  columns?: string[];
  whereClause?: string;
  whereParams?: unknown[];
  orderByClause?: string;
  limitCount?: number;
  offsetCount?: number;
}

// ============================================
// SQLite NAPI Driver
// ============================================

export interface SqliteNapiAdapter {
  // Query execution - now properly typed with table's row type
  select<T extends AnySQLiteTable>(table: T): SelectBuilder<InferRow<T>>;
  
  // Table operations
  insert<T extends AnySQLiteTable>(table: T): InsertBuilder<InferRow<T>>;
  update<T extends AnySQLiteTable>(table: T): UpdateBuilder<InferRow<T>>;
  delete<T extends AnySQLiteTable>(table: T): DeleteBuilder<InferRow<T>>;
  
  // Raw SQL
  execute(sql: string, params?: unknown[]): QueryResult;
  query<T>(sql: string): PreparedQuery<T>;
}

export interface PreparedQuery<T> {
  all(params?: unknown[]): T[];
  get(params?: unknown[]): T | undefined;
  run(params?: unknown[]): QueryResult;
}

// ============================================
// Query Builders
// ============================================

class SelectBuilder<T> {
  private sql: string = "";
  private _whereParams: unknown[] = [];

  constructor(
    private db: SqliteNapiDatabase,
    private tableName: string
  ) {
    this.sql = `SELECT * FROM ${tableName}`;
  }

  select<K extends keyof T>(...columns: K[]): SelectBuilder<Pick<T, K>> {
    const cols = columns.join(", ");
    this.sql = `SELECT ${cols} FROM ${this.tableName}`;
    return this as unknown as SelectBuilder<Pick<T, K>>;
  }

  where(condition: string, params?: unknown[]): this {
    this.sql += ` WHERE ${condition}`;
    this._whereParams = params || [];
    return this;
  }

  orderBy(column: string, direction: "asc" | "desc" = "asc"): this {
    this.sql += ` ORDER BY ${column} ${direction.toUpperCase()}`;
    return this;
  }


  limit(count: number): this {
    this.sql += ` LIMIT ${count}`;
    return this;
  }

  offset(count: number): this {
    this.sql += ` OFFSET ${count}`;
    return this;
  }

  all(): T[] {
    return this.db.query(this.sql).all(this._whereParams) as T[];
  }

  get(): T | undefined {
    return this.db.query(this.sql).get(this._whereParams) as T | undefined;
  }

  run(): QueryResult {
    return this.db.run(this.sql, this._whereParams);
  }
}

class InsertBuilder<T> {
  constructor(
    private db: SqliteNapiDatabase,
    private tableName: string
  ) {}

  values(v: Partial<T>): InsertBuilder<T> {
    this.rowData = v;
    return this;
  }

  private rowData: Partial<T> = {} as T;

  run(): QueryResult {
    const keys = Object.keys(this.rowData) as (keyof T)[];
    const insertValues = keys.map(k => this.rowData[k]);
    const placeholders = keys.map(() => "?").join(", ");
    const columns = keys.join(", ");

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    return this.db.run(sql, insertValues);
  }
}

class UpdateBuilder<T> {
  constructor(
    private db: SqliteNapiDatabase,
    private tableName: string
  ) {}

  set(v: Partial<T>): UpdateBuilder<T> {
    this.updateData = v;
    return this;
  }

  private updateData: Partial<T> = {} as T;

  where(condition: string, params?: unknown[]): UpdateBuilder<T> {
    this._whereCondition = condition;
    this._whereParams = params || [];
    return this;
  }

  private _whereCondition: string = "";
  private _whereParams: unknown[] = [];

  run(): QueryResult {
    const keys = Object.keys(this.updateData) as (keyof T)[];
    const updateValues = keys.map(k => this.updateData[k]);
    const setClause = keys.map(k => `${String(k)} = ?`).join(", ");

    let sql = `UPDATE ${this.tableName} SET ${setClause}`;
    const params: unknown[] = [...updateValues];

    if (this._whereCondition) {
      sql += ` WHERE ${this._whereCondition}`;
      params.push(...this._whereParams);
    }

    return this.db.run(sql, params);
  }
}

class DeleteBuilder<T> {
  constructor(
    private db: SqliteNapiDatabase,
    private tableName: string
  ) {}

  where(condition: string, params?: unknown[]): DeleteBuilder<T> {
    this._whereCondition = condition;
    this._whereParams = params || [];
    return this;
  }

  private _whereCondition: string = "";
  private _whereParams: unknown[] = [];

  run(): QueryResult {
    let sql = `DELETE FROM ${this.tableName}`;
    const params: unknown[] = [];

    if (this._whereCondition) {
      sql += ` WHERE ${this._whereCondition}`;
      params.push(...this._whereParams);
    }

    return this.db.run(sql, params);
  }
}

// ============================================
// Main Driver Factory
// ============================================

/**
 * Create a Drizzle-compatible adapter for sqlite-napi
 * 
 * @example
 *   import { sqliteNapi } from "./core/drizzle";
 *   import { Database } from "sqlite-napi";
 *   
 *   const db = new Database(":memory:");
 *   const adapter = sqliteNapi(db);
 *   
 *   // Select all users
 *   const users = adapter.select(usersTable).all();
 *   
 *   // Insert a user
 *   adapter.insert(usersTable).values({ name: "Alice", email: "alice@example.com" }).run();
 * */
export function sqliteNapi(db: SqliteNapiDatabase): SqliteNapiAdapter {
  return {
    select<T extends AnySQLiteTable>(table: T): SelectBuilder<InferRow<T>> {
      return new SelectBuilder<InferRow<T>>(db, table.name);
    },

    insert<T extends AnySQLiteTable>(table: T): InsertBuilder<InferRow<T>> {
      return new InsertBuilder<InferRow<T>>(db, table.name);
    },

    update<T extends AnySQLiteTable>(table: T): UpdateBuilder<InferRow<T>> {
      return new UpdateBuilder<InferRow<T>>(db, table.name);
    },

    delete<T extends AnySQLiteTable>(table: T): DeleteBuilder<InferRow<T>> {
      return new DeleteBuilder<InferRow<T>>(db, table.name);
    },

    execute(sql: string, params?: unknown[]): QueryResult {
      return db.run(sql, params);
    },

    query<T>(sql: string): PreparedQuery<T> {
      const stmt = db.query(sql);
      return {
        all(params?: unknown[]) {
          return stmt.all(params) as T[];
        },
        get(params?: unknown[]) {
          return stmt.get(params) as T | undefined;
        },
        run(params?: unknown[]) {
          return stmt.run(params);
        },
      };
    },
  };
}

// ============================================
// Schema Migration Helper
// ============================================

/**
 * Generate SQL CREATE TABLE statements from Drizzle tables
 * 
 * @example
 *   import { sqliteNapi, sqliteTable, integer, text } from "./core/drizzle";
 *   
 *   const usersTable = sqliteTable("users", {
 *     id: integer("id").$primaryKey(),
 *     name: text("name"),
 *     email: text("email"),
 *   });
 *   
 *   const sql = getTableSQL(usersTable);
 *   console.log(sql);
 * */
export function getTableSQL(table: AnySQLiteTable): string {
  return table.getSQL();
}

/**
 * Generate SQL for all tables in an array
 * 
 * @example
 *   import { getTablesSQL } from "./core/drizzle";
 *   
 *   const sql = getTablesSQL([usersTable, postsTable]);
 * */
export function getTablesSQL(tables: AnySQLiteTable[]): string {
  return tables.map(t => t.getSQL()).join(";\n\n");
}
