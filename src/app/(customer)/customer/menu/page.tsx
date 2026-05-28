"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getMenu, createOrder, getTables } from "@/lib/api"
import type { MenuItemResponseDto, TableResponseDto } from "@/types"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, ShoppingCart, ArrowLeft, CheckCircle } from "lucide-react"
import { toast } from "sonner"

import { CATEGORY_KEYS, CATEGORY_LABEL, type CategoryKey } from "@/lib/categories"

function CustomerMenuContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tableId = searchParams.get("tableId")

  const [table, setTable] = useState<TableResponseDto | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItemResponseDto[]>([])
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [activeCategory, setActiveCategory] = useState<"all" | CategoryKey>("all")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)

  useEffect(() => {
    if (!tableId) { router.replace("/customer"); return }
    Promise.all([getMenu(), getTables()])
      .then(([m, tables]) => {
        setMenuItems(m.filter((i) => i.isAvailable))
        setTable(tables.find((t) => t.id === Number(tableId)) ?? null)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [tableId, router])

  const adjust = (id: number, delta: number) => {
    setQuantities((prev) => {
      const next = (prev[id] ?? 0) + delta
      if (next <= 0) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: next }
    })
  }

  const cartItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = menuItems.find((m) => m.id === Number(id))!
      return { menuItemId: Number(id), quantity: qty, name: item.name, price: Number(item.price) }
    })

  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0)

  const handleOrder = async () => {
    if (!tableId || cartItems.length === 0) return
    setSubmitting(true)
    try {
      const order = await createOrder({
        tableId: Number(tableId),
        isToGo: false,
        pricingStrategy: "Standard",
        items: cartItems.map(({ menuItemId, quantity }) => ({ menuItemId, quantity })),
      })
      setOrderId(order.id)
      setSubmitted(true)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredMenu =
    activeCategory === "all"
      ? menuItems
      : menuItems.filter((i) => i.category === activeCategory)

  if (loading) return <div className="py-24 text-center text-zinc-400">Loading menu…</div>

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Order placed!</h2>
        <p className="text-zinc-500 mb-1">Order #{orderId} is on its way.</p>
        <p className="text-zinc-500 mb-8">Your waiter will bring it to Table #{table?.number}.</p>
        <Button variant="outline" onClick={() => router.push("/customer")}>
          Back to tables
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/customer")}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" /> Change table
        </button>
        <span className="text-sm font-medium text-zinc-700">
          Table #{table?.number}
        </span>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap mb-5 -mx-1">
        {([{ id: "all" as const, label: "Tout" }, ...CATEGORY_KEYS.map((c) => ({ id: c, label: CATEGORY_LABEL[c] }))]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveCategory(id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === id
                ? "bg-zinc-900 text-white"
                : "bg-white border text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Menu items */}
      <div className="space-y-3 mb-8">
        {filteredMenu.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border p-4 flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="font-medium text-zinc-900">{item.name}</p>
              <p className="text-sm text-zinc-500">{CATEGORY_LABEL[item.category as CategoryKey] ?? item.category}</p>
              <p className="text-base font-semibold text-zinc-800 mt-0.5">
                €{Number(item.price).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => adjust(item.id, -1)}
                disabled={!quantities[item.id]}
                className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-zinc-50 disabled:opacity-30 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center font-medium text-zinc-800">
                {quantities[item.id] ?? 0}
              </span>
              <button
                onClick={() => adjust(item.id, 1)}
                className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-2xl mx-auto px-4 py-4">
            {/* Cart lines */}
            <div className="space-y-1 mb-3">
              {cartItems.map((i) => (
                <div key={i.menuItemId} className="flex justify-between text-sm text-zinc-700">
                  <span>{i.quantity}× {i.name}</span>
                  <span>€{(i.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator className="mb-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-zinc-500" />
                <span className="font-semibold text-zinc-900">€{total.toFixed(2)}</span>
                <Badge variant="secondary">{cartCount} items</Badge>
              </div>
              <Button onClick={handleOrder} disabled={submitting} className="px-6">
                {submitting ? "Placing…" : "Place Order"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Bottom padding so cart bar doesn't cover last item */}
      {cartCount > 0 && <div className="h-36" />}
    </div>
  )
}

export default function CustomerMenuPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-zinc-400">Loading…</div>}>
      <CustomerMenuContent />
    </Suspense>
  )
}
