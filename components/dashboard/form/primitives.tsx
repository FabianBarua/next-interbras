"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/* ─────────── Style tokens ─────────── */

export const inputCls =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
export const smallInputCls =
  "h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
export const textareaCls =
  "w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 resize-y"

/* ─────────── Utilities ─────────── */

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/* ─────────── Field wrapper ─────────── */

export function Field({
  label,
  required,
  hint,
  className,
  children,
}: {
  label?: React.ReactNode
  required?: boolean
  hint?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

/* ─────────── Inputs ─────────── */

type TextFieldProps = {
  label?: React.ReactNode
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
  hint?: React.ReactNode
  mono?: boolean
  small?: boolean
  type?: "text" | "number"
  min?: number
  className?: string
  inputClassName?: string
  disabled?: boolean
}

export function TextField({
  label,
  value,
  onChange,
  required,
  placeholder,
  hint,
  mono,
  small,
  type = "text",
  min,
  className,
  inputClassName,
  disabled,
}: TextFieldProps) {
  const base = small ? smallInputCls : inputCls
  return (
    <Field label={label} required={required} hint={hint} className={className}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        min={min}
        disabled={disabled}
        className={`${base} ${mono ? "font-mono" : ""} ${disabled ? "opacity-50" : ""} ${inputClassName ?? ""}`}
      />
    </Field>
  )
}

export function SlugField({
  value,
  onChange,
  placeholder,
  label = "Slug",
  hint,
  required,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label?: React.ReactNode
  hint?: React.ReactNode
  required?: boolean
}) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(v) => onChange(v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
      placeholder={placeholder}
      hint={hint}
      required={required}
      mono
    />
  )
}

export function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label?: React.ReactNode
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <Field label={label}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={textareaCls}
      />
    </Field>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  required,
  hint,
  small,
}: {
  label?: React.ReactNode
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  required?: boolean
  hint?: React.ReactNode
  small?: boolean
}) {
  const base = small ? smallInputCls : inputCls
  return (
    <Field label={label} required={required} hint={hint}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={base}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function SwitchField({
  label,
  checked,
  onChange,
  trueLabel = "Activo",
  falseLabel = "Inactivo",
}: {
  label?: React.ReactNode
  checked: boolean
  onChange: (v: boolean) => void
  trueLabel?: string
  falseLabel?: string
}) {
  return (
    <Field label={label}>
      <label className="flex h-9 items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 rounded border-input"
        />
        <span className="text-sm">{checked ? trueLabel : falseLabel}</span>
      </label>
    </Field>
  )
}

/* ─────────── Layout ─────────── */

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border bg-card p-6 space-y-4 ${className ?? ""}`}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Grid({
  cols = 2,
  children,
  className,
}: {
  cols?: 1 | 2 | 3 | 4
  children: React.ReactNode
  className?: string
}) {
  const map: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  }
  return <div className={`grid gap-4 ${map[cols]} ${className ?? ""}`}>{children}</div>
}

/* ─────────── Status banners ─────────── */

export function ErrorBanner({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
      {children}
    </div>
  )
}

export function SuccessBanner({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return (
    <div className="rounded-lg border border-green-500/30 bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
      {children}
    </div>
  )
}

/* ─────────── Back link ─────────── */

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" /> {children}
    </Link>
  )
}

/* ─────────── Form actions footer ─────────── */

export function FormActions({
  onSave,
  onCancel,
  cancelHref,
  saveLabel = "Guardar",
  pending,
  disabled,
  onDelete,
  deleteLabel = "Eliminar",
  sticky,
  extra,
}: {
  onSave: () => void
  onCancel?: () => void
  cancelHref?: string
  saveLabel?: string
  pending?: boolean
  disabled?: boolean
  onDelete?: () => void
  deleteLabel?: string
  sticky?: boolean
  extra?: React.ReactNode
}) {
  const content = (
    <>
      <Button onClick={onSave} disabled={pending || disabled}>
        {pending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
        {saveLabel}
      </Button>
      {cancelHref ? (
        <Button variant="outline" asChild>
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
      ) : onCancel ? (
        <Button variant="outline" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
      ) : null}
      {extra}
      {onDelete && (
        <Button
          variant="ghost"
          className="ml-auto text-destructive hover:text-destructive"
          onClick={onDelete}
          disabled={pending}
        >
          <Trash2 className="mr-1.5 size-3.5" /> {deleteLabel}
        </Button>
      )}
    </>
  )

  if (sticky) {
    return (
      <div className="sticky bottom-4 z-10">
        <div className="flex items-center gap-3 rounded-2xl border bg-background/90 p-3 shadow-lg backdrop-blur">
          {content}
        </div>
      </div>
    )
  }
  return <div className="flex items-center gap-3 pt-2">{content}</div>
}

/* ─────────── Confirm delete dialog ─────────── */

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = "Confirmar eliminación",
  description,
  onConfirm,
  pending,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title?: string
  description: React.ReactNode
  onConfirm: () => void
  pending?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
