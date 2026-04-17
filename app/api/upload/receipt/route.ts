import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { validateFile, validateMagicBytes, saveFile, type UploadOptions } from "@/lib/upload"

const opts: UploadOptions = {
  subdir: "receipts",
  maxSize: 2 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  hashBytes: 8,
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const rl = await rateLimit(`receipt-upload:${session.user.id}`, 5, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas subidas. Intente nuevamente." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } },
    )
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No se envió ningún archivo." }, { status: 400 })

  const v = validateFile(file, opts)
  if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!validateMagicBytes(buffer, file.type)) {
    return NextResponse.json({ error: "El contenido no coincide con el tipo declarado." }, { status: 400 })
  }

  const url = await saveFile(buffer, v.ext, opts)
  return NextResponse.json({ url })
}
