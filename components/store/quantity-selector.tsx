"use client"
import { useCartStore } from "@/store/cart-store"

export function QuantitySelector({ 
  itemId, 
  initialQuantity = 1,
  min = 1,
  max = 99
}: { 
  itemId: string, 
  initialQuantity?: number,
  min?: number,
  max?: number
}) {
  const { updateQuantity } = useCartStore()

  const handleDecrease = () => {
    if (initialQuantity > min) {
      updateQuantity(itemId, initialQuantity - 1)
    }
  }

  const handleIncrease = () => {
    if (initialQuantity < max) {
      updateQuantity(itemId, initialQuantity + 1)
    }
  }

  return (
    <div className="flex items-center rounded-md border h-10 w-fit">
      <button 
        type="button"
        onClick={handleDecrease}
        disabled={initialQuantity <= min}
        className="px-3 h-full hover:bg-muted disabled:opacity-50 transition-colors"
      >
        -
      </button>
      <div className="px-4 text-sm font-medium w-12 text-center select-none">
        {initialQuantity}
      </div>
      <button 
        type="button"
        onClick={handleIncrease}
        disabled={initialQuantity >= max}
        className="px-3 h-full hover:bg-muted disabled:opacity-50 transition-colors"
      >
        +
      </button>
    </div>
  )
}
