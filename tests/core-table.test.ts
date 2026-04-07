import { describe, it, expect } from "bun:test";
import { sqliteTable, Table } from "../src/core/table";
import { integer, text } from "../src/core/columns";

describe("Core Table", () => {
  it("should define a table and infer name and columns", () => {
    const usersTable = sqliteTable("users", {
      id: integer("id"),
      name: text("name"),
    });

    expect(usersTable.name).toBe("users");
    expect(usersTable.tableName).toBe("users");
    expect(usersTable.getColumns().length).toBe(2);
    expect(usersTable.getColumn("id")).toBeDefined();
    expect(usersTable.getColumn("missing")).toBeUndefined();
  });

  it("should create correct CREATE TABLE sql", () => {
    const usersTable = sqliteTable("users", {
      id: integer("id"),
      name: text("name"),
    });

    const sql = usersTable.getSQL();
    expect(sql).toContain("CREATE TABLE users");
    expect(sql).toContain("id INTEGER");
    expect(sql).toContain("name TEXT");
  });

  it("should find the primary key", () => {
    const usersTable = sqliteTable("users", {
      id: integer("id"),
    });
    // mock primary key because modifiers might return a new instance
    const pkCol = { name: "id", primaryKey: true, notNull: true, default: undefined, unique: true, autoIncrement: true, toSQL: () => "id INTEGER PRIMARY KEY", getSQLType: () => "INTEGER" };
    const table = new Table({
      name: "test",
      columns: [pkCol]
    });
    expect(table.primaryKey).toBe(pkCol);
  });
});
