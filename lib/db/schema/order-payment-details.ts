import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core"
import { orders } from "./orders"

export const orderPaymentDetails = pgTable("order_payment_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  gateway: varchar("gateway", { length: 50 }).notNull(),
  transactionEndToEndId: varchar("transaction_end_to_end_id", { length: 100 }),
  externalId: varchar("external_id", { length: 255 }),
  payerName: varchar("payer_name", { length: 255 }),
  payerDocument: varchar("payer_document", { length: 30 }),
  payerBankName: varchar("payer_bank_name", { length: 100 }),
  payerBankNumber: varchar("payer_bank_number", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
