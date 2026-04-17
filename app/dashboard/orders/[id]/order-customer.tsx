interface UserInfo {
  name?: string | null
  email?: string | null
  phone?: string | null
  documentNumber?: string | null
}

interface OrderInfo {
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  customerDocument?: string | null
}

export function OrderCustomer({ user, order }: { user: UserInfo | null; order: OrderInfo }) {
  const name = user?.name ?? order.customerName
  const email = user?.email ?? order.customerEmail
  const phone = user?.phone ?? order.customerPhone
  const document = user?.documentNumber ?? order.customerDocument

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Cliente</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Nombre</p>
          <p className="font-medium">{name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Email</p>
          <a href={`mailto:${email}`} className="font-medium text-primary hover:underline break-all">
            {email}
          </a>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Telefono</p>
          {phone ? (
            <a href={`tel:${phone}`} className="font-medium text-primary hover:underline">
              {phone}
            </a>
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Documento</p>
          <p className={`font-medium ${document ? "font-mono text-xs" : "text-muted-foreground"}`}>
            {document ?? "—"}
          </p>
        </div>
      </div>
    </div>
  )
}
