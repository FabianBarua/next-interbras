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

export const paymentTypes = pgTable("payment_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 50 }).unique().notNull(),
  name: jsonb("name").$type<I18nText>().notNull(),
  description: jsonb("description").$type<I18nText>(),
  icon: varchar("icon", { length: 30 }).notNull().default("cash"),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
})
