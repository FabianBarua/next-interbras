import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-session"
import { getUserProfile } from "@/services/user"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getActiveCountries, getShippingMethodsByCountry } from "@/services/countries"
import { EnvioFlow } from "./envio-flow"

export default async function EnvioPage() {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) redirect("/checkout")

  // Check profile completeness
  const dbUser = await db
    .select({
      name: users.name,
      phone: users.phone,
      documentType: users.documentType,
      documentNumber: users.documentNumber,
    })
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1)

  const u = dbUser[0]
  if (!u?.name || !u?.phone || !u?.documentType || !u?.documentNumber) {
    redirect("/checkout")
  }

  const user = await getUserProfile(sessionUser.id)
  if (!user) redirect("/checkout")

  // Load countries and shipping methods
  const allCountries = await getActiveCountries()
  const methodsByCountry: Record<string, Awaited<ReturnType<typeof getShippingMethodsByCountry>>> = {}
  await Promise.all(
    allCountries.map(async (c) => {
      const methods = await getShippingMethodsByCountry(c.code)
      // BR: only pickup (no delivery)
      methodsByCountry[c.code] = c.code === "BR"
        ? methods.filter((m) => !m.requiresAddress)
        : methods
    }),
  )

  return (
    <EnvioFlow
      user={user}
      countries={allCountries}
      methodsByCountry={methodsByCountry}
    />
  )
}
