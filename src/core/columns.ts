/**
 * Drizzle-style Column Definitions
 * 
 * Provides column builders that match Drizzle ORM's API
 */

import type { Table } from "./table";

// ============================================
// Column Builder Config
// ============================================

export interface ColumnBuilderConfig {
  name: string;
  table?: Table;
  notNull?: boolean;
  default?: unknown;
  primaryKey?: boolean;
  unique?: boolean;
  references?: { table: string; column: string };
  autoIncrement?: boolean;
}

// ============================================
// Base Column
// ============================================

export abstract class Column {
  readonly name: string;
  readonly table?: Table;
  readonly notNull: boolean = false;
  readonly default: unknown = undefined;
  readonly primaryKey: boolean = false;
  readonly unique: boolean = false;
  readonly references?: { table: string; column: string };
  readonly autoIncrement: boolean = false;

  constructor(config: ColumnBuilderConfig) {
    this.name = config.name;
    this.table = config.table;
    this.notNull = config.notNull ?? false;
    this.default = config.default;
    this.primaryKey = config.primaryKey ?? false;
    this.unique = config.unique ?? false;
    this.references = config.references;
    this.autoIncrement = config.autoIncrement ?? false;
  }

  abstract getSQLType(): string;

  toString(): string {
    return this.name;
  }

  toSQL(): string {
    let sql = `${this.name} ${this.getSQLType()}`;
    
    if (this.primaryKey && this.autoIncrement) {
      return `${this.name} INTEGER PRIMARY KEY AUTOINCREMENT`;
    }
    
    if (this.primaryKey) sql += " PRIMARY KEY";
    if (this.notNull && !this.primaryKey) sql += " NOT NULL";
    if (this.unique && !this.primaryKey) sql += " UNIQUE";
    
    if (this.default !== undefined) {
      const defaultVal = this.default;
      if (typeof defaultVal === "string" && (
        defaultVal.startsWith("(") || 
        defaultVal.toUpperCase().startsWith("DATETIME") ||
        defaultVal.toUpperCase().startsWith("CURRENT_") ||
        defaultVal.toUpperCase().startsWith("STRFTIME") ||
        defaultVal.toUpperCase().startsWith("DATE(") ||
        defaultVal.toUpperCase().startsWith("TIME(") ||
        defaultVal.includes("(")
      )) {
        sql += ` DEFAULT ${defaultVal}`;
      } else if (typeof defaultVal === "string") {
        sql += ` DEFAULT '${defaultVal}'`;
      } else if (defaultVal === null) {
        sql += ` DEFAULT NULL`;
      } else {
        sql += ` DEFAULT ${defaultVal}`;
      }
    }
    
    if (this.references) {
      sql += ` REFERENCES ${this.references.table}(${this.references.column})`;
    }
    
    return sql;
  }
}

export type AnyColumn = Column;

// ============================================
// Column Types
// ============================================

export class IntegerColumn extends Column {
  getSQLType(): string {
    return "INTEGER";
  }
}

export class TextColumn extends Column {
  getSQLType(): string {
    return "TEXT";
  }
}

export class RealColumn extends Column {
  getSQLType(): string {
    return "REAL";
  }
}

export class BlobColumn extends Column {
  getSQLType(): string {
    return "BLOB";
  }
}

export class BooleanColumn extends Column {
  getSQLType(): string {
    return "INTEGER";
  }
}

export class NumericColumn extends Column {
  getSQLType(): string {
    return "NUMERIC";
  }
}

// ============================================
// SQLiteColumn type (alias for compatibility)
// ============================================

export type SQLiteColumn = Column;

// ============================================
// Column Builders - Simple Functions
// ============================================

export const integer = (name: string): IntegerColumn => {
  return new IntegerColumn({ name });
};

export const text = (name: string): TextColumn => {
  return new TextColumn({ name });
};

export const varchar = (name: string, _length?: number): TextColumn => {
  return new TextColumn({ name });
};

export const real = (name: string): RealColumn => {
  return new RealColumn({ name });
};

export const blob = (name: string): BlobColumn => {
  return new BlobColumn({ name });
};

export const boolean = (name: string): BooleanColumn => {
  return new BooleanColumn({ name });
};

export const numeric = (name: string): NumericColumn => {
  return new NumericColumn({ name });
};

export const date = (name: string): TextColumn => {
  return new TextColumn({ name });
};

export const timestamp = (name: string): TextColumn => {
  return new TextColumn({ name });
};

// ============================================
// Column Modifiers
// ============================================

export const primaryKey = (col: IntegerColumn): IntegerColumn => {
  return new IntegerColumn({
    name: col.name,
    table: col.table,
    notNull: col.notNull,
    default: col.default,
    primaryKey: true,
    unique: col.unique,
    autoIncrement: true,
  });
};

export const notNull = <T extends Column>(col: T): T => {
  const newCol = new (Object.getPrototypeOf(col).constructor as new (config: ColumnBuilderConfig) => T)({
    name: col.name,
    table: col.table,
    notNull: true,
    default: col.default,
    primaryKey: col.primaryKey,
    unique: col.unique,
    references: col.references,
    autoIncrement: col.autoIncrement,
  });
  return newCol;
};

export const unique = <T extends Column>(col: T): T => {
  const newCol = new (Object.getPrototypeOf(col).constructor as new (config: ColumnBuilderConfig) => T)({
    name: col.name,
    table: col.table,
    notNull: col.notNull,
    default: col.default,
    primaryKey: col.primaryKey,
    unique: true,
    references: col.references,
    autoIncrement: col.autoIncrement,
  });
  return newCol;
};

export const default_ = <T, V>(col: T, value: V): T => {
  const newCol = new (Object.getPrototypeOf(col as Column).constructor as new (config: ColumnBuilderConfig) => T)({
    name: (col as Column).name,
    table: (col as Column).table,
    notNull: (col as Column).notNull,
    default: value,
    primaryKey: (col as Column).primaryKey,
    unique: (col as Column).unique,
    references: (col as Column).references,
    autoIncrement: (col as Column).autoIncrement,
  });
  return newCol;
};

export const references = <T extends Column>(col: T, config: { table: string; column: string }): T => {
  const newCol = new (Object.getPrototypeOf(col).constructor as new (config: ColumnBuilderConfig) => T)({
    name: col.name,
    table: col.table,
    notNull: col.notNull,
    default: col.default,
    primaryKey: col.primaryKey,
    unique: col.unique,
    references: config,
    autoIncrement: col.autoIncrement,
  });
  return newCol;
};

export const index = (columns: string[], unique?: boolean) => {
  return { columns, unique };
};

// Type for column definition
export interface ColumnDef {
  name: string;
  type: string;
  notNull?: boolean;
  default?: unknown;
  primaryKey?: boolean;
  unique?: boolean;
  references?: { table: string; column: string };
}
