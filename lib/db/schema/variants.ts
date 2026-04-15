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
import { products } from "./products"

export const variants = pgTable("variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  sku: varchar("sku", { length: 100 }).unique().notNull(),
  options: jsonb("options").$type<Record<string, string>>().notNull(),
  unitsPerBox: integer("units_per_box"),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (t) => [
  index("variants_product_id_idx").on(t.productId),
])
