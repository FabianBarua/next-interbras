import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { shippingMethods, countries, shippingMethodCountries, shippingPaymentRules } from "./schema"
import { eq } from "drizzle-orm"

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client)

async function seedConfig() {
  console.log("Seeding countries...")
  await db.insert(countries).values([
    {
      code: "PY",
      name: { es: "Paraguay", pt: "Paraguai" },
      flag: "🇵🇾",
      currency: "PYG",
      active: true,
      sortOrder: 0,
    },
    {
      code: "BR",
      name: { es: "Brasil", pt: "Brasil" },
      flag: "🇧🇷",
      currency: "BRL",
      active: true,
      sortOrder: 1,
    },
  ]).onConflictDoNothing()

  console.log("Seeding shipping methods...")
  await db.insert(shippingMethods).values([
    {
      slug: "standard",
      name: { es: "Envío estándar", pt: "Envio padrão" },
      description: { es: "Entrega en 3-5 días hábiles", pt: "Entrega em 3-5 dias úteis" },
      price: "8.50",
      active: true,
      requiresAddress: true,
      sortOrder: 0,
    },
    {
      slug: "express",
      name: { es: "Envío express", pt: "Envio expresso" },
      description: { es: "Entrega en 24-48 horas", pt: "Entrega em 24-48 horas" },
      price: "15.00",
      active: true,
      requiresAddress: true,
      sortOrder: 1,
    },
    {
      slug: "pickup",
      name: { es: "Retiro en tienda", pt: "Retirada na loja" },
      description: { es: "Retirá tu pedido gratis en nuestro local", pt: "Retire seu pedido grátis em nossa loja" },
      price: "0.00",
      active: true,
      requiresAddress: false,
      pickupConfig: {
        address: "Local Interbras, Asunción",
        hours: "Lun-Vie 8:00-17:00",
      },
      sortOrder: 2,
    },
  ]).onConflictDoNothing()

  // Link shipping methods to countries
  console.log("Linking shipping methods to countries...")
  const allCountries = await db.select().from(countries)
  const allMethods = await db.select().from(shippingMethods)

  for (const method of allMethods) {
    for (const country of allCountries) {
      // BR: only pickup (no delivery)
      if (country.code === "BR" && method.requiresAddress) continue
      await db.insert(shippingMethodCountries).values({
        shippingMethodId: method.id,
        countryId: country.id,
      }).onConflictDoNothing()
    }
  }

  // Seed shipping payment rules
  console.log("Seeding shipping payment rules...")
  const gatewayTypes = ["manual-cash", "manual-transfer", "manual-card", "pyxpay-pix", "pyxpay-card", "commpix-pix"]
  const pickupGatewayTypes = ["manual-cash", "manual-card"]

  for (const method of allMethods) {
    const allowedTypes = method.slug === "pickup" ? pickupGatewayTypes : gatewayTypes
    for (const gt of allowedTypes) {
      await db.insert(shippingPaymentRules).values({
        shippingMethodId: method.id,
        gatewayType: gt,
      }).onConflictDoNothing()
    }
  }

  console.log("Done!")
  await client.end()
  process.exit(0)
}

seedConfig().catch(async (e) => {
  console.error(e)
  await client.end()
  process.exit(1)
})
