"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  getOrder,
  getMenu,
  addOrderItem,
  removeOrderItem,
  confirmOrder,
  prepareOrder,
  readyOrder,
  serveOrder,
  cancelOrder,
  getPaymentByOrder,
} from "@/lib/api"
import type { OrderResponseDto, MenuItemResponseDto } from "@/types"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2, Plus, Package } from "lucide-react"
import { toast } from "sonner"

const PRICING_LABELS: Record<string, string> = {
  Standard: "Standard pricing",
  HappyHour: "Happy Hour pricing",
  GroupDiscount: "Group Discount pricing",
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [order, setOrder] = useState<OrderResponseDto | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItemResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  // add-item form
  const [addMenuItemId, setAddMenuItemId] = useState("")
  const [addQty, setAddQty] = useState("1")

  const reload = () =>
    getOrder(Number(id)).then(setOrder).catch((e) => toast.error(e.message))

  useEffect(() => {
    Promise.all([getOrder(Number(id)), getMenu()])
      .then(([o, m]) => {
        setOrder(o)
        setMenuItems(m.filter((i) => i.isAvailable))
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const action = async (fn: () => Promise<OrderResponseDto>, label: string) => {
    setBusy(true)
    try {
      const updated = await fn()
      setOrder(updated)
      toast.success(label)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleAddItem = async () => {
    if (!addMenuItemId) return toast.error("Select a menu item")
    await action(
      () => addOrderItem(Number(id), { menuItemId: Number(addMenuItemId), quantity: parseInt(addQty) }),
      "Item added"
    )
    setAddMenuItemId("")
    setAddQty("1")
  }

  const handleRemoveItem = (menuItemId: number) =>
    action(() => removeOrderItem(Number(id), menuItemId), "Item removed")

  const handleViewReceipt = async () => {
    try {
      const payment = await getPaymentByOrder(Number(id))
      router.push(`/payments/${payment.id}`)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    }
  }

  if (loading) return <div className="p-8 text-zinc-400">Loading…</div>
  if (!order) return <div className="p-8 text-zinc-500">Order not found.</div>

  const isPending = order.status === "Pending"
  const isReadOnly = order.status === "Paid" || order.status === "Cancelled"

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-semibold text-zinc-900">Order #{order.id}</h1>
            <StatusBadge status={order.status} />
            {order.isToGo && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                <Package className="w-3 h-3" /> To-go
              </Badge>
            )}
          </div>
          <p className="text-sm text-zinc-500">
            {order.tableId ? `Table ${order.tableId}` : "To-go"} · {PRICING_LABELS[order.pricingStrategy] ?? order.pricingStrategy} · Created {new Date(order.createdAt).toLocaleString()}
            {order.confirmedAt && ` · Confirmed ${new Date(order.confirmedAt).toLocaleString()}`}
            {order.servedAt && ` · Served ${new Date(order.servedAt).toLocaleString()}`}
            {order.paidAt && ` · Paid ${new Date(order.paidAt).toLocaleString()}`}
          </p>
        </div>
        <p className="text-2xl font-bold text-zinc-800">€{Number(order.totalAmount).toFixed(2)}</p>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border overflow-hidden mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Subtotal</TableHead>
              {isPending && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.menuItemId}>
                <TableCell>{item.menuItemName}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>€{Number(item.unitPrice).toFixed(2)}</TableCell>
                <TableCell>€{Number(item.subtotal).toFixed(2)}</TableCell>
                {isPending && (
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveItem(item.menuItemId)}
                      disabled={busy}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add item — Pending only */}
      {isPending && (
        <div className="bg-white rounded-xl border p-5 mb-6">
          <p className="text-sm font-medium text-zinc-700 mb-3">Add Item</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <Label>Menu item</Label>
              <Select value={addMenuItemId} onValueChange={(v) => setAddMenuItemId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item…" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name} — €{Number(m.price).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-1.5">
              <Label>Qty</Label>
              <Input
                type="number"
                min="1"
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
              />
            </div>
            <Button onClick={handleAddItem} disabled={busy} className="gap-1">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isReadOnly && (
        <div className="flex flex-wrap gap-3 mb-6">
          {order.status === "Pending" && (
            <>
              <Button onClick={() => action(() => confirmOrder(Number(id)), "Order confirmed")} disabled={busy}>
                Confirm
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => action(() => cancelOrder(Number(id)), "Order cancelled")}
                disabled={busy}
              >
                Cancel
              </Button>
            </>
          )}
          {order.status === "Confirmed" && (
            <>
              <Button onClick={() => action(() => prepareOrder(Number(id)), "Preparation started")} disabled={busy}>
                Start Preparing
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => action(() => cancelOrder(Number(id)), "Order cancelled")}
                disabled={busy}
              >
                Cancel
              </Button>
            </>
          )}
          {order.status === "Preparing" && (
            <>
              <Button onClick={() => action(() => readyOrder(Number(id)), "Order marked ready")} disabled={busy}>
                Mark Ready
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => action(() => cancelOrder(Number(id)), "Order cancelled")}
                disabled={busy}
              >
                Cancel
              </Button>
            </>
          )}
          {order.status === "Ready" && (
            <>
              <Button onClick={() => action(() => serveOrder(Number(id)), "Order served")} disabled={busy}>
                Serve
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => action(() => cancelOrder(Number(id)), "Order cancelled")}
                disabled={busy}
              >
                Cancel
              </Button>
            </>
          )}
          {order.status === "Served" && (
            <Button onClick={() => router.push(`/orders/${id}/payment`)}>
              Process Payment
            </Button>
          )}
        </div>
      )}

      {/* Receipt link for paid orders */}
      {order.status === "Paid" && (
        <Button variant="outline" onClick={handleViewReceipt}>
          View Receipt
        </Button>
      )}
    </div>
  )
}
