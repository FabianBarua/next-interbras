"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  updateCustomerRole,
  updateCustomerInfo,
  deleteCustomer,
} from "@/lib/actions/admin/customers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Role = "user" | "admin" | "support"

type CustomerUser = {
  id: string
  name: string
  email: string
  phone: string | null
  documentType: string | null
  documentNumber: string | null
  nationality: string | null
  role: Role
}

const ROLES: {
  value: Role
  label: string
  description: string
  color: string
  bg: string
  border: string
}[] = [
  {
    value: "user",
    label: "Usuario",
    description: "Acceso solo a su cuenta y pedidos.",
    color: "text-foreground",
    bg: "bg-secondary/30",
    border: "border-border",
  },
  {
    value: "support",
    label: "Soporte",
    description: "Puede ver pedidos y clientes. Sin acceso financiero.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-400/40",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Acceso total al dashboard. Usar con cuidado.",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-400/40",
  },
]

export function CustomerRoleToggle({ customer }: { customer: CustomerUser }) {
  const [selected, setSelected] = useState<Role>(customer.role)
  const [pending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)

  const isDirty = selected !== customer.role

  function handleSave() {
    startTransition(async () => {
      const res = await updateCustomerRole(customer.id, selected)
      if (res.error) {
        alert(res.error)
        setSelected(customer.role)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Rol / Permisos</p>
        {success && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">✓ Guardado</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {ROLES.map((role) => {
          const isActive = selected === role.value
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => {
                setSelected(role.value)
                setSuccess(false)
              }}
              disabled={pending}
              className={cn(
                "rounded-md border p-3 text-left transition-all",
                isActive
                  ? `${role.bg} ${role.border} ring-2 ring-offset-1 ring-offset-background ${role.border.replace("border-", "ring-")}`
                  : "border-border bg-card hover:bg-accent/40",
              )}
            >
              <p className={cn("text-sm font-semibold", isActive && role.color)}>
                {role.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                {role.description}
              </p>
            </button>
          )
        })}
      </div>

      {isDirty && (
        <div className="mt-3 flex items-center gap-2 border-t pt-3">
          <Button size="sm" onClick={handleSave} disabled={pending} className="h-8">
            {pending
              ? "Guardando…"
              : `Guardar como ${ROLES.find((r) => r.value === selected)?.label}`}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground"
            onClick={() => setSelected(customer.role)}
            disabled={pending}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}

export function CustomerEditForm({ customer }: { customer: CustomerUser }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(customer.name)
  const [phone, setPhone] = useState(customer.phone ?? "")
  const [documentType, setDocumentType] = useState(customer.documentType ?? "")
  const [documentNumber, setDocumentNumber] = useState(customer.documentNumber ?? "")
  const [nationality, setNationality] = useState(customer.nationality ?? "")
  const [pending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const res = await updateCustomerInfo(customer.id, { name, phone, documentType, documentNumber, nationality })
      if (res.error) {
        alert(res.error)
      } else {
        setEditing(false)
      }
    })
  }

  if (!editing) {
    return (
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        Editar información
      </Button>
    )
  }

  return (
    <div className="mt-4 space-y-3 rounded-md border p-4">
      <h3 className="text-sm font-semibold">Editar información</h3>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Nombre</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Teléfono</label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="099999999"
          className="h-8"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Tipo de documento</label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">— Sin documento —</option>
          <option value="CI">CI</option>
          <option value="CPF">CPF</option>
          <option value="RG">RG</option>
          <option value="OTRO">OTRO</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Nro. documento</label>
        <Input
          value={documentNumber}
          onChange={(e) => setDocumentNumber(e.target.value)}
          placeholder="Número de documento"
          className="h-8"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Nacionalidad</label>
        <Input
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          placeholder="Nacionalidad"
          className="h-8"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={pending}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditing(false)
            setName(customer.name)
            setPhone(customer.phone ?? "")
            setDocumentType(customer.documentType ?? "")
            setDocumentNumber(customer.documentNumber ?? "")
            setNationality(customer.nationality ?? "")
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}

export function CustomerDeleteButton({ customerId }: { customerId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (
      !confirm(
        "¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.",
      )
    )
      return
    startTransition(async () => {
      const res = await deleteCustomer(customerId)
      if (res.error) {
        alert(res.error)
      } else {
        router.push("/dashboard/customers")
      }
    })
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
      {pending ? "Eliminando..." : "Eliminar cliente"}
    </Button>
  )
}
