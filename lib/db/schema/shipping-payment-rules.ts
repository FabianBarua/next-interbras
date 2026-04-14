import {
  pgTable,
  uuid,
  varchar,
  unique,
} from "drizzle-orm/pg-core"
import { shippingMethods } from "./shipping-methods"

export const shippingPaymentRules = pgTable("shipping_payment_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  shippingMethodId: uuid("shipping_method_id").references(() => shippingMethods.id, { onDelete: "cascade" }).notNull(),
  gatewayType: varchar("gateway_type", { length: 50 }).notNull(),
}, (t) => [
  unique("spr_method_gateway_unique").on(t.shippingMethodId, t.gatewayType),
])
