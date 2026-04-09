import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core"
import type { I18nText } from "./i18n-helpers"

export const attributes = pgTable("attributes", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  name: jsonb("name").$type<I18nText>().notNull(),
  description: jsonb("description").$type<I18nText>(),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
})

export const attributeValues = pgTable("attribute_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  attributeId: uuid("attribute_id").references(() => attributes.id, { onDelete: "cascade" }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  name: jsonb("name").$type<I18nText>().notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (t) => [
  index("attribute_values_attribute_id_idx").on(t.attributeId),
])
