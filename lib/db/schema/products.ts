import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core"
import type { I18nText, I18nRichText, I18nSpecs } from "./i18n-helpers"
import { categories } from "./categories"

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => categories.id).notNull(),
  slug: varchar("slug", { length: 150 }).unique().notNull(),
  name: jsonb("name").$type<I18nText>().notNull(),
  description: jsonb("description").$type<I18nRichText>(),
  specs: jsonb("specs").$type<I18nSpecs>(),
  review: jsonb("review").$type<I18nRichText>(),
  included: jsonb("included").$type<I18nRichText>(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (t) => [
  index("products_category_id_idx").on(t.categoryId),
])
