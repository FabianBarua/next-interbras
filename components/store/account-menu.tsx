"use client"

import { useSession, signOut } from "next-auth/react"
import { useDictionary } from "@/i18n/context"
import Link from "@/i18n/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AccountMenu() {
  const { data: session } = useSession()
  const { dict } = useDictionary()
  const user = session?.user

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="sr-only">{dict.nav.account}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {user ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/cuenta">{dict.account.myAccount}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/cuenta/pedidos">{dict.account.orders}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/cuenta/wishlist">{dict.account.wishlist}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/cuenta/direcciones">{dict.account.addresses}</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {user.role === "admin" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">{dict.account.dashboard}</Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ redirectTo: "/" })}>
              {dict.account.logout}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/login">{dict.account.signIn}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/register">{dict.account.signUp}</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
