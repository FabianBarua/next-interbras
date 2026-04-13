import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core"
import type { I18nText, I18nRichText } from "./i18n-helpers"

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  name: jsonb("name").$type<I18nText>().notNull(),
  description: jsonb("description").$type<I18nRichText>(),
  shortDescription: jsonb("short_description").$type<I18nText>(),
  image: text("image"),
  svgIcon: text("svg_icon"),
  svgIconMeta: jsonb("svg_icon_meta").$type<{ library: string; name: string }>(),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
})
