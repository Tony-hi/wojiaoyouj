export interface Category {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  spec: string
  unit: string
  brand: string
  pesticide_reg_no: string
  purchase_price: number
  sale_price: number
  barcode?: string
  category_id: string
  category_name?: string
  created_at: string
  updated_at: string
}

export interface Stock {
  id: string
  product_id: string
  batch_no: string
  production_date: string
  expiry_date: string
  quantity: number
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  contact: string
  phone: string
  address: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  address: string
  created_at: string
  updated_at: string
}

export interface PurchaseOrder {
  id: string
  supplier_id: string
  supplier_name: string
  items: PurchaseOrderItem[]
  total_amount: number
  status: 'pending' | 'approved' | 'cancelled'
  remark: string
  created_at: string
  updated_at: string
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  product_id: string
  product_name: string
  spec: string
  unit: string
  batch_no: string
  production_date: string
  expiry_date: string
  quantity: number
  unit_price: number
  amount: number
}

export interface SaleOrder {
  id: string
  customer_id: string
  customer_name: string
  items: SaleOrderItem[]
  total_amount: number
  status: 'pending' | 'approved' | 'cancelled'
  remark: string
  created_at: string
  updated_at: string
}

export interface SaleOrderItem {
  id: string
  sale_order_id: string
  product_id: string
  product_name: string
  spec: string
  unit: string
  batch_no: string
  quantity: number
  unit_price: number
  amount: number
}

export interface Reservation {
  id: string
  customer_name: string
  customer_phone: string
  items: ReservationItem[]
  total_amount: number
  deposit_paid: boolean
  deposit_amount: number
  status: 'pending' | 'picked' | 'cancelled'
  expected_date: string
  remark: string
  created_at: string
  updated_at: string
}

export interface ReservationItem {
  id: string
  reservation_id: string
  product_id: string
  product_name: string
  spec: string
  unit: string
  quantity: number
  unit_price: number
  amount: number
}

export interface Account {
  id: string
  type: 'receivable' | 'payable'
  related_id: string
  related_name: string
  amount: number
  paid_amount: number
  status: 'pending' | 'partial' | 'paid'
  remark: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  type: 'receipt' | 'payment'
  account_id: string
  amount: number
  payment_method: 'cash' | 'transfer' | 'wechat' | 'alipay'
  remark: string
  created_at: string
}

export interface OperationLog {
  id: string
  action: string
  module: string
  description: string
  operator: string
  created_at: string
}

export interface AppSettings {
  id: string
  key: string
  value: string
  created_at: string
  updated_at: string
}

export type OrderStatus = 'pending' | 'approved' | 'cancelled'
export type ReservationStatus = 'pending' | 'picked' | 'cancelled'
