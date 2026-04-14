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

export const orderStatuses = pgTable("order_statuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 50 }).unique().notNull(),
  name: jsonb("name").$type<I18nText>().notNull(),
  description: jsonb("description").$type<I18nText>(),
  color: varchar("color", { length: 30 }).notNull().default("gray"),
  icon: varchar("icon", { length: 50 }).notNull().default("Circle"),
  isFinal: boolean("is_final").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdateFn(() => new Date()),
})
