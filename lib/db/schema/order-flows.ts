import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"
import { shippingMethods } from "./shipping-methods"
import type { I18nText } from "./i18n-helpers"

export const orderFlows = pgTable("order_flows", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: jsonb("name").$type<I18nText>().notNull(),
  description: jsonb("description").$type<I18nText>(),
  shippingMethodId: uuid("shipping_method_id").references(() => shippingMethods.id, { onDelete: "set null" }),
  gatewayType: varchar("gateway_type", { length: 50 }),
  isDefault: boolean("is_default").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdateFn(() => new Date()),
}, (t) => [
  unique("order_flows_shipping_gateway_unique").on(t.shippingMethodId, t.gatewayType),
])
