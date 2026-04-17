import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/get-session"
import { rateLimit } from "@/lib/rate-limit"
import path from "path"
import fs from "fs/promises"
import crypto from "crypto"

const UPLOAD_DIR = path.join(process.cwd(), "uploads")
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]

/** Map validated MIME type to safe extension (never trust user filename) */
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
}

/** Validate file content starts with expected magic bytes */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false
  switch (mimeType) {
    case "image/jpeg": return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF
    case "image/png": return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
    case "image/gif": return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38
    case "image/webp": return buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
    case "image/avif": return buffer.length >= 8 && buffer.subarray(4, 8).toString("ascii") === "ftyp"
    default: return false
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Rate limit: 60 uploads per minute per admin
  const forwarded = req.headers.get("x-forwarded-for")
  const ip = req.headers.get("x-real-ip")
    || (forwarded ? forwarded.split(",").pop()?.trim() : null)
    || "unknown"
  const rl = await rateLimit(`upload:${ip}`, 60, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas subidas. Intente nuevamente." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } },
    )
  }

  const formData = await req.formData()
  const files = formData.getAll("files") as File[]

  if (!files.length) {
    return NextResponse.json({ error: "No se enviaron archivos." }, { status: 400 })
  }

  if (files.length > 20) {
    return NextResponse.json({ error: "Máximo 20 archivos por petición." }, { status: 400 })
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  const urls: string[] = []

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo no permitido: ${file.type}. Usa JPG, PNG, WebP, AVIF o GIF.` },
        { status: 400 },
      )
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo "${file.name}" excede el límite de 5MB.` },
        { status: 400 },
      )
    }

    const ext = MIME_TO_EXT[file.type] ?? ".webp"
    const hash = crypto.randomBytes(12).toString("hex")
    const filename = `${Date.now()}-${hash}${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: `El archivo "${file.name}" no es una imagen válida.` },
        { status: 400 },
      )
    }

    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer)

    urls.push(`/uploads/${filename}`)
  }

  return NextResponse.json({ urls })
}
