"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { upsertSeoPage, deleteSeoPage } from "@/lib/actions/admin/seo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SeoPage {
  id: string
  path: string
  title: string | null
  description: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  canonical: string | null
  noIndex: boolean
  noFollow: boolean
  keywords: string | null
  structuredData: string | null
}

interface KnownPage {
  path: string
  label: string
}

interface Props {
  pages: SeoPage[]
  knownPages: KnownPage[]
  siteUrl: string
  siteName: string
}

const EMPTY_FORM = {
  path: "",
  title: "",
  description: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  canonical: "",
  noIndex: false,
  noFollow: false,
  keywords: "",
  structuredData: "",
}

export function SeoManager({ pages, knownPages, siteUrl, siteName }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<typeof EMPTY_FORM | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const existingPaths = new Set(pages.map((p) => p.path))
  const unconfigured = knownPages.filter((kp) => !existingPaths.has(kp.path))

  function openNew(path = "") {
    setEditing({ ...EMPTY_FORM, path })
    setError("")
    setSuccess("")
    setDialogOpen(true)
  }

  function openEdit(page: SeoPage) {
    setEditing({
      path: page.path,
      title: page.title ?? "",
      description: page.description ?? "",
      ogTitle: page.ogTitle ?? "",
      ogDescription: page.ogDescription ?? "",
      ogImage: page.ogImage ?? "",
      canonical: page.canonical ?? "",
      noIndex: page.noIndex,
      noFollow: page.noFollow,
      keywords: page.keywords ?? "",
      structuredData: page.structuredData ?? "",
    })
    setError("")
    setSuccess("")
    setDialogOpen(true)
  }

  async function handleUploadOgImage(file: File) {
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const json = await res.json()
      if (json.url) {
        setEditing((prev) => (prev ? { ...prev, ogImage: json.url } : prev))
      } else {
        setError(json.error || "Error al subir la imagen")
      }
    } catch {
      setError("Error al subir la imagen")
    }
    setUploading(false)
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    setError("")
    setSuccess("")

    const res = await upsertSeoPage(editing)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess("¡Guardado correctamente!")
      setTimeout(() => {
        setDialogOpen(false)
        router.refresh()
      }, 500)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteSeoPage(deleteTarget)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <>
      {/* Configured pages */}
      {pages.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Páginas configuradas
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => {
              const label = knownPages.find((kp) => kp.path === page.path)?.label
              return (
                <Card
                  key={page.id}
                  className="cursor-pointer transition-colors hover:border-primary/40"
                  onClick={() => openEdit(page)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs text-muted-foreground">
                          {page.path}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-medium">
                          {page.title || label || "Sin título"}
                        </p>
                        {page.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {page.description}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        {page.noIndex && (
                          <Badge variant="destructive" className="text-[10px]">
                            noindex
                          </Badge>
                        )}
                        {page.ogImage && (
                          <Badge variant="secondary" className="text-[10px]">
                            OG img
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Mini preview */}
                    <div className="mt-3 rounded border bg-muted/30 p-2">
                      <p className="truncate text-xs font-medium text-blue-600 dark:text-blue-400">
                        {page.ogTitle || page.title || "Título de la página"}
                      </p>
                      <p className="truncate text-[10px] text-green-700 dark:text-green-500">
                        {new URL(siteUrl).hostname}
                        {page.path}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
                        {page.ogDescription ||
                          page.description ||
                          "Descripción de la página..."}
                      </p>
                    </div>

                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(page.path)
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Unconfigured pages */}
      {unconfigured.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Páginas sin SEO
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {unconfigured.map((kp) => (
              <button
                key={kp.path}
                onClick={() => openNew(kp.path)}
                className="rounded-md border border-dashed p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <p className="text-sm font-medium">{kp.label}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {kp.path}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add custom page */}
      <div className="mt-6">
        <Button variant="outline" size="sm" onClick={() => openNew()}>
          + Página personalizada
        </Button>
      </div>

      {/* Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.path ? `SEO — ${editing.path}` : "Nueva página SEO"}
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-6 pt-2">
              {/* Path */}
              <div className="space-y-1.5">
                <Label>Ruta de la página</Label>
                <Input
                  value={editing.path}
                  onChange={(e) =>
                    setEditing({ ...editing, path: e.target.value })
                  }
                  placeholder="/"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Ej: /, /productos, /faq
                </p>
              </div>

              {/* Basic SEO */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Meta Tags Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>Título</Label>
                      <span className="text-xs text-muted-foreground">
                        {editing.title.length}/120
                      </span>
                    </div>
                    <Input
                      value={editing.title}
                      onChange={(e) =>
                        setEditing({ ...editing, title: e.target.value })
                      }
                      placeholder={`Título de la página — ${siteName}`}
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>Meta Description</Label>
                      <span className="text-xs text-muted-foreground">
                        {editing.description.length}/320
                      </span>
                    </div>
                    <Textarea
                      value={editing.description}
                      onChange={(e) =>
                        setEditing({ ...editing, description: e.target.value })
                      }
                      placeholder="Descripción para motores de búsqueda..."
                      maxLength={320}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Keywords</Label>
                    <Input
                      value={editing.keywords}
                      onChange={(e) =>
                        setEditing({ ...editing, keywords: e.target.value })
                      }
                      placeholder="electrodomésticos, hogar, productos"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separadas por coma
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>URL Canónica</Label>
                    <Input
                      value={editing.canonical}
                      onChange={(e) =>
                        setEditing({ ...editing, canonical: e.target.value })
                      }
                      placeholder={`${siteUrl}/productos`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Open Graph */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    Open Graph (Facebook, WhatsApp, etc.)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>OG Título</Label>
                    <Input
                      value={editing.ogTitle}
                      onChange={(e) =>
                        setEditing({ ...editing, ogTitle: e.target.value })
                      }
                      placeholder="Dejar vacío para usar el título principal"
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>OG Descripción</Label>
                    <Textarea
                      value={editing.ogDescription}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          ogDescription: e.target.value,
                        })
                      }
                      placeholder="Dejar vacío para usar la meta description"
                      maxLength={320}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>OG Imagen</Label>
                    <div className="flex gap-2">
                      <Input
                        value={editing.ogImage}
                        onChange={(e) =>
                          setEditing({ ...editing, ogImage: e.target.value })
                        }
                        placeholder="/uploads/og-image.jpg"
                        className="flex-1"
                      />
                      <label className="cursor-pointer">
                        <Button
                          variant="secondary"
                          size="sm"
                          asChild
                          disabled={uploading}
                        >
                          <span>{uploading ? "..." : "Subir"}</span>
                        </Button>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUploadOgImage(file)
                            e.target.value = ""
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recomendado: 1200×630px, JPG/PNG/WebP, máx 2MB
                    </p>

                    {editing.ogImage && (
                      <div className="mt-2 overflow-hidden rounded-md border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={editing.ogImage}
                          alt="OG Preview"
                          className="h-auto w-full max-w-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* OG Preview */}
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Vista previa del enlace compartido
                    </p>
                    {editing.ogImage && (
                      <div className="mb-2 h-32 overflow-hidden rounded border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={editing.ogImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {editing.ogTitle ||
                        editing.title ||
                        "Título de la página"}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {editing.ogDescription ||
                        editing.description ||
                        "Descripción de la página..."}
                    </p>
                    <p className="mt-0.5 text-[10px] text-green-700 dark:text-green-500">
                      {new URL(siteUrl).hostname}
                      {editing.path || "/"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Robots */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Indexación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={editing.noIndex}
                      onChange={(e) =>
                        setEditing({ ...editing, noIndex: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    <div>
                      <p className="text-sm font-medium">noindex</p>
                      <p className="text-xs text-muted-foreground">
                        Impide que esta página aparezca en los resultados de
                        búsqueda
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={editing.noFollow}
                      onChange={(e) =>
                        setEditing({ ...editing, noFollow: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    <div>
                      <p className="text-sm font-medium">nofollow</p>
                      <p className="text-xs text-muted-foreground">
                        Impide que los buscadores sigan los enlaces de esta
                        página
                      </p>
                    </div>
                  </label>
                </CardContent>
              </Card>

              {/* Structured Data */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    JSON-LD (datos estructurados)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Textarea
                    value={editing.structuredData}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        structuredData: e.target.value,
                      })
                    }
                    placeholder={
                      '{\n  "@context": "https://schema.org",\n  "@type": "WebSite",\n  "name": "' +
                      siteName +
                      '"\n}'
                    }
                    rows={8}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    JSON-LD personalizado. Se insertará como{" "}
                    {'<script type="application/ld+json">'} en el head de la
                    página.
                  </p>
                </CardContent>
              </Card>

              {/* Google Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    Vista previa en Google
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border p-4">
                    <p className="truncate text-lg text-blue-600 dark:text-blue-400">
                      {editing.title || `Título de la página — ${siteName}`}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-500">
                      {new URL(siteUrl).hostname}
                      {editing.path || "/"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {editing.description ||
                        "Descripción que aparece en los resultados de búsqueda..."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-primary">{success}</p>}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !editing.path}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar configuración SEO?
            </AlertDialogTitle>
            <AlertDialogDescription>
              La configuración SEO de{" "}
              <span className="font-mono">{deleteTarget}</span> será eliminada.
              La página seguirá funcionando con los valores por defecto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
