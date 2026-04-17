import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"

const UPLOAD_DIR = path.join(process.cwd(), "uploads")

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const segments = (await params).path
  // Sanitize: only allow filename characters, no traversal
  if (segments.some((s) => s.includes("..") || s.includes("\0") || /[<>:"|?*\\]/.test(s))) {
    return new NextResponse("Bad request", { status: 400 })
  }

  const filePath = path.join(UPLOAD_DIR, ...segments)

  // Ensure resolved path stays inside UPLOAD_DIR
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const ext = path.extname(filePath).toLowerCase()
  const contentType = EXT_TO_MIME[ext]
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 })
  }

  try {
    const data = await fs.readFile(resolved)
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}
