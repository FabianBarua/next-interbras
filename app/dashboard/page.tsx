import { getCurrentUser } from "@/lib/auth/get-session"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  return (
    <div>
      <h1 className="text-xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Bienvenido, {user?.name ?? "Admin"}.
      </p>
    </div>
  )
}
