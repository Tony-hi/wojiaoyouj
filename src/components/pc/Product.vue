<template>
  <view class="product-container">
    <view class="page-header">
      <button class="btn btn-primary" @click="showAddModal = true">新增商品</button>
      <view class="filter-bar">
        <picker :value="categoryIndex" :range="categoryNames" @change="onCategoryChange">
          <view class="filter-picker">{{ categoryNames[categoryIndex] || '全部分类' }}</view>
        </picker>
        <input v-model="searchText" placeholder="搜索商品名称" class="search-input" />
      </view>
    </view>
    
    <view class="product-list">
      <view v-for="product in filteredProducts" :key="product.id" class="product-card">
        <view class="card-header">
          <view class="product-title">
            <text class="product-name">{{ product.name }}</text>
            <text class="product-category">{{ product.category_name }}</text>
          </view>
          <view class="action-buttons">
            <button class="btn btn-secondary btn-sm" @click="editProduct(product)">编辑</button>
            <button class="btn btn-danger btn-sm" @click="deleteProduct(product)">删除</button>
          </view>
        </view>
        
        <view class="card-body">
          <view class="product-info">
            <view class="info-row">
              <text class="info-label">规格</text>
              <text class="info-value">{{ product.spec }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">单位</text>
              <text class="info-value">{{ product.unit }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">品牌</text>
              <text class="info-value">{{ product.brand || '-' }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">农药登记证号</text>
              <text class="info-value">{{ product.pesticide_no || '-' }}</text>
            </view>
          </view>
          <view class="product-price">
            <view class="price-item">
              <text class="price-label">进价</text>
              <text class="price-value">¥{{ product.purchase_price.toFixed(2) }}</text>
            </view>
            <view class="price-item">
              <text class="price-label">售价</text>
              <text class="price-value primary">¥{{ product.sale_price.toFixed(2) }}</text>
            </view>
          </view>
        </view>
        
        <view class="card-footer">
          <text class="create-time">创建时间: {{ formatDateTime(product.created_at) }}</text>
        </view>
      </view>
      
      <view v-if="filteredProducts.length === 0" class="empty-state">
        <text>暂无商品</text>
      </view>
    </view>
    
    <view v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <view class="modal-content large" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingProduct ? '编辑商品' : '新增商品' }}</text>
          <button class="modal-close" @click="closeModal">×</button>
        </view>
        <view class="modal-body">
          <view class="form-row">
            <text class="label">商品名称 *</text>
            <input v-model="formData.name" placeholder="输入商品名称" class="input" />
          </view>
          <view class="form-row">
            <text class="label">规格 *</text>
            <input v-model="formData.spec" placeholder="输入商品规格" class="input" />
          </view>
          <view class="form-row">
            <text class="label">单位 *</text>
            <input v-model="formData.unit" placeholder="输入商品单位" class="input" />
          </view>
          <view class="form-row">
            <text class="label">品牌</text>
            <input v-model="formData.brand" placeholder="输入品牌名称" class="input" />
          </view>
          <view class="form-row">
            <text class="label">农药登记证号</text>
            <input v-model="formData.pesticide_no" placeholder="输入登记证号" class="input" />
          </view>
          <view class="form-row">
            <text class="label">商品分类 *</text>
            <view class="category-select">
              <picker :value="formData.category_index" :range="categoryNames" @change="onFormCategoryChange">
                <view class="picker-input">{{ categoryNames[formData.category_index] || '请选择分类' }}</view>
              </picker>
              <button class="btn btn-outline btn-sm" @click="showNewCategory = true">新增分类</button>
            </view>
          </view>
          <view class="form-row">
            <text class="label">进价 *</text>
            <input v-model.number="formData.purchase_price" type="digit" class="input" placeholder="0.00" />
          </view>
          <view class="form-row">
            <text class="label">售价 *</text>
            <input v-model.number="formData.sale_price" type="digit" class="input" placeholder="0.00" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="submitProduct">{{ editingProduct ? '保存修改' : '确认添加' }}</button>
        </view>
      </view>
    </view>
    
    <view v-if="showNewCategory" class="modal-overlay" @click="showNewCategory = false">
      <view class="modal-content small" @click.stop>
        <view class="modal-header">
          <text class="modal-title">新增分类</text>
          <button class="modal-close" @click="showNewCategory = false">×</button>
        </view>
        <view class="modal-body">
          <view class="form-row">
            <text class="label">分类名称 *</text>
            <input v-model="newCategoryName" placeholder="输入分类名称" class="input" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn btn-secondary" @click="showNewCategory = false">取消</button>
          <button class="btn btn-primary" @click="addCategory">确认添加</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { mockProducts, mockCategories } from '@/data/mock'
import type { Product, Category } from '@/types'
import { generateId, formatDateTime } from '@/utils/format'

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const searchText = ref('')
const categoryIndex = ref(0)
const showAddModal = ref(false)
const showNewCategory = ref(false)
const editingProduct = ref<Product | null>(null)
const newCategoryName = ref('')

const categoryNames = computed(() => {
  return ['全部分类', ...categories.value.map(c => c.name)]
})

const formData = ref({
  name: '',
  spec: '',
  unit: '',
  brand: '',
  pesticide_no: '',
  category_index: 0,
  category_id: '',
  purchase_price: 0,
  sale_price: 0
})

const filteredProducts = computed(() => {
  let result = products.value
  
  if (categoryIndex.value > 0) {
    const category = categories.value[categoryIndex.value - 1]
    result = result.filter(p => p.category_id === category.id)
  }
  
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(p => p.name.toLowerCase().includes(keyword))
  }
  
  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

function onCategoryChange(e: any) {
  categoryIndex.value = e.detail.value
}

function onFormCategoryChange(e: any) {
  formData.value.category_index = e.detail.value
  if (formData.value.category_index > 0) {
    formData.value.category_id = categories.value[formData.value.category_index - 1].id
  }
}

function editProduct(product: Product) {
  editingProduct.value = product
  formData.value = {
    name: product.name,
    spec: product.spec,
    unit: product.unit,
    brand: product.brand || '',
    pesticide_no: product.pesticide_no || '',
    category_index: categories.value.findIndex(c => c.id === product.category_id) + 1 || 0,
    category_id: product.category_id,
    purchase_price: product.purchase_price,
    sale_price: product.sale_price
  }
  showAddModal.value = true
}

function deleteProduct(product: Product) {
  uni.showModal({
    title: '删除商品',
    content: `确定删除 "${product.name}" 吗？此操作不可恢复。`,
    success: (res) => {
      if (res.confirm) {
        const index = products.value.findIndex(p => p.id === product.id)
        if (index >= 0) {
          products.value.splice(index, 1)
        }
        uni.showToast({ title: '删除成功', icon: 'success' })
      }
    }
  })
}

function closeModal() {
  showAddModal.value = false
  editingProduct.value = null
  formData.value = {
    name: '',
    spec: '',
    unit: '',
    brand: '',
    pesticide_no: '',
    category_index: 0,
    category_id: '',
    purchase_price: 0,
    sale_price: 0
  }
}

function addCategory() {
  if (!newCategoryName.value.trim()) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' })
    return
  }
  
  if (categories.value.some(c => c.name === newCategoryName.value)) {
    uni.showToast({ title: '分类名称已存在', icon: 'none' })
    return
  }
  
  const category: Category = {
    id: generateId(),
    name: newCategoryName.value,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  categories.value.push(category)
  showNewCategory.value = false
  newCategoryName.value = ''
  uni.showToast({ title: '添加成功', icon: 'success' })
}

function submitProduct() {
  if (!formData.value.name.trim()) {
    uni.showToast({ title: '请输入商品名称', icon: 'none' })
    return
  }
  if (!formData.value.spec.trim()) {
    uni.showToast({ title: '请输入商品规格', icon: 'none' })
    return
  }
  if (!formData.value.unit.trim()) {
    uni.showToast({ title: '请输入商品单位', icon: 'none' })
    return
  }
  if (!formData.value.category_id) {
    uni.showToast({ title: '请选择商品分类', icon: 'none' })
    return
  }
  if (!formData.value.purchase_price || formData.value.purchase_price <= 0) {
    uni.showToast({ title: '请输入有效进价', icon: 'none' })
    return
  }
  if (!formData.value.sale_price || formData.value.sale_price <= 0) {
    uni.showToast({ title: '请输入有效售价', icon: 'none' })
    return
  }
  
  const category = categories.value.find(c => c.id === formData.value.category_id)
  
  if (editingProduct.value) {
    const index = products.value.findIndex(p => p.id === editingProduct.value!.id)
    if (index >= 0) {
      products.value[index] = {
        ...products.value[index],
        name: formData.value.name,
        spec: formData.value.spec,
        unit: formData.value.unit,
        brand: formData.value.brand,
        pesticide_no: formData.value.pesticide_no,
        category_id: formData.value.category_id,
        category_name: category?.name || '',
        purchase_price: formData.value.purchase_price,
        sale_price: formData.value.sale_price,
        updated_at: new Date().toISOString()
      }
    }
    uni.showToast({ title: '修改成功', icon: 'success' })
  } else {
    const product: Product = {
      id: generateId(),
      name: formData.value.name,
      spec: formData.value.spec,
      unit: formData.value.unit,
      brand: formData.value.brand,
      pesticide_no: formData.value.pesticide_no,
      purchase_price: formData.value.purchase_price,
      sale_price: formData.value.sale_price,
      category_id: formData.value.category_id,
      category_name: category?.name || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    products.value.unshift(product)
    uni.showToast({ title: '添加成功', icon: 'success' })
  }
  
  closeModal()
}

onMounted(() => {
  products.value = [...mockProducts]
  categories.value = [...mockCategories]
})
</script>

<style lang="scss" scoped>
.product-container {
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
  
  &-outline {
    background: transparent;
    border: 2rpx solid #e53935;
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

.filter-picker {
  height: 64rpx;
  padding: 0 24rpx;
  border-radius: 12rpx;
  border: 1rpx solid #eeeeee;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  color: #333333;
  min-width: 160rpx;
}

.search-input {
  width: 300rpx;
  height: 64rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #eeeeee;
  font-size: 24rpx;
}

.product-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.product-card {
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

.product-title {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.product-category {
  font-size: 22rpx;
  color: #999999;
  margin-top: 4rpx;
}

.action-buttons {
  display: flex;
  gap: 12rpx;
}

.card-body {
  display: flex;
  padding: 20rpx 0;
  border-top: 1rpx solid #f0f0f0;
  border-bottom: 1rpx solid #f0f0f0;
}

.product-info {
  flex: 1;
}

.info-row {
  display: flex;
  margin-bottom: 12rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  width: 140rpx;
  font-size: 24rpx;
  color: #999999;
}

.info-value {
  flex: 1;
  font-size: 24rpx;
  color: #333333;
}

.product-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16rpx;
}

.price-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.price-label {
  font-size: 22rpx;
  color: #999999;
}

.price-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  
  &.primary {
    color: #e53935;
  }
}

.card-footer {
  margin-top: 16rpx;
}

.create-time {
  font-size: 22rpx;
  color: #999999;
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
  
  &.small {
    max-width: 500rpx;
  }
  
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

.category-select {
  display: flex;
  gap: 16rpx;
}

.picker-input {
  flex: 1;
  height: 72rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #eeeeee;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  color: #333333;
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