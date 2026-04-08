import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { users } from "./users"

export const eventLogs = pgTable("event_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 50 }).notNull().default("sistema"),
  level: varchar("level", { length: 10 }).notNull().default("info"),
  action: varchar("action", { length: 100 }).notNull(),
  message: text("message"),
  userId: uuid("user_id").references(() => users.id),
  entity: varchar("entity", { length: 100 }),
  entityId: varchar("entity_id", { length: 100 }),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("event_logs_category_created_idx").on(table.category, table.createdAt),
  index("event_logs_level_idx").on(table.level),
])
