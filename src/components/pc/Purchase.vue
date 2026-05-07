<template>
  <view class="purchase-container">
    <view class="left-panel">
      <view class="panel-header">
        <text class="panel-title">供应商列表</text>
        <button class="btn btn-secondary btn-sm" @click="showSupplierModal = true">新增供应商</button>
      </view>
      <view class="supplier-list">
        <view 
          v-for="supplier in suppliers" 
          :key="supplier.id"
          class="supplier-item"
          :class="{ active: selectedSupplier?.id === supplier.id }"
          @click="selectSupplier(supplier)"
        >
          <text class="supplier-name">{{ supplier.name }}</text>
          <text class="supplier-phone">{{ supplier.phone }}</text>
        </view>
      </view>
    </view>
    
    <view class="middle-panel">
      <view class="panel-header">
        <text class="panel-title">商品列表</text>
        <view class="search-box">
          <input v-model="productSearch" placeholder="搜索商品" class="search-input" />
        </view>
      </view>
      <view class="product-list">
        <view 
          v-for="product in filteredProducts" 
          :key="product.id"
          class="product-item"
          @click="addToCart(product)"
        >
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <text class="product-spec">{{ product.spec }} / {{ product.unit }}</text>
          </view>
          <view class="product-price">
            <text class="purchase-price">¥{{ product.purchase_price.toFixed(2) }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="right-panel">
      <view class="panel-header">
        <text class="panel-title">采购清单</text>
        <button class="btn btn-danger btn-sm" @click="clearCart">清空</button>
      </view>
      
      <view class="cart-list">
        <view v-if="cartItems.length === 0" class="empty-cart">
          <text>暂无商品</text>
        </view>
        <view v-for="(item, index) in cartItems" :key="index" class="cart-item">
          <view class="cart-item-info">
            <text class="cart-item-name">{{ item.product_name }}</text>
            <text class="cart-item-spec">{{ item.spec }}</text>
          </view>
          <view class="cart-item-controls">
            <view class="quantity-control">
              <button class="qty-btn" @click="decreaseQty(index)">-</button>
              <input v-model.number="item.quantity" type="number" class="qty-input" />
              <button class="qty-btn" @click="increaseQty(index)">+</button>
            </view>
            <text class="cart-item-amount">¥{{ item.amount.toFixed(2) }}</text>
            <button class="remove-btn" @click="removeFromCart(index)">删除</button>
          </view>
        </view>
      </view>
      
      <view class="cart-footer">
        <view class="total-row">
          <text class="total-label">合计金额</text>
          <text class="total-amount">¥{{ totalAmount.toFixed(2) }}</text>
        </view>
        <view class="form-row">
          <text class="label">批次号</text>
          <input v-model="batchNo" placeholder="输入批次号" class="input" />
        </view>
        <view class="form-row">
          <text class="label">生产日期</text>
          <picker mode="date" :value="productionDate" @change="onProductionDateChange">
            <view class="picker-input">{{ productionDate || '选择日期' }}</view>
          </picker>
        </view>
        <view class="form-row">
          <text class="label">保质期(天)</text>
          <input v-model.number="expiryDays" type="number" class="input" placeholder="365" />
        </view>
        <view class="form-row">
          <text class="label">备注</text>
          <textarea v-model="remark" placeholder="输入备注" class="textarea" />
        </view>
        <button 
          class="btn btn-primary btn-lg" 
          @click="submitPurchase"
          :disabled="cartItems.length === 0 || !selectedSupplier"
        >
          确认入库
        </button>
      </view>
    </view>
    
    <view v-if="showSupplierModal" class="modal-overlay" @click="showSupplierModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">新增供应商</text>
          <button class="modal-close" @click="showSupplierModal = false">×</button>
        </view>
        <view class="modal-body">
          <view class="form-row">
            <text class="label">供应商名称</text>
            <input v-model="newSupplier.name" placeholder="输入名称" class="input" />
          </view>
          <view class="form-row">
            <text class="label">联系电话</text>
            <input v-model="newSupplier.phone" placeholder="输入电话" class="input" />
          </view>
          <view class="form-row">
            <text class="label">地址</text>
            <textarea v-model="newSupplier.address" placeholder="输入地址" class="textarea" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn btn-secondary" @click="showSupplierModal = false">取消</button>
          <button class="btn btn-primary" @click="addSupplier">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { mockSuppliers, mockProducts } from '@/data/mock'
import type { Supplier, Product } from '@/types'
import { generateId } from '@/utils/format'

const suppliers = ref<Supplier[]>([])
const products = ref<Product[]>([])
const selectedSupplier = ref<Supplier | null>(null)
const productSearch = ref('')
const cartItems = ref<any[]>([])
const batchNo = ref('')
const productionDate = ref('')
const expiryDays = ref(365)
const remark = ref('')
const showSupplierModal = ref(false)
const newSupplier = ref({ name: '', phone: '', address: '' })

const filteredProducts = computed(() => {
  if (!productSearch.value) return products.value
  return products.value.filter(p => 
    p.name.includes(productSearch.value) || 
    p.spec.includes(productSearch.value)
  )
})

const totalAmount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.amount, 0)
})

function selectSupplier(supplier: Supplier) {
  selectedSupplier.value = supplier
}

function addToCart(product: Product) {
  const existing = cartItems.value.find(item => item.product_id === product.id)
  if (existing) {
    existing.quantity++
    existing.amount = existing.quantity * existing.price
  } else {
    cartItems.value.push({
      product_id: product.id,
      product_name: product.name,
      spec: product.spec,
      unit: product.unit,
      price: product.purchase_price,
      quantity: 1,
      amount: product.purchase_price
    })
  }
}

function removeFromCart(index: number) {
  cartItems.value.splice(index, 1)
}

function clearCart() {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空采购清单吗？',
    success: (res) => {
      if (res.confirm) {
        cartItems.value = []
      }
    }
  })
}

function increaseQty(index: number) {
  cartItems.value[index].quantity++
  cartItems.value[index].amount = cartItems.value[index].quantity * cartItems.value[index].price
}

function decreaseQty(index: number) {
  if (cartItems.value[index].quantity > 1) {
    cartItems.value[index].quantity--
    cartItems.value[index].amount = cartItems.value[index].quantity * cartItems.value[index].price
  }
}

function onProductionDateChange(e: any) {
  productionDate.value = e.detail.value
}

function addSupplier() {
  if (!newSupplier.value.name.trim()) {
    uni.showToast({ title: '请输入供应商名称', icon: 'none' })
    return
  }
  const supplier: Supplier = {
    id: generateId(),
    name: newSupplier.value.name,
    phone: newSupplier.value.phone,
    address: newSupplier.value.address,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  suppliers.value.push(supplier)
  showSupplierModal.value = false
  newSupplier.value = { name: '', phone: '', address: '' }
  uni.showToast({ title: '添加成功', icon: 'success' })
}

function submitPurchase() {
  if (!selectedSupplier.value) {
    uni.showToast({ title: '请选择供应商', icon: 'none' })
    return
  }
  if (!batchNo.value) {
    uni.showToast({ title: '请输入批次号', icon: 'none' })
    return
  }
  if (!productionDate.value) {
    uni.showToast({ title: '请选择生产日期', icon: 'none' })
    return
  }
  
  uni.showModal({
    title: '确认入库',
    content: `确认将 ${cartItems.value.length} 种商品入库吗？`,
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '入库成功', icon: 'success' })
        cartItems.value = []
        batchNo.value = ''
        productionDate.value = ''
        remark.value = ''
      }
    }
  })
}

onMounted(() => {
  suppliers.value = [...mockSuppliers]
  products.value = [...mockProducts]
})
</script>

<style lang="scss" scoped>
.purchase-container {
  display: flex;
  height: calc(100vh - 180rpx);
  gap: 24rpx;
}

.left-panel, .middle-panel, .right-panel {
  background: #ffffff;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.left-panel {
  width: 25%;
}

.middle-panel {
  width: 50%;
}

.right-panel {
  width: 25%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #eeeeee;
}

.panel-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.btn {
  height: 64rpx;
  padding: 0 24rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  border: none;
  
  &-secondary {
    background: #f5f5f5;
    color: #333333;
  }
  
  &-danger {
    background: #e53935;
    color: #ffffff;
  }
  
  &-primary {
    background: #e53935;
    color: #ffffff;
  }
  
  &-sm {
    height: 56rpx;
    font-size: 22rpx;
  }
  
  &-lg {
    height: 88rpx;
    font-size: 28rpx;
  }
  
  &[disabled] {
    background: #cccccc;
  }
}

.search-box {
  flex: 1;
  margin-left: 20rpx;
}

.search-input {
  width: 100%;
  height: 60rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #eeeeee;
  font-size: 24rpx;
}

.supplier-list, .product-list, .cart-list {
  flex: 1;
  overflow-y: auto;
  padding: 10rpx;
}

.supplier-item {
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 10rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #f5f5f5;
  }
  
  &.active {
    background: #fff3f3;
    border-left: 4rpx solid #e53935;
  }
}

.supplier-name {
  display: block;
  font-size: 26rpx;
  font-weight: 500;
  color: #1a1a1a;
}

.supplier-phone {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-top: 5rpx;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 10rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #f5f5f5;
  }
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
  margin-top: 5rpx;
}

.product-price {
  margin-left: 20rpx;
}

.purchase-price {
  font-size: 26rpx;
  color: #e53935;
  font-weight: bold;
}

.empty-cart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200rpx;
  color: #999999;
  font-size: 24rpx;
}

.cart-item {
  padding: 16rpx;
  border-radius: 12rpx;
  background: #fafafa;
  margin-bottom: 10rpx;
}

.cart-item-info {
  margin-bottom: 10rpx;
}

.cart-item-name {
  display: block;
  font-size: 24rpx;
  font-weight: 500;
  color: #1a1a1a;
}

.cart-item-spec {
  display: block;
  font-size: 20rpx;
  color: #999999;
}

.cart-item-controls {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.quantity-control {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 8rpx;
  border: 1rpx solid #eeeeee;
}

.qty-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: 28rpx;
  color: #666666;
}

.qty-input {
  width: 60rpx;
  height: 48rpx;
  text-align: center;
  border: none;
  font-size: 24rpx;
}

.cart-item-amount {
  flex: 1;
  text-align: right;
  font-size: 24rpx;
  color: #e53935;
  font-weight: bold;
}

.remove-btn {
  width: 60rpx;
  height: 48rpx;
  background: #ffebee;
  border: none;
  border-radius: 8rpx;
  font-size: 20rpx;
  color: #e53935;
}

.cart-footer {
  padding: 20rpx;
  border-top: 1rpx solid #eeeeee;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #eeeeee;
  margin-bottom: 20rpx;
}

.total-label {
  font-size: 26rpx;
  color: #333333;
}

.total-amount {
  font-size: 36rpx;
  color: #e53935;
  font-weight: bold;
}

.form-row {
  margin-bottom: 16rpx;
}

.label {
  display: block;
  font-size: 24rpx;
  color: #666666;
  margin-bottom: 8rpx;
}

.input {
  width: 100%;
  height: 72rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #eeeeee;
  font-size: 24rpx;
}

.picker-input {
  width: 100%;
  height: 72rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #eeeeee;
  font-size: 24rpx;
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
  font-size: 24rpx;
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
  max-width: 600rpx;
  max-height: 80vh;
  overflow: hidden;
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
  max-height: 400rpx;
  overflow-y: auto;
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