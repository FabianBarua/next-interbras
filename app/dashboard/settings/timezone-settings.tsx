"use client"

import { useMemo, useRef, useState } from "react"
import { saveTimezone } from "@/lib/actions/admin/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Check, ChevronDown, Clock, MapPin, Search } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Country mapping ──────────────────────────────────────────

const TZ_COUNTRY: Record<string, string> = {
  "America/Sao_Paulo": "Brasil",
  "America/Manaus": "Brasil",
  "America/Fortaleza": "Brasil",
  "America/Belem": "Brasil",
  "America/Recife": "Brasil",
  "America/Bahia": "Brasil",
  "America/Cuiaba": "Brasil",
  "America/Campo_Grande": "Brasil",
  "America/Porto_Velho": "Brasil",
  "America/Rio_Branco": "Brasil",
  "America/Noronha": "Brasil",
  "America/Eirunepe": "Brasil",
  "America/Maceio": "Brasil",
  "America/Araguaina": "Brasil",
  "America/Santarem": "Brasil",
  "America/Argentina/Buenos_Aires": "Argentina",
  "America/Argentina/Cordoba": "Argentina",
  "America/Argentina/Mendoza": "Argentina",
  "America/Argentina/Tucuman": "Argentina",
  "America/Argentina/Salta": "Argentina",
  "America/Argentina/San_Juan": "Argentina",
  "America/Argentina/Jujuy": "Argentina",
  "America/Argentina/Catamarca": "Argentina",
  "America/Argentina/La_Rioja": "Argentina",
  "America/Argentina/San_Luis": "Argentina",
  "America/Argentina/Rio_Gallegos": "Argentina",
  "America/Argentina/Ushuaia": "Argentina",
  "America/Santiago": "Chile",
  "America/Punta_Arenas": "Chile",
  "America/Bogota": "Colombia",
  "America/Lima": "Perú",
  "America/Caracas": "Venezuela",
  "America/Mexico_City": "México",
  "America/Cancun": "México",
  "America/Monterrey": "México",
  "America/Tijuana": "México",
  "America/Chihuahua": "México",
  "America/Merida": "México",
  "America/Hermosillo": "México",
  "America/Mazatlan": "México",
  "America/New_York": "EE.UU.",
  "America/Chicago": "EE.UU.",
  "America/Denver": "EE.UU.",
  "America/Los_Angeles": "EE.UU.",
  "America/Anchorage": "EE.UU.",
  "America/Phoenix": "EE.UU.",
  "America/Detroit": "EE.UU.",
  "America/Indiana/Indianapolis": "EE.UU.",
  "America/Toronto": "Canadá",
  "America/Vancouver": "Canadá",
  "America/Winnipeg": "Canadá",
  "America/Edmonton": "Canadá",
  "America/Halifax": "Canadá",
  "America/Montevideo": "Uruguay",
  "America/Asuncion": "Paraguay",
  "America/La_Paz": "Bolivia",
  "America/Guayaquil": "Ecuador",
  "America/Havana": "Cuba",
  "America/Panama": "Panamá",
  "America/Costa_Rica": "Costa Rica",
  "America/Guatemala": "Guatemala",
  "America/Santo_Domingo": "Rep. Dominicana",
  "America/Port-au-Prince": "Haití",
  "America/Jamaica": "Jamaica",
  "Europe/Lisbon": "Portugal",
  "Europe/London": "Reino Unido",
  "Europe/Madrid": "España",
  "Europe/Paris": "Francia",
  "Europe/Berlin": "Alemania",
  "Europe/Rome": "Italia",
  "Europe/Moscow": "Rusia",
  "Europe/Amsterdam": "Holanda",
  "Europe/Brussels": "Bélgica",
  "Europe/Zurich": "Suiza",
  "Europe/Vienna": "Austria",
  "Europe/Warsaw": "Polonia",
  "Europe/Prague": "Chequia",
  "Europe/Budapest": "Hungría",
  "Europe/Bucharest": "Rumania",
  "Europe/Athens": "Grecia",
  "Europe/Istanbul": "Turquía",
  "Europe/Helsinki": "Finlandia",
  "Europe/Stockholm": "Suecia",
  "Europe/Oslo": "Noruega",
  "Europe/Copenhagen": "Dinamarca",
  "Europe/Dublin": "Irlanda",
  "Europe/Kiev": "Ucrania",
  "Asia/Tokyo": "Japón",
  "Asia/Shanghai": "China",
  "Asia/Hong_Kong": "Hong Kong",
  "Asia/Dubai": "Emiratos Árabes",
  "Asia/Kolkata": "India",
  "Asia/Singapore": "Singapur",
  "Asia/Seoul": "Corea del Sur",
  "Asia/Bangkok": "Tailandia",
  "Asia/Jakarta": "Indonesia",
  "Asia/Taipei": "Taiwán",
  "Asia/Manila": "Filipinas",
  "Asia/Karachi": "Pakistán",
  "Asia/Dhaka": "Bangladesh",
  "Asia/Riyadh": "Arabia Saudita",
  "Asia/Tehran": "Irán",
  "Asia/Baghdad": "Irak",
  "Asia/Kuala_Lumpur": "Malasia",
  "Asia/Ho_Chi_Minh": "Vietnam",
  "Australia/Sydney": "Australia",
  "Australia/Melbourne": "Australia",
  "Australia/Brisbane": "Australia",
  "Australia/Perth": "Australia",
  "Australia/Adelaide": "Australia",
  "Pacific/Auckland": "Nueva Zelanda",
  "Pacific/Fiji": "Fiji",
  "Pacific/Honolulu": "EE.UU. (Hawái)",
  "Africa/Cairo": "Egipto",
  "Africa/Lagos": "Nigeria",
  "Africa/Johannesburg": "Sudáfrica",
  "Africa/Nairobi": "Kenia",
  "Africa/Casablanca": "Marruecos",
}

const REGION_LABELS: Record<string, string> = {
  Africa: "África",
  America: "América",
  Antarctica: "Antártica",
  Arctic: "Ártico",
  Asia: "Asia",
  Atlantic: "Atlántico",
  Australia: "Australia",
  Europe: "Europa",
  Indian: "Índico",
  Pacific: "Pacífico",
}

// ── Helpers ──────────────────────────────────────────────────

function getOffset(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date())
    return (
      parts.find((p) => p.type === "timeZoneName")?.value.replace("GMT", "UTC") ?? ""
    )
  } catch {
    return ""
  }
}

function getOffsetMinutes(tz: string): number {
  try {
    const now = new Date()
    const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }))
    const local = new Date(now.toLocaleString("en-US", { timeZone: tz }))
    return (local.getTime() - utc.getTime()) / 60000
  } catch {
    return 0
  }
}

function cityName(tz: string): string {
  const parts = tz.split("/")
  return (parts[parts.length - 1] ?? tz).replace(/_/g, " ")
}

interface TzEntry {
  value: string
  city: string
  country: string
  offset: string
  offsetMin: number
  region: string
}

function buildTimezones(): TzEntry[] {
  return Intl.supportedValuesOf("timeZone")
    .map((tz) => ({
      value: tz,
      city: cityName(tz),
      country: TZ_COUNTRY[tz] ?? "",
      offset: getOffset(tz),
      offsetMin: getOffsetMinutes(tz),
      region: tz.split("/")[0] ?? "Other",
    }))
    .sort((a, b) => a.offsetMin - b.offsetMin)
}

function groupByRegion(entries: TzEntry[]) {
  const map = new Map<string, TzEntry[]>()
  for (const e of entries) {
    const label = REGION_LABELS[e.region] ?? e.region
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(e)
  }
  return map
}

// ── Component ────────────────────────────────────────────────

interface Props {
  initialTimezone: string
}

export function TimezoneSettings({ initialTimezone }: Props) {
  const [tz, setTz] = useState(initialTimezone)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  const allTimezones = useMemo(() => buildTimezones(), [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allTimezones
    return allTimezones.filter(
      (t) =>
        t.value.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.country.toLowerCase().includes(q) ||
        t.offset.toLowerCase().includes(q),
    )
  }, [allTimezones, search])

  const grouped = useMemo(() => groupByRegion(filtered), [filtered])

  const selected = useMemo(
    () => allTimezones.find((t) => t.value === tz),
    [allTimezones, tz],
  )

  async function handleSave() {
    setError("")
    setSaved(false)
    setSaving(true)
    const res = await saveTimezone(tz)
    if (res.error) {
      setError(res.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="size-4" />
          Zona horaria
        </CardTitle>
        <CardDescription>
          Timezone IANA usado para reportes, filtros de fecha y visualización de horarios.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-hidden rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background shadow-sm">
              <Clock className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              {selected ? (
                <>
                  <p className="truncate text-sm font-medium leading-none">
                    {selected.city}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {selected.country ? `${selected.country} · ` : ""}
                    {selected.value}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ninguna zona seleccionada
                </p>
              )}
            </div>
            {selected && (
              <span className="shrink-0 rounded bg-background px-2 py-0.5 font-mono text-xs font-medium text-foreground shadow-sm">
                {selected.offset}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between border-t bg-background/60 px-4 py-2">
            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v)
                if (!v) setSearch("")
              }}
            >
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <MapPin className="size-3.5" />
                  Cambiar zona horaria
                  <ChevronDown className="size-3.5" />
                </button>
              </DialogTrigger>

              <DialogContent className="flex max-h-[600px] max-w-md flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="shrink-0 px-4 pb-0 pt-4">
                  <DialogTitle>Seleccionar zona horaria</DialogTitle>
                </DialogHeader>

                <div className="shrink-0 px-4 py-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={searchRef}
                      placeholder="Ciudad, país u offset…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto border-t">
                  {filtered.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      No se encontraron resultados.
                    </p>
                  ) : (
                    [...grouped.entries()].map(([region, entries]) => (
                      <div key={region}>
                        <div className="sticky top-0 z-10 border-b bg-muted/80 px-4 py-1.5 backdrop-blur-sm">
                          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            {region}
                          </span>
                        </div>
                        {entries.map((entry) => {
                          const isSelected = tz === entry.value
                          return (
                            <button
                              key={entry.value}
                              type="button"
                              onClick={() => {
                                setTz(entry.value)
                                setOpen(false)
                                setSearch("")
                              }}
                              className={cn(
                                "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent",
                                isSelected && "bg-accent",
                              )}
                            >
                              <div className="flex size-4 shrink-0 items-center justify-center">
                                {isSelected && (
                                  <Check className="size-4 text-primary" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium leading-none">
                                  {entry.city}
                                </p>
                                {entry.country && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {entry.country}
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                                {entry.offset}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || tz === initialTimezone}
              className="h-7 px-3 text-xs"
            >
              {saving ? "Guardando…" : saved ? "¡Guardado!" : "Guardar"}
            </Button>
          </div>
        </div>

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
