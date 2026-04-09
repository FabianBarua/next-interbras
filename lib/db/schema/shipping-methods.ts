import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  boolean,
  integer,
  decimal,
  timestamp,
} from "drizzle-orm/pg-core"
import type { I18nText } from "./i18n-helpers"

export const shippingMethods = pgTable("shipping_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 50 }).unique().notNull(),
  name: jsonb("name").$type<I18nText>().notNull(),
  description: jsonb("description").$type<I18nText>(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
})
