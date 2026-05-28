import type {
  MenuItemResponseDto,
  TableResponseDto,
  OrderResponseDto,
  PaymentResponseDto,
  OrderStatus,
  PaymentMethod,
} from "@/types"

const BASE = ""

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Menu ──────────────────────────────────────────────────────────────────────

export const getMenu = () =>
  apiFetch<MenuItemResponseDto[]>("/api/menu")

export const getMenuByCategory = (category: number) =>
  apiFetch<MenuItemResponseDto[]>(`/api/menu/category/${category}`)

export const getMenuItem = (id: number) =>
  apiFetch<MenuItemResponseDto>(`/api/menu/${id}`)

export const createMenuItem = (data: {
  name: string
  price: number
  category: number
  isAvailable: boolean
}) => apiFetch<MenuItemResponseDto>("/api/menu", { method: "POST", body: JSON.stringify(data) })

export const updateMenuItem = (
  id: number,
  data: { name: string; price: number; category: number; isAvailable: boolean }
) =>
  apiFetch<MenuItemResponseDto>(`/api/menu/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })

export const deleteMenuItem = (id: number) =>
  apiFetch<void>(`/api/menu/${id}`, { method: "DELETE" })

// ── Tables ────────────────────────────────────────────────────────────────────

export const getTables = () =>
  apiFetch<TableResponseDto[]>("/api/tables")

export const getTable = (id: number) =>
  apiFetch<TableResponseDto>(`/api/tables/${id}`)

export const createTable = (data: { number: number; capacity: number }) =>
  apiFetch<TableResponseDto>("/api/tables", { method: "POST", body: JSON.stringify(data) })

export const occupyTable = (id: number) =>
  apiFetch<TableResponseDto>(`/api/tables/${id}/occupy`, { method: "PATCH" })

export const releaseTable = (id: number) =>
  apiFetch<TableResponseDto>(`/api/tables/${id}/release`, { method: "PATCH" })

// ── Orders ────────────────────────────────────────────────────────────────────

export const getOrders = (status?: OrderStatus) =>
  apiFetch<OrderResponseDto[]>(status ? `/api/orders?status=${status}` : "/api/orders")

export const getOrder = (id: number) =>
  apiFetch<OrderResponseDto>(`/api/orders/${id}`)

export const createOrder = (data: {
  tableId: number
  items: { menuItemId: number; quantity: number }[]
}) =>
  apiFetch<OrderResponseDto>("/api/orders", { method: "POST", body: JSON.stringify(data) })

export const addOrderItem = (orderId: number, data: { menuItemId: number; quantity: number }) =>
  apiFetch<OrderResponseDto>(`/api/orders/${orderId}/items`, {
    method: "POST",
    body: JSON.stringify(data),
  })

export const removeOrderItem = (orderId: number, menuItemId: number) =>
  apiFetch<OrderResponseDto>(`/api/orders/${orderId}/items/${menuItemId}`, { method: "DELETE" })

export const confirmOrder = (id: number) =>
  apiFetch<OrderResponseDto>(`/api/orders/${id}/confirm`, { method: "PATCH" })

export const prepareOrder = (id: number) =>
  apiFetch<OrderResponseDto>(`/api/orders/${id}/prepare`, { method: "PATCH" })

export const readyOrder = (id: number) =>
  apiFetch<OrderResponseDto>(`/api/orders/${id}/ready`, { method: "PATCH" })

export const serveOrder = (id: number) =>
  apiFetch<OrderResponseDto>(`/api/orders/${id}/serve`, { method: "PATCH" })

export const cancelOrder = (id: number) =>
  apiFetch<OrderResponseDto>(`/api/orders/${id}/cancel`, { method: "PATCH" })

// ── Payments ──────────────────────────────────────────────────────────────────

export const createPayment = (data: {
  orderId: number
  method: PaymentMethod
  tipAmount: number
}) =>
  apiFetch<PaymentResponseDto>("/api/payments", { method: "POST", body: JSON.stringify(data) })

export const getPayment = (id: number) =>
  apiFetch<PaymentResponseDto>(`/api/payments/${id}`)

export const getPaymentByOrder = (orderId: number) =>
  apiFetch<PaymentResponseDto>(`/api/payments/order/${orderId}`)
