import { getUserProfile } from "@/services/user"
import { requireAuth } from "@/lib/auth/get-session"
import { redirect } from "next/navigation"
import { ProfileForm } from "./profile-form"
import { getDictionary } from "@/i18n/get-dictionary"

export default async function AccountProfilePage() {
  const user = await requireAuth()
  let profile: Awaited<ReturnType<typeof getUserProfile>> = null
  try {
    profile = await getUserProfile(user.id)
  } catch (err) {
    console.error("[cuenta] Failed to load profile", err)
  }
  if (!profile) redirect("/login")
  const dict = await getDictionary()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{dict.account.profile}</h1>
        <p className="text-sm text-muted-foreground mt-1">{dict.account.profileDesc}</p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  )
}
