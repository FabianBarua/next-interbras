"use client"

import { useSession } from "next-auth/react"
import Link from "@/i18n/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GearSixIcon, PencilSimpleIcon, PackageIcon, TagIcon, ListBulletsIcon } from "@phosphor-icons/react"

interface Props {
  productId: string
  variantId?: string
  externalCode?: string
}

export function AdminProductFab({ productId, variantId, externalCode }: Props) {
  const { data: session } = useSession()
  if (session?.user?.role !== "admin") return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon-lg" className="rounded-full shadow-lg">
            <GearSixIcon className="size-5" />
            <span className="sr-only">Admin</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Admin</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href={`/dashboard/products/${productId}`}>
              <PencilSimpleIcon className="size-4 mr-2" />
              Editar Producto
            </Link>
          </DropdownMenuItem>

          {variantId && (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/products/${productId}/variants/${variantId}`}>
                <PackageIcon className="size-4 mr-2" />
                Editar Variante
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild>
            <Link href={`/dashboard/products/${productId}/variants`}>
              <ListBulletsIcon className="size-4 mr-2" />
              Todas las Variantes
            </Link>
          </DropdownMenuItem>

          {externalCode && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs font-mono text-muted-foreground">
                <TagIcon className="size-4 mr-2" />
                CEC: {externalCode}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
