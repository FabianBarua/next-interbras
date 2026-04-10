"use server"

import os from "node:os"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { redis } from "@/lib/redis"
import { requireAdmin } from "@/lib/auth/get-session"

export interface SystemStatus {
  timestamp: string
  system: {
    hostname: string
    platform: string
    arch: string
    nodeVersion: string
    processUptimeSeconds: number
    osUptimeSeconds: number
  }
  cpu: {
    cores: number
    model: string
    loadAvg: number[]
  }
  memory: {
    totalBytes: number
    freeBytes: number
    usedBytes: number
    usagePercent: number
    process: {
      rssBytes: number
      heapTotalBytes: number
      heapUsedBytes: number
      externalBytes: number
    }
  }
  database: {
    connected: boolean
    latencyMs: number
    sizeBytes: number
    activeConnections: number
    tables: { name: string; rows: number; sizeBytes: number }[]
  }
  redis: {
    connected: boolean
    latencyMs: number
    usedMemoryBytes: number
    connectedClients: number
    uptimeSeconds: number
  }
}

export async function getSystemStatus(): Promise<SystemStatus> {
  await requireAdmin()

  const cpus = os.cpus()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const mem = process.memoryUsage()

  let dbConnected = false
  let dbLatency = 0
  let dbSize = 0
  let dbActiveConns = 0
  let dbTables: { name: string; rows: number; sizeBytes: number }[] = []

  try {
    const start = performance.now()
    await db.execute(sql`SELECT 1`)
    dbLatency = Math.round((performance.now() - start) * 100) / 100
    dbConnected = true

    const [sizeResult, connsResult, tablesResult] = await Promise.all([
      db.execute(sql`SELECT pg_database_size(current_database()) AS size`),
      db.execute(sql`SELECT count(*)::int AS count FROM pg_stat_activity WHERE datname = current_database()`),
      db.execute(sql`
        SELECT
          t.table_name AS name,
          (xpath('/table/row/cnt/text()', query_to_xml('SELECT count(*) AS cnt FROM ' || quote_ident(t.table_name), false, false, '')))[1]::text::bigint AS rows,
          pg_total_relation_size(quote_ident(t.table_name))::bigint AS size_bytes
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
        ORDER BY pg_total_relation_size(quote_ident(t.table_name)) DESC
      `),
    ])

    const sizeRows = sizeResult as unknown as { size: string }[]
    const connsRows = connsResult as unknown as { count: number }[]
    const tableRows = tablesResult as unknown as { name: string; rows: number; size_bytes: string }[]

    dbSize = Number(sizeRows[0]?.size ?? 0)
    dbActiveConns = Number(connsRows[0]?.count ?? 0)
    dbTables = tableRows.map((r) => ({
      name: String(r.name),
      rows: Number(r.rows),
      sizeBytes: Number(r.size_bytes),
    }))
  } catch {
    // DB unreachable
  }

  let redisConnected = false
  let redisLatency = 0
  let redisMemory = 0
  let redisClients = 0
  let redisUptime = 0

  try {
    const start = performance.now()
    await redis.ping()
    redisLatency = Math.round((performance.now() - start) * 100) / 100
    redisConnected = true

    const info = await redis.info("memory")
    const serverInfo = await redis.info("server")
    const clientsInfo = await redis.info("clients")

    redisMemory = Number(info.match(/used_memory:(\d+)/)?.[1] ?? 0)
    redisClients = Number(clientsInfo.match(/connected_clients:(\d+)/)?.[1] ?? 0)
    redisUptime = Number(serverInfo.match(/uptime_in_seconds:(\d+)/)?.[1] ?? 0)
  } catch {
    // Redis unreachable
  }

  return {
    timestamp: new Date().toISOString(),
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      processUptimeSeconds: Math.floor(process.uptime()),
      osUptimeSeconds: Math.floor(os.uptime()),
    },
    cpu: {
      cores: cpus.length,
      model: cpus[0]?.model ?? "unknown",
      loadAvg: os.loadavg(),
    },
    memory: {
      totalBytes: totalMem,
      freeBytes: freeMem,
      usedBytes: totalMem - freeMem,
      usagePercent: Math.round(((totalMem - freeMem) / totalMem) * 1000) / 10,
      process: {
        rssBytes: mem.rss,
        heapTotalBytes: mem.heapTotal,
        heapUsedBytes: mem.heapUsed,
        externalBytes: mem.external,
      },
    },
    database: {
      connected: dbConnected,
      latencyMs: dbLatency,
      sizeBytes: dbSize,
      activeConnections: dbActiveConns,
      tables: dbTables,
    },
    redis: {
      connected: redisConnected,
      latencyMs: redisLatency,
      usedMemoryBytes: redisMemory,
      connectedClients: redisClients,
      uptimeSeconds: redisUptime,
    },
  }
}
