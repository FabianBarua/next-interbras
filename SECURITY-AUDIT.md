# Auditoría de Seguridad — next-interbras

**Fecha**: Junio 2025  
**Scope**: Proyecto completo (auth, API routes, server actions, DB, config, client)

---

# Resumen Ejecutivo

- **Total de issues encontrados**: 14
- **Críticos**: 1 | **Altos**: 4 | **Medios**: 5 | **Bajos**: 4
- **Riesgo general**: **ALTO**

El proyecto tiene una base de seguridad sólida: rate limiting atómico con Redis, Zod en todas las entradas, bcrypt con costo 12, tokens de reset hasheados con SHA-256 y expiración, anti-enumeración en forgot-password, e invalidación de JWT al cambiar contraseña. Los hallazgos se concentran en endurecimiento de CSP, validación de uploads, y race conditions en stock.

---

# Hallazgos Detallados

## 1. [CRÍTICO] — Race Condition en Decremento de Stock (Checkout)

**Ubicación**: `services/orders.ts` — función `createOrder`, dentro de `db.transaction`  
**Descripción**: El stock se lee fuera de la transacción (en `variantMap`) y se verifica con un valor en memoria, pero la query de decremento usa `WHERE stock >= quantity`. Si dos peticiones concurrentes pasan la verificación en memoria al mismo tiempo, ambas podrían decrementar stock ya que la verificación `v.stock < item.quantity` se basa en datos stale.  
**Riesgo**: Over-selling — vender más unidades de las disponibles. El `WHERE stock >= quantity` mitiga parcialmente, pero la primera verificación da información falsa al usuario y la segunda query puede silenciosamente no actualizar ninguna fila sin detectar el fallo.

**Código actual**:
```ts
// Stock leído fuera de transacción
const variantMap = new Map(...)
for (const row of variantRows) {
  variantMap.set(row.v.id, { stock: row.v.stock, ... })
}

// Dentro de transacción:
for (const item of input.items) {
  const v = variantMap.get(item.variantId)!
  if (v.stock !== null) {
    if (v.stock < item.quantity) {
      throw new Error(`Stock insuficiente...`)
    }
    await tx.update(variantsTable)
      .set({ stock: sql`${variantsTable.stock} - ${item.quantity}` })
      .where(and(eq(variantsTable.id, item.variantId), sql`${variantsTable.stock} >= ${item.quantity}`))
    // ⚠ No verifica si la fila fue actualizada (rowCount === 0)
  }
}
```

**Recomendación**:
```ts
// Dentro de la transacción, leer stock con SELECT ... FOR UPDATE
for (const item of input.items) {
  const [current] = await tx
    .select({ stock: variantsTable.stock })
    .from(variantsTable)
    .where(eq(variantsTable.id, item.variantId))
    .for("update") // Lock the row
  
  if (current.stock !== null && current.stock < item.quantity) {
    throw new Error(`Stock insuficiente para ${item.variantId}`)
  }

  const result = await tx.update(variantsTable)
    .set({ stock: sql`${variantsTable.stock} - ${item.quantity}` })
    .where(and(
      eq(variantsTable.id, item.variantId),
      sql`${variantsTable.stock} >= ${item.quantity}`
    ))
  
  // Drizzle con postgres-js: verificar que se actualizó
  if (result.count === 0) {
    throw new Error(`Stock insuficiente (concurrent update)`)
  }
}
```

> **Nota**: Drizzle ORM no soporta `FOR UPDATE` directamente. Alternativa: usar `sql` raw query o verificar `result.rowCount` / `result.count` en el UPDATE.

---

## 2. [ALTO] — CSP con `unsafe-inline` y `unsafe-eval` en script-src

**Ubicación**: [next.config.mjs](next.config.mjs)  
**Descripción**: La Content Security Policy incluye `'unsafe-inline'` y `'unsafe-eval'` en la directiva `script-src`, lo que anula la protección principal contra XSS que ofrece CSP.  
**Riesgo**: Si existe cualquier vector de XSS (incluso uno menor), un atacante puede ejecutar JavaScript arbitrario ya que CSP no bloqueará scripts inline ni `eval()`.

**Código actual**:
```js
"Content-Security-Policy",
"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'"
```

**Recomendación**:
```js
// Usar nonces con Next.js para eliminar unsafe-inline/unsafe-eval
// En next.config.mjs headers, o mejor aún, generación dinámica de CSP con nonce:
"Content-Security-Policy",
"default-src 'self'; script-src 'self' 'nonce-{{NONCE}}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://accounts.google.com; frame-ancestors 'none'"
```

> Implementar la [estrategia de nonce de Next.js](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy) en middleware para generar un nonce por request y propagarlo a los scripts.  
> `style-src 'unsafe-inline'` es aceptable por la dificultad de usar nonces con CSS-in-JS.

---

## 3. [ALTO] — Upload Acepta Extensión Arbitraria del Nombre del Archivo

**Ubicación**: [app/api/upload/route.ts](app/api/upload/route.ts)  
**Descripción**: La extensión se toma directamente de `file.name` del usuario: `path.extname(file.name)`. Un admin podría subir un archivo con extensión `.html`, `.svg` (que ejecuta JS), o `.php` si hay proxy reverso con PHP. El MIME type se valida, pero MIME !== extensión.  
**Riesgo**: Almacenamiento de archivos con extensiones posibremente peligrosas (`.svg` con XSS, `.html`) servidos desde `public/uploads/` directamente por Next.js.

**Código actual**:
```ts
const ext = path.extname(file.name) || ".webp"
const hash = crypto.randomBytes(12).toString("hex")
const filename = `${Date.now()}-${hash}${ext}`
```

**Recomendación**:
```ts
// Mapear extensión desde el MIME type validado, no del nombre del archivo
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
}

const ext = MIME_TO_EXT[file.type] ?? ".webp"
const hash = crypto.randomBytes(12).toString("hex")
const filename = `${Date.now()}-${hash}${ext}`
```

---

## 4. [ALTO] — Upload No Valida Magic Bytes del Contenido

**Ubicación**: [app/api/upload/route.ts](app/api/upload/route.ts)  
**Descripción**: Solo se verifica `file.type` (el MIME type declarado por el cliente), que es trivialmente spoofeable. Un atacante admin podría enviar un archivo HTML/SVG con `Content-Type: image/png`.  
**Riesgo**: Stored XSS si otro admin o un usuario accede al archivo directamente via URL.

**Recomendación**:
```ts
// Validar magic bytes del archivo
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],  // GIF8
  "image/avif": [], // AVIF uses ftyp box — check bytes 4-8 for 'ftyp'
}

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType]
  if (!signatures || signatures.length === 0) return true
  return signatures.some(sig =>
    sig.every((byte, i) => buffer[i] === byte)
  )
}

// En el loop de archivos:
const buffer = Buffer.from(await file.arrayBuffer())
if (!validateMagicBytes(buffer, file.type)) {
  return NextResponse.json(
    { error: `El archivo "${file.name}" no es una imagen válida.` },
    { status: 400 }
  )
}
```

---

## 5. [ALTO] — `x-forwarded-for` confiado sin configuración de proxy

**Ubicación**: [middleware.ts](middleware.ts), [lib/auth/actions/login.ts](lib/auth/actions/login.ts)  
**Descripción**: El IP se obtiene de `x-forwarded-for` para rate limiting. Este header puede ser spoofed si la app no está detrás de un proxy configurado, o si el proxy no limpia el header. Un atacante puede enviar `X-Forwarded-For: 1.2.3.4` para evadir rate limits.  
**Riesgo**: Bypass total del rate limiting en login, register y forgot-password.

**Código actual**:
```ts
const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
```

**Recomendación**:
```ts
// Si usas Vercel, confiar en x-real-ip (inyectado por la plataforma)
// Si usas proxy propio, tomar solo el ÚLTIMO IP de x-forwarded-for (el que añadió tu proxy)
const forwarded = req.headers.get("x-forwarded-for")
const ip = req.headers.get("x-real-ip") 
  || (forwarded ? forwarded.split(",").pop()?.trim() : null)
  || "unknown"
```

> **En Next.js 16**, también puedes configurar `trustProxy` o usar headers específicos de la plataforma.

---

## 6. [MEDIO] — `redis.keys()` en invalidateCache — O(N) scan

**Ubicación**: [lib/cache.ts](lib/cache.ts)  
**Descripción**: `invalidateCache()` usa `redis.keys(pattern)` que escanea TODAS las keys del Redis. En producción con miles de keys, esto bloquea Redis.  
**Riesgo**: Degradación de rendimiento / DoS accidental. Cada operación admin (crear, editar, borrar producto) ejecuta `keys()`.

**Recomendación**:
```ts
// Usar SCAN en vez de KEYS
async function invalidateCache(...patterns: string[]): Promise<void> {
  for (const pattern of patterns) {
    let cursor = "0"
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100)
      cursor = nextCursor
      if (keys.length > 0) await redis.del(...keys)
    } while (cursor !== "0")
  }
}
```

> O mejor: usar un esquema de cache con TTL corto + tag-based invalidation con Redis Sets.

---

## 7. [MEDIO] — IDs no validados como UUID en Admin Actions

**Ubicación**: Múltiples archivos en `lib/actions/admin/`  
**Descripción**: Los parámetros `id` en `updateProductAction(id, data)`, `deleteProductAction(id)`, `bulkDeleteProductsAction(ids)`, etc., no se validan como UUID. Solo se verifica `if (!id)`. Lo mismo para `bulkDeleteVariantsAction(ids: string[])`.  
**Riesgo**: Bajo (Drizzle ORM parametriza queries, no hay SQL injection), pero permite enviar basura a la DB innecesariamente.

**Código actual**:
```ts
export async function deleteProductAction(id: string) {
  await requireAdmin()
  if (!id) return { error: "ID requerido." }
  // id no se valida como UUID
}

export async function bulkDeleteProductsAction(ids: string[]) {
  await requireAdmin()
  if (!ids?.length) return { error: "..." }
  // ids[] no se valida — podrían ser strings arbitrarios
}
```

**Recomendación**:
```ts
const uuidSchema = z.string().uuid()
const uuidArraySchema = z.array(z.string().uuid()).min(1).max(200)

export async function deleteProductAction(id: string) {
  await requireAdmin()
  const parsed = uuidSchema.safeParse(id)
  if (!parsed.success) return { error: "ID inválido." }
  // ...
}

export async function bulkDeleteProductsAction(ids: unknown) {
  await requireAdmin()
  const parsed = uuidArraySchema.safeParse(ids)
  if (!parsed.success) return { error: "IDs inválidos." }
  // ...
}
```

---

## 8. [MEDIO] — Bulk Operations sin límite en N queries seriales

**Ubicación**: `services/admin/variants.ts` — `bulkDeleteVariants`, `bulkUpdateVariantsActive`, `bulkCreateVariants`  
**Descripción**: Los bulk operations iteran uno por uno con un `for` loop, haciendo N queries individuales. Con la validación actual de `.max(50)` en `bulkCreateSchema` está parcialmente mitigado para create, pero delete/toggle no tienen límite de array.  
**Riesgo**: Un admin podría enviar cientos de IDs causando cientos de queries secuenciales, degradando el rendimiento de la DB.

**Recomendación**:
```ts
// Para deletes y toggles, usar inArray en una sola query:
export async function bulkDeleteVariants(ids: string[]): Promise<number> {
  const result = await db.delete(variants).where(inArray(variants.id, ids))
  await invalidateCache("products:*", "variants:*")
  return result.rowCount ?? ids.length
}

export async function bulkUpdateVariantsActive(ids: string[], active: boolean): Promise<void> {
  await db.update(variants).set({ active }).where(inArray(variants.id, ids))
  await invalidateCache("products:*", "variants:*")
}
```

> Y validar `.max(200)` en el Zod schema del action para `bulkDeleteVariantsAction`.

---

## 9. [MEDIO] — `connect-src 'self' https:` en CSP es permisivo

**Ubicación**: [next.config.mjs](next.config.mjs)  
**Descripción**: `connect-src 'self' https:` permite conexiones fetch/XHR a cualquier dominio HTTPS fuera de la app. Si existe un vector XSS, los datos se pueden exfiltrar a cualquier servidor.  
**Riesgo**: Debilita CSP contra exfiltración de datos.

**Recomendación**:
```js
// Especificar solo los dominios necesarios
"connect-src 'self' https://accounts.google.com https://*.googleapis.com"
```

---

## 10. [MEDIO] — Search API carga todos los productos en memoria

**Ubicación**: [app/api/search/route.ts](app/api/search/route.ts)  
**Descripción**: La API de búsqueda llama `getProducts()` que carga TODOS los productos y luego filtra en memoria con `.filter()` y `.slice(0, 10)`.  
**Riesgo**: A medida que crezca el catálogo (miles de productos), cada búsqueda consume memoria significativa. Múltiples requests concurrentes podrían causar OOM.

**Recomendación**:
```ts
// Implementar búsqueda a nivel de DB con ILIKE o Full-Text Search
import { ilike, or, sql } from "drizzle-orm"

const results = await db.select(...)
  .from(products)
  .where(or(
    sql`${products.name}->>'es' ILIKE ${'%' + query + '%'}`,
    sql`${products.name}->>'pt' ILIKE ${'%' + query + '%'}`,
  ))
  .limit(10)
```

> Esto está parcialmente mitigado por el cache de Redis (300s TTL), pero sigue siendo un problema de escalabilidad.

---

## 11. [BAJO] — Redis Error Handler silencioso

**Ubicación**: [lib/redis.ts](lib/redis.ts)  
**Descripción**: `client.on("error", () => {})` — los errores de conexión Redis se ignoran completamente sin logging.  
**Riesgo**: Problemas de Redis pasan desapercibidos en producción (OOM, conexión perdida, etc.).

**Recomendación**:
```ts
client.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message)
})
```

---

## 12. [BAJO] — `trustHost: true` en NextAuth sin host explícito

**Ubicación**: [lib/auth/config.ts](lib/auth/config.ts)  
**Descripción**: `trustHost: true` confía en cualquier header `Host` sin validación. En combinación con reverse proxies mal configurados, podría permitir host header injection.  
**Riesgo**: Bajo si se usa con Vercel (que controla el header). Potencialmente medio si se despliega en infraestructura propia.

**Recomendación**: Aceptable para Vercel. Si se despliega en servidor propio, definir `NEXTAUTH_URL` explícitamente y eliminar `trustHost`.

---

## 13. [BAJO] — No hay audit logging en operaciones admin

**Ubicación**: Todas las funciones en `lib/actions/admin/*`  
**Descripción**: Las operaciones de creación, actualización y eliminación de productos, categorías, variantes, etc. no registran eventos en `event_logs`. Solo las acciones de auth (login, register) usan `logEvent()`.  
**Riesgo**: No hay trazabilidad de qué admin hizo qué cambio y cuándo.

**Recomendación**:
```ts
export async function deleteProductAction(id: string) {
  const session = await requireAdmin()
  // ...
  await deleteProduct(id)
  await logEvent({
    category: "admin",
    action: "product.delete",
    entity: "product",
    entityId: id,
    userId: session.user.id,
  })
  return { success: true }
}
```

---

## 14. [BAJO] — Seed tiene password hardcodeado como fallback

**Ubicación**: [lib/db/seed.ts](lib/db/seed.ts)  
**Descripción**: `process.env.SEED_ADMIN_PASSWORD ?? "Admin@2024!Secure"` — si no se define la env var, se usa un password predecible.  
**Riesgo**: Bajo (solo afecta desarrollo/staging), pero si el seed se ejecuta en producción sin la env var, la cuenta admin tendría una contraseña conocida.

**Recomendación**:
```ts
const adminPassword = process.env.SEED_ADMIN_PASSWORD
if (!adminPassword) {
  console.error("❌ SEED_ADMIN_PASSWORD env var is required")
  process.exit(1)
}
```

---

# Mejoras Generales Recomendadas

1. **Migrar CSP a nonce-based** — Eliminar `unsafe-inline`/`unsafe-eval` usando la API de nonces de Next.js en middleware.
2. **Implementar audit trail** — Agregar `logEvent()` a todas las operaciones admin CRUD para trazabilidad.
3. **Búsqueda en DB** — Reemplazar búsqueda en memoria por Full-Text Search de PostgreSQL para escalabilidad.
4. **SCAN en vez de KEYS** — Redis `KEYS` es O(N); usar `SCAN` incrementalmente.
5. **Validar IDs como UUID** — Agregar `z.string().uuid()` a todos los parámetros de ID en server actions.
6. **Magic bytes en uploads** — Validar headers de archivo además del MIME type declarado.
7. **Monitorear Redis** — Agregar logging a errores de Redis para detección proactiva de problemas.
8. **Considerar `npm audit`** — Ejecutar `pnpm audit` periódicamente para detectar vulnerabilidades en dependencias.
9. **Rate limiting en admin routes** — Si la cuenta admin se compromete, no hay rate limiting que frene bulk operations destructivas.
10. **Bulk operations atómicas** — Usar `inArray` en vez de loops seriales para operaciones batch.

---

# Lo que está bien hecho ✓

- **Rate limiting atómico** con Lua script en Redis (login, register, forgot-password, reset-password, checkout, wishlist)
- **Zod validation** en todas las server actions sin excepción
- **bcrypt cost 12** para password hashing
- **Anti-enumeración** en forgot-password (siempre retorna éxito)
- **SHA-256 hashed tokens** con expiración para password reset
- **JWT invalidation** al cambiar contraseña (`passwordChangedAt` vs token `iat`)
- **AES-256-GCM** para settings cifrados con IV + auth tag
- **Security headers** completos (HSTS 2yr+preload, X-Frame-Options DENY, X-Content-Type-Options nosniff, Permissions-Policy)
- **File upload** restringido a admin, con type whitelist, size limit y filenames random
- **Ownership checks** en address CRUD (verifica `userId` antes de eliminar)
- **Drizzle ORM** parametriza todas las queries — no hay SQL injection posible
- **Cascade deletes** correctamente configurados en FK constraints
- **No hay `dangerouslySetInnerHTML`** con datos de usuario (solo en chart.tsx con data hardcodeada de themes)

---

# Checklist de Seguimiento

- [x] Fijar race condition de stock en `createOrder` (SELECT FOR UPDATE o check rowCount)
- [x] Eliminar `'unsafe-inline'` y `'unsafe-eval'` de CSP, implementar nonces
- [x] Derivar extensión de upload desde MIME type, no del filename del usuario
- [x] Agregar validación de magic bytes en uploads
- [x] Evaluar `x-real-ip` o estrategia de IP para rate limiting
- [x] Reemplazar `redis.keys()` por `redis.scan()` en `invalidateCache`
- [x] Agregar `z.string().uuid()` a parámetros de ID en admin actions
- [x] Refactorizar bulk deletes/toggles para usar `inArray` en una sola query
- [x] Restringir `connect-src` en CSP a dominios específicos
- [x] Implementar búsqueda en DB para `/api/search`
- [x] Agregar logging a errores de Redis
- [x] Agregar audit logging a operaciones admin
- [x] Eliminar password fallback en seed.ts
- [ ] Ejecutar `pnpm audit` y actualizar dependencias vulnerables
