import { auth } from "@/lib/auth"

export async function getSession() {
  return auth()
}

export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Not authenticated")
  }
  return session.user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== "admin") {
    throw new Error("Not authorized")
  }
  return user
}

export async function requireSupport() {
  const user = await requireAuth()
  if (user.role !== "support" && user.role !== "admin") {
    throw new Error("Not authorized")
  }
  return user
}
