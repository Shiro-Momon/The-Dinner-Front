"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getOrders } from "@/lib/api"
import type { OrderResponseDto, OrderStatus } from "@/types"
import { StatusBadge } from "@/components/status-badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

const ALL_STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready",
  "Served",
  "Paid",
  "Cancelled",
]

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderResponseDto[]>([])
  const [filter, setFilter] = useState<"All" | OrderStatus>("All")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const status = filter === "All" ? undefined : filter
    getOrders(status)
      .then(setOrders)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Orders</h1>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as "All" | OrderStatus)} className="mb-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="All">All</TabsTrigger>
          {ALL_STATUSES.map((s) => (
            <TabsTrigger key={s} value={s}>{s}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <p className="text-zinc-400">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-zinc-400">No orders found.</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-zinc-50"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>Table {order.tableId}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>€{Number(order.totalAmount).toFixed(2)}</TableCell>
                  <TableCell className="text-zinc-500 text-sm">
                    {new Date(order.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
