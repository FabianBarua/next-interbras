import {
  pgTable,
  uuid,
  primaryKey,
  uniqueIndex,
  index,
  timestamp,
} from "drizzle-orm/pg-core"
import { variants } from "./variants"
import { attributes, attributeValues } from "./attributes"

export const variantAttributeValues = pgTable("variant_attribute_values", {
  variantId: uuid("variant_id").references(() => variants.id, { onDelete: "cascade" }).notNull(),
  attributeId: uuid("attribute_id").references(() => attributes.id, { onDelete: "restrict" }).notNull(),
  attributeValueId: uuid("attribute_value_id").references(() => attributeValues.id, { onDelete: "restrict" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.variantId, t.attributeValueId] }),
  uniqueIndex("variant_attribute_values_variant_attr_unique").on(t.variantId, t.attributeId),
  index("variant_attribute_values_attribute_value_idx").on(t.attributeValueId),
  index("variant_attribute_values_attribute_idx").on(t.attributeId),
])
