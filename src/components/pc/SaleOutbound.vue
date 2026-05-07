<template>
  <div class="sale-outbound">
    <div class="sale-header">
      <h3>销售出库 - 友金农资库存与账单管理系统</h3>
      <div class="header-actions">
        <button class="btn btn-scan" @click="showScanner = true">
          📷 扫码出库
        </button>
        <button class="btn btn-outline" @click="resetForm">清空</button>
      </div>
    </div>
    
    <div class="sale-layout">
      <div class="left-panel">
        <div class="panel-header">
          <h4>客户</h4>
          <button class="btn btn-outline btn-sm" @click="showCustomerModal = true">新增</button>
        </div>
        <div class="customer-list">
          <div 
            v-for="customer in customers" 
            :key="customer.id"
            class="customer-item"
            :class="{ active: selectedCustomer?.id === customer.id }"
            @click="selectCustomer(customer)"
          >
            <div class="customer-name">{{ customer.name }}</div>
            <div class="customer-phone">{{ customer.phone }}</div>
          </div>
        </div>
      </div>
      
      <div class="center-panel">
        <div class="panel-header">
          <h4>商品库存</h4>
          <div class="header-right">
            <button class="btn btn-scan-sm" @click="showScanner = true">
              📷 扫码
            </button>
            <select class="category-select" v-model="selectedCategory">
              <option value="">全部分类</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
        </div>
        <div class="product-grid">
          <div 
            v-for="product in filteredProducts" 
            :key="product.id"
            class="product-card"
            :class="{ 
              disabled: getProductStock(product.id) <= 0,
              'has-barcode': product.barcode 
            }"
            @click="getProductStock(product.id) > 0 && addProductToOrder(product)"
          >
            <div class="product-name">{{ product.name }}</div>
            <div class="product-spec">{{ product.spec }} / {{ product.unit }}</div>
            <div class="product-price">售价: {{ formatAmount(product.sale_price) }}</div>
            <div class="product-stock">库存: {{ getProductStock(product.id) }}</div>
            <div v-if="product.barcode" class="product-barcode">📊</div>
          </div>
        </div>
      </div>
      
      <div class="right-panel">
        <div class="panel-header">
          <h4>销售单</h4>
          <span class="order-total">合计: {{ formatAmount(totalAmount) }}</span>
        </div>
        
        <div v-if="!selectedCustomer" class="empty-hint">
          <p>请先选择客户</p>
        </div>
        
        <div v-else class="order-content">
          <div class="customer-info">
            <span class="label">客户:</span>
            <span>{{ selectedCustomer.name }}</span>
          </div>
          
          <div class="order-items">
            <div v-for="(item, index) in orderItems" :key="index" class="order-item">
              <div class="item-info">
                <span class="item-name">{{ item.product_name }}</span>
                <span class="item-spec">{{ item.spec }}/{{ item.unit }}</span>
              </div>
              <div class="item-batch">
                <select v-model="item.batch_no" class="batch-select">
                  <option v-for="batch in getProductBatches(item.product_id)" :key="batch.id" :value="batch.batch_no">
                    {{ batch.batch_no }} ({{ formatDate(batch.production_date) }})
                  </option>
                </select>
              </div>
              <input 
                v-model.number="item.quantity" 
                type="number" 
                class="quantity-input"
                :max="getProductStock(item.product_id)"
                @input="updateItemAmount(index)"
              />
              <div class="item-total">{{ formatAmount(item.amount) }}</div>
              <button class="remove-btn" @click="removeOrderItem(index)">×</button>
            </div>
          </div>
          
          <div class="remark-section">
            <label>备注</label>
            <textarea v-model="remark" class="form-textarea" placeholder="请输入备注"></textarea>
          </div>
          
          <button 
            class="submit-btn" 
            :disabled="orderItems.length === 0"
            @click="submitOrder"
          >
            提交出库
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="showCustomerModal" class="modal-overlay" @click.self="showCustomerModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>新增客户</h3>
          <button class="close-btn" @click="showCustomerModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>客户名称</label>
            <input v-model="newCustomer.name" type="text" class="form-input" />
          </div>
          <div class="form-row">
            <label>联系电话</label>
            <input v-model="newCustomer.phone" type="text" class="form-input" />
          </div>
          <div class="form-row">
            <label>地址</label>
            <input v-model="newCustomer.address" type="text" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCustomerModal = false">取消</button>
          <button class="btn btn-primary" @click="saveCustomer">保存</button>
        </div>
      </div>
    </div>

    <BarcodeScanner
      :visible="showScanner"
      mode="outbound"
      @close="showScanner = false"
      @scanned="handleBarcodeScanned"
      @not-found="handleBarcodeNotFound"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { createCustomer, createSaleOrder, deductStock, createOperationLog } from '@/utils/supabase'
import { formatAmount } from '@/utils/format'
import type { Customer, Product, SaleOrderItem, Stock } from '@/types'
import BarcodeScanner from '@/components/BarcodeScanner.vue'

const appStore = useAppStore()

const customers = ref<Customer[]>([])
const categories = ref<any[]>([])
const products = ref<Product[]>([])
const stock = ref<Stock[]>([])

const selectedCustomer = ref<Customer | null>(null)
const selectedCategory = ref('')
const remark = ref('')
const showScanner = ref(false)

const orderItems = ref<any[]>([])

const showCustomerModal = ref(false)
const newCustomer = ref({
  name: '',
  phone: '',
  address: ''
})

const filteredProducts = computed(() => {
  if (!selectedCategory.value) return products.value
  return products.value.filter(p => p.category_id === selectedCategory.value)
})

const totalAmount = computed(() => {
  return orderItems.value.reduce((sum, item) => sum + item.amount, 0)
})

function getProductStock(productId: string): number {
  return stock.value
    .filter(s => s.product_id === productId)
    .reduce((sum, s) => sum + s.quantity, 0)
}

function getProductBatches(productId: string): Stock[] {
  return stock.value
    .filter(s => s.product_id === productId && s.quantity > 0)
    .sort((a, b) => new Date(a.production_date).getTime() - new Date(b.production_date).getTime())
}

function selectCustomer(customer: Customer) {
  selectedCustomer.value = customer
}

function addProductToOrder(product: Product) {
  const existingItem = orderItems.value.find(item => item.product_id === product.id)
  if (existingItem) {
    const maxQty = getProductStock(product.id)
    if (existingItem.quantity < maxQty) {
      existingItem.quantity++
      existingItem.amount = existingItem.quantity * existingItem.unit_price
    }
  } else {
    const batches = getProductBatches(product.id)
    orderItems.value.push({
      id: '',
      sale_order_id: '',
      product_id: product.id,
      product_name: product.name,
      spec: product.spec,
      unit: product.unit,
      batch_no: batches.length > 0 ? batches[0].batch_no : '',
      quantity: 1,
      unit_price: product.sale_price,
      amount: product.sale_price
    })
  }
}

function updateItemAmount(index: number) {
  const item = orderItems.value[index]
  item.amount = item.quantity * item.unit_price
}

function removeOrderItem(index: number) {
  orderItems.value.splice(index, 1)
}

async function saveCustomer() {
  if (!newCustomer.value.name.trim()) {
    alert('请输入客户名称')
    return
  }
  
  const customer = await createCustomer(newCustomer.value)
  customers.value.push(customer)
  showCustomerModal.value = false
  newCustomer.value = { name: '', phone: '', address: '' }
  
  await createOperationLog({
    action: 'customer_create',
    module: 'sale',
    description: `新增客户 ${customer.name}`,
    operator: 'admin'
  })
}

async function submitOrder() {
  if (!selectedCustomer.value) {
    alert('请选择客户')
    return
  }
  
  if (orderItems.value.length === 0) {
    alert('请添加销售商品')
    return
  }
  
  const order = await createSaleOrder({
    customer_id: selectedCustomer.value.id,
    customer_name: selectedCustomer.value.name,
    items: orderItems.value,
    total_amount: totalAmount.value,
    status: 'pending',
    remark: remark.value
  })
  
  for (const item of orderItems.value) {
    await deductStock(item.product_id, item.batch_no, item.quantity)
  }
  
  await createOperationLog({
    action: 'sale_create',
    module: 'sale',
    description: `创建销售出库单 ${selectedCustomer.value.name} 合计 ${formatAmount(totalAmount.value)}`,
    operator: 'admin'
  })
  
  await appStore.loadAllData()
  
  alert('出库成功')
  resetForm()
}

function resetForm() {
  selectedCustomer.value = null
  remark.value = ''
  orderItems.value = []
}

function handleBarcodeScanned(result: any) {
  if (result.product) {
    if (getProductStock(result.product.id) > 0) {
      addProductToOrder(result.product)
    } else {
      alert(`商品 "${result.product.name}" 库存为0，无法出库`)
    }
  }
  showScanner.value = false
}

function handleBarcodeNotFound(barcode: string) {
  alert(`未找到条形码 "${barcode}" 对应的商品，请先到商品管理中添加该商品！`)
  showScanner.value = false
}

function formatDate(dateStr: string): string {
  return dateStr.split('T')[0]
}

onMounted(async () => {
  await appStore.loadAllData()
  customers.value = appStore.customers
  categories.value = appStore.categories
  products.value = appStore.products
  stock.value = appStore.stock
})
</script>

<style lang="scss" scoped>
.sale-outbound {
  padding-bottom: 20px;
}

.sale-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.btn-primary {
    background: #E53935;
    color: #fff;
    
    &:hover {
      background: #C62828;
    }
  }
  
  &.btn-outline {
    background: #fff;
    color: #666;
    border: 1px solid #d9d9d9;
    
    &:hover {
      border-color: #E53935;
      color: #E53935;
    }
  }
  
  &.btn-scan {
    background: linear-gradient(135deg, #FF4D4F, #FF6B6B);
    color: #fff;
    display: flex;
    align-items: center;
    gap: 6px;
    
    &:hover {
      background: linear-gradient(135deg, #E63E3F, #E85A5A);
    }
  }
  
  &.btn-scan-sm {
    background: linear-gradient(135deg, #FF4D4F, #FF6B6B);
    color: #fff;
    padding: 6px 12px;
    font-size: 12px;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    
    &:hover {
      background: linear-gradient(135deg, #E63E3F, #E85A5A);
    }
  }
  
  &.btn-sm {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  &.btn-secondary {
    background: #f5f5f5;
    color: #666;
    
    &:hover {
      background: #e8e8e8;
    }
  }
}

.sale-layout {
  display: grid;
  grid-template-columns: 25% 50% 25%;
  gap: 20px;
  height: calc(100vh - 180px);
}

.left-panel, .center-panel, .right-panel {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  
  h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }
  
  .header-right {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

.category-select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 13px;
}

.customer-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.customer-item {
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
  
  &:hover {
    background: #f5f5f5;
  }
  
  &.active {
    background: linear-gradient(135deg, #FF4D4F, #FF6B6B);
    color: #fff;
    
    .customer-phone {
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

.customer-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.customer-phone {
  font-size: 12px;
  color: #999;
}

.product-grid {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  align-content: start;
}

.product-card {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover:not(.disabled) {
    border-color: #FF4D4F;
    box-shadow: 0 2px 8px rgba(255, 77, 79, 0.15);
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.has-barcode {
    border-color: #e8e8e8;
    background: linear-gradient(135deg, #fff 85%, #f0f0f0 100%);
  }
}

.product-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-spec {
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.product-price {
  font-size: 12px;
  color: #52C41A;
  font-weight: 500;
}

.product-stock {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.product-barcode {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 12px;
}

.order-total {
  font-size: 14px;
  color: #E53935;
  font-weight: 600;
}

.order-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.customer-info {
  font-size: 13px;
  margin-bottom: 16px;
  
  .label {
    color: #999;
  }
}

.order-items {
  margin-bottom: 16px;
}

.order-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 10px;
  margin-bottom: 8px;
}

.item-info {
  flex: 1;
  min-width: 100px;
  
  .item-name {
    display: block;
    font-size: 13px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .item-spec {
    font-size: 11px;
    color: #999;
  }
}

.item-batch {
  width: 100%;
  
  .batch-select {
    width: 100%;
    padding: 6px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    font-size: 12px;
  }
}

.quantity-input {
  width: 50px;
  padding: 6px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  text-align: center;
  font-size: 13px;
}

.item-total {
  font-size: 13px;
  color: #E53935;
  font-weight: 500;
  min-width: 60px;
  text-align: right;
}

.remove-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: #ff4d4f20;
  color: #FF4D4F;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  
  &:hover {
    background: #ff4d4f30;
  }
}

.remark-section {
  margin-bottom: 16px;
  
  label {
    display: block;
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
  }
  
  .form-textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    font-size: 13px;
    resize: none;
    height: 60px;
    
    &:focus {
      outline: none;
      border-color: #FF4D4F;
    }
  }
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #FF4D4F, #FF6B6B);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #E63E3F, #E85A5A);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}

.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 500px;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: #f5f5f5;
    border-radius: 50%;
    font-size: 20px;
    color: #666;
    cursor: pointer;
  }
}

.modal-body {
  margin-bottom: 24px;
}

.form-row {
  margin-bottom: 16px;
  
  label {
    display: block;
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .form-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: #FF4D4F;
    }
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
