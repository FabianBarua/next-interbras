import { notFound } from "next/navigation"
import { getTemplate } from "@/lib/actions/admin/email-templates"
import { TemplateEditor } from "./template-editor"

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const template = await getTemplate(slug)
  if (!template) notFound()

  return (
    <TemplateEditor
      slug={template.slug}
      subject={template.subject}
      bodyHtml={template.bodyHtml}
      variables={(template.variables as string[] | null) ?? []}
      active={template.active}
    />
  )
}
