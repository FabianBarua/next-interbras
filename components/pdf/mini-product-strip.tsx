"use client"

import { memo } from "react"

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface MiniProduct {
  id: string
  name: string
  code: string
  imageUrl: string | null
}

interface StripProps {
  products: MiniProduct[]
}

/* ------------------------------------------------------------------ */
/*  Layout offsets – each card gets a unique static transform          */
/* ------------------------------------------------------------------ */

const OFFSETS = [
  { x: -38, y: 6, rotate: -4 },
  { x: -14, y: -4, rotate: 2 },
  { x: 8, y: 8, rotate: -2 },
  { x: 30, y: -2, rotate: 3 },
  { x: -20, y: 4, rotate: -1 },
  { x: 14, y: -6, rotate: 4 },
  { x: -8, y: 2, rotate: -3 },
  { x: 24, y: 6, rotate: 1 },
]

/* ------------------------------------------------------------------ */
/*  Mini card                                                         */
/* ------------------------------------------------------------------ */

function MiniCard({ product, offset }: {
  product: MiniProduct
  offset: (typeof OFFSETS)[number]
}) {
  return (
    <div
      className="flex w-28 shrink-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm"
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.rotate}deg)`,
      }}
    >
      {/* Image */}
      <div className="flex aspect-square w-full items-center justify-center bg-linear-to-br from-brand-500/5 to-transparent">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt=""
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">
            {product.code}
          </span>
        )}
      </div>

      {/* Label */}
      <div className="border-t border-border/30 px-2 py-1.5">
        <p className="truncate text-[10px] font-semibold leading-tight text-foreground">
          {product.name}
        </p>
        <p className="truncate font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
          {product.code}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Strip – horizontal row of mini cards with overflow hidden          */
/* ------------------------------------------------------------------ */

function MiniProductStripImpl({ products }: StripProps) {
  if (products.length === 0) return null

  const visible = products.slice(0, 8)

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden">
      <div className="flex items-center gap-3">
        {visible.map((p, i) => (
          <MiniCard
            key={p.id}
            product={p}
            offset={OFFSETS[i % OFFSETS.length]}
          />
        ))}
      </div>
    </div>
  )
}

export const MiniProductStrip = memo(MiniProductStripImpl)
