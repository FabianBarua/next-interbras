"use client"
import { useState } from "react"
import Link from "next/link"

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 -ml-2 rounded-md hover:bg-muted z-50 relative"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
        </svg>
        <span className="sr-only">Toggle menu</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-background border-r p-6 shadow-lg animate-in slide-in-from-left">
            <div className="flex flex-col gap-6 pt-10">
              <Link href="/" onClick={() => setIsOpen(false)} className="text-lg font-medium">Inicio</Link>
              <Link href="/productos" onClick={() => setIsOpen(false)} className="text-lg font-medium">Productos</Link>
              <Link href="/downloads" onClick={() => setIsOpen(false)} className="text-lg font-medium">Downloads</Link>
              <Link href="/quienes-somos" onClick={() => setIsOpen(false)} className="text-lg font-medium">Quiénes Somos</Link>
              <Link href="/donde-estamos" onClick={() => setIsOpen(false)} className="text-lg font-medium">Dónde Estamos</Link>
              
              <div className="h-px bg-border my-4" />
              
              <Link href="/cuenta" onClick={() => setIsOpen(false)} className="text-lg font-medium">Mi Cuenta</Link>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-md hover:bg-muted"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                <span className="sr-only">Close menu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
