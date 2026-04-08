import { getSetting } from "./settings"

const DEFAULT_TZ = "America/Sao_Paulo"

let _tz: string | null = null
let _ts = 0
const CACHE_TTL = 60_000 // 1 min

/**
 * Site timezone from DB setting `site.timezone`.
 * Cached in-memory for 1 min.
 */
export async function getTimezone(): Promise<string> {
  const now = Date.now()
  if (_tz && now - _ts < CACHE_TTL) return _tz
  _tz = (await getSetting("site.timezone")) ?? DEFAULT_TZ
  _ts = now
  return _tz
}
