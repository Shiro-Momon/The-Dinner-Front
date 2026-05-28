"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getTables } from "@/lib/api"
import type { TableResponseDto } from "@/types"
import { toast } from "sonner"
import { Users } from "lucide-react"

export default function CustomerLandingPage() {
  const router = useRouter()
  const [tables, setTables] = useState<TableResponseDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTables()
      .then(setTables)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-400">Loading tables…</div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Welcome!</h1>
        <p className="text-zinc-500">Select your table to start ordering</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {tables.map((table) => (
          <button
            key={table.id}
            disabled={table.isOccupied}
            onClick={() => router.push(`/customer/menu?tableId=${table.id}`)}
            className={`
              rounded-2xl border-2 p-5 flex flex-col items-center gap-2 transition-all
              ${
                table.isOccupied
                  ? "border-zinc-200 bg-zinc-100 opacity-40 cursor-not-allowed"
                  : "border-zinc-200 bg-white hover:border-zinc-900 hover:shadow-md cursor-pointer active:scale-95"
              }
            `}
          >
            <span className="text-2xl font-bold text-zinc-800">#{table.number}</span>
            <div className="flex items-center gap-1 text-sm text-zinc-500">
              <Users className="w-3.5 h-3.5" />
              <span>{table.capacity}</span>
            </div>
            {table.isOccupied && (
              <span className="text-xs text-zinc-400">Occupied</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
