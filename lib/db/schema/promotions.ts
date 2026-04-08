import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  decimal,
  timestamp,
  boolean,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import type { I18nText, I18nRichText } from "./i18n-helpers"
import { externalCodes } from "./external-codes"

export const promotionTypeEnum = pgEnum("promotion_type", [
  "percentage",
  "fixed",
])

export const promotions = pgTable("promotions", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  name: jsonb("name").$type<I18nText>().notNull(),
  description: jsonb("description").$type<I18nRichText>(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  active: boolean("active").default(true).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
})

export const promotionItems = pgTable("promotion_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  promotionId: uuid("promotion_id").references(() => promotions.id, { onDelete: "cascade" }).notNull(),
  externalCodeId: uuid("external_code_id").references(() => externalCodes.id, { onDelete: "cascade" }).notNull(),
  type: promotionTypeEnum("type").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
}, (t) => [
  uniqueIndex("promotion_items_promo_ext_idx").on(t.promotionId, t.externalCodeId),
])
