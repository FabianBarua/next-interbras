import { requireAdmin } from "@/lib/auth/get-session"
import { AttributeCreateForm } from "./client"

export default async function NewAttributePage() {
  await requireAdmin()
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Nuevo atributo</h1>
        <p className="text-sm text-muted-foreground">Crear un nuevo atributo de producto</p>
      </div>
      <AttributeCreateForm />
    </div>
  )
}
