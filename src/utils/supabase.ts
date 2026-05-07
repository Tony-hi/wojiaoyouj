import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Category, Product, Stock, Supplier, Customer, PurchaseOrder, SaleOrder, Reservation, Account, Transaction, OperationLog, AppSettings } from '@/types'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL || ''
const supabaseKey = process.env.VUE_APP_SUPABASE_ANON_KEY || ''

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data || []
}

export async function createCategory(name: string): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert({ name }).select().single()
  if (error) throw error
  return data
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const { data, error } = await supabase.from('categories').update({ name }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function getProducts(categoryId?: string): Promise<Product[]> {
  let query = supabase.from('products').select(`
    *,
    categories(name)
  `).order('name')
  
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data?.map(p => ({
    ...p,
    category_name: p.categories?.name
  })) || []
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select(`
    *,
    categories(name)
  `).eq('id', id).single()
  if (error) return null
  return {
    ...data,
    category_name: data.categories?.name
  }
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category_name'>): Promise<Product> {
  const { data, error } = await supabase.from('products').insert(product).select().single()
  if (error) throw error
  return data
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase.from('products').update(product).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function checkProductExists(name: string, spec: string, excludeId?: string): Promise<boolean> {
  let query = supabase.from('products').select('id').eq('name', name).eq('spec', spec)
  if (excludeId) {
    query = query.neq('id', excludeId)
  }
  const { data, error } = await query
  if (error) throw error
  return data && data.length > 0
}

export async function getStock(productId?: string): Promise<Stock[]> {
  let query = supabase.from('stock').select('*').order('expiry_date')
  if (productId) {
    query = query.eq('product_id', productId)
  }
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getStockByProduct(productId: string): Promise<Stock[]> {
  const { data, error } = await supabase.from('stock').select('*').eq('product_id', productId).order('expiry_date')
  if (error) throw error
  return data || []
}

export async function addStock(stock: Omit<Stock, 'id' | 'created_at' | 'updated_at'>): Promise<Stock> {
  const { data, error } = await supabase.from('stock').insert(stock).select().single()
  if (error) throw error
  return data
}

export async function updateStock(id: string, quantity: number): Promise<Stock> {
  const { data, error } = await supabase.from('stock').update({ quantity }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function getSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from('suppliers').select('*').order('name')
  if (error) throw error
  return data || []
}

export async function createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
  const { data, error } = await supabase.from('suppliers').insert(supplier).select().single()
  if (error) throw error
  return data
}

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select('*').order('name')
  if (error) throw error
  return data || []
}

export async function createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
  const { data, error } = await supabase.from('customers').insert(customer).select().single()
  if (error) throw error
  return data
}

export async function createPurchaseOrder(order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>): Promise<PurchaseOrder> {
  const { data, error } = await supabase.from('purchase_orders').insert(order).select().single()
  if (error) throw error
  return data
}

export async function getPurchaseOrders(status?: string): Promise<PurchaseOrder[]> {
  let query = supabase.from('purchase_orders').select('*').order('created_at', { ascending: false })
  if (status) {
    query = query.eq('status', status)
  }
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function updatePurchaseOrderStatus(id: string, status: 'pending' | 'approved' | 'cancelled'): Promise<PurchaseOrder> {
  const { data, error } = await supabase.from('purchase_orders').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function createSaleOrder(order: Omit<SaleOrder, 'id' | 'created_at' | 'updated_at'>): Promise<SaleOrder> {
  const { data, error } = await supabase.from('sale_orders').insert(order).select().single()
  if (error) throw error
  return data
}

export async function getSaleOrders(status?: string): Promise<SaleOrder[]> {
  let query = supabase.from('sale_orders').select('*').order('created_at', { ascending: false })
  if (status) {
    query = query.eq('status', status)
  }
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function updateSaleOrderStatus(id: string, status: 'pending' | 'approved' | 'cancelled'): Promise<SaleOrder> {
  const { data, error } = await supabase.from('sale_orders').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function createReservation(reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>): Promise<Reservation> {
  const { data, error } = await supabase.from('reservations').insert(reservation).select().single()
  if (error) throw error
  return data
}

export async function getReservations(status?: string): Promise<Reservation[]> {
  let query = supabase.from('reservations').select('*').order('created_at', { ascending: false })
  if (status) {
    query = query.eq('status', status)
  }
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function updateReservationStatus(id: string, status: 'pending' | 'picked' | 'cancelled'): Promise<Reservation> {
  const { data, error } = await supabase.from('reservations').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function createAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
  const { data, error } = await supabase.from('accounts').insert(account).select().single()
  if (error) throw error
  return data
}

export async function getAccounts(type?: 'receivable' | 'payable'): Promise<Account[]> {
  let query = supabase.from('accounts').select('*').order('created_at', { ascending: false })
  if (type) {
    query = query.eq('type', type)
  }
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function updateAccountPayment(id: string, paidAmount: number): Promise<Account> {
  const { data: accountData, error: accountError } = await supabase.from('accounts').select('amount, paid_amount').eq('id', id).single()
  if (accountError) throw accountError
  
  const newPaidAmount = (accountData.paid_amount || 0) + paidAmount
  const status = newPaidAmount >= accountData.amount ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'pending')
  
  const { data, error } = await supabase.from('accounts').update({ paid_amount: newPaidAmount, status }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
  const { data, error } = await supabase.from('transactions').insert(transaction).select().single()
  if (error) throw error
  return data
}

export async function createOperationLog(log: Omit<OperationLog, 'id' | 'created_at'>): Promise<void> {
  await supabase.from('operation_logs').insert(log)
}

export async function getOperationLogs(): Promise<OperationLog[]> {
  const { data, error } = await supabase.from('operation_logs').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getSettings(): Promise<AppSettings[]> {
  const { data, error } = await supabase.from('app_settings').select('*')
  if (error) throw error
  return data || []
}

export async function updateSetting(key: string, value: string): Promise<void> {
  const { data, error } = await supabase.from('app_settings').select('id').eq('key', key).single()
  if (error && error.code !== 'PGRST116') throw error
  
  if (data) {
    await supabase.from('app_settings').update({ value }).eq('id', data.id)
  } else {
    await supabase.from('app_settings').insert({ key, value })
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'admin_password').single()
  if (error) return false
  return data.value === password
}

export async function updatePassword(newPassword: string): Promise<void> {
  await updateSetting('admin_password', newPassword)
}

export async function getLoginAttempts(): Promise<number> {
  const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'login_attempts').single()
  if (error) return 0
  return parseInt(data.value) || 0
}

export async function incrementLoginAttempts(): Promise<void> {
  const attempts = await getLoginAttempts()
  await updateSetting('login_attempts', (attempts + 1).toString())
}

export async function resetLoginAttempts(): Promise<void> {
  await updateSetting('login_attempts', '0')
}

export async function getLockoutUntil(): Promise<string | null> {
  const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'lockout_until').single()
  if (error) return null
  return data.value
}

export async function setLockoutUntil(timestamp: string): Promise<void> {
  await updateSetting('lockout_until', timestamp)
}
