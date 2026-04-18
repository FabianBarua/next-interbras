import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  integer,
  decimal,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { variants } from "./variants"

export const externalCodes = pgTable("external_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  system: varchar("system", { length: 50 }).notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  externalName: varchar("external_name", { length: 255 }),
  variantId: uuid("variant_id").references(() => variants.id, { onDelete: "cascade" }),
  priceUsd: decimal("price_usd", { precision: 10, scale: 2 }),
  priceGs: decimal("price_gs", { precision: 12, scale: 0 }),
  priceBrl: decimal("price_brl", { precision: 10, scale: 2 }),
  price1: decimal("price_1", { precision: 10, scale: 2 }),
  price2: decimal("price_2", { precision: 10, scale: 2 }),
  price3: decimal("price_3", { precision: 10, scale: 2 }),
  stock: integer("stock"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (t) => [
  uniqueIndex("external_codes_system_code_idx").on(t.system, t.code),
  uniqueIndex("external_codes_variant_id_unique").on(t.variantId),
])
