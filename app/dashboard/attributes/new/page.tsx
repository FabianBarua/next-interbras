import { requireAdmin } from "@/lib/auth/get-session"
import { AttributeForm } from "@/components/dashboard/forms/attribute-form"

export default async function NewAttributePage() {
  await requireAdmin()
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Nuevo atributo</h1>
        <p className="text-sm text-muted-foreground">Crear un nuevo atributo de producto</p>
      </div>
      <AttributeForm />
    </div>
  )
}
