"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getMenu, createOrder, createPayment, confirmOrder, getTables } from "@/lib/api"
import type { MenuItemResponseDto, TableResponseDto } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, ShoppingCart, ArrowLeft, CheckCircle, CreditCard, Banknote, Package } from "lucide-react"
import { toast } from "sonner"
import { CATEGORY_KEYS, CATEGORY_LABEL, type CategoryKey } from "@/lib/categories"

type Stage = "menu" | "confirm" | "payment" | "done"

function CustomerMenuContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tableId = searchParams.get("tableId")
  const isToGo = searchParams.get("isToGo") === "true"

  const [table, setTable] = useState<TableResponseDto | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItemResponseDto[]>([])
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [activeCategory, setActiveCategory] = useState<"all" | CategoryKey>("all")
  const [customerName, setCustomerName] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paying, setPaying] = useState(false)
  const [stage, setStage] = useState<Stage>("menu")
  const [orderId, setOrderId] = useState<number | null>(null)
  const [paymentId, setPaymentId] = useState<number | null>(null)

  useEffect(() => {
    if (!isToGo && !tableId) { router.replace("/customer"); return }

    const fetches: Promise<unknown>[] = [getMenu()]
    if (tableId) fetches.push(getTables())

    Promise.all(fetches)
      .then(([m, tables]) => {
        setMenuItems((m as MenuItemResponseDto[]).filter((i) => i.isAvailable))
        if (tables && tableId)
          setTable((tables as TableResponseDto[]).find((t) => t.id === Number(tableId)) ?? null)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [tableId, isToGo, router])

  const adjust = (id: number, delta: number) => {
    setQuantities((prev) => {
      const next = (prev[id] ?? 0) + delta
      if (next <= 0) { const { [id]: _, ...rest } = prev; return rest }
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

  const handleConfirmOrder = async () => {
    setSubmitting(true)
    try {
      const order = await createOrder({
        tableId: isToGo ? null : Number(tableId),
        isToGo,
        pricingStrategy: "Standard",
        items: cartItems.map(({ menuItemId, quantity }) => ({ menuItemId, quantity })),
        customerName: customerName.trim() || null,
      })
      setOrderId(order.id)
      setStage("payment")
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePayByCard = async () => {
    if (!orderId) return
    setPaying(true)
    try {
      const payment = await createPayment({ orderId, method: "CreditCard", tipAmount: 0 })
      setPaymentId(payment.id)
      if (isToGo) await confirmOrder(orderId)
      setStage("done")
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setPaying(false)
    }
  }

  const filteredMenu =
    activeCategory === "all"
      ? menuItems
      : menuItems.filter((i) => i.category === activeCategory)

  if (loading) return <div className="py-24 text-center text-zinc-400">Loading menu…</div>

  // ── Confirm step ─────────────────────────────────────────────────────────
  if (stage === "confirm") {
    return (
      <div className="max-w-sm mx-auto py-8">
        <button
          onClick={() => setStage("menu")}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Edit order
        </button>

        <h2 className="text-xl font-bold text-zinc-900 mb-4">Confirm your order</h2>

        <div className="bg-white rounded-2xl border p-4 mb-4 space-y-2">
          {cartItems.map((i) => (
            <div key={i.menuItemId} className="flex justify-between text-sm">
              <span className="text-zinc-700">{i.quantity}× {i.name}</span>
              <span className="text-zinc-600">€{(i.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold text-zinc-900">
            <span>Total</span>
            <span>€{total.toFixed(2)}</span>
          </div>
        </div>

        {isToGo && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Your name <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Marie — leave blank to use your order number"
              maxLength={100}
            />
          </div>
        )}

        <Button className="w-full" onClick={handleConfirmOrder} disabled={submitting}>
          {submitting ? "Placing order…" : "Confirm Order"}
        </Button>
      </div>
    )
  }

  // ── Payment choice ────────────────────────────────────────────────────────
  if (stage === "payment") {
    const displayName = customerName.trim() || `Order #${orderId}`
    return (
      <div className="flex flex-col items-center py-12 gap-6 max-w-sm mx-auto">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-1">Order placed!</h2>
          <p className="text-zinc-500 text-sm">
            {isToGo
              ? <><Package className="inline w-3.5 h-3.5 mr-1" />To-go · {displayName}</>
              : `Table #${table?.number}`}
          </p>
        </div>

        <div className="w-full space-y-3">
          <p className="text-sm font-medium text-zinc-700 text-center">How would you like to pay?</p>

          <button
            onClick={handlePayByCard}
            disabled={paying}
            className="w-full flex items-center gap-4 rounded-2xl border-2 border-zinc-200 bg-white p-5 hover:border-zinc-900 hover:shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <CreditCard className="w-8 h-8 text-zinc-700 shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-zinc-900">{paying ? "Processing…" : "Pay by card"}</p>
              <p className="text-xs text-zinc-500">Pay now · €{total.toFixed(2)}</p>
            </div>
          </button>

          <button
            onClick={() => setStage("done")}
            className="w-full flex items-center gap-4 rounded-2xl border-2 border-zinc-200 bg-white p-5 hover:border-zinc-900 hover:shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Banknote className="w-8 h-8 text-zinc-700 shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-zinc-900">Pay at the counter</p>
              <p className="text-xs text-zinc-500">Cash or meal voucher · staff will process and send to kitchen</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (stage === "done") {
    const displayName = customerName.trim() || `Order #${orderId}`
    return (
      <div className="flex flex-col items-center py-12 gap-4 text-center max-w-sm mx-auto">
        <CheckCircle className="w-14 h-14 text-green-500" />
        <h2 className="text-2xl font-bold text-zinc-900">
          {paymentId ? "Payment confirmed!" : "Thank you!"}
        </h2>
        {isToGo && (
          <p className="text-lg font-medium text-zinc-800">
            Pick-up name: <span className="text-zinc-900 font-bold">{displayName}</span>
          </p>
        )}
        <p className="text-zinc-500">
          {paymentId
            ? "Your payment is complete. Your order is on its way!"
            : "Please go to the counter to pay. Staff will start your order once payment is confirmed."}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/customer")}>
          Back to home
        </Button>
      </div>
    )
  }

  // ── Menu ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/customer")}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-sm font-medium text-zinc-700">
          {isToGo ? "To-go order" : `Table #${table?.number}`}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {([{ id: "all" as const, label: "Tout" }, ...CATEGORY_KEYS.map((c) => ({ id: c, label: CATEGORY_LABEL[c] }))]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveCategory(id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === id ? "bg-zinc-900 text-white" : "bg-white border text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-8">
        {filteredMenu.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-zinc-900">{item.name}</p>
              <p className="text-sm text-zinc-500">{CATEGORY_LABEL[item.category as CategoryKey] ?? item.category}</p>
              <p className="text-base font-semibold text-zinc-800 mt-0.5">€{Number(item.price).toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => adjust(item.id, -1)}
                disabled={!quantities[item.id]}
                className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-zinc-50 disabled:opacity-30 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center font-medium text-zinc-800">{quantities[item.id] ?? 0}</span>
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

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-2xl mx-auto px-4 py-4">
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
              <Button onClick={() => setStage("confirm")} className="px-6">
                Review Order
              </Button>
            </div>
          </div>
        </div>
      )}
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
