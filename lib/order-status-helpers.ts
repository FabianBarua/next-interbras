import { cachedQuery } from "@/lib/cache"
import { getAllOrderStatuses } from "@/services/admin/order-statuses"
import type { OrderStatusRecord } from "@/types/order-flow"

async function getStatusesMap(): Promise<Map<string, OrderStatusRecord>> {
  const statuses = await cachedQuery(
    "order-statuses:all",
    getAllOrderStatuses,
    300, // 5 min cache
  )
  return new Map(statuses.map((s) => [s.slug, s]))
}

export async function getStatusLabel(slug: string, locale: string): Promise<string> {
  const map = await getStatusesMap()
  const status = map.get(slug)
  if (!status) return slug
  return (status.name as Record<string, string>)[locale] ?? status.name.es ?? slug
}

export async function getStatusColor(slug: string): Promise<string> {
  const map = await getStatusesMap()
  return map.get(slug)?.color ?? "gray"
}

export async function getStatusIcon(slug: string): Promise<string> {
  const map = await getStatusesMap()
  return map.get(slug)?.icon ?? "Circle"
}

export async function getAllStatusesForDisplay(locale: string): Promise<
  { slug: string; label: string; color: string; icon: string; isFinal: boolean }[]
> {
  const map = await getStatusesMap()
  return Array.from(map.values())
    .filter((s) => s.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({
      slug: s.slug,
      label: (s.name as Record<string, string>)[locale] ?? s.name.es ?? s.slug,
      color: s.color,
      icon: s.icon,
      isFinal: s.isFinal,
    }))
}
