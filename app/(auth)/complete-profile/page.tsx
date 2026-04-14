import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/get-session"
import { CompleteProfileForm } from "./form"

export default async function CompleteProfilePage() {
  const user = await getCurrentUser()

  // Not logged in → go to register
  if (!user) redirect("/register")

  // Check if profile is already complete
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { phone: true, documentType: true, documentNumber: true, nationality: true },
  })

  if (dbUser?.phone && dbUser?.documentNumber && dbUser?.nationality) {
    redirect("/")
  }

  return (
    <CompleteProfileForm
      defaults={{
        phone: dbUser?.phone ?? "",
        documentType: dbUser?.documentType ?? "CI",
        documentNumber: dbUser?.documentNumber ?? "",
        nationality: dbUser?.nationality ?? "",
      }}
    />
  )
}
