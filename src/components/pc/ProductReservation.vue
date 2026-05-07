<template>
  <div class="product-reservation">
    <div class="reservation-header">
      <h3>商品预定 - 友金农资库存与账单管理系统</h3>
      <button class="btn btn-primary" @click="showAddModal = true">新增预定</button>
    </div>
    
    <div class="filter-bar">
      <select v-model="statusFilter" class="status-select">
        <option value="">全部状态</option>
        <option value="pending">未提货</option>
        <option value="picked">已提货</option>
        <option value="cancelled">已取消</option>
      </select>
      <input v-model="searchKeyword" type="text" class="search-input" placeholder="搜索客户名称或电话" />
    </div>
    
    <div class="reservation-list">
      <div 
        v-for="reservation in filteredReservations" 
        :key="reservation.id"
        class="reservation-card"
      >
        <div class="card-header">
          <div class="customer-info">
            <span class="customer-name">{{ reservation.customer_name }}</span>
            <span class="customer-phone">{{ reservation.customer_phone }}</span>
          </div>
          <span 
            class="status-badge" 
            :class="reservation.status"
          >
            {{ getStatusText(reservation.status) }}
          </span>
        </div>
        
        <div class="card-body">
          <div class="items-list">
            <div v-for="(item, index) in reservation.items" :key="index" class="item-row">
              <span class="item-name">{{ item.product_name }}</span>
              <span class="item-spec">{{ item.spec }}/{{ item.unit }}</span>
              <span class="item-qty">×{{ item.quantity }}</span>
              <span class="item-price">{{ formatAmount(item.amount) }}</span>
            </div>
          </div>
        </div>
        
        <div class="card-footer">
          <div class="total-info">
            <span class="label">合计金额:</span>
            <span class="total-amount">{{ formatAmount(reservation.total_amount) }}</span>
          </div>
          <div class="deposit-info" v-if="reservation.deposit_paid">
            <span>已付定金: {{ formatAmount(reservation.deposit_amount) }}</span>
          </div>
          <div class="date-info">
            <span>预定日期: {{ formatDate(reservation.expected_date) }}</span>
          </div>
        </div>
        
        <div class="card-actions">
          <button 
            v-if="reservation.status === 'pending'"
            class="action-btn btn-pick"
            @click="handlePickup(reservation)"
          >
            确认提货
          </button>
          <button 
            v-if="reservation.status === 'pending'"
            class="action-btn btn-cancel"
            @click="handleCancel(reservation)"
          >
            取消预定
          </button>
          <button 
            v-if="reservation.status === 'pending'"
            class="action-btn btn-convert"
            @click="handleConvert(reservation)"
          >
            转为出库单
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>新增商品预定</h3>
          <button class="close-btn" @click="closeAddModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>客户名称</label>
            <input v-model="newReservation.customer_name" type="text" class="form-input" />
          </div>
          <div class="form-row">
            <label>联系电话</label>
            <input v-model="newReservation.customer_phone" type="text" class="form-input" />
          </div>
          <div class="form-row">
            <label>预计提货日期</label>
            <input v-model="newReservation.expected_date" type="date" class="form-input" />
          </div>
          
          <div class="form-row">
            <label>选择商品</label>
            <select v-model="selectedProductId" class="form-select">
              <option value="">请选择商品</option>
              <option v-for="product in products" :key="product.id" :value="product.id">
                {{ product.name }} - {{ product.spec }} ({{ product.sale_price }}/{{ product.unit }})
              </option>
            </select>
          </div>
          
          <div class="form-row" v-if="selectedProduct">
            <label>数量</label>
            <input v-model.number="addItemQuantity" type="number" class="form-input" min="1" />
            <button class="btn btn-secondary btn-sm" @click="addToReservationItems">添加</button>
          </div>
          
          <div class="items-preview">
            <div v-for="(item, index) in newReservation.items" :key="index" class="preview-item">
              <span>{{ item.product_name }} × {{ item.quantity }}</span>
              <span>{{ formatAmount(item.amount) }}</span>
              <button class="remove-btn" @click="removeItem(index)">×</button>
            </div>
          </div>
          
          <div class="form-row">
            <label>
              <input v-model="newReservation.deposit_paid" type="checkbox" /> 已付定金
            </label>
          </div>
          <div class="form-row" v-if="newReservation.deposit_paid">
            <label>定金金额</label>
            <input v-model.number="newReservation.deposit_amount" type="number" class="form-input" />
          </div>
          
          <div class="form-row">
            <label>备注</label>
            <textarea v-model="newReservation.remark" class="form-textarea"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAddModal">取消</button>
          <button class="btn btn-primary" @click="submitReservation">保存预定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { createReservation, getReservations, updateReservationStatus, createSaleOrder, createOperationLog } from '@/utils/supabase'
import { formatAmount, formatDate, getStatusText } from '@/utils/format'
import type { Reservation, Product, ReservationItem } from '@/types'

const appStore = useAppStore()

const reservations = ref<Reservation[]>([])
const products = ref<Product[]>([])

const statusFilter = ref('')
const searchKeyword = ref('')

const showAddModal = ref(false)
const newReservation = ref({
  customer_name: '',
  customer_phone: '',
  items: [] as ReservationItem[],
  total_amount: 0,
  deposit_paid: false,
  deposit_amount: 0,
  expected_date: new Date().toISOString().split('T')[0],
  remark: ''
})

const selectedProductId = ref('')
const addItemQuantity = ref(1)

const selectedProduct = computed(() => {
  return products.value.find(p => p.id === selectedProductId.value)
})

const filteredReservations = computed(() => {
  let result = reservations.value
  
  if (statusFilter.value) {
    result = result.filter(r => r.status === statusFilter.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(r => 
      r.customer_name.toLowerCase().includes(keyword) || 
      r.customer_phone.includes(keyword)
    )
  }
  
  return result
})

function addToReservationItems() {
  if (!selectedProduct.value || addItemQuantity.value <= 0) return
  
  const existingItem = newReservation.value.items.find(item => item.product_id === selectedProduct.value!.id)
  if (existingItem) {
    existingItem.quantity += addItemQuantity.value
    existingItem.amount = existingItem.quantity * existingItem.unit_price
  } else {
    newReservation.value.items.push({
      id: '',
      reservation_id: '',
      product_id: selectedProduct.value.id,
      product_name: selectedProduct.value.name,
      spec: selectedProduct.value.spec,
      unit: selectedProduct.value.unit,
      quantity: addItemQuantity.value,
      unit_price: selectedProduct.value.sale_price,
      amount: addItemQuantity.value * selectedProduct.value.sale_price
    })
  }
  
  updateTotalAmount()
  addItemQuantity.value = 1
  selectedProductId.value = ''
}

function removeItem(index: number) {
  newReservation.value.items.splice(index, 1)
  updateTotalAmount()
}

function updateTotalAmount() {
  newReservation.value.total_amount = newReservation.value.items.reduce((sum, item) => sum + item.amount, 0)
}

function closeAddModal() {
  showAddModal.value = false
  newReservation.value = {
    customer_name: '',
    customer_phone: '',
    items: [],
    total_amount: 0,
    deposit_paid: false,
    deposit_amount: 0,
    expected_date: new Date().toISOString().split('T')[0],
    remark: ''
  }
  selectedProductId.value = ''
  addItemQuantity.value = 1
}

async function submitReservation() {
  if (!newReservation.value.customer_name.trim()) {
    uni.showToast({ title: '请输入客户名称', icon: 'none' })
    return
  }
  
  if (newReservation.value.items.length === 0) {
    uni.showToast({ title: '请添加预定商品', icon: 'none' })
    return
  }
  
  const reservation = {
    customer_name: newReservation.value.customer_name,
    customer_phone: newReservation.value.customer_phone,
    items: newReservation.value.items,
    total_amount: newReservation.value.total_amount,
    deposit_paid: newReservation.value.deposit_paid,
    deposit_amount: newReservation.value.deposit_amount,
    status: 'pending' as const,
    expected_date: newReservation.value.expected_date,
    remark: newReservation.value.remark
  }
  
  await createReservation(reservation)
  
  await createOperationLog({
    action: 'reservation_create',
    module: 'reservation',
    description: `创建商品预定单，客户: ${newReservation.value.customer_name}`,
    operator: 'admin'
  })
  
  await loadReservations()
  closeAddModal()
  
  uni.showToast({ title: '预定成功', icon: 'success' })
}

async function handlePickup(reservation: Reservation) {
  await updateReservationStatus(reservation.id, 'picked')
  
  await createOperationLog({
    action: 'reservation_picked',
    module: 'reservation',
    description: `预定单 ${reservation.id} 已提货`,
    operator: 'admin'
  })
  
  await loadReservations()
  uni.showToast({ title: '已确认提货', icon: 'success' })
}

async function handleCancel(reservation: Reservation) {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消此预定吗？',
    success: async (res) => {
      if (res.confirm) {
        await updateReservationStatus(reservation.id, 'cancelled')
        
        await createOperationLog({
          action: 'reservation_cancel',
          module: 'reservation',
          description: `预定单 ${reservation.id} 已取消`,
          operator: 'admin'
        })
        
        await loadReservations()
        uni.showToast({ title: '已取消预定', icon: 'success' })
      }
    }
  })
}

async function handleConvert(reservation: Reservation) {
  uni.showModal({
    title: '转为出库单',
    content: '确定要将此预定单转为销售出库单吗？',
    success: async (res) => {
      if (res.confirm) {
        const saleOrder = {
          customer_id: '',
          customer_name: reservation.customer_name,
          items: reservation.items.map(item => ({
            id: '',
            sale_order_id: '',
            product_id: item.product_id,
            product_name: item.product_name,
            spec: item.spec,
            unit: item.unit,
            batch_no: '',
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount
          })),
          total_amount: reservation.total_amount,
          status: 'pending' as const,
          remark: `由预定单转换，定金: ${reservation.deposit_amount}`
        }
        
        await createSaleOrder(saleOrder)
        await updateReservationStatus(reservation.id, 'picked')
        
        await createOperationLog({
          action: 'reservation_convert',
          module: 'reservation',
          description: `预定单 ${reservation.id} 转为销售出库单`,
          operator: 'admin'
        })
        
        await loadReservations()
        uni.showToast({ title: '已转为出库单', icon: 'success' })
      }
    }
  })
}

async function loadReservations() {
  reservations.value = await getReservations()
}

onMounted(async () => {
  await appStore.loadProducts()
  products.value = appStore.products
  await loadReservations()
})
</script>

<style lang="scss" scoped>
.product-reservation {
  padding-bottom: 20px;
}

.reservation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.reservation-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.status-select {
  padding: 10px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
}

.search-input {
  flex: 1;
  max-width: 300px;
  padding: 10px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
}

.reservation-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.reservation-card {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #F5F5F5;
}

.customer-info {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-size: 16px;
  font-weight: 600;
}

.customer-phone {
  font-size: 12px;
  color: #999;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  
  &.pending {
    background: #FFF3E0;
    color: #FF9800;
  }
  
  &.picked {
    background: #E3F2FD;
    color: #2196F3;
  }
  
  &.cancelled {
    background: #FFEBEE;
    color: #f44336;
  }
}

.card-body {
  padding: 16px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: #FAFAFA;
  border-radius: 8px;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}

.item-spec {
  font-size: 12px;
  color: #666;
  margin-right: 12px;
}

.item-qty {
  font-size: 12px;
  color: #999;
  margin-right: 12px;
}

.item-price {
  font-size: 14px;
  font-weight: 600;
  color: #E53935;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  border-top: 1px solid #F0F0F0;
  flex-wrap: wrap;
  gap: 8px;
}

.total-info {
  display: flex;
  align-items: center;
}

.total-info .label {
  font-size: 12px;
  color: #666;
  margin-right: 8px;
}

.total-amount {
  font-size: 18px;
  font-weight: 700;
  color: #E53935;
}

.deposit-info, .date-info {
  font-size: 12px;
  color: #666;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #F0F0F0;
}

.action-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.btn-pick {
    background: #E3F2FD;
    color: #2196F3;
    
    &:hover {
      background: #2196F3;
      color: #fff;
    }
  }
  
  &.btn-cancel {
    background: #FFEBEE;
    color: #f44336;
    
    &:hover {
      background: #f44336;
      color: #fff;
    }
  }
  
  &.btn-convert {
    background: #E8F5E9;
    color: #4CAF50;
    
    &:hover {
      background: #4CAF50;
      color: #fff;
    }
  }
}

.form-row {
  margin-bottom: 16px;
  
  label {
    display: block;
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .form-input, .form-select {
    width: 100%;
    padding: 12px;
    border: 1px solid #E0E0E0;
    border-radius: 8px;
    font-size: 14px;
  }
  
  .form-textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #E0E0E0;
    border-radius: 8px;
    font-size: 14px;
    min-height: 80px;
    resize: none;
  }
}

.items-preview {
  margin-bottom: 16px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #F9F9F9;
  border-radius: 8px;
  margin-bottom: 8px;
  
  .remove-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: #FFEBEE;
    color: #E53935;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
  }
}
</style>
