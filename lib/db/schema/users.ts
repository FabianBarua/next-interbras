import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "support"])
export const documentTypeEnum = pgEnum("document_type", ["CI", "CPF", "RG", "OTRO"])

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date", withTimezone: true }),
  image: text("image"),
  passwordHash: text("password_hash"),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  documentType: documentTypeEnum("document_type"),
  documentNumber: varchar("document_number", { length: 30 }),
  nationality: varchar("nationality", { length: 100 }),
  role: userRoleEnum("role").notNull().default("user"),
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})
