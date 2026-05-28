"use client"

import { useEffect, useState } from "react"
import { getTables, createTable, occupyTable, releaseTable } from "@/lib/api"
import type { TableResponseDto } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus } from "lucide-react"
import { toast } from "sonner"

export default function TablesPage() {
  const [tables, setTables] = useState<TableResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ number: "", capacity: "" })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getTables()
      .then(setTables)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setSaving(true)
    try {
      await createTable({ number: parseInt(form.number), capacity: parseInt(form.capacity) })
      toast.success("Table created")
      setDialogOpen(false)
      setForm({ number: "", capacity: "" })
      load()
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleOccupy = async (id: number) => {
    try {
      await occupyTable(id)
      toast.success("Table marked as occupied")
      load()
    } catch (e: unknown) {
      toast.error((e as Error).message)
    }
  }

  const handleRelease = async (id: number) => {
    try {
      await releaseTable(id)
      toast.success("Table released")
      load()
    } catch (e: unknown) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Tables</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Table
        </Button>
      </div>

      {loading ? (
        <p className="text-zinc-400">Loading…</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table #</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">#{table.number}</TableCell>
                  <TableCell>{table.capacity} seats</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        table.isOccupied
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }
                    >
                      {table.isOccupied ? "Occupied" : "Free"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={table.isOccupied}
                        onClick={() => handleOccupy(table.id)}
                      >
                        Occupy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!table.isOccupied}
                        onClick={() => handleRelease(table.id)}
                      >
                        Release
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Table Number</Label>
              <Input
                type="number"
                min="1"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                placeholder="e.g. 5"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Capacity</Label>
              <Input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="e.g. 4"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
