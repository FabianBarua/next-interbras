import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-session"
import { getUserProfile } from "@/services/user"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getCheckoutSession } from "@/lib/actions/checkout-session"
import { getPaymentOptionsForMethod } from "@/services/countries"
import { PagoFlow } from "./pago-flow"

export default async function PagoPage() {
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

  // Session gate — must have shipping selection
  const checkoutSession = await getCheckoutSession()
  if (!checkoutSession) redirect("/checkout/envio")

  const user = await getUserProfile(sessionUser.id)
  if (!user) redirect("/checkout")

  // Load payment options for the selected shipping method
  let paymentOptions = await getPaymentOptionsForMethod(checkoutSession.shippingMethodId)

  // BR: only manual payment types
  if (checkoutSession.countryCode === "BR") {
    paymentOptions = paymentOptions.filter((o) => o.gatewayType.startsWith("manual-"))
  }

  return (
    <PagoFlow
      user={user}
      session={checkoutSession}
      paymentOptions={paymentOptions}
    />
  )
}
