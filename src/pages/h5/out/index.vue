<template>
  <view class="h5-container">
    <view class="page-header">
      <text class="page-title">销售出库</text>
      <text class="page-subtitle">友金农资库存与账单管理系统</text>
    </view>
    
    <view class="step-indicator">
      <view class="step" :class="{ active: currentStep >= 1 }">
        <text class="step-num">1</text>
        <text class="step-text">选择客户</text>
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
      <view class="section-title">选择客户</view>
      <view v-if="customers.length === 0" class="empty-tip">
        <text>暂无客户，请先添加</text>
      </view>
      <view 
        v-for="customer in customers" 
        :key="customer.id"
        class="customer-card"
        :class="{ active: selectedCustomer?.id === customer.id }"
        @click="selectCustomer(customer)"
      >
        <view class="card-info">
          <text class="card-name">{{ customer.name }}</text>
          <text class="card-phone">{{ customer.phone }}</text>
        </view>
        <view v-if="selectedCustomer?.id === customer.id" class="check-icon">✓</view>
      </view>
      <button class="add-customer-btn" @click="showCustomerModal = true">+ 添加客户</button>
      <button class="next-btn" :disabled="!selectedCustomer" @click="nextStep">下一步</button>
    </view>
    
    <view v-else-if="currentStep === 2" class="step-content">
      <view class="search-box">
        <input class="search-input" v-model="searchKeyword" placeholder="搜索商品" />
      </view>
      <view class="section-title">选择商品</view>
      <view 
        v-for="product in productsWithStock" 
        :key="product.id"
        class="product-card"
        :class="{ disabled: product.availableStock === 0 }"
        @click="addToOrder(product)"
      >
        <view class="product-info">
          <text class="product-name">{{ product.name }}</text>
          <text class="product-spec">{{ product.spec }} · ¥{{ product.sale_price }}/{{ product.unit }}</text>
        </view>
        <view class="product-stock">库存: {{ product.availableStock }}</view>
        <view v-if="getOrderItemQty(product.id) > 0" class="product-qty">
          <button class="qty-btn-minus" :disabled="getOrderItemQty(product.id) <= 1" @click.stop="decreaseQty(product.id)">-</button>
          <text class="qty-value">{{ getOrderItemQty(product.id) }}</text>
          <button class="qty-btn-plus" :disabled="getOrderItemQty(product.id) >= product.availableStock" @click.stop="increaseQty(product.id)">+</button>
        </view>
        <view v-else-if="product.availableStock > 0" class="add-icon">+</view>
        <view v-else class="stock-empty">缺货</view>
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
          <text class="info-label">客户</text>
          <text class="info-value">{{ selectedCustomer?.name }}</text>
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
        <button class="submit-btn" @click="submitOrder">提交出库</button>
      </view>
    </view>
    
    <view v-if="showCustomerModal" class="modal-mask" @click="closeCustomerModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingCustomer ? '编辑客户' : '添加客户' }}</text>
          <text class="close-btn" @click="closeCustomerModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">客户名称 *</text>
            <input class="form-input" v-model="customerForm.name" placeholder="请输入名称" />
          </view>
          <view class="form-item">
            <text class="form-label">联系电话</text>
            <input class="form-input" v-model="customerForm.phone" placeholder="请输入电话" />
          </view>
          <view class="form-item">
            <text class="form-label">地址</text>
            <input class="form-input" v-model="customerForm.address" placeholder="请输入地址" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="closeCustomerModal">取消</button>
          <button class="modal-btn confirm" @click="saveCustomer">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getCustomers, createCustomer, getProducts, getStocks, createSaleOrder, updateStock, createOperationLog } from '@/utils/supabase'
import type { Customer, Product, Stock, SaleItem } from '@/types'

interface ProductWithStock extends Product {
  availableStock: number
}

const customers = ref<Customer[]>([])
const products = ref<Product[]>([])
const stocks = ref<Stock[]>([])
const selectedCustomer = ref<Customer | null>(null)
const searchKeyword = ref('')
const orderItems = ref<SaleItem[]>([])
const currentStep = ref(1)
const showCustomerModal = ref(false)
const editingCustomer = ref<Customer | null>(null)
const customerForm = ref({ name: '', phone: '', address: '' })

const productsWithStock = computed<ProductWithStock[]>(() => {
  const stockMap: Record<string, number> = {}
  stocks.value.forEach(s => {
    stockMap[s.product_id] = (stockMap[s.product_id] || 0) + s.quantity
  })
  
  let result = products.value.map(p => ({
    ...p,
    availableStock: stockMap[p.id] || 0
  }))
  
  const orderMap: Record<string, number> = {}
  orderItems.value.forEach(item => {
    orderMap[item.product_id] = (orderMap[item.product_id] || 0) + item.quantity
  })
  
  result = result.map(p => ({
    ...p,
    availableStock: Math.max(0, p.availableStock - (orderMap[p.id] || 0))
  }))
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      p.spec.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

const totalQuantity = computed(() => orderItems.value.reduce((sum, item) => sum + item.quantity, 0))
const totalAmount = computed(() => orderItems.value.reduce((sum, item) => sum + item.amount, 0))

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    customers.value = await getCustomers()
    products.value = await getProducts()
    stocks.value = await getStocks()
  } catch (error) {
    console.error('Load data error:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const getOrderItemQty = (productId: string): number => {
  const item = orderItems.value.find(i => i.product_id === productId)
  return item?.quantity || 0
}

const selectCustomer = (customer: Customer) => {
  selectedCustomer.value = customer
}

const addToOrder = (product: ProductWithStock) => {
  if (product.availableStock === 0) {
    uni.showToast({ title: '库存不足', icon: 'none' })
    return
  }
  
  const existingItem = orderItems.value.find(item => item.product_id === product.id)
  if (existingItem) {
    if (existingItem.quantity < product.availableStock) {
      existingItem.quantity += 1
      existingItem.amount = existingItem.quantity * existingItem.price
    } else {
      uni.showToast({ title: '库存不足', icon: 'none' })
    }
  } else {
    orderItems.value.push({
      id: '',
      product_id: product.id,
      product_name: product.name,
      product_spec: product.spec,
      batch_no: '',
      quantity: 1,
      price: product.sale_price,
      amount: product.sale_price
    })
  }
}

const increaseQty = (productId: string) => {
  const product = productsWithStock.value.find(p => p.id === productId)
  const item = orderItems.value.find(i => i.product_id === productId)
  
  if (product && item && item.quantity < product.availableStock) {
    item.quantity += 1
    item.amount = item.quantity * item.price
  } else {
    uni.showToast({ title: '库存不足', icon: 'none' })
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

const closeCustomerModal = () => {
  showCustomerModal.value = false
  editingCustomer.value = null
  customerForm.value = { name: '', phone: '', address: '' }
}

const saveCustomer = async () => {
  if (!customerForm.value.name.trim()) {
    uni.showToast({ title: '请输入名称', icon: 'none' })
    return
  }
  
  try {
    await createCustomer({
      name: customerForm.value.name,
      phone: customerForm.value.phone,
      address: customerForm.value.address
    })
    await loadData()
    closeCustomerModal()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    console.error('Save customer error:', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

const submitOrder = async () => {
  if (!selectedCustomer.value) return
  
  uni.showLoading({ title: '提交中...' })
  
  try {
    const orderItemsWithBatch = await Promise.all(orderItems.value.map(async (item) => {
      const productStocks = stocks.value
        .filter(s => s.product_id === item.product_id && s.quantity > 0)
        .sort((a, b) => new Date(a.production_date).getTime() - new Date(b.production_date))
      
      let remainingQty = item.quantity
      const batches: { batch_no: string; qty: number }[] = []
      
      for (const stock of productStocks) {
        if (remainingQty <= 0) break
        const takeQty = Math.min(remainingQty, stock.quantity)
        batches.push({ batch_no: stock.batch_no, qty: takeQty })
        remainingQty -= takeQty
      }
      
      return { ...item, batch_no: batches.map(b => `${b.batch_no}(${b.qty})`).join(', ') }
    }))
    
    const order = await createSaleOrder({
      customer_id: selectedCustomer.value.id,
      customer_name: selectedCustomer.value.name,
      items: orderItemsWithBatch,
      total_amount: totalAmount.value,
      status: 'approved'
    })
    
    for (const item of orderItems.value) {
      const productStocks = stocks.value
        .filter(s => s.product_id === item.product_id && s.quantity > 0)
        .sort((a, b) => new Date(a.production_date).getTime() - new Date(b.production_date))
      
      let remainingQty = item.quantity
      
      for (const stock of productStocks) {
        if (remainingQty <= 0) break
        const takeQty = Math.min(remainingQty, stock.quantity)
        await updateStock(stock.id, stock.quantity - takeQty)
        remainingQty -= takeQty
      }
    }
    
    await createOperationLog({
      operator: '管理员',
      action: '销售出库',
      target: `订单 ${order.id}`,
      detail: `销售金额 ¥${totalAmount.value.toFixed(2)}`
    })
    
    uni.hideLoading()
    uni.showToast({ title: '提交成功', icon: 'success' })
    
    setTimeout(() => {
      selectedCustomer.value = null
      orderItems.value = []
      currentStep.value = 1
      loadData()
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

.customer-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 12px;
  margin-bottom: 12px;
  border: 2px solid transparent;
  
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

.add-customer-btn {
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
  
  &.disabled {
    opacity: 0.5;
  }
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

.product-stock {
  font-size: 12px;
  color: #666666;
  margin-right: 12px;
}

.product-qty {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn-minus, .qty-btn-plus {
  width: 32px;
  height: 32px;
  border: 1px solid #e53935;
  border-radius: 8px;
  background-color: #ffffff;
  color: #e53935;
  font-size: 16px;
  
  &:disabled {
    opacity: 0.5;
  }
}

.qty-value {
  font-size: 16px;
  font-weight: 600;
  color: #e53935;
  min-width: 28px;
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

.stock-empty {
  font-size: 12px;
  color: #999999;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.item-info {
  flex: 1;
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

.item-qty-amount {
  text-align: right;
}

.item-qty {
  display: block;
  font-size: 13px;
  color: #666666;
  margin-bottom: 4px;
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