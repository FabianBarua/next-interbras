"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { AdminAttributeFull, AdminAttributeValue } from "@/services/admin/attributes"
import {
  bulkCreateAttributeValuesAction,
  createAttributeAction,
  createAttributeValueAction,
  deleteAttributeAction,
  deleteAttributeValueAction,
  updateAttributeAction,
  updateAttributeValueAction,
} from "@/lib/actions/admin/attributes"
import { I18nInput } from "@/components/dashboard/i18n-input"
import { Modal } from "@/components/dashboard/modal"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { PageHeader } from "@/components/dashboard/page-header"
import {
  BackLink,
  ConfirmDeleteDialog,
  ErrorBanner,
  FormActions,
  Grid,
  SectionCard,
  SlugField,
  smallInputCls,
  SuccessBanner,
  SwitchField,
  TextField,
  slugify,
} from "@/components/dashboard/form/primitives"

const LIST_HREF = "/dashboard/attributes"

/* ─────────── AttributeForm ─────────── */

export function AttributeForm({ attribute }: { attribute?: AdminAttributeFull }) {
  const router = useRouter()
  const isEdit = !!attribute
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [slug, setSlug] = useState(attribute?.slug ?? "")
  const [nameEs, setNameEs] = useState(attribute?.name.es ?? "")
  const [namePt, setNamePt] = useState(attribute?.name.pt ?? "")
  const [descEs, setDescEs] = useState(attribute?.description?.es ?? "")
  const [descPt, setDescPt] = useState(attribute?.description?.pt ?? "")
  const [sortOrder, setSortOrder] = useState(attribute?.sortOrder ?? 0)
  const [active, setActive] = useState(attribute?.active ?? true)

  // Value modals (edit mode only)
  const [showAdd, setShowAdd] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [editing, setEditing] = useState<AdminAttributeValue | null>(null)

  const handleSave = () => {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      if (isEdit && attribute) {
        const res = await updateAttributeAction(attribute.id, {
          name: { es: nameEs, pt: namePt },
          description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
          sortOrder,
          active,
        })
        if ("error" in res && res.error) setError(res.error)
        else {
          setSuccess(true)
          router.refresh()
        }
      } else {
        const res = await createAttributeAction({
          slug,
          name: { es: nameEs, pt: namePt },
          ...(descEs || descPt ? { description: { es: descEs, pt: descPt } } : {}),
          sortOrder,
          active,
        })
        if ("error" in res && res.error) setError(res.error)
        else if ("id" in res && res.id) router.push(`/dashboard/attributes/${res.id}`)
      }
    })
  }

  const handleDelete = () => {
    if (!attribute) return
    startTransition(async () => {
      const res = await deleteAttributeAction(attribute.id)
      if ("error" in res && res.error) {
        setError(res.error)
        setDeleteOpen(false)
      } else router.push(LIST_HREF)
    })
  }

  const handleDeleteValue = (id: string) => {
    if (!confirm("¿Eliminar este valor?")) return
    startTransition(async () => {
      await deleteAttributeValueAction(id)
      router.refresh()
    })
  }

  const handleToggleValue = (id: string, val: boolean) => {
    startTransition(async () => {
      await updateAttributeValueAction(id, { active: val })
      router.refresh()
    })
  }

  return (
    <div>
      {isEdit && (
        <Breadcrumbs
          items={[
            { label: "Atributos", href: LIST_HREF },
            { label: attribute!.name.es ?? attribute!.slug },
          ]}
        />
      )}
      {isEdit ? (
        <PageHeader label={attribute!.name.es ?? attribute!.slug}>
          Slug: <span className="font-mono">{attribute!.slug}</span>
        </PageHeader>
      ) : (
        <BackLink href={LIST_HREF}>Volver a atributos</BackLink>
      )}

      <div className={`${isEdit ? "" : "mt-4 max-w-2xl"} space-y-6`}>
        <ErrorBanner>{error}</ErrorBanner>
        <SuccessBanner>{success ? "Cambios guardados." : null}</SuccessBanner>

        <SectionCard title={isEdit ? "Información del atributo" : undefined}>
          {!isEdit && (
            <SlugField value={slug} onChange={setSlug} placeholder="ej: color" required />
          )}
          <I18nInput
            label="Nombre"
            valueEs={nameEs}
            valuePt={namePt}
            onChangeEs={setNameEs}
            onChangePt={setNamePt}
            placeholder="Nombre"
          />
          <I18nInput
            label="Descripción"
            valueEs={descEs}
            valuePt={descPt}
            onChangeEs={setDescEs}
            onChangePt={setDescPt}
            textarea
            placeholder="Descripción"
          />
          <Grid cols={2}>
            <TextField
              label="Orden"
              type="number"
              value={sortOrder.toString()}
              onChange={(v) => setSortOrder(Number(v) || 0)}
            />
            <SwitchField label="Estado" checked={active} onChange={setActive} />
          </Grid>
          <FormActions
            onSave={handleSave}
            cancelHref={!isEdit ? LIST_HREF : undefined}
            saveLabel={isEdit ? "Guardar atributo" : "Crear atributo"}
            pending={isPending}
            disabled={!nameEs || (!isEdit && !slug)}
            onDelete={isEdit ? () => setDeleteOpen(true) : undefined}
          />
        </SectionCard>

        {isEdit && attribute && (
          <SectionCard
            title={`Valores predefinidos (${attribute.values.length})`}
            action={
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulk(true)}
                  className="h-8 rounded-lg border px-3 text-xs font-medium hover:bg-muted"
                >
                  + Múltiples
                </button>
                <button
                  onClick={() => setShowAdd(true)}
                  className="h-8 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  + Nuevo valor
                </button>
              </div>
            }
          >
            {attribute.values.length > 0 ? (
              <ValuesTable
                values={attribute.values}
                onEdit={setEditing}
                onDelete={handleDeleteValue}
                onToggle={handleToggleValue}
                pending={isPending}
              />
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Sin valores. Agregue valores como &quot;Blanco&quot;, &quot;Negro&quot;, &quot;Rojo&quot;.
              </div>
            )}
          </SectionCard>
        )}
      </div>

      {/* Modals */}
      {isEdit && attribute && (
        <>
          <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo valor">
            <ValueForm
              attributeId={attribute.id}
              onDone={() => {
                setShowAdd(false)
                router.refresh()
              }}
            />
          </Modal>
          <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar valor">
            {editing && (
              <ValueForm
                attributeId={attribute.id}
                value={editing}
                onDone={() => {
                  setEditing(null)
                  router.refresh()
                }}
              />
            )}
          </Modal>
          <Modal
            open={showBulk}
            onClose={() => setShowBulk(false)}
            title="Agregar múltiples valores"
            wide
          >
            <BulkAddValues
              attributeId={attribute.id}
              onDone={() => {
                setShowBulk(false)
                router.refresh()
              }}
            />
          </Modal>
          <ConfirmDeleteDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="¿Eliminar atributo?"
            description={
              <>Se eliminará el atributo &quot;{attribute.name.es}&quot; y todos sus valores. Esta acción no se puede deshacer.</>
            }
            onConfirm={handleDelete}
            pending={isPending}
          />
        </>
      )}
    </div>
  )
}

/* ─────────── Values table ─────────── */

function ValuesTable({
  values,
  onEdit,
  onDelete,
  onToggle,
  pending,
}: {
  values: AdminAttributeValue[]
  onEdit: (v: AdminAttributeValue) => void
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
  pending: boolean
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <Th>Nombre ES</Th>
            <Th>Nombre PT</Th>
            <Th>Slug</Th>
            <Th center>Orden</Th>
            <Th center>Activo</Th>
            <Th right>Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {values.map((v) => (
            <tr key={v.id} className="border-b last:border-b-0 hover:bg-muted/20">
              <td className="px-3 py-2 font-medium">{v.name.es ?? "—"}</td>
              <td className="px-3 py-2">{v.name.pt ?? "—"}</td>
              <td className="px-3 py-2 font-mono text-xs">{v.slug}</td>
              <td className="px-3 py-2 text-center tabular-nums">{v.sortOrder}</td>
              <td className="px-3 py-2 text-center">
                <button
                  onClick={() => onToggle(v.id, !v.active)}
                  disabled={pending}
                  className={`relative h-5 w-8 rounded-full transition-colors ${v.active ? "bg-primary" : "bg-muted-foreground/30"}`}
                  aria-label={v.active ? "Desactivar" : "Activar"}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${v.active ? "left-3.5" : "left-0.5"}`}
                  />
                </button>
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onEdit(v)} className="text-xs text-primary hover:underline">
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(v.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({
  children,
  center,
  right,
}: {
  children: React.ReactNode
  center?: boolean
  right?: boolean
}) {
  return (
    <th
      className={`px-3 py-2 text-xs font-semibold uppercase text-muted-foreground ${
        center ? "text-center" : right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  )
}

/* ─────────── Single value form ─────────── */

function ValueForm({
  attributeId,
  value,
  onDone,
}: {
  attributeId: string
  value?: AdminAttributeValue
  onDone: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState(value?.slug ?? "")
  const [nameEs, setNameEs] = useState(value?.name.es ?? "")
  const [namePt, setNamePt] = useState(value?.name.pt ?? "")
  const [sortOrder, setSortOrder] = useState(value?.sortOrder ?? 0)
  const [active, setActive] = useState(value?.active ?? true)

  const handleSubmit = () => {
    setError(null)
    const autoSlug = slug || slugify(nameEs)
    startTransition(async () => {
      const res = value
        ? await updateAttributeValueAction(value.id, {
            slug: autoSlug,
            name: { es: nameEs, pt: namePt },
            sortOrder,
            active,
          })
        : await createAttributeValueAction({
            attributeId,
            slug: autoSlug,
            name: { es: nameEs, pt: namePt },
            sortOrder,
            active,
          })
      if ("error" in res && res.error) setError(res.error)
      else onDone()
    })
  }

  return (
    <div className="space-y-4">
      <I18nInput
        label="Nombre"
        valueEs={nameEs}
        valuePt={namePt}
        onChangeEs={setNameEs}
        onChangePt={setNamePt}
        placeholder="ej: Blanco / Branco"
      />
      <SlugField value={slug} onChange={setSlug} placeholder="auto" />
      <Grid cols={2}>
        <TextField
          label="Orden"
          type="number"
          value={sortOrder.toString()}
          onChange={(v) => setSortOrder(Number(v) || 0)}
        />
        <SwitchField label="Estado" checked={active} onChange={setActive} />
      </Grid>
      <ErrorBanner>{error}</ErrorBanner>
      <FormActions
        onSave={handleSubmit}
        saveLabel={value ? "Guardar" : "Crear valor"}
        pending={isPending}
        disabled={!nameEs.trim()}
      />
    </div>
  )
}

/* ─────────── Bulk add values ─────────── */

function BulkAddValues({
  attributeId,
  onDone,
}: {
  attributeId: string
  onDone: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<{ nameEs: string; namePt: string; slug: string }[]>([
    { nameEs: "", namePt: "", slug: "" },
    { nameEs: "", namePt: "", slug: "" },
    { nameEs: "", namePt: "", slug: "" },
  ])

  const update = (i: number, field: "nameEs" | "namePt" | "slug", val: string) => {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)))
  }

  const handleSubmit = () => {
    setError(null)
    const valid = rows.filter((r) => r.nameEs.trim())
    if (valid.length === 0) {
      setError("Ingrese al menos un nombre.")
      return
    }
    const data = valid.map((r, i) => ({
      attributeId,
      slug: r.slug || slugify(r.nameEs),
      name: { es: r.nameEs.trim(), pt: r.namePt.trim() },
      sortOrder: i,
    }))
    startTransition(async () => {
      const res = await bulkCreateAttributeValuesAction(data)
      if ("error" in res && res.error) setError(res.error)
      else onDone()
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Agregue múltiples valores. El slug se auto-genera si está vacío.
      </p>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={r.nameEs}
              onChange={(e) => update(i, "nameEs", e.target.value)}
              placeholder="Nombre ES *"
              className={smallInputCls}
            />
            <input
              value={r.namePt}
              onChange={(e) => update(i, "namePt", e.target.value)}
              placeholder="Nombre PT"
              className={smallInputCls}
            />
            <input
              value={r.slug}
              onChange={(e) => update(i, "slug", e.target.value)}
              placeholder="slug (auto)"
              className={`${smallInputCls} font-mono`}
            />
            <button
              type="button"
              onClick={() => rows.length > 1 && setRows((rs) => rs.filter((_, idx) => idx !== i))}
              disabled={rows.length <= 1}
              className="shrink-0 text-xs text-destructive hover:underline disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows((r) => [...r, { nameEs: "", namePt: "", slug: "" }])}
        className="text-xs text-primary hover:underline"
      >
        + Agregar fila
      </button>
      <ErrorBanner>{error}</ErrorBanner>
      <FormActions
        onSave={handleSubmit}
        saveLabel={`Crear ${rows.filter((r) => r.nameEs.trim()).length} valor(es)`}
        pending={isPending}
      />
      {/* end */}
    </div>
  )
}
