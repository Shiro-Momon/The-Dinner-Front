"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getTables, getOrders } from "@/lib/api"
import type { TableResponseDto, OrderResponseDto } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"
import { toast } from "sonner"

export default function DashboardPage() {
  const [tables, setTables] = useState<TableResponseDto[]>([])
  const [pending, setPending] = useState<OrderResponseDto[]>([])
  const [preparing, setPreparing] = useState<OrderResponseDto[]>([])
  const [ready, setReady] = useState<OrderResponseDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getTables(),
      getOrders("Pending"),
      getOrders("Preparing"),
      getOrders("Ready"),
    ])
      .then(([t, p, pr, r]) => {
        setTables(t)
        setPending(p)
        setPreparing(pr)
        setReady(r)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">Loading…</div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-zinc-500 mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{pending.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-zinc-500 mb-1">In Preparation</p>
          <p className="text-3xl font-bold text-orange-600">{preparing.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-zinc-500 mb-1">Ready to Serve</p>
          <p className="text-3xl font-bold text-purple-600">{ready.length}</p>
        </div>
      </div>

      <h2 className="text-base font-medium text-zinc-700 mb-4">
        Tables — {tables.filter((t) => !t.isOccupied).length} free /{" "}
        {tables.filter((t) => t.isOccupied).length} occupied
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map((table) => (
          <Card
            key={table.id}
            className={`border-2 ${
              table.isOccupied ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
            }`}
          >
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-zinc-800">#{table.number}</span>
                <Badge
                  variant="outline"
                  className={
                    table.isOccupied
                      ? "bg-red-100 text-red-700 border-red-200"
                      : "bg-green-100 text-green-700 border-green-200"
                  }
                >
                  {table.isOccupied ? "Occupied" : "Free"}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-zinc-500">
                <Users className="w-3.5 h-3.5" />
                <span>{table.capacity} seats</span>
              </div>
              <Link href={`/orders/new?tableId=${table.id}`}>
                <Button size="sm" variant="outline" className="w-full gap-1 text-xs">
                  <Plus className="w-3.5 h-3.5" /> New Order
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
