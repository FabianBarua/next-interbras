import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-session"
import { getUserProfile } from "@/services/user"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { StepAccount } from "./step-account"
import { ProfileCard } from "./profile-card"

export default async function CheckoutPage() {
  const sessionUser = await getCurrentUser()

  let user = sessionUser ? await getUserProfile(sessionUser.id) : null
  let missingFields: {
    name?: boolean
    phone?: boolean
    documentType?: boolean
    documentNumber?: boolean
  } | null = null

  if (sessionUser) {
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
    const m = {
      name: !u?.name,
      phone: !u?.phone,
      documentType: !u?.documentType,
      documentNumber: !u?.documentNumber,
    }
    const hasMissing = m.name || m.phone || m.documentType || m.documentNumber
    missingFields = hasMissing ? m : null
  }

  // Logged in + profile complete → show profile card
  if (user && !missingFields) {
    return <ProfileCard user={user} />
  }

  // Not logged in OR missing fields → login/register/complete-profile
  return <StepAccount user={user} missingFields={missingFields} />
}
