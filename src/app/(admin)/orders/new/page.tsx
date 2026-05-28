"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getTables, getMenu, createOrder } from "@/lib/api"
import type { TableResponseDto, MenuItemResponseDto } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { CATEGORY_IDS, CATEGORY_LABEL } from "@/lib/categories"

function NewOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedTableId = searchParams.get("tableId")

  const [tables, setTables] = useState<TableResponseDto[]>([])
  const [menuItems, setMenuItems] = useState<MenuItemResponseDto[]>([])
  const [selectedTableId, setSelectedTableId] = useState<string>(preselectedTableId ?? "")
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [activeCategory, setActiveCategory] = useState<"all" | number>("all")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([getTables(), getMenu()])
      .then(([t, m]) => {
        setTables(t)
        setMenuItems(m.filter((i) => i.isAvailable))
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

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

  const orderItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = menuItems.find((m) => m.id === Number(id))!
      return { menuItemId: Number(id), quantity: qty, name: item.name, price: Number(item.price) }
    })

  const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const handleSubmit = async () => {
    if (!selectedTableId) return toast.error("Select a table first")
    if (orderItems.length === 0) return toast.error("Add at least one item")
    setSubmitting(true)
    try {
      const order = await createOrder({
        tableId: parseInt(selectedTableId),
        items: orderItems.map(({ menuItemId, quantity }) => ({ menuItemId, quantity })),
      })
      toast.success("Order created")
      router.push(`/orders/${order.id}`)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredMenu =
    activeCategory === "all" ? menuItems : menuItems.filter((i) => Number(i.category) === activeCategory)

  if (loading) return <div className="p-8 text-zinc-400">Loading…</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">New Order</h1>

      <div className="flex gap-8">
        {/* Left — table + menu */}
        <div className="flex-1 min-w-0">
          {/* Table selector */}
          <div className="bg-white rounded-xl border p-5 mb-5">
            <p className="text-sm font-medium text-zinc-700 mb-2">Select Table</p>
            <Select value={selectedTableId} onValueChange={(v) => setSelectedTableId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a table…" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    Table #{t.number} — {t.capacity} seats{" "}
                    {t.isOccupied ? "(Occupied)" : "(Free)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mb-4">
            {([{ id: "all", label: "Tout" }, ...CATEGORY_IDS.map((c) => ({ id: c, label: CATEGORY_LABEL[c] }))] as { id: "all" | number; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveCategory(id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredMenu.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 truncate">{item.name}</p>
                  <p className="text-sm text-zinc-500">€{Number(item.price).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => adjust(item.id, -1)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-zinc-50 disabled:opacity-30"
                    disabled={!quantities[item.id]}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm font-medium">
                    {quantities[item.id] ?? 0}
                  </span>
                  <button
                    onClick={() => adjust(item.id, 1)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-zinc-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — order summary */}
        <div className="w-72 shrink-0">
          <Card className="sticky top-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-4 h-4 text-zinc-600" />
                <span className="font-medium text-zinc-800">Order Summary</span>
                {orderItems.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {orderItems.reduce((s, i) => s + i.quantity, 0)}
                  </Badge>
                )}
              </div>

              {orderItems.length === 0 ? (
                <p className="text-sm text-zinc-400">No items yet</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {orderItems.map((i) => (
                    <div key={i.menuItemId} className="flex justify-between text-sm">
                      <span className="text-zinc-700">
                        {i.quantity}× {i.name}
                      </span>
                      <span className="text-zinc-600">€{(i.price * i.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <Separator className="my-3" />
              <div className="flex justify-between font-semibold text-zinc-900 mb-4">
                <span>Total</span>
                <span>€{total.toFixed(2)}</span>
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting || orderItems.length === 0 || !selectedTableId}
              >
                {submitting ? "Submitting…" : "Place Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-400">Loading…</div>}>
      <NewOrderForm />
    </Suspense>
  )
}
