"use client"

import { useState, useTransition } from "react"
import { User, ShieldCheck } from "lucide-react"
import { updateProfileAction, updatePasswordAction } from "@/lib/actions/profile"
import type { UserProfile } from "@/types/user"
import { useDictionary } from "@/i18n/context"

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const { dict } = useDictionary()
  const [name, setName] = useState(profile.name)
  const [phone, setPhone] = useState(profile.phone ?? "")
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [profileMsg, setProfileMsg] = useState<string | null>(null)
  const [pwMsg, setPwMsg] = useState<string | null>(null)
  const [isPendingProfile, startProfileTransition] = useTransition()
  const [isPendingPw, startPwTransition] = useTransition()

  function handleProfileSubmit() {
    setProfileMsg(null)
    startProfileTransition(async () => {
      const res = await updateProfileAction({ name, phone: phone || undefined })
      if (res && "error" in res) {
        setProfileMsg(res.error as string)
      } else {
        setProfileMsg(dict.profile.changesSaved)
      }
    })
  }

  function handlePasswordSubmit() {
    setPwMsg(null)
    startPwTransition(async () => {
      const res = await updatePasswordAction({ currentPassword: currentPw, newPassword: newPw })
      if (res && "error" in res) {
        setPwMsg(res.error as string)
      } else {
        setPwMsg(dict.profile.passwordUpdated)
        setCurrentPw("")
        setNewPw("")
      }
    })
  }

  return (
    <>
      {/* Información Personal */}
      <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
        <div className="flex items-center gap-3 border-b border-border/50 bg-muted/20 px-6 sm:px-8 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold">{dict.profile.personalInfo}</h2>
        </div>

        <div className="p-6 sm:p-8 space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{dict.profile.fullName}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{dict.profile.phone}</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{dict.profile.email}</label>
            <input
              type="email"
              defaultValue={profile.email}
              disabled
              className="w-full h-11 rounded-xl border border-input bg-muted/40 px-4 text-sm text-muted-foreground cursor-not-allowed outline-none"
            />
            <p className="text-[11px] text-muted-foreground/80 mt-1 font-medium pl-1">{dict.profile.emailHelp}</p>
          </div>

          {profileMsg && (
            <p className={`text-sm font-medium ${profileMsg.includes("error") || profileMsg.includes("Error") ? "text-destructive" : "text-green-600"}`}>
              {profileMsg}
            </p>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleProfileSubmit}
              disabled={isPendingProfile}
              className="px-8 h-11 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-xs hover:shadow-md hover:scale-[1.02] duration-200 disabled:opacity-60"
            >
              {isPendingProfile ? dict.profile.saving : dict.profile.saveChanges}
            </button>
          </div>
        </div>
      </div>

      {/* Seguridad */}
      <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
        <div className="flex items-center gap-3 border-b border-border/50 bg-muted/20 px-6 sm:px-8 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold">{dict.profile.security}</h2>
        </div>

        <div className="p-6 sm:p-8 space-y-6 max-w-2xl">
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{dict.profile.currentPassword}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{dict.profile.newPassword}</label>
            <input
              type="password"
              placeholder={dict.profile.minChars}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          {pwMsg && (
            <p className={`text-sm font-medium ${pwMsg.includes("error") || pwMsg.includes("Error") || pwMsg.includes("incorrecta") || pwMsg.includes("OAuth") ? "text-destructive" : "text-green-600"}`}>
              {pwMsg}
            </p>
          )}

          <div className="pt-4">
            <button
              type="button"
              onClick={handlePasswordSubmit}
              disabled={isPendingPw || !currentPw || newPw.length < 8}
              className="px-8 h-11 border border-input font-bold rounded-xl hover:bg-muted transition-colors shadow-xs hover:shadow-xs hover:scale-[1.01] duration-200 disabled:opacity-60"
            >
              {isPendingPw ? dict.profile.updating : dict.profile.updatePassword}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
