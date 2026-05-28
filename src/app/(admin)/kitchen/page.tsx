"use client"

import { useEffect, useState, useCallback } from "react"
import { getOrders, prepareOrder, readyOrder } from "@/lib/api"
import type { OrderResponseDto } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { toast } from "sonner"

function elapsed(since: string | null): string {
  if (!since) return ""
  const diff = Math.floor((Date.now() - new Date(since).getTime()) / 1000)
  const m = Math.floor(diff / 60)
  const s = diff % 60
  return `${m}m ${s}s`
}

function KitchenCard({
  order,
  onAction,
}: {
  order: OrderResponseDto
  onAction: (id: number, type: "prepare" | "ready") => void
}) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="bg-white rounded-xl border p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-zinc-800">Order #{order.id}</span>
        <Badge variant="outline" className="text-xs">
          {order.isToGo
            ? (order.customerName ?? `To-go`)
            : `Table ${order.tableId}`}
        </Badge>
      </div>
      <ul className="space-y-1">
        {order.items.map((item) => (
          <li key={item.menuItemId} className="text-sm text-zinc-700">
            <span className="font-medium">{item.quantity}×</span> {item.menuItemName}
          </li>
        ))}
      </ul>
      {order.confirmedAt && (
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <Clock className="w-3 h-3" />
          {elapsed(order.confirmedAt)}
          {/* tick is read to trigger re-render each second */}
          <span className="sr-only">{tick}</span>
        </div>
      )}
      {order.status === "Confirmed" && (
        <Button size="sm" onClick={() => onAction(order.id, "prepare")}>
          Start Preparing
        </Button>
      )}
      {order.status === "Preparing" && (
        <Button size="sm" onClick={() => onAction(order.id, "ready")}>
          Mark Ready
        </Button>
      )}
    </div>
  )
}

export default function KitchenPage() {
  const [confirmed, setConfirmed] = useState<OrderResponseDto[]>([])
  const [preparing, setPreparing] = useState<OrderResponseDto[]>([])
  const [ready, setReady] = useState<OrderResponseDto[]>([])

  const load = useCallback(() => {
    Promise.all([
      getOrders("Confirmed"),
      getOrders("Preparing"),
      getOrders("Ready"),
    ])
      .then(([c, p, r]) => {
        setConfirmed(c)
        setPreparing(p)
        setReady(r)
      })
      .catch((e) => toast.error(e.message))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 20000)
    return () => clearInterval(interval)
  }, [load])

  const handleAction = async (id: number, type: "prepare" | "ready") => {
    try {
      if (type === "prepare") await prepareOrder(id)
      else await readyOrder(id)
      load()
    } catch (e: unknown) {
      toast.error((e as Error).message)
    }
  }

  const columns = [
    { title: "To Prepare", count: confirmed.length, orders: confirmed, color: "text-blue-600" },
    { title: "In Preparation", count: preparing.length, orders: preparing, color: "text-orange-600" },
    { title: "Ready", count: ready.length, orders: ready, color: "text-purple-600" },
  ]

  return (
    <div className="p-8 h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Kitchen</h1>
        <p className="text-xs text-zinc-400">Auto-refreshes every 20s</p>
      </div>
      <div className="grid grid-cols-3 gap-6 h-[calc(100%-5rem)]">
        {columns.map(({ title, count, orders, color }) => (
          <div key={title} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-zinc-700">{title}</h2>
              <span className={`text-lg font-bold ${color}`}>{count}</span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <p className="text-sm text-zinc-400">Nothing here</p>
              ) : (
                orders.map((o) => (
                  <KitchenCard key={o.id} order={o} onAction={handleAction} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
