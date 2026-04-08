import { pgTable, varchar, boolean } from "drizzle-orm/pg-core"

export const locales = pgTable("locales", {
  code: varchar("code", { length: 5 }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
})
