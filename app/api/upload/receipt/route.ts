import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import path from "path"
import fs from "fs/promises"
import crypto from "crypto"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "receipts")
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
}

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false
  switch (mimeType) {
    case "image/jpeg": return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF
    case "image/png": return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
    case "image/webp": return buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
    default: return false
  }
}

export async function POST(req: NextRequest) {
  // Auth: any logged-in user (not admin-only)
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  // Rate limit: 5 uploads per minute per user
  const rl = await rateLimit(`receipt-upload:${session.user.id}`, 5, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas subidas. Intente nuevamente." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } },
    )
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No se envió ningún archivo." }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Solo se permiten imágenes JPEG, PNG o WebP." }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "El archivo supera el límite de 2 MB." }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (!validateMagicBytes(buffer, file.type)) {
    return NextResponse.json({ error: "El contenido del archivo no coincide con el tipo declarado." }, { status: 400 })
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  const ext = MIME_TO_EXT[file.type]
  const hash = crypto.randomBytes(8).toString("hex")
  const fileName = `${Date.now()}-${hash}${ext}`
  const filePath = path.join(UPLOAD_DIR, fileName)

  await fs.writeFile(filePath, buffer)

  return NextResponse.json({ url: `/uploads/receipts/${fileName}` })
}
