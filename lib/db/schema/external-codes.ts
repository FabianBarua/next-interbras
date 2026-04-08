import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  decimal,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"
import { variants } from "./variants"

export const externalCodes = pgTable("external_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  system: varchar("system", { length: 50 }).notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  externalName: varchar("external_name", { length: 255 }),
  variantId: uuid("variant_id").references(() => variants.id, { onDelete: "cascade" }).notNull(),
  priceUsd: decimal("price_usd", { precision: 10, scale: 2 }),
  priceGs: decimal("price_gs", { precision: 12, scale: 0 }),
  priceBrl: decimal("price_brl", { precision: 10, scale: 2 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (t) => [
  uniqueIndex("external_codes_system_code_idx").on(t.system, t.code),
  index("external_codes_variant_id_idx").on(t.variantId),
])
