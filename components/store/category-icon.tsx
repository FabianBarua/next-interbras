/**
 * CategoryIcon — renders the pre-rendered SVG string stored in the DB.
 * Zero client JS: no react-icons import, no lazy loading, no hooks.
 * The SVG was generated server-side by the admin icon picker (react-icons → outerHTML).
 * Works in both server and client components.
 */

import DOMPurify from "isomorphic-dompurify"

const DEFAULT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`

/** Sanitize SVG with DOMPurify — only allow safe SVG elements/attributes */
function sanitizeSvg(raw: string): string {
  return DOMPurify.sanitize(raw, { USE_PROFILES: { svg: true, svgFilters: true } })
}

/** Inject width/height into the root <svg> tag */
function sizeSvg(svg: string, size: number): string {
  // Target only the opening <svg ...> tag
  return svg.replace(
    /(<svg\b[^>]*?)(\s*\/?>)/i,
    (_match, head: string, tail: string) => {
      // (?<!-) prevents matching stroke-width, fill-width, etc.
      head = /(?<!-)width\s*=\s*["'][^"']*["']/i.test(head)
        ? head.replace(/(?<!-)width\s*=\s*["'][^"']*["']/i, `width="${size}"`)
        : head + ` width="${size}"`
      head = /(?<!-)height\s*=\s*["'][^"']*["']/i.test(head)
        ? head.replace(/(?<!-)height\s*=\s*["'][^"']*["']/i, `height="${size}"`)
        : head + ` height="${size}"`
      return head + tail
    },
  )
}

export function CategoryIcon({
  svgIcon,
  size = 18,
  className,
}: {
  svgIcon: string | null | undefined
  size?: number
  className?: string
}) {
  const raw = svgIcon || DEFAULT_ICON
  const html = sanitizeSvg(sizeSvg(raw, size))

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
