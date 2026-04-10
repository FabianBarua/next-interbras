import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import bcrypt from "bcryptjs"
import * as schema from "./schema"

async function seed() {
  const connectionString = process.env.DATABASE_URL!
  const client = postgres(connectionString)
  const db = drizzle(client, { schema })

  console.log("⏳ Seeding database...")

  // 1. Create admin user
  const adminEmail = "admin@interbras.com"
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (!adminPassword) {
    console.error("❌ SEED_ADMIN_PASSWORD env var is required")
    process.exit(1)
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12)

  await db
    .insert(schema.users)
    .values({
      name: "Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
    })
    .onConflictDoNothing({ target: schema.users.email })

  console.log(`✅ Admin user: ${adminEmail}`)

  // 2. Create email templates
  await db
    .insert(schema.emailTemplates)
    .values([
      {
        slug: "welcome",
        subject: "Bem-vindo, {{nome}}!",
        bodyHtml: `
          <h1>Bem-vindo, {{nome}}!</h1>
          <p>Sua conta foi criada com sucesso.</p>
          <p>Acesse: <a href="{{siteUrl}}">{{siteUrl}}</a></p>
        `.trim(),
        variables: ["nome", "siteUrl"],
      },
      {
        slug: "password-reset",
        subject: "Redefinir sua senha",
        bodyHtml: `
          <h1>Olá, {{nome}}</h1>
          <p>Você solicitou a redefinição da sua senha.</p>
          <p>Clique no link abaixo para criar uma nova senha:</p>
          <p><a href="{{link}}">Redefinir senha</a></p>
          <p>Este link expira em 1 hora.</p>
          <p>Se você não solicitou isso, ignore este email.</p>
        `.trim(),
        variables: ["nome", "link"],
      },
    ])
    .onConflictDoNothing({ target: schema.emailTemplates.slug })

  console.log("✅ Email templates: welcome, password-reset")

  // 3. Create default settings
  const defaultSettings = [
    { key: "site.name", value: "Interbras" },
    { key: "site.timezone", value: "America/Sao_Paulo" },
  ]

  for (const s of defaultSettings) {
    await db
      .insert(schema.settings)
      .values({ key: s.key, value: s.value, encrypted: false })
      .onConflictDoNothing({ target: schema.settings.key })
  }

  console.log("✅ Default settings created")

  await client.end()
  console.log("🎉 Seed complete!")
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})
