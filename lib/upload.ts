import path from "path"
import fs from "fs/promises"
import crypto from "crypto"

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads")

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
}

const MAGIC: Record<string, (b: Buffer) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF,
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47,
  "image/gif": (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  "image/webp": (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46,
  "image/avif": (b) => b.length >= 8 && b.subarray(4, 8).toString("ascii") === "ftyp",
}

export interface UploadOptions {
  /** Subdirectory inside uploads/ (e.g. "receipts") */
  subdir?: string
  /** Max file size in bytes */
  maxSize: number
  /** Allowed MIME types */
  allowedTypes: string[]
  /** Hash byte length (default 12) */
  hashBytes?: number
}

export interface ValidatedFile {
  ext: string
  name: string
}

/** Validate a single file. Returns error string or validated result. */
export function validateFile(file: File, opts: UploadOptions): { error: string } | ValidatedFile {
  if (!opts.allowedTypes.includes(file.type)) {
    return { error: `Tipo no permitido: ${file.type}` }
  }
  if (file.size > opts.maxSize) {
    const mb = (opts.maxSize / 1024 / 1024).toFixed(0)
    return { error: `"${file.name}" excede el límite de ${mb}MB.` }
  }
  const ext = MIME_TO_EXT[file.type]
  if (!ext) return { error: `Tipo no soportado: ${file.type}` }
  return { ext, name: file.name }
}

/** Validate magic bytes of a buffer against declared MIME type. */
export function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false
  return MAGIC[mimeType]?.(buffer) ?? false
}

/** Save a validated file to disk. Returns the public URL path. */
export async function saveFile(
  buffer: Buffer,
  ext: string,
  opts: UploadOptions,
): Promise<string> {
  const dir = opts.subdir ? path.join(UPLOAD_ROOT, opts.subdir) : UPLOAD_ROOT
  await fs.mkdir(dir, { recursive: true })

  const hash = crypto.randomBytes(opts.hashBytes ?? 12).toString("hex")
  const filename = `${Date.now()}-${hash}${ext}`
  await fs.writeFile(path.join(dir, filename), buffer)

  const urlPath = opts.subdir ? `/uploads/${opts.subdir}/${filename}` : `/uploads/${filename}`
  return urlPath
}
