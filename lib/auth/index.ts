import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema"
import { authConfig } from "./config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = (credentials.email as string)?.trim().toLowerCase()
        const password = credentials.password as string

        if (!email || !password) return null

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        })

        if (!user || !user.passwordHash) return null

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? "user"
      }
      if (trigger === "signIn" && token.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
        })
        if (dbUser) {
          token.role = dbUser.role
          token.passwordChangedAt = dbUser.passwordChangedAt?.getTime() ?? 0
        }
      }
      // Invalidate JWT if password was changed after token was issued
      if (token.id && token.passwordChangedAt) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
        })
        if (dbUser?.passwordChangedAt) {
          const changedAt = dbUser.passwordChangedAt.getTime()
          if (changedAt > (token.passwordChangedAt as number)) {
            return { ...token, id: undefined, role: undefined }
          }
        }
      }
      return token
    },
  },
})
