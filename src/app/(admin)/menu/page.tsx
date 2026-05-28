"use client"

import { useEffect, useState } from "react"
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/api"
import type { MenuItemResponseDto } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { CATEGORY_KEYS, CATEGORY_LABEL, type CategoryKey } from "@/lib/categories"

type FormState = {
  name: string
  price: string
  category: CategoryKey
  isAvailable: boolean
}

const emptyForm: FormState = { name: "", price: "", category: "Starter", isAvailable: true }

export default function MenuPage() {
  const [items, setItems] = useState<MenuItemResponseDto[]>([])
  const [activeTab, setActiveTab] = useState<"all" | CategoryKey>("all")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<MenuItemResponseDto | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getMenu()
      .then(setItems)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered =
    activeTab === "all" ? items : items.filter((i) => i.category === activeTab)

  const openEdit = (item: MenuItemResponseDto) => {
    setEditItem(item)
    setForm({ name: item.name, price: String(item.price), category: item.category as CategoryKey, isAvailable: item.isAvailable })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = { name: form.name, price: parseFloat(form.price), category: form.category, isAvailable: form.isAvailable }
      if (editItem) {
        await updateMenuItem(editItem.id, data)
        toast.success("Item updated")
      } else {
        await createMenuItem(data)
        toast.success("Item created")
      }
      setDialogOpen(false)
      load()
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: MenuItemResponseDto) => {
    if (!confirm(`Delete "${item.name}"?`)) return
    try {
      await deleteMenuItem(item.id)
      toast.success("Item deleted")
      load()
    } catch (e: unknown) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Menu</h1>
        <Button onClick={() => { setEditItem(null); setForm(emptyForm); setDialogOpen(true) }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v === "all" ? "all" : v as CategoryKey)}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all">Tout</TabsTrigger>
          {CATEGORY_KEYS.map((c) => (
            <TabsTrigger key={c} value={c}>{CATEGORY_LABEL[c]}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <p className="text-zinc-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-zinc-400">No items in this category.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} className="bg-white">
              <CardContent className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-900">{item.name}</p>
                    <p className="text-sm text-zinc-500">{CATEGORY_LABEL[item.category as CategoryKey] ?? item.category}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      item.isAvailable
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-zinc-100 text-zinc-500 border-zinc-200"
                    }
                  >
                    {item.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                <p className="text-lg font-semibold text-zinc-800">€{Number(item.price).toFixed(2)}</p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(item)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Caesar Salad"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Price (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as CategoryKey })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_KEYS.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isAvailable"
                checked={form.isAvailable}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                className="w-4 h-4 accent-zinc-800"
              />
              <Label htmlFor="isAvailable">Available</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
