import {
  pgTable,
  uuid,
  unique,
} from "drizzle-orm/pg-core"
import { shippingMethods } from "./shipping-methods"
import { countries } from "./countries"

export const shippingMethodCountries = pgTable("shipping_method_countries", {
  id: uuid("id").primaryKey().defaultRandom(),
  shippingMethodId: uuid("shipping_method_id").references(() => shippingMethods.id, { onDelete: "cascade" }).notNull(),
  countryId: uuid("country_id").references(() => countries.id, { onDelete: "cascade" }).notNull(),
}, (t) => [
  unique("smc_method_country_unique").on(t.shippingMethodId, t.countryId),
])
