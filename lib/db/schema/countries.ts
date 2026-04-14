import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core"
import type { I18nText } from "./i18n-helpers"

export const countries = pgTable("countries", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 5 }).unique().notNull(),
  name: jsonb("name").$type<I18nText>().notNull(),
  flag: varchar("flag", { length: 10 }).notNull(),
  currency: varchar("currency", { length: 5 }).notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
})
