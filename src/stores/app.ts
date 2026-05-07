import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Category, Product, Supplier, Customer, PurchaseOrder, SaleOrder, Reservation, Stock } from '@/types'
import { getCategories, getProducts, getSuppliers, getCustomers, getStock } from '@/utils/supabase'

export const useAppStore = defineStore('app', () => {
  const categories = ref<Category[]>([])
  const products = ref<Product[]>([])
  const suppliers = ref<Supplier[]>([])
  const customers = ref<Customer[]>([])
  const stock = ref<Stock[]>([])
  
  const purchaseOrders = ref<PurchaseOrder[]>([])
  const saleOrders = ref<SaleOrder[]>([])
  const reservations = ref<Reservation[]>([])

  const currentPage = ref('purchase')

  const totalStockValue = computed(() => {
    let total = 0
    stock.value.forEach(s => {
      const product = products.value.find(p => p.id === s.product_id)
      if (product) {
        total += s.quantity * product.purchase_price
      }
    })
    return total
  })

  const lowStockItems = computed(() => {
    const stockMap: Record<string, number> = {}
    stock.value.forEach(s => {
      stockMap[s.product_id] = (stockMap[s.product_id] || 0) + s.quantity
    })
    return products.value.filter(p => (stockMap[p.id] || 0) < 10)
  })

  const expiringStock = computed(() => {
    const now = new Date()
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    return stock.value.filter(s => {
      const expiry = new Date(s.expiry_date)
      return expiry <= thirtyDaysLater && expiry > now
    })
  })

  async function loadCategories() {
    categories.value = await getCategories()
  }

  async function loadProducts(categoryId?: string) {
    products.value = await getProducts(categoryId)
  }

  async function loadSuppliers() {
    suppliers.value = await getSuppliers()
  }

  async function loadCustomers() {
    customers.value = await getCustomers()
  }

  async function loadStock() {
    stock.value = await getStock()
  }

  async function loadAllData() {
    await Promise.all([
      loadCategories(),
      loadProducts(),
      loadSuppliers(),
      loadCustomers(),
      loadStock()
    ])
  }

  function setCurrentPage(page: string) {
    currentPage.value = page
  }

  return {
    categories,
    products,
    suppliers,
    customers,
    stock,
    purchaseOrders,
    saleOrders,
    reservations,
    currentPage,
    totalStockValue,
    lowStockItems,
    expiringStock,
    loadCategories,
    loadProducts,
    loadSuppliers,
    loadCustomers,
    loadStock,
    loadAllData,
    setCurrentPage
  }
})
