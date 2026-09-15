import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const miners = sqliteTable("miners", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  host: text("host").notNull(),
  port: integer("port").notNull(),
  accessToken: text("access_token"),
  tags: text("tags"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const minerSnapshots = sqliteTable("miner_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  minerId: text("miner_id").notNull().references(() => miners.id),
  summary: text("summary", { mode: "json" }),
  threads: text("threads", { mode: "json" }),
  config: text("config", { mode: "json" }),
  error: text("error"),
  threadsError: text("threads_error"),
  configError: text("config_error"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})