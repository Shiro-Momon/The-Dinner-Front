"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getPayment, getOrder } from "@/lib/api"
import type { PaymentResponseDto, OrderResponseDto } from "@/types"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import { toast } from "sonner"

export default function PaymentReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const [payment, setPayment] = useState<PaymentResponseDto | null>(null)
  const [order, setOrder] = useState<OrderResponseDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPayment(Number(id))
      .then(async (p) => {
        setPayment(p)
        const o = await getOrder(p.orderId)
        setOrder(o)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 text-zinc-400">Loading…</div>
  if (!payment || !order) return <div className="p-8 text-zinc-500">Receipt not found.</div>

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border p-8">
        <div className="flex flex-col items-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
          <h1 className="text-xl font-semibold text-zinc-900">Payment Receipt</h1>
          <p className="text-sm text-zinc-500">
            {new Date(payment.processedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex justify-between text-sm mb-4">
          <span className="text-zinc-500">Order</span>
          <span className="font-medium">#{order.id}</span>
        </div>
        <div className="flex justify-between text-sm mb-4">
          <span className="text-zinc-500">Table</span>
          <span className="font-medium">Table {order.tableId}</span>
        </div>
        <div className="flex justify-between text-sm mb-4">
          <span className="text-zinc-500">Payment Method</span>
          <Badge variant="outline">{payment.method}</Badge>
        </div>
        <div className="flex justify-between text-sm mb-4">
          <span className="text-zinc-500">Transaction Ref</span>
          <span className="font-mono text-xs text-zinc-600">{payment.transactionReference}</span>
        </div>

        <Separator className="my-4" />

        <p className="text-sm font-medium text-zinc-700 mb-3">Items</p>
        <div className="space-y-2 mb-4">
          {order.items.map((item) => (
            <div key={item.menuItemId} className="flex justify-between text-sm">
              <span className="text-zinc-700">{item.quantity}× {item.menuItemName}</span>
              <span className="text-zinc-600">€{Number(item.subtotal).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Subtotal</span>
            <span>€{Number(order.totalAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Tip</span>
            <span>€{Number(payment.tipAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-zinc-900 pt-1">
            <span>Total Paid</span>
            <span>€{Number(payment.amount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
