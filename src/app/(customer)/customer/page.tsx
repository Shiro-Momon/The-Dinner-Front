"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getTables } from "@/lib/api"
import type { TableResponseDto } from "@/types"
import { toast } from "sonner"
import { Users, Package, UtensilsCrossed, ArrowLeft } from "lucide-react"

type Step = "choice" | "table"

export default function CustomerLandingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("choice")
  const [tables, setTables] = useState<TableResponseDto[]>([])
  const [loading, setLoading] = useState(false)

  const loadTables = () => {
    setLoading(true)
    getTables()
      .then(setTables)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (step === "table") loadTables()
  }, [step])

  if (step === "choice") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Welcome!</h1>
          <p className="text-zinc-500">How would you like to order?</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <button
            onClick={() => setStep("table")}
            className="rounded-2xl border-2 border-zinc-200 bg-white p-6 flex flex-col items-center gap-3 hover:border-zinc-900 hover:shadow-md transition-all cursor-pointer active:scale-95"
          >
            <UtensilsCrossed className="w-10 h-10 text-zinc-700" />
            <span className="font-semibold text-zinc-900">Dine In</span>
            <span className="text-xs text-zinc-500 text-center">Choose a table</span>
          </button>

          <button
            onClick={() => router.push("/customer/menu?isToGo=true")}
            className="rounded-2xl border-2 border-zinc-200 bg-white p-6 flex flex-col items-center gap-3 hover:border-zinc-900 hover:shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Package className="w-10 h-10 text-zinc-700" />
            <span className="font-semibold text-zinc-900">To-go</span>
            <span className="text-xs text-zinc-500 text-center">Order to take away</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setStep("choice")}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Select your table</h1>
          <p className="text-sm text-zinc-500">Choose a free table to start ordering</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading tables…</div>
      ) : (
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
      )}
    </div>
  )
}
