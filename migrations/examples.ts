import { ORM, WhereBuilder, type DB, type Row, type SQLValue, type PreparedQuery } from "./builder";

type UserRow = { id?: number; name: string; email: string; created_at: string };
type PostRow = { id?: number; user_id: number; title: string; content: string; published: number };

const createMockDB = (): DB => ({
	query<T = Row>(_sql: string): PreparedQuery<T> {
		return {
			run: (_params?: SQLValue[]) => ({ lastInsertRowid: 1n, changes: 0 }),
			get: (_params?: SQLValue[]) => undefined,
			all: (_params?: SQLValue[]) => [],
		};
	},
});

const orm = new ORM(createMockDB());

console.log("=== ORM EXAMPLES ===\n");

console.log("1. SELECT with where clause:");
const user = orm
	.from<UserRow>("users")
	.where((w) => w.eq("email", "test@example.com"))
	.first();
console.log(user);

console.log("\n2. SELECT with multiple conditions:");
const users = orm
	.from<UserRow>("users")
	.where((w) => w.eq("status", "active").gt("created_at", "2024-01-01"))
	.limit(10)
	.all();
console.log(users);

console.log("\n3. SELECT with LIKE:");
const posts = orm
	.from<PostRow>("posts")
	.where((w) => w.like("title", "%TypeScript%"))
	.all();
console.log(posts);

console.log("\n4. COUNT:");
const count = orm.from<UserRow>("users").count();
console.log(count);

console.log("\n5. EXISTS:");
const exists = orm.from<UserRow>("users").where((w) => w.eq("id", 1)).exists();
console.log(exists);

console.log("\n6. INSERT:");
const userId = orm
	.insert<UserRow>("users", {
		name: "John Doe",
		email: "john@example.com",
		created_at: new Date().toISOString(),
	})
	.run();
console.log(`Inserted user with id: ${userId}`);

console.log("\n7. INSERT OR IGNORE:");
orm.insert<UserRow>("users", { id: 1, name: "Jane" }).orIgnore().run();

console.log("\n8. INSERT OR REPLACE:");
orm.insert<UserRow>("users", { id: 1, name: "Jane Updated" }).orReplace().run();

console.log("\n9. UPSERT (ON CONFLICT):");
orm.upsert<UserRow>(
	"users",
	{ id: 1, name: "Jane Updated", email: "jane@example.com" },
	["id"]
).run();

console.log("\n10. UPDATE:");
orm.update<UserRow>("users", { name: "John Updated" })
	.where((w) => w.eq("id", 1))
	.run();

console.log("\n11. DELETE:");
orm.delete("users").where((w) => w.eq("id", 1)).run();

console.log("\n=== CHAINING EXAMPLES ===\n");

console.log("Fluent chaining:");
const result = orm
	.from<UserRow>("users")
	.select("id", "name", "email")
	.where((w) => w.eq("status", "active"))
	.orderBy("name", "ASC")
	.limit(20)
	.all();
console.log(result);

console.log("\n=== WHERE BUILDER DIRECTLY ===\n");

const wb = new WhereBuilder();
wb.eq("status", "published").gt("views", 100).like("title", "tutorial");
console.log(wb.build());

console.log("\n=== REUSABLE WITH ANY DB ADAPTER ===\n");

function createORM<T extends DB>(db: T) {
	return new ORM(db);
}

const myDb = createMockDB();
const myOrm = createORM(myDb);
myOrm.insert<UserRow>("users", { name: "Test", email: "test@test.com" }).run();