const VARIABLE_RE = /\{\{(\w+)\}\}/g

/** Escape HTML special characters to prevent injection in emails. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Replace `{{key}}` placeholders with variable values.
 * All values are HTML-escaped unless the key is in `rawKeys`.
 */
export function renderTemplate(
  text: string,
  variables: Record<string, string>,
  rawKeys?: Set<string>,
): string {
  return text.replace(VARIABLE_RE, (_, key: string) => {
    const value = variables[key]
    if (value === undefined) return `{{${key}}}`
    if (rawKeys?.has(key)) return value
    return escapeHtml(value)
  })
}
