import { getUserProfile } from "@/services/user"
import { requireAuth } from "@/lib/auth/get-session"
import { redirect } from "next/navigation"
import { ProfileForm } from "./profile-form"

export default async function AccountProfilePage() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)
  if (!profile) redirect("/login")

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Administra tu información personal y parámetros de seguridad.</p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  )
}
