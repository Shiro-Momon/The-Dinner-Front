import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/types"

const statusStyles: Record<OrderStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  Preparing: "bg-orange-100 text-orange-800 border-orange-200",
  Ready: "bg-purple-100 text-purple-800 border-purple-200",
  Served: "bg-teal-100 text-teal-800 border-teal-200",
  Paid: "bg-green-100 text-green-800 border-green-200",
  Cancelled: "bg-red-100 text-red-800 border-red-200",
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {status}
    </Badge>
  )
}
