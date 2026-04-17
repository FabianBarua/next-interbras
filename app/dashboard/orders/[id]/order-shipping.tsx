interface Address {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

export function OrderShipping({ address }: { address: Address | null }) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Direccion de envio</h3>
      {address ? (
        <div className="text-sm text-muted-foreground space-y-0.5">
          {address.street && <p className="text-foreground font-medium">{address.street}</p>}
          <p>{[address.city, address.state].filter(Boolean).join(", ")}</p>
          {address.zipCode && <p>CP: {address.zipCode}</p>}
          {address.country && <p>{address.country}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sin direccion de envio registrada.</p>
      )}
    </div>
  )
}
