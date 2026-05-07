<template>
  <view class="h5-container">
    <view class="page-header">
      <text class="page-title">商品预定</text>
      <text class="page-subtitle">友金农资库存与账单管理系统</text>
    </view>
    
    <view class="filter-bar">
      <view class="search-box">
        <input class="search-input" v-model="searchKeyword" placeholder="搜索客户或商品" />
      </view>
      <view class="filter-tabs">
        <button 
          v-for="filter in statusFilters" 
          :key="filter.value"
          class="filter-btn"
          :class="{ active: selectedFilter === filter.value }"
          @click="selectedFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </view>
    </view>
    
    <view class="reservation-list">
      <view 
        v-for="reservation in filteredReservations" 
        :key="reservation.id"
        class="reservation-card"
        @click="showDetail(reservation)"
      >
        <view class="card-header">
          <view class="customer-info">
            <text class="customer-name">{{ reservation.customer_name }}</text>
            <text class="customer-phone">{{ reservation.customer_phone }}</text>
          </view>
          <view class="status-badge" :class="reservation.status">
            {{ getStatusText(reservation.status) }}
          </view>
        </view>
        
        <view class="product-info">
          <text class="product-name">{{ reservation.product_name }}</text>
          <text class="product-spec">{{ reservation.product_spec }} x{{ reservation.quantity }}</text>
        </view>
        
        <view class="card-footer">
          <view class="price-info">
            <text class="amount-label">预定金额</text>
            <text class="amount-value">¥{{ reservation.amount.toFixed(2) }}</text>
          </view>
          <view class="action-buttons">
            <button v-if="reservation.status === 'pending'" class="action-btn" @click.stop="handlePickup(reservation)">提货</button>
            <button v-if="reservation.status === 'pending'" class="action-btn cancel" @click.stop="handleCancel(reservation)">取消</button>
          </view>
        </view>
      </view>
    </view>
    
    <view v-if="filteredReservations.length === 0" class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无预定记录</text>
    </view>
    
    <view class="add-btn-container">
      <button class="add-btn" @click="showAddModal">+ 新增预定</button>
    </view>
    
    <view v-if="showModal" class="modal-mask" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingReservation ? '编辑预定' : '新增预定' }}</text>
          <text class="close-btn" @click="closeModal">×</text>
        </view>
        <scroll-view scroll-y class="modal-body">
          <view class="form-item">
            <text class="form-label">客户姓名 *</text>
            <input class="form-input" v-model="form.customer_name" placeholder="请输入客户姓名" />
          </view>
          <view class="form-item">
            <text class="form-label">联系电话</text>
            <input class="form-input" v-model="form.customer_phone" placeholder="请输入联系电话" />
          </view>
          <view class="form-item">
            <text class="form-label">选择商品 *</text>
            <view class="product-select" @click="showProductPicker = true">
              <text v-if="selectedProduct">{{ selectedProduct.name }} - {{ selectedProduct.spec }}</text>
              <text v-else class="placeholder">请选择商品</text>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">预定数量 *</text>
            <input class="form-input" type="number" v-model="form.quantity" placeholder="请输入数量" />
          </view>
          <view class="form-item">
            <text class="form-label">预定金额 *</text>
            <input class="form-input" type="digit" v-model="form.amount" placeholder="请输入金额" />
          </view>
          <view class="form-item">
            <text class="form-label">是否付定金</text>
            <view class="radio-group">
              <label class="radio-item">
                <input type="radio" v-model="form.deposit_paid" :value="true" />
                <text>是</text>
              </label>
              <label class="radio-item">
                <input type="radio" v-model="form.deposit_paid" :value="false" />
                <text>否</text>
              </label>
            </view>
          </view>
          <view v-if="form.deposit_paid" class="form-item">
            <text class="form-label">定金金额</text>
            <input class="form-input" type="digit" v-model="form.deposit_amount" placeholder="请输入定金金额" />
          </view>
          <view class="form-item">
            <text class="form-label">预定日期 *</text>
            <input class="form-input" type="date" v-model="form.reservation_date" />
          </view>
          <view class="form-item">
            <text class="form-label">备注</text>
            <textarea class="form-textarea" v-model="form.remark" placeholder="请输入备注" />
          </view>
        </scroll-view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="closeModal">取消</button>
          <button class="modal-btn confirm" @click="saveReservation">确定</button>
        </view>
      </view>
    </view>
    
    <view v-if="showProductPicker" class="modal-mask" @click="showProductPicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择商品</text>
          <text class="close-btn" @click="showProductPicker = false">×</text>
        </view>
        <scroll-view scroll-y class="product-list">
          <view 
            v-for="product in products" 
            :key="product.id"
            class="product-item"
            @click="selectProduct(product)"
          >
            <view class="product-info">
              <text class="product-name">{{ product.name }}</text>
              <text class="product-spec">{{ product.spec }} · ¥{{ product.sale_price }}/{{ product.unit }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
    
    <view v-if="showDetailModal" class="modal-mask" @click="closeDetailModal">
      <view class="detail-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">预定详情</text>
          <text class="close-btn" @click="closeDetailModal">×</text>
        </view>
        <scroll-view scroll-y class="modal-body" v-if="selectedReservation">
          <view class="detail-section">
            <view class="detail-row">
              <text class="detail-label">客户</text>
              <text class="detail-value">{{ selectedReservation.customer_name }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">电话</text>
              <text class="detail-value">{{ selectedReservation.customer_phone }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">商品</text>
              <text class="detail-value">{{ selectedReservation.product_name }} - {{ selectedReservation.product_spec }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">数量</text>
              <text class="detail-value">{{ selectedReservation.quantity }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">金额</text>
              <text class="detail-value amount">¥{{ selectedReservation.amount.toFixed(2) }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">定金</text>
              <text class="detail-value">{{ selectedReservation.deposit_paid ? `已付 ¥${selectedReservation.deposit_amount.toFixed(2)}` : '未付' }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">预定日期</text>
              <text class="detail-value">{{ selectedReservation.reservation_date }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">状态</text>
              <text class="detail-value" :class="selectedReservation.status">{{ getStatusText(selectedReservation.status) }}</text>
            </view>
            <view v-if="selectedReservation.remark" class="detail-row">
              <text class="detail-label">备注</text>
              <text class="detail-value">{{ selectedReservation.remark }}</text>
            </view>
          </view>
        </scroll-view>
        <view class="modal-footer" v-if="selectedReservation?.status === 'pending'">
          <button class="modal-btn cancel" @click="closeDetailModal">关闭</button>
          <button class="modal-btn confirm" @click="handleConvert(selectedReservation)">转为出库</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getReservations, createReservation, updateReservation, getProducts, createSaleOrder, getStocks, updateStock, createOperationLog } from '@/utils/supabase'
import { formatDate } from '@/utils/format'
import type { Reservation, Product, SaleItem } from '@/types'

const reservations = ref<Reservation[]>([])
const products = ref<Product[]>([])
const searchKeyword = ref('')
const selectedFilter = ref('all')
const showModal = ref(false)
const showProductPicker = ref(false)
const showDetailModal = ref(false)
const editingReservation = ref<Reservation | null>(null)
const selectedProduct = ref<Product | null>(null)
const selectedReservation = ref<Reservation | null>(null)

const statusFilters = [
  { label: '全部', value: 'all' },
  { label: '未提货', value: 'pending' },
  { label: '已提货', value: 'picked' },
  { label: '已取消', value: 'cancelled' }
]

const form = ref({
  customer_name: '',
  customer_phone: '',
  product_id: '',
  product_name: '',
  product_spec: '',
  quantity: 1,
  amount: 0,
  deposit_paid: false,
  deposit_amount: 0,
  reservation_date: formatDate(new Date()),
  remark: ''
})

const filteredReservations = computed(() => {
  let result = reservations.value
  
  if (selectedFilter.value !== 'all') {
    result = result.filter(r => r.status === selectedFilter.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(r =>
      r.customer_name.toLowerCase().includes(keyword) ||
      r.product_name.toLowerCase().includes(keyword) ||
      r.customer_phone.includes(keyword)
    )
  }
  
  return result
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    reservations.value = await getReservations()
    products.value = await getProducts()
  } catch (error) {
    console.error('Load data error:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: '未提货',
    picked: '已提货',
    cancelled: '已取消'
  }
  return map[status] || status
}

const showAddModal = () => {
  editingReservation.value = null
  selectedProduct.value = null
  form.value = {
    customer_name: '',
    customer_phone: '',
    product_id: '',
    product_name: '',
    product_spec: '',
    quantity: 1,
    amount: 0,
    deposit_paid: false,
    deposit_amount: 0,
    reservation_date: formatDate(new Date()),
    remark: ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingReservation.value = null
  selectedProduct.value = null
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedReservation.value = null
}

const selectProduct = (product: Product) => {
  selectedProduct.value = product
  form.value.product_id = product.id
  form.value.product_name = product.name
  form.value.product_spec = product.spec
  form.value.amount = product.sale_price
  showProductPicker.value = false
}

const showDetail = (reservation: Reservation) => {
  selectedReservation.value = reservation
  showDetailModal.value = true
}

const saveReservation = async () => {
  if (!form.value.customer_name.trim()) {
    uni.showToast({ title: '请输入客户姓名', icon: 'none' })
    return
  }
  if (!form.value.product_id) {
    uni.showToast({ title: '请选择商品', icon: 'none' })
    return
  }
  if (!form.value.quantity || form.value.quantity <= 0) {
    uni.showToast({ title: '请输入有效数量', icon: 'none' })
    return
  }
  if (!form.value.amount || form.value.amount <= 0) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' })
    return
  }
  
  uni.showLoading({ title: '保存中...' })
  
  try {
    if (editingReservation.value) {
      await updateReservation(editingReservation.value.id, {
        customer_name: form.value.customer_name,
        customer_phone: form.value.customer_phone,
        product_id: form.value.product_id,
        product_name: form.value.product_name,
        product_spec: form.value.product_spec,
        quantity: form.value.quantity,
        amount: parseFloat(form.value.amount.toString()),
        deposit_paid: form.value.deposit_paid,
        deposit_amount: parseFloat(form.value.deposit_amount.toString()) || 0,
        reservation_date: form.value.reservation_date,
        remark: form.value.remark
      })
      
      await createOperationLog({
        operator: '管理员',
        action: '修改预定',
        target: `${form.value.customer_name}`,
        detail: `${form.value.product_name} x${form.value.quantity}`
      })
    } else {
      await createReservation({
        customer_name: form.value.customer_name,
        customer_phone: form.value.customer_phone,
        product_id: form.value.product_id,
        product_name: form.value.product_name,
        product_spec: form.value.product_spec,
        quantity: form.value.quantity,
        amount: parseFloat(form.value.amount.toString()),
        deposit_paid: form.value.deposit_paid,
        deposit_amount: parseFloat(form.value.deposit_amount.toString()) || 0,
        reservation_date: form.value.reservation_date,
        status: 'pending',
        remark: form.value.remark
      })
      
      await createOperationLog({
        operator: '管理员',
        action: '新增预定',
        target: `${form.value.customer_name}`,
        detail: `${form.value.product_name} x${form.value.quantity}`
      })
    }
    
    uni.hideLoading()
    await loadData()
    closeModal()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    uni.hideLoading()
    console.error('Save reservation error:', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

const handlePickup = async (reservation: Reservation) => {
  uni.showModal({
    title: '确认提货',
    content: `确定将 "${reservation.product_name}" 标记为已提货吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await updateReservation(reservation.id, { status: 'picked' })
          await createOperationLog({
            operator: '管理员',
            action: '确认提货',
            target: `${reservation.customer_name}`,
            detail: `${reservation.product_name} x${reservation.quantity}`
          })
          await loadData()
          uni.showToast({ title: '操作成功', icon: 'success' })
        } catch (error) {
          console.error('Pickup error:', error)
          uni.showToast({ title: '操作失败', icon: 'none' })
        }
      }
    }
  })
}

const handleCancel = async (reservation: Reservation) => {
  uni.showModal({
    title: '确认取消',
    content: `确定取消 "${reservation.customer_name}" 的预定吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await updateReservation(reservation.id, { status: 'cancelled' })
          await createOperationLog({
            operator: '管理员',
            action: '取消预定',
            target: `${reservation.customer_name}`,
            detail: `${reservation.product_name} x${reservation.quantity}`
          })
          await loadData()
          uni.showToast({ title: '操作成功', icon: 'success' })
        } catch (error) {
          console.error('Cancel error:', error)
          uni.showToast({ title: '操作失败', icon: 'none' })
        }
      }
    }
  })
}

const handleConvert = async (reservation: Reservation) => {
  uni.showModal({
    title: '转为出库',
    content: `确定将此预定转为销售出库单吗？`,
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中...' })
        
        try {
          const stocks = await getStocks()
          const productStocks = stocks
            .filter(s => s.product_id === reservation.product_id && s.quantity > 0)
            .sort((a, b) => new Date(a.production_date).getTime() - new Date(b.production_date))
          
          let remainingQty = reservation.quantity
          
          for (const stock of productStocks) {
            if (remainingQty <= 0) break
            remainingQty -= stock.quantity
          }
          
          if (remainingQty > 0) {
            uni.hideLoading()
            uni.showToast({ title: '库存不足，无法转出库', icon: 'none' })
            closeDetailModal()
            return
          }
          
          const orderItems: SaleItem[] = [{
            id: '',
            product_id: reservation.product_id,
            product_name: reservation.product_name,
            product_spec: reservation.product_spec,
            batch_no: '',
            quantity: reservation.quantity,
            price: reservation.amount / reservation.quantity,
            amount: reservation.amount
          }]
          
          await createSaleOrder({
            customer_id: '',
            customer_name: reservation.customer_name,
            items: orderItems,
            total_amount: reservation.amount,
            status: 'approved'
          })
          
          for (const stock of productStocks) {
            if (reservation.quantity <= 0) break
            const takeQty = Math.min(reservation.quantity, stock.quantity)
            await updateStock(stock.id, stock.quantity - takeQty)
            reservation.quantity -= takeQty
          }
          
          await updateReservation(reservation.id, { status: 'picked' })
          
          await createOperationLog({
            operator: '管理员',
            action: '预定转出库',
            target: `${reservation.customer_name}`,
            detail: `${reservation.product_name} x${reservation.quantity}`
          })
          
          uni.hideLoading()
          await loadData()
          closeDetailModal()
          uni.showToast({ title: '转换成功', icon: 'success' })
        } catch (error) {
          uni.hideLoading()
          console.error('Convert error:', error)
          uni.showToast({ title: '转换失败', icon: 'none' })
        }
      }
    }
  })
}
</script>

<style lang="scss">
.h5-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 140px;
}

.page-header {
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
  padding: 40px 20px 32px;
  border-radius: 0 0 32px 32px;
}

.page-title {
  display: block;
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.filter-bar {
  padding: 16px;
  background-color: #ffffff;
  margin: -20px 16px 16px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.search-box {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  background-color: #f5f5f5;
  border: none;
  border-radius: 12px;
  font-size: 14px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid #eeeeee;
  border-radius: 8px;
  background-color: #ffffff;
  font-size: 13px;
  color: #666666;
  
  &.active {
    background-color: #e53935;
    color: #ffffff;
    border-color: #e53935;
  }
}

.reservation-list {
  padding: 0 16px;
}

.reservation-card {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.customer-info {
  flex: 1;
}

.customer-name {
  display: block;
  font-size: 17px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
}

.customer-phone {
  font-size: 13px;
  color: #999999;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  
  &.pending {
    background-color: #fff3e0;
    color: #ff9800;
  }
  
  &.picked {
    background-color: #e8f5e9;
    color: #4caf50;
  }
  
  &.cancelled {
    background-color: #f5f5f5;
    color: #999999;
  }
}

.product-info {
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 16px;
}

.product-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
}

.product-spec {
  font-size: 13px;
  color: #666666;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-info {
  text-align: right;
}

.amount-label {
  display: block;
  font-size: 12px;
  color: #999999;
  margin-bottom: 4px;
}

.amount-value {
  font-size: 20px;
  font-weight: 600;
  color: #e53935;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  border: 1px solid #e53935;
  border-radius: 8px;
  font-size: 13px;
  color: #e53935;
  background-color: #ffffff;
  
  &.cancel {
    border-color: #999999;
    color: #666666;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
}

.add-btn-container {
  position: fixed;
  bottom: 120px;
  left: 16px;
  right: 16px;
}

.add-btn {
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
  color: #ffffff;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  max-height: 85vh;
  background-color: #ffffff;
  border-radius: 24px 24px 0 0;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #333333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f5f5f5;
  color: #666666;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #666666;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #eeeeee;
  border-radius: 12px;
  font-size: 15px;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #eeeeee;
  border-radius: 12px;
  font-size: 15px;
  min-height: 100px;
}

.product-select {
  padding: 14px 16px;
  border: 1px solid #eeeeee;
  border-radius: 12px;
  font-size: 15px;
  color: #333333;
  
  .placeholder {
    color: #cccccc;
  }
}

.radio-group {
  display: flex;
  gap: 24px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.modal-btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  
  &.cancel {
    background-color: #f5f5f5;
    color: #666666;
  }
  
  &.confirm {
    background-color: #e53935;
    color: #ffffff;
  }
}

.picker-content {
  width: 100%;
  max-height: 70vh;
  background-color: #ffffff;
  border-radius: 24px 24px 0 0;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.picker-title {
  font-size: 17px;
  font-weight: 600;
  color: #333333;
}

.product-list {
  max-height: calc(70vh - 60px);
  padding: 16px;
}

.product-item {
  padding: 16px;
  border-radius: 12px;
  background-color: #f8f9fa;
  margin-bottom: 12px;
}

.product-item .product-name {
  font-size: 16px;
}

.product-item .product-spec {
  font-size: 13px;
}

.detail-modal {
  width: 100%;
  max-height: 80vh;
  background-color: #ffffff;
  border-radius: 24px 24px 0 0;
  display: flex;
  flex-direction: column;
}

.detail-section {
  padding-bottom: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-label {
  font-size: 14px;
  color: #666666;
}

.detail-value {
  font-size: 14px;
  color: #333333;
  
  &.amount {
    color: #e53935;
    font-weight: 600;
  }
  
  &.pending {
    color: #ff9800;
  }
  
  &.picked {
    color: #4caf50;
  }
  
  &.cancelled {
    color: #999999;
  }
}
</style>