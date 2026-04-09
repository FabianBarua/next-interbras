import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { paymentTypes, shippingMethods } from "./schema"

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client)

async function seedConfig() {
  console.log("Seeding payment types...")
  await db.insert(paymentTypes).values([
    {
      slug: "cash",
      name: { es: "Efectivo", pt: "Dinheiro" },
      description: { es: "Pago contra entrega en efectivo", pt: "Pagamento na entrega em dinheiro" },
      icon: "cash",
      active: true,
      sortOrder: 0,
    },
    {
      slug: "card",
      name: { es: "Tarjeta de crédito/débito", pt: "Cartão de crédito/débito" },
      description: { es: "Pago con tarjeta al momento de la entrega", pt: "Pagamento com cartão no momento da entrega" },
      icon: "card",
      active: false,
      sortOrder: 1,
    },
    {
      slug: "transfer",
      name: { es: "Transferencia bancaria", pt: "Transferência bancária" },
      description: { es: "Transferencia a cuenta bancaria. Se confirmará tras verificar el comprobante.", pt: "Transferência para conta bancária. Confirmação após verificação do comprovante." },
      icon: "bank",
      active: false,
      sortOrder: 2,
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
      sortOrder: 0,
    },
    {
      slug: "express",
      name: { es: "Envío express", pt: "Envio expresso" },
      description: { es: "Entrega en 24-48 horas", pt: "Entrega em 24-48 horas" },
      price: "15.00",
      active: true,
      sortOrder: 1,
    },
    {
      slug: "pickup",
      name: { es: "Retiro en tienda", pt: "Retirada na loja" },
      description: { es: "Retirá tu pedido gratis en nuestro local", pt: "Retire seu pedido grátis em nossa loja" },
      price: "0.00",
      active: true,
      sortOrder: 2,
    },
  ]).onConflictDoNothing()

  console.log("Done!")
  await client.end()
  process.exit(0)
}

seedConfig().catch(async (e) => {
  console.error(e)
  await client.end()
  process.exit(1)
})
