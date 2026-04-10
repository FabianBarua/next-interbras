import {
  searchOrders,
  getOrderStatusCounts,
  getDistinctDomains,
} from "@/lib/actions/orders"
import { OrderFilters } from "@/components/dashboard/order-filters"
import type { OrderFiltersState } from "@/components/dashboard/order-filters"
import { OrdersTable } from "@/components/dashboard/orders-table"

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const str = (k: string) => (typeof sp[k] === "string" ? sp[k] : "") ?? ""

  const filters: OrderFiltersState = {
    search: str("search"),
    status: str("status"),
    dateFrom: str("dateFrom"),
    dateTo: str("dateTo"),
    minTotal: str("minTotal"),
    maxTotal: str("maxTotal"),
    transactionId: str("transactionId"),
    domains: str("domains"),
  }

  const page = Math.max(1, Number(str("page")) || 1)
  const sortBy = str("sortBy") || "createdAt"
  const sortOrder = str("sortOrder") || "desc"

  const domainsArr = filters.domains
    ? filters.domains.split(",").filter(Boolean)
    : undefined

  const countFilters = {
    search: filters.search || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    minTotal: filters.minTotal || undefined,
    maxTotal: filters.maxTotal || undefined,
    transactionId: filters.transactionId || undefined,
    domains: domainsArr,
  }

  const [result, statusCounts, availableDomains] = await Promise.all([
    searchOrders({
      page,
      limit: 50,
      search: filters.search || undefined,
      status: filters.status || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      minTotal: filters.minTotal || undefined,
      maxTotal: filters.maxTotal || undefined,
      transactionId: filters.transactionId || undefined,
      domains: domainsArr,
      sortBy,
      sortOrder,
    }),
    getOrderStatusCounts(countFilters),
    getDistinctDomains(),
  ])

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">
          {statusCounts.total ?? 0} pedidos en total
        </p>
      </div>

      <OrderFilters
        initialFilters={filters}
        statusCounts={statusCounts}
        availableDomains={availableDomains}
      />

      <OrdersTable
        orders={result.orders}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}
