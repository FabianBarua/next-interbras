import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/get-session"
import path from "path"
import fs from "fs/promises"
import crypto from "crypto"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
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

    const ext = path.extname(file.name) || ".webp"
    const hash = crypto.randomBytes(12).toString("hex")
    const filename = `${Date.now()}-${hash}${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer)

    urls.push(`/uploads/${filename}`)
  }

  return NextResponse.json({ urls })
}
