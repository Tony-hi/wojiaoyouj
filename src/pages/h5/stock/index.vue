<template>
  <view class="h5-container">
    <view class="page-header">
      <text class="page-title">库存管理</text>
      <text class="page-subtitle">友金农资库存与账单管理系统</text>
    </view>
    
    <view class="tab-bar">
      <button 
        v-for="tab in tabs" 
        :key="tab.value"
        class="tab-btn"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <view v-if="tab.badge > 0" class="badge">{{ tab.badge }}</view>
      </button>
    </view>
    
    <view v-if="activeTab === 'stock'" class="stock-content">
      <view class="search-box">
        <input class="search-input" v-model="searchKeyword" placeholder="搜索商品" />
      </view>
      <view class="stock-list">
        <view 
          v-for="stock in filteredStocks" 
          :key="stock.id"
          class="stock-card"
          :class="{ warning: isExpiring(stock), low: stock.quantity < 10 }"
          @click="showStockDetail(stock)"
        >
          <view class="card-header">
            <text class="product-name">{{ stock.product_name }}</text>
            <text class="product-spec">{{ stock.product_spec }}</text>
          </view>
          <view class="card-body">
            <view class="detail-row">
              <text class="detail-label">批次</text>
              <text class="detail-value">{{ stock.batch_no }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">生产日期</text>
              <text class="detail-value">{{ formatDate(stock.production_date) }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">保质期</text>
              <text class="detail-value" :class="{ warning: isExpiring(stock) }">{{ formatDate(stock.expire_date) }}</text>
            </view>
          </view>
          <view class="card-footer">
            <text class="stock-qty" :class="{ low: stock.quantity < 10 }">库存: {{ stock.quantity }}</text>
            <text class="expire-info" v-if="isExpiring(stock)">剩余 {{ getDaysUntilExpire(stock.expire_date) }} 天过期</text>
          </view>
        </view>
        
        <view v-if="filteredStocks.length === 0" class="empty-state">
          <text class="empty-icon">📦</text>
          <text class="empty-text">暂无库存</text>
        </view>
      </view>
    </view>
    
    <view v-else-if="activeTab === 'alert'" class="alert-content">
      <view v-if="lowStockProducts.length > 0" class="alert-section">
        <text class="section-title">⚠️ 库存不足预警</text>
        <view 
          v-for="product in lowStockProducts" 
          :key="product.id"
          class="alert-card"
        >
          <view class="alert-info">
            <text class="alert-name">{{ product.name }} - {{ product.spec }}</text>
            <text class="alert-unit">{{ product.unit }}</text>
          </view>
          <text class="alert-qty">{{ getStockQuantity(product.id) }}</text>
        </view>
      </view>
      
      <view v-if="expiringStocks.length > 0" class="alert-section">
        <text class="section-title">⏰ 临期预警</text>
        <view 
          v-for="stock in expiringStocks" 
          :key="stock.id"
          class="alert-card"
        >
          <view class="alert-info">
            <text class="alert-name">{{ stock.product_name }} - {{ stock.product_spec }}</text>
            <text class="alert-expire">剩余 {{ getDaysUntilExpire(stock.expire_date) }} 天</text>
          </view>
          <text class="alert-qty">{{ stock.quantity }}</text>
        </view>
      </view>
      
      <view v-if="lowStockProducts.length === 0 && expiringStocks.length === 0" class="empty-state">
        <text class="empty-icon">✅</text>
        <text class="empty-text">暂无预警信息</text>
      </view>
    </view>
    
    <view v-if="showDetailModal" class="modal-mask" @click="closeDetailModal">
      <view class="detail-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">库存详情</text>
          <text class="close-btn" @click="closeDetailModal">×</text>
        </view>
        <view class="modal-body" v-if="selectedStock">
          <view class="detail-section">
            <view class="detail-row">
              <text class="detail-label">商品名称</text>
              <text class="detail-value">{{ selectedStock.product_name }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">规格</text>
              <text class="detail-value">{{ selectedStock.product_spec }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">批次号</text>
              <text class="detail-value">{{ selectedStock.batch_no }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">生产日期</text>
              <text class="detail-value">{{ formatDate(selectedStock.production_date) }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">保质期至</text>
              <text class="detail-value" :class="{ warning: isExpiring(selectedStock) }">{{ formatDate(selectedStock.expire_date) }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">当前库存</text>
              <text class="detail-value" :class="{ low: selectedStock.quantity < 10 }">{{ selectedStock.quantity }}</text>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn" @click="closeDetailModal">关闭</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getStocks, getProducts } from '@/utils/supabase'
import { formatDate, getDaysUntilExpire } from '@/utils/format'
import type { Stock, Product } from '@/types'

const activeTab = ref<'stock' | 'alert'>('stock')
const searchKeyword = ref('')
const stocks = ref<Stock[]>([])
const products = ref<Product[]>([])
const showDetailModal = ref(false)
const selectedStock = ref<Stock | null>(null)

const tabs = computed(() => [
  { label: '实时库存', value: 'stock' as const, badge: 0 },
  { label: '预警提醒', value: 'alert' as const, badge: lowStockProducts.value.length + expiringStocks.value.length }
])

const filteredStocks = computed(() => {
  let result = stocks.value
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(s =>
      s.product_name.toLowerCase().includes(keyword) ||
      s.product_spec.toLowerCase().includes(keyword)
    )
  }
  
  return result.sort((a, b) => new Date(a.expire_date).getTime() - new Date(b.expire_date).getTime())
})

const lowStockProducts = computed(() => {
  const stockMap: Record<string, number> = {}
  stocks.value.forEach(s => {
    stockMap[s.product_id] = (stockMap[s.product_id] || 0) + s.quantity
  })
  
  return products.value.filter(p => (stockMap[p.id] || 0) < 10)
})

const expiringStocks = computed(() => {
  return stocks.value.filter(s => {
    const days = getDaysUntilExpire(s.expire_date)
    return days > 0 && days <= 30
  })
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    stocks.value = await getStocks()
    products.value = await getProducts()
  } catch (error) {
    console.error('Load data error:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const isExpiring = (stock: Stock): boolean => {
  return getDaysUntilExpire(stock.expire_date) <= 30
}

const getStockQuantity = (productId: string): number => {
  return stocks.value
    .filter(s => s.product_id === productId)
    .reduce((sum, s) => sum + s.quantity, 0)
}

const showStockDetail = (stock: Stock) => {
  selectedStock.value = stock
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedStock.value = null
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

.tab-bar {
  display: flex;
  padding: 16px;
  background-color: #ffffff;
  margin: -20px 16px 16px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.tab-btn {
  flex: 1;
  position: relative;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background-color: #ffffff;
  font-size: 15px;
  color: #666666;
  
  &.active {
    background-color: #e53935;
    color: #ffffff;
  }
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background-color: #ff5252;
  color: #ffffff;
  font-size: 12px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stock-content, .alert-content {
  padding: 0 16px;
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

.stock-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stock-card {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 16px;
  
  &.warning {
    background-color: #fff3e0;
  }
  
  &.low {
    background-color: #fff5f5;
  }
}

.card-header {
  margin-bottom: 12px;
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

.card-body {
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}

.detail-label {
  font-size: 13px;
  color: #999999;
}

.detail-value {
  font-size: 13px;
  color: #333333;
  
  &.warning {
    color: #ff9800;
  }
  
  &.low {
    color: #e53935;
    font-weight: 600;
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-qty {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  
  &.low {
    color: #e53935;
  }
}

.expire-info {
  font-size: 12px;
  color: #ff9800;
}

.alert-section {
  margin-bottom: 20px;
}

.section-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 12px;
}

.alert-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 12px;
  margin-bottom: 12px;
}

.alert-info {
  flex: 1;
}

.alert-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
}

.alert-unit {
  font-size: 12px;
  color: #999999;
}

.alert-expire {
  font-size: 12px;
  color: #ff9800;
}

.alert-qty {
  font-size: 20px;
  font-weight: 600;
  color: #e53935;
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

.detail-modal {
  width: 100%;
  background-color: #ffffff;
  border-radius: 24px 24px 0 0;
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

.detail-section {
  padding-bottom: 20px;
}

.detail-section .detail-row {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-section .detail-label {
  font-size: 14px;
}

.detail-section .detail-value {
  font-size: 14px;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.modal-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  background-color: #e53935;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  border: none;
}
</style>