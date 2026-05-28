export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Ready"
  | "Served"
  | "Paid"
  | "Cancelled"

export type PaymentMethod = "Cash" | "CreditCard" | "MealVoucher"

export interface MenuItemResponseDto {
  id: number
  name: string
  price: number
  category: number
  isAvailable: boolean
}

export interface TableResponseDto {
  id: number
  number: number
  capacity: number
  isOccupied: boolean
}

export interface OrderItemResponseDto {
  menuItemId: number
  menuItemName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface OrderResponseDto {
  id: number
  tableId: number
  status: OrderStatus
  items: OrderItemResponseDto[]
  totalAmount: number
  createdAt: string
  confirmedAt: string | null
  servedAt: string | null
  paidAt: string | null
}

export interface PaymentResponseDto {
  id: number
  orderId: number
  amount: number
  tipAmount: number
  method: PaymentMethod
  transactionReference: string
  processedAt: string
}
