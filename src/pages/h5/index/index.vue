<template>
  <view class="h5-container">
    <view class="page-header">
      <text class="page-title">采购入库</text>
      <text class="page-subtitle">友金农资库存与账单管理系统</text>
    </view>
    
    <view class="step-indicator">
      <view class="step" :class="{ active: currentStep >= 1 }">
        <text class="step-num">1</text>
        <text class="step-text">选择供应商</text>
      </view>
      <view class="step-line" :class="{ active: currentStep >= 2 }"></view>
      <view class="step" :class="{ active: currentStep >= 2 }">
        <text class="step-num">2</text>
        <text class="step-text">选择商品</text>
      </view>
      <view class="step-line" :class="{ active: currentStep >= 3 }"></view>
      <view class="step" :class="{ active: currentStep >= 3 }">
        <text class="step-num">3</text>
        <text class="step-text">确认提交</text>
      </view>
    </view>
    
    <view v-if="currentStep === 1" class="step-content">
      <view class="section-title">选择供应商</view>
      <view v-if="suppliers.length === 0" class="empty-tip">
        <text>暂无供应商，请先添加</text>
      </view>
      <view 
        v-for="supplier in suppliers" 
        :key="supplier.id"
        class="supplier-card"
        :class="{ active: selectedSupplier?.id === supplier.id }"
        @click="selectSupplier(supplier)"
      >
        <view class="card-info">
          <text class="card-name">{{ supplier.name }}</text>
          <text class="card-phone">{{ supplier.phone }}</text>
        </view>
        <view v-if="selectedSupplier?.id === supplier.id" class="check-icon">✓</view>
      </view>
      <button class="add-supplier-btn" @click="showSupplierModal = true">+ 添加供应商</button>
      <button class="next-btn" :disabled="!selectedSupplier" @click="nextStep">下一步</button>
    </view>
    
    <view v-else-if="currentStep === 2" class="step-content">
      <view class="search-box">
        <input class="search-input" v-model="searchKeyword" placeholder="搜索商品" />
      </view>
      <view class="section-title">选择商品</view>
      <view 
        v-for="product in filteredProducts" 
        :key="product.id"
        class="product-card"
        @click="addToOrder(product)"
      >
        <view class="product-info">
          <text class="product-name">{{ product.name }}</text>
          <text class="product-spec">{{ product.spec }} · ¥{{ product.purchase_price }}/{{ product.unit }}</text>
        </view>
        <view v-if="getOrderItemQty(product.id) > 0" class="product-qty">
          <button class="qty-btn-minus" @click.stop="decreaseQty(product.id)">-</button>
          <text class="qty-value">{{ getOrderItemQty(product.id) }}</text>
          <button class="qty-btn-plus" @click.stop="increaseQty(product.id)">+</button>
        </view>
        <view v-else class="add-icon">+</view>
      </view>
      <view class="order-summary">
        <text class="summary-text">已选 {{ totalQuantity }} 件商品</text>
        <text class="summary-amount">¥{{ totalAmount.toFixed(2) }}</text>
      </view>
      <view class="btn-group">
        <button class="back-btn" @click="prevStep">上一步</button>
        <button class="next-btn" :disabled="orderItems.length === 0" @click="nextStep">下一步</button>
      </view>
    </view>
    
    <view v-else-if="currentStep === 3" class="step-content">
      <view class="section-title">订单确认</view>
      <view class="info-card">
        <view class="info-row">
          <text class="info-label">供应商</text>
          <text class="info-value">{{ selectedSupplier?.name }}</text>
        </view>
      </view>
      <view class="items-list">
        <view 
          v-for="(item, index) in orderItems" 
          :key="index" 
          class="order-item"
        >
          <view class="item-info">
            <text class="item-name">{{ item.product_name }}</text>
            <text class="item-spec">{{ item.product_spec }}</text>
          </view>
          <view class="item-detail">
            <input class="batch-input" v-model="item.batch_no" placeholder="批次号" />
            <input class="date-input" type="date" v-model="item.production_date" />
            <input class="date-input" type="date" v-model="item.expire_date" />
          </view>
          <view class="item-qty-amount">
            <text class="item-qty">x{{ item.quantity }}</text>
            <text class="item-amount">¥{{ item.amount.toFixed(2) }}</text>
          </view>
        </view>
      </view>
      <view class="total-row">
        <text class="total-label">合计金额</text>
        <text class="total-amount">¥{{ totalAmount.toFixed(2) }}</text>
      </view>
      <view class="btn-group">
        <button class="back-btn" @click="prevStep">上一步</button>
        <button class="submit-btn" @click="submitOrder">提交入库</button>
      </view>
    </view>
    
    <view v-if="showSupplierModal" class="modal-mask" @click="closeSupplierModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingSupplier ? '编辑供应商' : '添加供应商' }}</text>
          <text class="close-btn" @click="closeSupplierModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">供应商名称 *</text>
            <input class="form-input" v-model="supplierForm.name" placeholder="请输入名称" />
          </view>
          <view class="form-item">
            <text class="form-label">联系电话</text>
            <input class="form-input" v-model="supplierForm.phone" placeholder="请输入电话" />
          </view>
          <view class="form-item">
            <text class="form-label">地址</text>
            <input class="form-input" v-model="supplierForm.address" placeholder="请输入地址" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="closeSupplierModal">取消</button>
          <button class="modal-btn confirm" @click="saveSupplier">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getSuppliers, createSupplier, getProducts, createPurchaseOrder, addStock, createOperationLog } from '@/utils/supabase'
import { generateBatchNo, getCurrentDate } from '@/utils/format'
import type { Supplier, Product, PurchaseItem } from '@/types'

const suppliers = ref<Supplier[]>([])
const products = ref<Product[]>([])
const selectedSupplier = ref<Supplier | null>(null)
const searchKeyword = ref('')
const orderItems = ref<PurchaseItem[]>([])
const currentStep = ref(1)
const showSupplierModal = ref(false)
const editingSupplier = ref<Supplier | null>(null)
const supplierForm = ref({ name: '', phone: '', address: '' })

const filteredProducts = computed(() => {
  if (!searchKeyword.value) return products.value
  const keyword = searchKeyword.value.toLowerCase()
  return products.value.filter(p =>
    p.name.toLowerCase().includes(keyword) ||
    p.spec.toLowerCase().includes(keyword)
  )
})

const totalQuantity = computed(() => orderItems.value.reduce((sum, item) => sum + item.quantity, 0))
const totalAmount = computed(() => orderItems.value.reduce((sum, item) => sum + item.amount, 0))

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    suppliers.value = await getSuppliers()
    products.value = await getProducts()
  } catch (error) {
    console.error('Load data error:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const getOrderItemQty = (productId: string): number => {
  const item = orderItems.value.find(i => i.product_id === productId)
  return item?.quantity || 0
}

const selectSupplier = (supplier: Supplier) => {
  selectedSupplier.value = supplier
}

const addToOrder = (product: Product) => {
  const existingItem = orderItems.value.find(item => item.product_id === product.id)
  if (existingItem) {
    existingItem.quantity += 1
    existingItem.amount = existingItem.quantity * existingItem.price
  } else {
    orderItems.value.push({
      id: '',
      product_id: product.id,
      product_name: product.name,
      product_spec: product.spec,
      batch_no: generateBatchNo(),
      production_date: getCurrentDate(),
      expire_date: getCurrentDate(),
      quantity: 1,
      price: product.purchase_price,
      amount: product.purchase_price
    })
  }
}

const increaseQty = (productId: string) => {
  const item = orderItems.value.find(i => i.product_id === productId)
  if (item) {
    item.quantity += 1
    item.amount = item.quantity * item.price
  }
}

const decreaseQty = (productId: string) => {
  const index = orderItems.value.findIndex(i => i.product_id === productId)
  if (index > -1) {
    if (orderItems.value[index].quantity > 1) {
      orderItems.value[index].quantity -= 1
      orderItems.value[index].amount = orderItems.value[index].quantity * orderItems.value[index].price
    } else {
      orderItems.value.splice(index, 1)
    }
  }
}

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const closeSupplierModal = () => {
  showSupplierModal.value = false
  editingSupplier.value = null
  supplierForm.value = { name: '', phone: '', address: '' }
}

const saveSupplier = async () => {
  if (!supplierForm.value.name.trim()) {
    uni.showToast({ title: '请输入名称', icon: 'none' })
    return
  }
  
  try {
    await createSupplier({
      name: supplierForm.value.name,
      phone: supplierForm.value.phone,
      address: supplierForm.value.address
    })
    await loadData()
    closeSupplierModal()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    console.error('Save supplier error:', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

const submitOrder = async () => {
  if (!selectedSupplier.value) return
  
  for (const item of orderItems.value) {
    if (!item.batch_no || !item.production_date || !item.expire_date) {
      uni.showToast({ title: '请填写完整批次信息', icon: 'none' })
      return
    }
  }
  
  uni.showLoading({ title: '提交中...' })
  
  try {
    const order = await createPurchaseOrder({
      supplier_id: selectedSupplier.value.id,
      supplier_name: selectedSupplier.value.name,
      items: orderItems.value,
      total_amount: totalAmount.value,
      status: 'approved'
    })
    
    for (const item of orderItems.value) {
      await addStock({
        product_id: item.product_id,
        product_name: item.product_name,
        product_spec: item.product_spec,
        batch_no: item.batch_no,
        production_date: item.production_date,
        expire_date: item.expire_date,
        quantity: item.quantity
      })
    }
    
    await createOperationLog({
      operator: '管理员',
      action: '采购入库',
      target: `订单 ${order.id}`,
      detail: `采购金额 ¥${totalAmount.value.toFixed(2)}`
    })
    
    uni.hideLoading()
    uni.showToast({ title: '提交成功', icon: 'success' })
    
    setTimeout(() => {
      selectedSupplier.value = null
      orderItems.value = []
      currentStep.value = 1
    }, 1500)
  } catch (error) {
    uni.hideLoading()
    console.error('Submit order error:', error)
    uni.showToast({ title: '提交失败', icon: 'none' })
  }
}
</script>

<style lang="scss">
.h5-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120px;
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

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background-color: #ffffff;
  margin: -20px 16px 16px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.step-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f0f0f0;
  color: #999999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.step-text {
  font-size: 12px;
  color: #999999;
}

.step.active {
  .step-num {
    background-color: #e53935;
    color: #ffffff;
  }
  .step-text {
    color: #333333;
    font-weight: 500;
  }
}

.step-line {
  flex: 1;
  height: 2px;
  background-color: #eeeeee;
  margin: 0 8px;
  transition: all 0.2s ease;
}

.step-line.active {
  background-color: #e53935;
}

.step-content {
  padding: 0 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 16px;
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: #999999;
  font-size: 14px;
}

.supplier-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 12px;
  margin-bottom: 12px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  
  &.active {
    border-color: #e53935;
    background-color: #fff5f5;
  }
}

.card-info {
  flex: 1;
}

.card-name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
}

.card-phone {
  font-size: 13px;
  color: #999999;
}

.check-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #e53935;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.add-supplier-btn {
  width: 100%;
  height: 48px;
  border: 2px dashed #e53935;
  border-radius: 12px;
  background-color: transparent;
  color: #e53935;
  font-size: 15px;
  margin-top: 8px;
}

.search-box {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  background-color: #ffffff;
  border: 1px solid #eeeeee;
  border-radius: 12px;
  font-size: 14px;
}

.product-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 12px;
  margin-bottom: 12px;
}

.product-info {
  flex: 1;
}

.product-name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
}

.product-spec {
  font-size: 13px;
  color: #999999;
}

.product-qty {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qty-btn-minus, .qty-btn-plus {
  width: 36px;
  height: 36px;
  border: 1px solid #e53935;
  border-radius: 8px;
  background-color: #ffffff;
  color: #e53935;
  font-size: 18px;
}

.qty-value {
  font-size: 16px;
  font-weight: 600;
  color: #e53935;
  min-width: 30px;
  text-align: center;
}

.add-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #e53935;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.order-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 12px;
  margin-top: 16px;
}

.summary-text {
  font-size: 14px;
  color: #666666;
}

.summary-amount {
  font-size: 20px;
  font-weight: 600;
  color: #e53935;
}

.btn-group {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.back-btn {
  flex: 1;
  height: 48px;
  border: 1px solid #eeeeee;
  border-radius: 12px;
  background-color: #ffffff;
  color: #666666;
  font-size: 15px;
}

.next-btn {
  flex: 2;
  height: 48px;
  border-radius: 12px;
  background-color: #e53935;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  
  &:disabled {
    background-color: #cccccc;
  }
}

.submit-btn {
  flex: 2;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
}

.info-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  font-size: 14px;
  color: #666666;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.items-list {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 8px 16px;
  margin-bottom: 16px;
}

.order-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.item-info {
  margin-bottom: 12px;
}

.item-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
}

.item-spec {
  font-size: 12px;
  color: #999999;
}

.item-detail {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.batch-input, .date-input {
  flex: 1;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #eeeeee;
  border-radius: 8px;
  font-size: 13px;
}

.item-qty-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-qty {
  font-size: 14px;
  color: #666666;
}

.item-amount {
  font-size: 16px;
  font-weight: 600;
  color: #e53935;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #fff5f5;
  border-radius: 12px;
  margin-bottom: 16px;
}

.total-label {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
}

.total-amount {
  font-size: 24px;
  font-weight: 600;
  color: #e53935;
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
  background-color: #ffffff;
  border-radius: 24px 24px 0 0;
  padding-bottom: env(safe-area-inset-bottom);
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
  padding: 24px;
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

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px;
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
</style>