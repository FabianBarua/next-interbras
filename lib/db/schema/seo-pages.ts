import { boolean, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

export const seoPages = pgTable("seo_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  path: varchar("path", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 120 }),
  description: varchar("description", { length: 320 }),
  ogTitle: varchar("og_title", { length: 120 }),
  ogDescription: varchar("og_description", { length: 320 }),
  ogImage: text("og_image"),
  canonical: varchar("canonical", { length: 500 }),
  noIndex: boolean("no_index").notNull().default(false),
  noFollow: boolean("no_follow").notNull().default(false),
  keywords: text("keywords"),
  structuredData: text("structured_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
})
