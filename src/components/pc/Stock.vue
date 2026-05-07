<template>
  <view class="stock-container">
    <view class="page-header">
      <view class="tabs">
        <view 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </view>
      </view>
      <view class="filter-bar">
        <input v-model="searchText" placeholder="搜索商品" class="search-input" />
      </view>
    </view>
    
    <view class="stock-content">
      <view v-if="activeTab === 'overview'" class="overview-panel">
        <view class="stats-grid">
          <view class="stat-card">
            <view class="stat-icon">📦</view>
            <view class="stat-info">
              <text class="stat-value">{{ totalProducts }}</text>
              <text class="stat-label">商品种类</text>
            </view>
          </view>
          <view class="stat-card">
            <view class="stat-icon">📊</view>
            <view class="stat-info">
              <text class="stat-value">{{ totalStock }}</text>
              <text class="stat-label">库存总量</text>
            </view>
          </view>
          <view class="stat-card warning">
            <view class="stat-icon">⚠️</view>
            <view class="stat-info">
              <text class="stat-value">{{ lowStockCount }}</text>
              <text class="stat-label">库存预警</text>
            </view>
          </view>
          <view class="stat-card danger">
            <view class="stat-icon">⏰</view>
            <view class="stat-info">
              <text class="stat-value">{{ expiryCount }}</text>
              <text class="stat-label">临期商品</text>
            </view>
          </view>
        </view>
        
        <view class="table-container">
          <view class="table-header">
            <text class="th">商品名称</text>
            <text class="th">规格</text>
            <text class="th">批次</text>
            <text class="th">库存数量</text>
            <text class="th">生产日期</text>
            <text class="th">保质期</text>
            <text class="th">状态</text>
          </view>
          <view v-for="stock in filteredStocks" :key="stock.id" class="table-row" :class="{ low: stock.quantity <= 10, expiry: isExpiry(stock.expiry_date) }">
            <text class="td">{{ stock.product_name }}</text>
            <text class="td">{{ stock.spec }}</text>
            <text class="td">{{ stock.batch }}</text>
            <text class="td" :class="{ warning: stock.quantity <= 10 }">{{ stock.quantity }}</text>
            <text class="td">{{ formatDate(stock.production_date) }}</text>
            <text class="td" :class="{ danger: isExpiry(stock.expiry_date) }">{{ formatDate(stock.expiry_date) }}</text>
            <text class="td">
              <view class="status-badge" :class="getStatusClass(stock)">
                {{ getStatusText(stock) }}
              </view>
            </text>
          </view>
        </view>
      </view>
      
      <view v-else-if="activeTab === 'warning'" class="warning-panel">
        <view v-if="lowStockItems.length > 0" class="warning-list">
          <text class="panel-title">库存不足预警</text>
          <view v-for="item in lowStockItems" :key="item.id" class="warning-item">
            <view class="item-info">
              <text class="item-name">{{ item.product_name }}</text>
              <text class="item-spec">{{ item.spec }}</text>
            </view>
            <view class="item-meta">
              <text class="item-stock">库存: {{ item.quantity }}</text>
              <button class="btn btn-primary btn-sm">补货</button>
            </view>
          </view>
        </view>
        
        <view v-if="expiryItems.length > 0" class="warning-list mt-lg">
          <text class="panel-title">临期商品提醒</text>
          <view v-for="item in expiryItems" :key="item.id" class="warning-item expiry">
            <view class="item-info">
              <text class="item-name">{{ item.product_name }}</text>
              <text class="item-spec">{{ item.spec }} · 剩余{{ getDaysRemaining(item.expiry_date) }}天</text>
            </view>
            <view class="item-meta">
              <text class="item-expiry">到期: {{ formatDate(item.expiry_date) }}</text>
            </view>
          </view>
        </view>
        
        <view v-if="lowStockItems.length === 0 && expiryItems.length === 0" class="empty-state">
          <text>暂无预警信息</text>
        </view>
      </view>
      
      <view v-else-if="activeTab === 'check'" class="check-panel">
        <view class="check-header">
          <text class="check-title">库存盘点</text>
          <button class="btn btn-primary" @click="startCheck">开始盘点</button>
        </view>
        
        <view v-if="checking" class="check-content">
          <view class="check-table">
            <view class="table-header">
              <text class="th">商品名称</text>
              <text class="th">规格</text>
              <text class="th">账面数量</text>
              <text class="th">实际数量</text>
              <text class="th">差异</text>
            </view>
            <view v-for="item in checkItems" :key="item.id" class="table-row">
              <text class="td">{{ item.product_name }}</text>
              <text class="td">{{ item.spec }}</text>
              <text class="td">{{ item.quantity }}</text>
              <text class="td">
                <input v-model.number="item.real_qty" type="number" class="check-input" />
              </text>
              <text class="td" :class="item.diff !== 0 ? 'danger' : ''">{{ item.diff }}</text>
            </view>
          </view>
          <view class="check-footer">
            <text class="check-summary">差异合计: <text class="danger">{{ totalDiff }}</text></text>
            <view class="check-actions">
              <button class="btn btn-secondary" @click="cancelCheck">取消</button>
              <button class="btn btn-primary" @click="submitCheck">确认盘点</button>
            </view>
          </view>
        </view>
        
        <view v-else class="check-hint">
          <text class="hint-icon">📋</text>
          <text class="hint-text">点击"开始盘点"按钮进行库存盘点</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { mockStocks } from '@/data/mock'
import type { Stock } from '@/types'
import { formatDate } from '@/utils/format'

const tabs = [
  { key: 'overview', label: '库存总览' },
  { key: 'warning', label: '预警提醒' },
  { key: 'check', label: '库存盘点' }
]

const activeTab = ref('overview')
const searchText = ref('')
const stocks = ref<Stock[]>([])
const checking = ref(false)
const checkItems = ref<any[]>([])

const filteredStocks = computed(() => {
  let result = stocks.value
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(s => 
      s.product_name.toLowerCase().includes(keyword) || 
      s.spec.toLowerCase().includes(keyword)
    )
  }
  return result
})

const totalProducts = computed(() => {
  const productIds = new Set(stocks.value.map(s => s.product_id))
  return productIds.size
})

const totalStock = computed(() => {
  return stocks.value.reduce((sum, s) => sum + s.quantity, 0)
})

const lowStockCount = computed(() => {
  return stocks.value.filter(s => s.quantity <= 10).length
})

const expiryCount = computed(() => {
  return stocks.value.filter(s => isExpiry(s.expiry_date)).length
})

const lowStockItems = computed(() => {
  return stocks.value.filter(s => s.quantity <= 10)
})

const expiryItems = computed(() => {
  return stocks.value.filter(s => isExpiry(s.expiry_date))
})

const totalDiff = computed(() => {
  return checkItems.value.reduce((sum, item) => sum + item.diff, 0)
})

function isExpiry(expiryDate: string): boolean {
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diff = expiry.getTime() - today.getTime()
  return diff < 30 * 24 * 60 * 60 * 1000 && diff > 0
}

function getDaysRemaining(expiryDate: string): number {
  const expiry = new Date(expiryDate)
  const today = new Date()
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getStatusClass(stock: Stock): string {
  if (stock.quantity <= 10) return 'warning'
  if (isExpiry(stock.expiry_date)) return 'danger'
  return 'normal'
}

function getStatusText(stock: Stock): string {
  if (stock.quantity <= 10) return '库存不足'
  if (isExpiry(stock.expiry_date)) return '即将过期'
  return '正常'
}

function startCheck() {
  checkItems.value = stocks.value.map(s => ({
    ...s,
    real_qty: s.quantity,
    diff: 0
  }))
  checkItems.value.forEach(item => {
    item.diff = item.real_qty - item.quantity
  })
  checking.value = true
}

function cancelCheck() {
  checking.value = false
  checkItems.value = []
}

function submitCheck() {
  uni.showModal({
    title: '确认盘点',
    content: `盘点完成，差异合计: ${totalDiff.value}`,
    success: (res) => {
      if (res.confirm) {
        stocks.value = checkItems.value.map(item => ({
          ...item,
          quantity: item.real_qty
        }))
        checking.value = false
        checkItems.value = []
        uni.showToast({ title: '盘点完成', icon: 'success' })
      }
    }
  })
}

onMounted(() => {
  stocks.value = [...mockStocks]
})
</script>

<style lang="scss" scoped>
.stock-container {
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

.tabs {
  display: flex;
  gap: 10rpx;
}

.tab-item {
  padding: 16rpx 32rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
  color: #666666;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.active {
    background: #e53935;
    color: #ffffff;
  }
}

.filter-bar {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.search-input {
  width: 300rpx;
  height: 64rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #eeeeee;
  font-size: 24rpx;
}

.stock-content {
  flex: 1;
  overflow-y: auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.stat-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  
  &.warning {
    background: #fff3e0;
  }
  
  &.danger {
    background: #fce4ec;
  }
}

.stat-icon {
  font-size: 48rpx;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.stat-label {
  font-size: 22rpx;
  color: #999999;
}

.table-container {
  background: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
}

.table-header {
  display: flex;
  background: #fafafa;
  
  .th {
    flex: 1;
    padding: 20rpx;
    font-size: 26rpx;
    font-weight: bold;
    color: #666666;
    text-align: center;
    border-right: 1rpx solid #eeeeee;
    
    &:last-child {
      border-right: none;
    }
  }
}

.table-row {
  display: flex;
  border-bottom: 1rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  &.low .td:last-child .status-badge {
    background: #fff3e0;
    color: #ff9800;
  }
  
  &.expiry .td:last-child .status-badge {
    background: #fce4ec;
    color: #e53935;
  }
  
  .td {
    flex: 1;
    padding: 20rpx;
    font-size: 24rpx;
    color: #333333;
    text-align: center;
    border-right: 1rpx solid #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:last-child {
      border-right: none;
    }
    
    &.warning {
      color: #ff9800;
      font-weight: bold;
    }
    
    &.danger {
      color: #e53935;
      font-weight: bold;
    }
  }
}

.status-badge {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  background: #e8f5e9;
  color: #4caf50;
  
  &.warning {
    background: #fff3e0;
    color: #ff9800;
  }
  
  &.danger {
    background: #fce4ec;
    color: #e53935;
  }
}

.warning-panel {
  display: flex;
  flex-direction: column;
}

.warning-list {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.panel-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 20rpx;
  display: block;
}

.warning-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  &.expiry {
    background: #fce4ec;
    margin: 10rpx 0;
    padding: 20rpx;
    border-radius: 12rpx;
    border-bottom: none;
  }
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #1a1a1a;
}

.item-spec {
  font-size: 22rpx;
  color: #999999;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.item-stock {
  font-size: 24rpx;
  color: #e53935;
  font-weight: bold;
}

.item-expiry {
  font-size: 22rpx;
  color: #e53935;
}

.btn {
  height: 64rpx;
  padding: 0 24rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  border: none;
  
  &-primary {
    background: #e53935;
    color: #ffffff;
  }
  
  &-secondary {
    background: #f5f5f5;
    color: #333333;
  }
  
  &-sm {
    height: 56rpx;
    font-size: 22rpx;
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300rpx;
  color: #999999;
  font-size: 28rpx;
}

.check-panel {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.check-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.check-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.check-content {
  display: flex;
  flex-direction: column;
}

.check-table {
  border: 1rpx solid #eeeeee;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.check-input {
  width: 100rpx;
  height: 64rpx;
  text-align: center;
  border: 1rpx solid #eeeeee;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.check-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.check-summary {
  font-size: 26rpx;
  color: #333333;
  
  .danger {
    color: #e53935;
    font-weight: bold;
  }
}

.check-actions {
  display: flex;
  gap: 20rpx;
}

.check-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.hint-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.hint-text {
  font-size: 28rpx;
  color: #999999;
}

.mt-lg {
  margin-top: 20rpx;
}
</style>