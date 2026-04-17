import { formatUSD, productName } from "@/lib/order-constants"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"

interface Item {
  id: string
  productName: unknown
  sku?: string | null
  unitPrice: string | number
  quantity: number
}

export function OrderItemsTable({ items }: { items: Item[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead className="text-center">Cant.</TableHead>
          <TableHead className="text-right">Precio</TableHead>
          <TableHead className="text-right">Subtotal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{productName(item.productName)}</TableCell>
            <TableCell className="text-xs font-mono text-muted-foreground">
              {item.sku ?? "—"}
            </TableCell>
            <TableCell className="text-center">{item.quantity}</TableCell>
            <TableCell className="text-right">{formatUSD(item.unitPrice)}</TableCell>
            <TableCell className="text-right font-medium">
              {formatUSD(Number(item.unitPrice) * item.quantity)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
