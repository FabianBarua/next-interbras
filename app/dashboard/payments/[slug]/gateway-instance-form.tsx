"use client"

import { useActionState, useMemo, useState, useRef } from "react"
import {
  saveGatewayInstance,
  type GatewayConfigState,
} from "@/lib/actions/admin/gateway-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { ArrowLeft, Check, AlertCircle, Search } from "lucide-react"

interface Props {
  id?: string
  type: string
  slug: string
  name: string
  displayName: string
  currentCredentials: string | null
  domains: string[]
  sandbox: boolean
  active: boolean
  siteDomains: string[]
  registeredTypes: string[]
  credentialPlaceholder?: string
  isEdit?: boolean
}

export function GatewayInstanceForm({
  id,
  type: initialType,
  slug: initialSlug,
  name: initialName,
  displayName: initialDisplayName,
  currentCredentials,
  domains: initialDomains,
  sandbox: initialSandbox,
  active: initialActive,
  siteDomains,
  registeredTypes,
  credentialPlaceholder,
  isEdit,
}: Props) {
  const [state, action, pending] = useActionState<GatewayConfigState, FormData>(
    saveGatewayInstance,
    {},
  )

  const [selectedType, setSelectedType] = useState(initialType)
  const [domains, setDomains] = useState<string[]>(initialDomains)
  const [credentials, setCredentials] = useState(currentCredentials ?? "")
  const [jsonError, setJsonError] = useState("")
  const [isActive, setIsActive] = useState(initialActive)
  const [isSandbox, setIsSandbox] = useState(initialSandbox)
  const formRef = useRef<HTMLFormElement>(null)

  function toggleDomain(d: string) {
    setDomains((prev) =>
      prev.includes(d) ? prev.filter((v) => v !== d) : [...prev, d],
    )
  }

  function beautifyJson() {
    try {
      setCredentials(JSON.stringify(JSON.parse(credentials), null, 2))
      setJsonError("")
    } catch {
      setJsonError("JSON inválido")
    }
  }

  function minifyJson() {
    try {
      setCredentials(JSON.stringify(JSON.parse(credentials)))
      setJsonError("")
    } catch {
      setJsonError("JSON inválido")
    }
  }

  const PLACEHOLDERS: Record<string, string> = {
    "commpix-pix": JSON.stringify(
      {
        email: "",
        password: "",
        webhookSecret: "",
        apiUrl: "https://api.commpix.com",
        currency: "BRL",
        nature: "SERVICES_AND_OTHERS",
      },
      null,
      2,
    ),
    "pyxpay-pix": JSON.stringify({ apiKey: "", taxa: 2.5 }, null, 2),
  }

  const placeholder =
    credentialPlaceholder ?? PLACEHOLDERS[selectedType] ?? '{\n  "apiKey": "..."\n}'

  return (
    <form ref={formRef} action={action} className="space-y-6">
      {id && <input type="hidden" name="id" value={id} />}
      <input type="hidden" name="domains" value={JSON.stringify(domains)} />
      <input type="hidden" name="active" value={isActive ? "on" : ""} />
      <input type="hidden" name="sandbox" value={isSandbox ? "on" : ""} />

      {/* Row 1: Type + Slug */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-base">Tipo</Label>
          <Select name="type" value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione..." />
            </SelectTrigger>
            <SelectContent position="popper">
              {registeredTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-base" htmlFor="slug">
            Slug
          </Label>
          {isEdit && <input type="hidden" name="slug" value={initialSlug} />}
          <Input
            id="slug"
            name={isEdit ? undefined : "slug"}
            defaultValue={initialSlug}
            placeholder="commpix-principal"
            disabled={isEdit}
            className="font-mono text-base"
          />
        </div>
      </div>

      {/* Row 2: Names */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-base" htmlFor="name">
            Nombre interno
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={initialName}
            placeholder="Commpix - Principal"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-base" htmlFor="displayName">
            Nombre en checkout
          </Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={initialDisplayName}
            placeholder="PIX"
          />
        </div>
      </div>

      {/* Domains */}
      <div className="space-y-2 text-sm">
        <Label className="text-base">Dominios</Label>
        <DomainMultiSelect
          siteDomains={siteDomains}
          selected={domains}
          onToggle={toggleDomain}
        />
      </div>

      {/* Credentials */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <Label className="text-base" htmlFor="credentials">
            Credenciales (JSON)
          </Label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={beautifyJson}
              className="h-7 text-sm"
            >
              Beautify
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={minifyJson}
              className="h-7 text-sm"
            >
              Minify
            </Button>
          </div>
        </div>
        <Textarea
          id="credentials"
          name="credentials"
          rows={8}
          className="font-mono text-base"
          value={credentials}
          onChange={(e) => {
            setCredentials(e.target.value)
            setJsonError("")
          }}
          placeholder={placeholder}
        />
        {jsonError && (
          <p className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="size-3" /> {jsonError}
          </p>
        )}
      </div>

      {/* Toggles */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-base">
          <Switch checked={isActive} onCheckedChange={setIsActive} /> Activo
        </label>
        <label className="flex items-center gap-2 text-base">
          <Switch checked={isSandbox} onCheckedChange={setIsSandbox} /> Sandbox
        </label>
      </div>

      {/* Feedback */}
      {state.error && (
        <p className="flex items-center gap-1.5 text-base text-destructive">
          <AlertCircle className="size-3.5 shrink-0" /> {state.error}
        </p>
      )}
      {state.success && (
        <p className="flex items-center gap-1.5 text-base text-emerald-600 dark:text-emerald-400">
          <Check className="size-3.5 shrink-0" /> ¡Guardado con éxito!
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/payments">
            <ArrowLeft className="mr-1 size-4" /> Volver
          </Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  )
}

/* Domain Multi-Select */

const MAX_VISIBLE = 50

function DomainMultiSelect({
  siteDomains,
  selected,
  onToggle,
}: {
  siteDomains: string[]
  selected: string[]
  onToggle: (d: string) => void
}) {
  const [search, setSearch] = useState("")
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const filtered = useMemo(() => {
    if (!search) return siteDomains.slice(0, MAX_VISIBLE)
    const q = search.toLowerCase()
    const result: string[] = []
    for (const d of siteDomains) {
      if (d.includes(q)) result.push(d)
      if (result.length >= MAX_VISIBLE) break
    }
    return result
  }, [siteDomains, search])

  if (siteDomains.length === 0) {
    return (
      <p className="text-base text-muted-foreground">
        Ningún dominio configurado. Configure dominios en Configuraciones.
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-2 border-b px-3">
        <Search className="size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar dominio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        {selected.length > 0 && (
          <span className="shrink-0 text-sm text-muted-foreground">
            {selected.length} sel.
          </span>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto p-2 mt-1">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-base text-muted-foreground">
            Sin resultados.
          </p>
        ) : (
          filtered.map((d) => {
            const on = selectedSet.has(d)
            return (
              <button
                key={d}
                type="button"
                onClick={() => onToggle(d)}
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-base transition-colors ${
                  on
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 text-muted-foreground"
                }`}
              >
                <div
                  className={`flex size-4 shrink-0 items-center justify-center rounded-sm border ${
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/25"
                  }`}
                >
                  {on && <Check className="size-3" strokeWidth={3} />}
                </div>
                <span className="truncate font-mono text-sm">{d}</span>
              </button>
            )
          })
        )}
      </div>

      {!search && siteDomains.length > MAX_VISIBLE && (
        <div className="border-t px-3 py-1.5 text-center text-sm text-muted-foreground">
          Mostrando {MAX_VISIBLE} de {siteDomains.length} — use la búsqueda para filtrar.
        </div>
      )}

      {selected.length === 0 && (
        <div className="border-t px-3 py-1.5 text-sm text-muted-foreground">
          Sin selección = fallback para todos los dominios.
        </div>
      )}
    </div>
  )
}
