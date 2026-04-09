import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core"
import { orders } from "./orders"
import { variants } from "./variants"
import type { I18nText } from "./i18n-helpers"

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  variantId: uuid("variant_id").references(() => variants.id, { onDelete: "set null" }),
  productName: jsonb("product_name").$type<I18nText>().notNull(),
  sku: varchar("sku", { length: 100 }),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 5 }).notNull().default("USD"),
})
