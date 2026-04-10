import Link from "@/i18n/link"
import {
  getTemplates,
  toggleTemplate,
} from "@/lib/actions/admin/email-templates"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function TemplatesPage() {
  const templates = await getTemplates()

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Templates de Email</h2>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead>Asunto</TableHead>
              <TableHead className="w-24 text-center">Variables</TableHead>
              <TableHead className="w-24 text-center">Estado</TableHead>
              <TableHead className="w-40 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-muted-foreground"
                >
                  No hay templates creados aún.
                </TableCell>
              </TableRow>
            )}
            {templates.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-sm">{t.slug}</TableCell>
                <TableCell className="max-w-xs truncate">{t.subject}</TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {(t.variables as string[] | null)?.length ?? 0}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={t.active ? "default" : "outline"}>
                    {t.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <form action={toggleTemplate.bind(null, t.slug)}>
                      <Button variant="outline" size="sm" type="submit">
                        {t.active ? "Desactivar" : "Activar"}
                      </Button>
                    </form>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/emails/templates/${t.slug}`}>
                        Editar
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
