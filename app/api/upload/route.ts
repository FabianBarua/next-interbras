import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/get-session"
import { rateLimit } from "@/lib/rate-limit"
import { validateFile, validateMagicBytes, saveFile, type UploadOptions } from "@/lib/upload"

const opts: UploadOptions = {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

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

  if (!files.length) return NextResponse.json({ error: "No se enviaron archivos." }, { status: 400 })
  if (files.length > 20) return NextResponse.json({ error: "Máximo 20 archivos por petición." }, { status: 400 })

  const urls: string[] = []

  for (const file of files) {
    const v = validateFile(file, opts)
    if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: `"${file.name}" no es una imagen válida.` }, { status: 400 })
    }

    urls.push(await saveFile(buffer, v.ext, opts))
  }

  return NextResponse.json({ urls })
}
