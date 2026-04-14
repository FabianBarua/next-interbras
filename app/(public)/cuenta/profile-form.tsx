"use client"

import { useState, useTransition } from "react"
import { User, ShieldCheck, FileText, Globe, Info, Calendar } from "lucide-react"
import { updateProfileAction, updatePasswordAction } from "@/lib/actions/profile"
import type { UserProfile } from "@/types/user"
import { useDictionary } from "@/i18n/context"
import { nationalities } from "@/lib/data/nationalities"

const inputClass = "w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
const selectClass = "w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none"
const labelClass = "text-xs font-semibold uppercase tracking-wider text-muted-foreground"

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const { dict, locale } = useDictionary()
  const [name, setName] = useState(profile.name)
  const [phone, setPhone] = useState(profile.phone ?? "")
  const [documentType, setDocumentType] = useState(profile.documentType ?? "CI")
  const [documentNumber, setDocumentNumber] = useState(profile.documentNumber ?? "")
  const [nationality, setNationality] = useState(profile.nationality ?? "")
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [profileMsg, setProfileMsg] = useState<string | null>(null)
  const [pwMsg, setPwMsg] = useState<string | null>(null)
  const [isPendingProfile, startProfileTransition] = useTransition()
  const [isPendingPw, startPwTransition] = useTransition()

  function handleProfileSubmit() {
    setProfileMsg(null)
    startProfileTransition(async () => {
      const res = await updateProfileAction({
        name,
        phone: phone || undefined,
        documentType: documentType || undefined,
        documentNumber: documentNumber || undefined,
        nationality: nationality || undefined,
      })
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

  const memberDate = new Date(profile.createdAt).toLocaleDateString(
    locale === "pt" ? "pt-BR" : "es-PY",
    { day: "numeric", month: "long", year: "numeric" },
  )

  return (
    <>
      {/* Account Info */}
      <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
        <div className="flex items-center gap-3 border-b border-border/50 bg-muted/20 px-6 sm:px-8 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
            <Info className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold">{dict.profile.accountInfo}</h2>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{dict.profile.memberSince}:</span>
              <span className="font-medium">{memberDate}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{dict.profile.loginMethod}:</span>
              <span className="font-medium">
                {profile.isOAuth ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {dict.profile.oauthGoogle}
                  </span>
                ) : dict.profile.credentials}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info */}
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
              <label className={labelClass}>{dict.profile.fullName}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-2.5">
              <label className={labelClass}>{dict.profile.phone}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+595 981 123456" />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className={labelClass}>{dict.profile.email}</label>
            <input
              type="email"
              defaultValue={profile.email}
              disabled
              className="w-full h-11 rounded-xl border border-input bg-muted/40 px-4 text-sm text-muted-foreground cursor-not-allowed outline-none"
            />
            <p className="text-[11px] text-muted-foreground/80 mt-1 font-medium pl-1">{dict.profile.emailHelp}</p>
          </div>

          {/* Document section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className={labelClass}>{dict.profile.documentType}</label>
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className={selectClass}>
                <option value="CI">CI</option>
                <option value="CPF">CPF</option>
                <option value="RG">RG</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div className="space-y-2.5">
              <label className={labelClass}>{dict.profile.documentNumber}</label>
              <input type="text" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Nationality */}
          <div className="space-y-2.5">
            <label className={labelClass}>{dict.profile.nationality}</label>
            <select value={nationality} onChange={(e) => setNationality(e.target.value)} className={selectClass}>
              <option value="">{dict.profile.selectNationality}</option>
              {nationalities.map((n) => (
                <option key={n.code} value={n.code}>
                  {n[locale as "es" | "pt"] ?? n.es}
                </option>
              ))}
            </select>
          </div>

          {profileMsg && (
            <p className={`text-sm font-medium ${profileMsg === dict.profile.changesSaved ? "text-green-600" : "text-destructive"}`}>
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

      {/* Security */}
      <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
        <div className="flex items-center gap-3 border-b border-border/50 bg-muted/20 px-6 sm:px-8 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold">{dict.profile.security}</h2>
        </div>

        <div className="p-6 sm:p-8 space-y-6 max-w-2xl">
          {profile.isOAuth ? (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300">{dict.profile.oauthNote}</p>
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                <label className={labelClass}>{dict.profile.currentPassword}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-2.5">
                <label className={labelClass}>{dict.profile.newPassword}</label>
                <input
                  type="password"
                  placeholder={dict.profile.minChars}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>

              {pwMsg && (
                <p className={`text-sm font-medium ${pwMsg === dict.profile.passwordUpdated ? "text-green-600" : "text-destructive"}`}>
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
            </>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-3xl border border-destructive/30 bg-card shadow-sm overflow-hidden ring-1 ring-destructive/10">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-destructive">{dict.profile.deleteAccount}</h3>
            <p className="text-sm text-muted-foreground mt-1">{dict.profile.deleteAccountDesc}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(dict.profile.deleteConfirm)) {
                // TODO: implement delete account action
              }
            }}
            className="px-6 h-10 border border-destructive/30 text-destructive font-semibold rounded-xl hover:bg-destructive/10 transition-colors text-sm shrink-0"
          >
            {dict.profile.deleteAccount}
          </button>
        </div>
      </div>
    </>
  )
}
