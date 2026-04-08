"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { SidebarNav } from "./sidebar-nav"

export function MobileNav({ siteName }: { siteName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex h-full w-64 flex-col p-0">
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        <div className="flex h-14 shrink-0 items-center border-b border-border/50 px-5">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="text-base font-bold tracking-tight"
          >
            {siteName}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              Admin
            </span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain" onClick={() => setOpen(false)}>
          <SidebarNav mobile />
        </div>
      </SheetContent>
    </Sheet>
  )
}
