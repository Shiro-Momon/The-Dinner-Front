"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getOrder, createPayment } from "@/lib/api"
import type { OrderResponseDto, PaymentMethod } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Package } from "lucide-react"
import { toast } from "sonner"

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "CreditCard", "MealVoucher"]

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [order, setOrder] = useState<OrderResponseDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [tipAmount, setTipAmount] = useState("0")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash")
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    getOrder(Number(id))
      .then((o) => {
        if (o.status !== "Served") {
          toast.error("Order must be served before payment")
          router.replace(`/orders/${id}`)
          return
        }
        setOrder(o)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [id, router])

  const handlePayment = async () => {
    if (!order) return
    setPaying(true)
    try {
      const payment = await createPayment({
        orderId: order.id,
        method: paymentMethod,
        tipAmount: parseFloat(tipAmount) || 0,
      })
      toast.success("Payment processed")
      router.push(`/payments/${payment.id}`)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <div className="p-8 text-zinc-400">Loading…</div>
  if (!order) return null

  const tip = parseFloat(tipAmount) || 0
  const grandTotal = Number(order.totalAmount) + tip

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-1">Process Payment</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Order #{order.id} · {order.isToGo ? "To-go" : `Table ${order.tableId}`}
      </p>

      {/* Order summary */}
      <div className="bg-white rounded-xl border p-5 mb-5">
        <p className="text-sm font-medium text-zinc-700 mb-3">Order Summary</p>
        <div className="space-y-2 mb-3">
          {order.items.map((item) => (
            <div key={item.menuItemId} className="flex justify-between text-sm">
              <span className="text-zinc-700">{item.quantity}× {item.menuItemName}</span>
              <span className="text-zinc-600">€{Number(item.subtotal).toFixed(2)}</span>
            </div>
          ))}
        </div>
        {order.isToGo && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
            <Package className="w-3.5 h-3.5 shrink-0" /> To-go order
          </div>
        )}
      </div>

      {/* Payment form */}
      <div className="bg-white rounded-xl border p-5 space-y-4 mb-5">
        <div className="space-y-1.5">
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Tip Amount (€)</Label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={tipAmount}
            onChange={(e) => setTipAmount(e.target.value)}
          />
        </div>
      </div>

      {/* Totals */}
      <div className="bg-white rounded-xl border p-5 mb-6 space-y-2">
        <div className="flex justify-between text-sm text-zinc-600">
          <span>Subtotal</span>
          <span>€{Number(order.totalAmount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-zinc-600">
          <span>Tip</span>
          <span>€{tip.toFixed(2)}</span>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between text-lg font-bold text-zinc-900">
          <span>Total</span>
          <span>€{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>
          Back
        </Button>
        <Button className="flex-1" onClick={handlePayment} disabled={paying}>
          {paying ? "Processing…" : "Confirm Payment"}
        </Button>
      </div>
    </div>
  )
}
