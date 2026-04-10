import { getSystemStatus } from "@/lib/actions/admin/system-status"
import { cn } from "@/lib/utils"
import { formatInTimeZone } from "date-fns-tz"
import { getTimezone } from "@/lib/timezone"
import {
  Activity,
  Cpu,
  Database,
  MemoryStick,
  Server,
  Wifi,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(i > 1 ? 2 : 0)} ${sizes[i]}`
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h < 24) return `${h}h ${m}m`
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h`
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-block size-2.5 rounded-full",
        ok ? "bg-emerald-500" : "bg-red-500",
      )}
    />
  )
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-emerald-500",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  )
}

export default async function StatusPage() {
  const [s, tz] = await Promise.all([getSystemStatus(), getTimezone()])

  return (
    <div>
      <div className="flex items-center gap-2">
        <Activity className="size-5 text-primary" />
        <h1 className="text-xl font-bold">Estado del Sistema</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Actualizado a las{" "}
        {formatInTimeZone(new Date(s.timestamp), tz, "dd/MM/yyyy HH:mm:ss")}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* System Info */}
        <div className="rounded-md border p-4">
          <div className="flex items-center gap-2">
            <Server className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Sistema</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Stat label="Hostname" value={s.system.hostname} />
            <Stat label="Plataforma" value={`${s.system.platform} / ${s.system.arch}`} />
            <Stat label="Node.js" value={s.system.nodeVersion} />
            <Stat label="Uptime (Proceso)" value={formatDuration(s.system.processUptimeSeconds)} />
            <Stat label="Uptime (SO)" value={formatDuration(s.system.osUptimeSeconds)} />
          </div>
        </div>

        {/* CPU */}
        <div className="rounded-md border p-4">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">CPU</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Stat label="Cores" value={s.cpu.cores} />
            <Stat label="Modelo" value={s.cpu.model.split("@")[0]?.trim() ?? s.cpu.model} />
            <Stat
              label="Load Average (1 / 5 / 15 min)"
              value={s.cpu.loadAvg.map((v) => v.toFixed(2)).join(" / ")}
            />
          </div>
        </div>

        {/* Memory */}
        <div className="rounded-md border p-4">
          <div className="flex items-center gap-2">
            <MemoryStick className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Memoria</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>RAM del Sistema</span>
                <span>
                  {formatBytes(s.memory.usedBytes)} / {formatBytes(s.memory.totalBytes)} (
                  {s.memory.usagePercent}%)
                </span>
              </div>
              <ProgressBar value={s.memory.usedBytes} max={s.memory.totalBytes} />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <Stat label="Proceso (RSS)" value={formatBytes(s.memory.process.rssBytes)} />
              <Stat label="Heap Usado" value={formatBytes(s.memory.process.heapUsedBytes)} />
              <Stat label="Heap Total" value={formatBytes(s.memory.process.heapTotalBytes)} />
              <Stat label="Externo" value={formatBytes(s.memory.process.externalBytes)} />
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="rounded-md border p-4">
          <div className="flex items-center gap-2">
            <Database className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Base de Datos</h2>
            <StatusDot ok={s.database.connected} />
          </div>
          {s.database.connected ? (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <Stat label="Latencia" value={`${s.database.latencyMs} ms`} />
                <Stat label="Tamaño" value={formatBytes(s.database.sizeBytes)} />
                <Stat label="Conexiones activas" value={s.database.activeConnections} />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-destructive">Base de datos no disponible</p>
          )}
        </div>

        {/* Redis */}
        <div className="rounded-md border p-4">
          <div className="flex items-center gap-2">
            <Wifi className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Redis</h2>
            <StatusDot ok={s.redis.connected} />
          </div>
          {s.redis.connected ? (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stat label="Latencia" value={`${s.redis.latencyMs} ms`} />
              <Stat label="Memoria usada" value={formatBytes(s.redis.usedMemoryBytes)} />
              <Stat label="Clientes conectados" value={s.redis.connectedClients} />
              <Stat label="Uptime" value={formatDuration(s.redis.uptimeSeconds)} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-destructive">Redis no disponible</p>
          )}
        </div>
      </div>

      {/* Table Row Counts */}
      {s.database.connected && s.database.tables.length > 0 && (
        <div className="mt-6 rounded-md border p-4">
          <h2 className="mb-3 text-sm font-semibold">Tablas de la Base de Datos</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tabla</TableHead>
                  <TableHead className="w-32 text-right">Registros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.database.tables
                  .sort((a, b) => b.rows - a.rows)
                  .map((t) => (
                    <TableRow key={t.name}>
                      <TableCell className="font-mono text-xs">{t.name}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {t.rows.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
