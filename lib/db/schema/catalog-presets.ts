import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core"
import type { I18nText, I18nRichText } from "./i18n-helpers"
import { locales } from "./locales"
import { promotions } from "./promotions"

export const catalogPageTypeEnum = pgEnum("catalog_page_type", [
  "category",
  "product",
  "banner",
  "photo",
  "custom",
])

export const catalogPresets = pgTable("catalog_presets", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  name: jsonb("name").$type<I18nText>().notNull(),
  preferredLocale: varchar("preferred_locale", { length: 5 }).references(() => locales.code).notNull(),
  promotionId: uuid("promotion_id").references(() => promotions.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
})

export const catalogPages = pgTable("catalog_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  presetId: uuid("preset_id").references(() => catalogPresets.id, { onDelete: "cascade" }).notNull(),
  pageType: catalogPageTypeEnum("page_type").notNull(),
  referenceId: uuid("reference_id"),
  title: jsonb("title").$type<I18nText>(),
  content: jsonb("content").$type<I18nRichText>(),
  sortOrder: integer("sort_order").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})
