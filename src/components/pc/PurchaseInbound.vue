<template>
  <div class="purchase-inbound">
    <div class="purchase-header">
      <h3>采购入库 - 友金农资库存与账单管理系统</h3>
      <div class="header-actions">
        <button class="btn btn-scan" @click="showScanner = true">
          📷 扫码入库
        </button>
        <button class="btn btn-outline" @click="resetForm">清空</button>
      </div>
    </div>
    
    <div class="purchase-layout">
      <div class="left-panel">
        <div class="panel-header">
          <h4>供应商</h4>
          <button class="btn btn-outline btn-sm" @click="showSupplierModal = true">新增</button>
        </div>
        <div class="supplier-list">
          <div 
            v-for="supplier in suppliers" 
            :key="supplier.id"
            class="supplier-item"
            :class="{ active: selectedSupplier?.id === supplier.id }"
            @click="selectSupplier(supplier)"
          >
            <div class="supplier-name">{{ supplier.name }}</div>
            <div class="supplier-contact">{{ supplier.contact }} | {{ supplier.phone }}</div>
          </div>
        </div>
      </div>
      
      <div class="center-panel">
        <div class="panel-header">
          <h4>商品列表</h4>
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
            :class="{ 'has-barcode': product.barcode }"
            @click="addProductToOrder(product)"
          >
            <div class="product-name">{{ product.name }}</div>
            <div class="product-spec">{{ product.spec }} / {{ product.unit }}</div>
            <div class="product-price">进价: {{ formatAmount(product.purchase_price) }}</div>
            <div v-if="product.barcode" class="product-barcode">📊</div>
          </div>
        </div>
      </div>
      
      <div class="right-panel">
        <div class="panel-header">
          <h4>采购单</h4>
          <span class="order-total">合计: {{ formatAmount(totalAmount) }}</span>
        </div>
        
        <div v-if="!selectedSupplier" class="empty-hint">
          <p>请先选择供应商</p>
        </div>
        
        <div v-else class="order-content">
          <div class="supplier-info">
            <span class="label">供应商:</span>
            <span>{{ selectedSupplier.name }}</span>
          </div>
          
          <div class="batch-info">
            <div class="form-row">
              <label>批次号</label>
              <input v-model="batchNo" type="text" class="form-input" placeholder="自动生成" />
            </div>
            <div class="form-row">
              <label>生产日期</label>
              <input v-model="productionDate" type="date" class="form-input" />
            </div>
            <div class="form-row">
              <label>保质期(天)</label>
              <input v-model="expiryDays" type="number" class="form-input" placeholder="365" />
            </div>
          </div>
          
          <div class="order-items">
            <div v-for="(item, index) in orderItems" :key="index" class="order-item">
              <div class="item-info">
                <span class="item-name">{{ item.product_name }}</span>
                <span class="item-spec">{{ item.spec }}/{{ item.unit }}</span>
              </div>
              <div class="item-price">{{ formatAmount(item.unit_price) }}</div>
              <input 
                v-model.number="item.quantity" 
                type="number" 
                class="quantity-input"
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
            提交入库
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="showSupplierModal" class="modal-overlay" @click.self="showSupplierModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>新增供应商</h3>
          <button class="close-btn" @click="showSupplierModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>供应商名称</label>
            <input v-model="newSupplier.name" type="text" class="form-input" />
          </div>
          <div class="form-row">
            <label>联系人</label>
            <input v-model="newSupplier.contact" type="text" class="form-input" />
          </div>
          <div class="form-row">
            <label>联系电话</label>
            <input v-model="newSupplier.phone" type="text" class="form-input" />
          </div>
          <div class="form-row">
            <label>地址</label>
            <input v-model="newSupplier.address" type="text" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showSupplierModal = false">取消</button>
          <button class="btn btn-primary" @click="saveSupplier">保存</button>
        </div>
      </div>
    </div>

    <BarcodeScanner
      :visible="showScanner"
      mode="inbound"
      @close="showScanner = false"
      @scanned="handleBarcodeScanned"
      @not-found="handleBarcodeNotFound"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { createSupplier, createPurchaseOrder, addStock, createOperationLog, generateBatchNo } from '@/utils/supabase'
import { formatAmount } from '@/utils/format'
import type { Supplier, Product, PurchaseOrderItem } from '@/types'
import BarcodeScanner from '@/components/BarcodeScanner.vue'

const appStore = useAppStore()

const suppliers = ref<Supplier[]>([])
const categories = ref<any[]>([])
const products = ref<Product[]>([])

const selectedSupplier = ref<Supplier | null>(null)
const selectedCategory = ref('')
const batchNo = ref(generateBatchNo())
const productionDate = ref(new Date().toISOString().split('T')[0])
const expiryDays = ref(365)
const remark = ref('')
const showScanner = ref(false)

const orderItems = ref<PurchaseOrderItem[]>([])

const showSupplierModal = ref(false)
const newSupplier = ref({
  name: '',
  contact: '',
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

function selectSupplier(supplier: Supplier) {
  selectedSupplier.value = supplier
}

function addProductToOrder(product: Product) {
  const existingItem = orderItems.value.find(item => item.product_id === product.id)
  if (existingItem) {
    existingItem.quantity++
    existingItem.amount = existingItem.quantity * existingItem.unit_price
  } else {
    orderItems.value.push({
      id: '',
      purchase_order_id: '',
      product_id: product.id,
      product_name: product.name,
      spec: product.spec,
      unit: product.unit,
      batch_no: batchNo.value,
      production_date: productionDate.value,
      expiry_date: calculateExpiryDate(),
      quantity: 1,
      unit_price: product.purchase_price,
      amount: product.purchase_price
    })
  }
}

function calculateExpiryDate(): string {
  const date = new Date(productionDate.value)
  date.setDate(date.getDate() + Number(expiryDays.value))
  return date.toISOString().split('T')[0]
}

function updateItemAmount(index: number) {
  const item = orderItems.value[index]
  item.amount = item.quantity * item.unit_price
}

function removeOrderItem(index: number) {
  orderItems.value.splice(index, 1)
}

async function saveSupplier() {
  if (!newSupplier.value.name.trim()) {
    alert('请输入供应商名称')
    return
  }
  
  const supplier = await createSupplier(newSupplier.value)
  suppliers.value.push(supplier)
  showSupplierModal.value = false
  newSupplier.value = { name: '', contact: '', phone: '', address: '' }
  
  await createOperationLog({
    action: 'supplier_create',
    module: 'purchase',
    description: `新增供应商 ${supplier.name}`,
    operator: 'admin'
  })
}

async function submitOrder() {
  if (!selectedSupplier.value) {
    alert('请选择供应商')
    return
  }
  
  if (orderItems.value.length === 0) {
    alert('请添加采购商品')
    return
  }
  
  const order = await createPurchaseOrder({
    supplier_id: selectedSupplier.value.id,
    supplier_name: selectedSupplier.value.name,
    items: orderItems.value.map(item => ({
      ...item,
      expiry_date: calculateExpiryDate()
    })),
    total_amount: totalAmount.value,
    status: 'pending',
    remark: remark.value
  })
  
  for (const item of orderItems.value) {
    await addStock({
      product_id: item.product_id,
      batch_no: batchNo.value || generateBatchNo(),
      production_date: productionDate.value,
      expiry_date: calculateExpiryDate(),
      quantity: item.quantity
    })
  }
  
  await createOperationLog({
    action: 'purchase_create',
    module: 'purchase',
    description: `创建采购入库单 ${selectedSupplier.value.name} 合计 ${formatAmount(totalAmount.value)}`,
    operator: 'admin'
  })
  
  await appStore.loadAllData()
  
  alert('入库成功')
  resetForm()
}

function resetForm() {
  selectedSupplier.value = null
  batchNo.value = generateBatchNo()
  productionDate.value = new Date().toISOString().split('T')[0]
  expiryDays.value = 365
  remark.value = ''
  orderItems.value = []
}

function handleBarcodeScanned(result: any) {
  if (result.product) {
    addProductToOrder(result.product)
  }
  showScanner.value = false
}

function handleBarcodeNotFound(barcode: string) {
  alert(`未找到条形码 "${barcode}" 对应的商品，请先到商品管理中添加该商品！`)
  showScanner.value = false
}

onMounted(async () => {
  await appStore.loadAllData()
  suppliers.value = appStore.suppliers
  categories.value = appStore.categories
  products.value = appStore.products
})
</script>

<style lang="scss" scoped>
.purchase-inbound {
  padding-bottom: 20px;
}

.purchase-header {
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

.purchase-layout {
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

.supplier-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.supplier-item {
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
    
    .supplier-contact {
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

.supplier-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.supplier-contact {
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
  
  &:hover {
    border-color: #FF4D4F;
    box-shadow: 0 2px 8px rgba(255, 77, 79, 0.15);
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
  color: #E53935;
  font-weight: 500;
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

.supplier-info {
  font-size: 13px;
  margin-bottom: 16px;
  
  .label {
    color: #999;
  }
}

.batch-info {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.form-row {
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
  }
  
  .form-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    font-size: 13px;
    
    &:focus {
      outline: none;
      border-color: #FF4D4F;
    }
  }
}

.order-items {
  margin-bottom: 16px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 10px;
  margin-bottom: 8px;
}

.item-info {
  flex: 1;
  min-width: 0;
  
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

.item-price {
  font-size: 12px;
  color: #666;
  min-width: 50px;
  text-align: right;
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

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
