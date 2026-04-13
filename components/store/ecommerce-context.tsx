"use client"

import { createContext, useContext } from "react"

const EcommerceContext = createContext(false)

export function EcommerceProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: React.ReactNode
}) {
  return (
    <EcommerceContext.Provider value={enabled}>
      {children}
    </EcommerceContext.Provider>
  )
}

export function useEcommerce() {
  return useContext(EcommerceContext)
}
