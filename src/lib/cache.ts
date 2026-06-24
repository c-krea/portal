import { unstable_cache, revalidateTag } from "next/cache"

// Single knob for how long the portal serves a stored copy before recomputing.
// Portal-visible data changes only on the daily ERP sync or on admin edits, and
// every such write busts the matching tag below — so a 30-min window shows
// nothing meaningfully stale while cutting Vercel CPU sharply. Tune here.
export const CACHE_TTL_SECONDS = 1800 // 30 minutes

// Every data-cache tag. Add a tag here when you cache a new domain so the broad
// invalidators (ERP sync, financial-rule edits) cover it automatically.
export const CACHE_TAGS = ["pagos", "gastos", "locales", "mora", "dashboard", "proyecciones", "facturas", "medidores"] as const
export type CacheTag = (typeof CACHE_TAGS)[number]

// Wrap a data-layer read in the shared 30-min cache under one domain tag.
// keyParts must be unique per function; call arguments (month/periodo/…) are
// part of the key automatically, so each distinct month caches separately.
export function cached<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  keyParts: string[],
  tag: CacheTag,
): (...args: A) => Promise<R> {
  return unstable_cache(fn, keyParts, { revalidate: CACHE_TTL_SECONDS, tags: [tag] })
}

// Refresh specific data caches after a write that changes their underlying data.
// Next 16: revalidateTag needs a cache-life profile — "max" = stale-while-revalidate.
export function bustTags(...tags: CacheTag[]): void {
  for (const tag of tags) revalidateTag(tag, "max")
}

// Refresh every data cache — use after the daily ERP sync or a financial-rule
// edit, both of which move figures across all screens.
export function bustAllCaches(): void {
  bustTags(...CACHE_TAGS)
}
