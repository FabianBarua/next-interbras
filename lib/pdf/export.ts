"use client"

/**
 * PDF export: captures each DOM element as PNG via html-to-image, then embeds
 * each PNG into its own pdf-lib page sized exactly to the image dimensions.
 * No slicing, no A4 constraint — every section fits perfectly.
 */

import * as htmlToImage from "html-to-image"
import { PDFDocument } from "pdf-lib"

export interface ExportProgress {
  index: number
  total: number
  stage: "capturing" | "rendering" | "saving" | "done"
  label?: string
}

export interface ExportOptions {
  targets: HTMLElement[]
  fileName: string
  /** Device pixel ratio (higher = sharper). Default 2. */
  pixelRatio?: number
  onProgress?: (p: ExportProgress) => void
}

/** Temporarily hides all [data-pdf-hide] children of el, returns a restore fn. */
function hideUiChrome(el: HTMLElement): () => void {
  const hidden: Array<{ node: HTMLElement; was: string }> = []
  el.querySelectorAll<HTMLElement>("[data-pdf-hide]").forEach((node) => {
    hidden.push({ node, was: node.style.display })
    node.style.display = "none"
  })
  return () => {
    for (const { node, was } of hidden) node.style.display = was
  }
}

/** Two rAF ticks so the browser has time to repaint after style mutations. */
function nextPaint(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
}

/** Capture an element as a PNG Uint8Array via html-to-image. */
async function capturePng(el: HTMLElement, pixelRatio: number): Promise<Uint8Array> {
  const dataUrl = await htmlToImage.toPng(el, {
    pixelRatio,
    cacheBust: true,
    includeQueryParams: true,
    // Keep background white even if element has transparent bg
    backgroundColor: "#ffffff",
  })
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j)
  return bytes
}

export async function exportPdf({
  targets,
  fileName,
  pixelRatio = 2,
  onProgress,
}: ExportOptions): Promise<void> {
  if (targets.length === 0) throw new Error("No targets to export")

  const pdfDoc = await PDFDocument.create()
  const total = targets.length

  for (let i = 0; i < total; i++) {
    const el = targets[i]
    onProgress?.({ index: i, total, stage: "capturing", label: el.dataset.exportLabel })

    // Hide edit-mode chrome before capture
    const restoreChrome = hideUiChrome(el)
    await nextPaint()

    let pngBytes: Uint8Array
    try {
      pngBytes = await capturePng(el, pixelRatio)
    } finally {
      restoreChrome()
    }

    onProgress?.({ index: i, total, stage: "rendering", label: el.dataset.exportLabel })

    // Embed PNG and create a page exactly as large as the image (in pt)
    // At pixelRatio, the image is pixelRatio× the CSS pixels.
    // 1 CSS px → 1 pt (both are 1/72 in at 96dpi screen) — close enough for PDF.
    const img = await pdfDoc.embedPng(pngBytes)
    const pageW = img.width / pixelRatio
    const pageH = img.height / pixelRatio
    const page = pdfDoc.addPage([pageW, pageH])
    page.drawImage(img, { x: 0, y: 0, width: pageW, height: pageH })
  }

  onProgress?.({ index: total, total, stage: "saving" })

  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `${fileName}.pdf`
  anchor.click()
  // Revoke after a short delay to allow the download to start
  setTimeout(() => URL.revokeObjectURL(url), 5000)

  onProgress?.({ index: total, total, stage: "done" })
}
