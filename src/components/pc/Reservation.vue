<template>
  <view class="reservation-container">
    <view class="page-header">
      <button class="btn btn-primary" @click="showAddModal = true">新增预定</button>
      <view class="filter-bar">
        <input v-model="searchText" placeholder="搜索客户或商品" class="search-input" />
        <picker :value="statusIndex" :range="statusOptions" @change="onStatusChange">
          <view class="filter-picker">{{ statusOptions[statusIndex] }}</view>
        </picker>
      </view>
    </view>
    
    <view class="reservation-list">
      <view v-for="reservation in filteredReservations" :key="reservation.id" class="reservation-card">
        <view class="card-header">
          <view class="card-title">
            <text class="customer-name">{{ reservation.customer_name }}</text>
            <text class="customer-phone">{{ reservation.customer_phone }}</text>
          </view>
          <view class="status-tag" :class="reservation.status">
            {{ getStatusText(reservation.status) }}
          </view>
        </view>
        
        <view class="card-body">
          <view class="product-info">
            <text class="product-name">{{ reservation.product_name }}</text>
            <text class="product-spec">{{ reservation.spec }}</text>
          </view>
          <view class="reservation-info">
            <view class="info-item">
              <text class="info-label">预定数量</text>
              <text class="info-value">{{ reservation.quantity }}件</text>
            </view>
            <view class="info-item">
              <text class="info-label">预定金额</text>
              <text class="info-value price">¥{{ reservation.amount.toFixed(2) }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">预定日期</text>
              <text class="info-value">{{ formatDate(reservation.reservation_date) }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">定金</text>
              <text class="info-value" :class="reservation.deposit_paid ? 'success' : ''">
                {{ reservation.deposit_paid ? '已付' : '未付' }}
              </text>
            </view>
          </view>
        </view>
        
        <view v-if="reservation.remark" class="card-remark">
          <text>{{ reservation.remark }}</text>
        </view>
        
        <view class="card-footer">
          <text class="create-time">{{ formatDateTime(reservation.created_at) }}</text>
          <view class="action-buttons">
            <button 
              v-if="reservation.status === 'pending'" 
              class="btn btn-primary btn-sm" 
              @click="handlePickup(reservation)"
            >
              确认提货
            </button>
            <button 
              v-if="reservation.status === 'pending'" 
              class="btn btn-secondary btn-sm" 
              @click="handleConvert(reservation)"
            >
              转销售单
            </button>
            <button 
              v-if="reservation.status !== 'cancelled'" 
              class="btn btn-danger btn-sm" 
              @click="handleCancel(reservation)"
            >
              取消预定
            </button>
          </view>
        </view>
      </view>
      
      <view v-if="filteredReservations.length === 0" class="empty-state">
        <text>暂无预定记录</text>
      </view>
    </view>
    
    <view v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <view class="modal-content large" @click.stop>
        <view class="modal-header">
          <text class="modal-title">新增商品预定</text>
          <button class="modal-close" @click="showAddModal = false">×</button>
        </view>
        <view class="modal-body">
          <view class="form-row">
            <text class="label">客户名称 *</text>
            <input v-model="newReservation.customer_name" placeholder="输入客户名称" class="input" />
          </view>
          <view class="form-row">
            <text class="label">联系电话</text>
            <input v-model="newReservation.customer_phone" placeholder="输入联系电话" class="input" />
          </view>
          <view class="form-row">
            <text class="label">选择商品 *</text>
            <picker :value="productIndex" :range="productNames" @change="onProductChange">
              <view class="picker-input">{{ productIndex >= 0 ? productNames[productIndex] : '请选择商品' }}</view>
            </picker>
          </view>
          <view class="form-row">
            <text class="label">预定数量 *</text>
            <input v-model.number="newReservation.quantity" type="number" class="input" placeholder="输入数量" />
          </view>
          <view class="form-row">
            <text class="label">预定金额 *</text>
            <input v-model.number="newReservation.amount" type="digit" class="input" placeholder="输入金额" />
          </view>
          <view class="form-row">
            <text class="label">预定日期 *</text>
            <picker mode="date" :value="newReservation.reservation_date" @change="onDateChange">
              <view class="picker-input">{{ newReservation.reservation_date || '选择日期' }}</view>
            </picker>
          </view>
          <view class="form-row">
            <text class="label">是否付定金</text>
            <view class="radio-group">
              <view 
                class="radio-item" 
                :class="{ active: newReservation.deposit_paid }"
                @click="newReservation.deposit_paid = true"
              >
                <view class="radio-dot"></view>
                <text>是</text>
              </view>
              <view 
                class="radio-item" 
                :class="{ active: !newReservation.deposit_paid }"
                @click="newReservation.deposit_paid = false"
              >
                <view class="radio-dot"></view>
                <text>否</text>
              </view>
            </view>
          </view>
          <view class="form-row">
            <text class="label">备注</text>
            <textarea v-model="newReservation.remark" placeholder="输入备注" class="textarea" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn btn-secondary" @click="showAddModal = false">取消</button>
          <button class="btn btn-primary" @click="submitReservation">确认预定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { mockProducts, mockCustomers } from '@/data/mock'
import type { Product, Reservation as ReservationType } from '@/types'
import { generateId, formatDate, formatDateTime } from '@/utils/format'

const reservations = ref<ReservationType[]>([])
const searchText = ref('')
const statusIndex = ref(0)
const statusOptions = ['全部', '未提货', '已提货', '已取消']
const showAddModal = ref(false)
const newReservation = ref({
  customer_name: '',
  customer_phone: '',
  product_id: '',
  product_name: '',
  spec: '',
  quantity: 1,
  amount: 0,
  deposit_paid: false,
  reservation_date: '',
  remark: ''
})
const products = ref<Product[]>([])
const productNames = ref<string[]>([])
const productIndex = ref(-1)

const filteredReservations = computed(() => {
  let result = reservations.value
  
  if (statusIndex.value > 0) {
    const statusMap: Record<number, string> = {
      1: 'pending',
      2: 'picked',
      3: 'cancelled'
    }
    result = result.filter(r => r.status === statusMap[statusIndex.value])
  }
  
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(r => 
      r.customer_name.toLowerCase().includes(keyword) ||
      r.customer_phone.includes(keyword) ||
      r.product_name.toLowerCase().includes(keyword)
    )
  }
  
  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    'pending': '未提货',
    'picked': '已提货',
    'cancelled': '已取消'
  }
  return map[status] || status
}

function onStatusChange(e: any) {
  statusIndex.value = e.detail.value
}

function onProductChange(e: any) {
  productIndex.value = e.detail.value
  if (productIndex.value >= 0) {
    const product = products.value[productIndex.value]
    newReservation.value.product_id = product.id
    newReservation.value.product_name = product.name
    newReservation.value.spec = product.spec
    newReservation.value.amount = product.sale_price * (newReservation.value.quantity || 1)
  }
}

function onDateChange(e: any) {
  newReservation.value.reservation_date = e.detail.value
}

function handlePickup(reservation: ReservationType) {
  uni.showModal({
    title: '确认提货',
    content: `确定将 "${reservation.customer_name}" 的预定标记为已提货吗？`,
    success: (res) => {
      if (res.confirm) {
        const index = reservations.value.findIndex(r => r.id === reservation.id)
        if (index >= 0) {
          reservations.value[index].status = 'picked'
          reservations.value[index].updated_at = new Date().toISOString()
        }
        uni.showToast({ title: '操作成功', icon: 'success' })
      }
    }
  })
}

function handleConvert(reservation: ReservationType) {
  uni.showModal({
    title: '转为销售单',
    content: `确定将 "${reservation.customer_name}" 的预定转为销售出库单吗？`,
    success: (res) => {
      if (res.confirm) {
        const index = reservations.value.findIndex(r => r.id === reservation.id)
        if (index >= 0) {
          reservations.value[index].status = 'picked'
          reservations.value[index].updated_at = new Date().toISOString()
        }
        uni.showToast({ title: '已转为销售单', icon: 'success' })
      }
    }
  })
}

function handleCancel(reservation: ReservationType) {
  uni.showModal({
    title: '取消预定',
    content: `确定取消 "${reservation.customer_name}" 的预定吗？`,
    success: (res) => {
      if (res.confirm) {
        const index = reservations.value.findIndex(r => r.id === reservation.id)
        if (index >= 0) {
          reservations.value[index].status = 'cancelled'
          reservations.value[index].updated_at = new Date().toISOString()
        }
        uni.showToast({ title: '已取消', icon: 'success' })
      }
    }
  })
}

function submitReservation() {
  if (!newReservation.value.customer_name.trim()) {
    uni.showToast({ title: '请输入客户名称', icon: 'none' })
    return
  }
  if (productIndex.value < 0) {
    uni.showToast({ title: '请选择商品', icon: 'none' })
    return
  }
  if (!newReservation.value.quantity || newReservation.value.quantity <= 0) {
    uni.showToast({ title: '请输入有效数量', icon: 'none' })
    return
  }
  if (!newReservation.value.reservation_date) {
    uni.showToast({ title: '请选择预定日期', icon: 'none' })
    return
  }
  
  const reservation: ReservationType = {
    id: generateId(),
    customer_id: '',
    customer_name: newReservation.value.customer_name,
    customer_phone: newReservation.value.customer_phone,
    product_id: newReservation.value.product_id,
    product_name: newReservation.value.product_name,
    spec: newReservation.value.spec,
    quantity: newReservation.value.quantity,
    amount: newReservation.value.amount,
    deposit_paid: newReservation.value.deposit_paid,
    status: 'pending',
    reservation_date: newReservation.value.reservation_date,
    remark: newReservation.value.remark,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  reservations.value.unshift(reservation)
  showAddModal.value = false
  newReservation.value = {
    customer_name: '',
    customer_phone: '',
    product_id: '',
    product_name: '',
    spec: '',
    quantity: 1,
    amount: 0,
    deposit_paid: false,
    reservation_date: '',
    remark: ''
  }
  productIndex.value = -1
  uni.showToast({ title: '预定成功', icon: 'success' })
}

onMounted(() => {
  products.value = [...mockProducts]
  productNames.value = products.value.map(p => `${p.name} (${p.spec})`)
  
  const today = new Date().toISOString().split('T')[0]
  reservations.value = [
    {
      id: 'r1',
      customer_id: 'cu1',
      customer_name: '张三',
      customer_phone: '13500135001',
      product_id: 'p5',
      product_name: '玉米种子',
      spec: '郑单958',
      quantity: 5,
      amount: 275,
      deposit_paid: true,
      status: 'pending',
      reservation_date: today,
      remark: '要优质种子',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'r2',
      customer_id: 'cu2',
      customer_name: '李四',
      customer_phone: '13600136002',
      product_id: 'p4',
      product_name: '尿素',
      spec: '46%含量',
      quantity: 50,
      amount: 150,
      deposit_paid: false,
      status: 'pending',
      reservation_date: today,
      remark: '',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'r3',
      customer_id: 'cu3',
      customer_name: '王五',
      customer_phone: '13400134003',
      product_id: 'p1',
      product_name: '草甘膦',
      spec: '41%水剂',
      quantity: 20,
      amount: 360,
      deposit_paid: true,
      status: 'picked',
      reservation_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      remark: '已提货',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString()
    }
  ]
})
</script>

<style lang="scss" scoped>
.reservation-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.btn {
  height: 72rpx;
  padding: 0 32rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  border: none;
  
  &-primary {
    background: #e53935;
    color: #ffffff;
  }
  
  &-secondary {
    background: #f5f5f5;
    color: #333333;
  }
  
  &-danger {
    background: #ffebee;
    color: #e53935;
  }
  
  &-sm {
    height: 56rpx;
    padding: 0 20rpx;
    font-size: 22rpx;
  }
}

.filter-bar {
  display: flex;
  gap: 20rpx;
  align-items: center;
}

.search-input {
  width: 300rpx;
  height: 64rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #eeeeee;
  font-size: 24rpx;
}

.filter-picker {
  height: 64rpx;
  padding: 0 24rpx;
  border-radius: 12rpx;
  border: 1rpx solid #eeeeee;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  color: #333333;
}

.reservation-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.reservation-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.card-title {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.customer-phone {
  font-size: 22rpx;
  color: #999999;
  margin-top: 4rpx;
}

.status-tag {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  
  &.pending {
    background: #fff3e0;
    color: #ff9800;
  }
  
  &.picked {
    background: #e8f5e9;
    color: #4caf50;
  }
  
  &.cancelled {
    background: #fce4ec;
    color: #e53935;
  }
}

.card-body {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;
  border-top: 1rpx solid #f0f0f0;
  border-bottom: 1rpx solid #f0f0f0;
}

.product-info {
  flex: 1;
}

.product-name {
  display: block;
  font-size: 26rpx;
  font-weight: 500;
  color: #1a1a1a;
}

.product-spec {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-top: 4rpx;
}

.reservation-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  justify-content: flex-end;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.info-label {
  font-size: 22rpx;
  color: #999999;
}

.info-value {
  font-size: 24rpx;
  color: #333333;
  
  &.price {
    color: #e53935;
    font-weight: bold;
  }
  
  &.success {
    color: #4caf50;
  }
}

.card-remark {
  padding: 16rpx 0;
  font-size: 24rpx;
  color: #666666;
  background: #fafafa;
  border-radius: 8rpx;
  padding: 16rpx;
  margin: 16rpx 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.create-time {
  font-size: 22rpx;
  color: #999999;
}

.action-buttons {
  display: flex;
  gap: 16rpx;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300rpx;
  color: #999999;
  font-size: 28rpx;
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
  background: #ffffff;
  border-radius: 20rpx;
  width: 90%;
  max-width: 700rpx;
  max-height: 85vh;
  overflow: hidden;
  
  &.large {
    max-width: 800rpx;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #eeeeee;
}

.modal-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.modal-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: 40rpx;
  color: #999999;
}

.modal-body {
  padding: 24rpx;
  max-height: 500rpx;
  overflow-y: auto;
}

.form-row {
  margin-bottom: 20rpx;
}

.label {
  display: block;
  font-size: 24rpx;
  color: #666666;
  margin-bottom: 10rpx;
}

.input {
  width: 100%;
  height: 72rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #eeeeee;
  font-size: 26rpx;
}

.picker-input {
  width: 100%;
  height: 72rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #eeeeee;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  color: #333333;
}

.textarea {
  width: 100%;
  height: 120rpx;
  padding: 16rpx 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #eeeeee;
  font-size: 26rpx;
}

.radio-group {
  display: flex;
  gap: 40rpx;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  
  &.active .radio-dot {
    background: #e53935;
    
    &::after {
      display: block;
    }
  }
}

.radio-dot {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 2rpx solid #dddddd;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background: #ffffff;
    display: none;
  }
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  border-top: 1rpx solid #eeeeee;
  
  .btn {
    flex: 1;
    height: 80rpx;
  }
}
</style>