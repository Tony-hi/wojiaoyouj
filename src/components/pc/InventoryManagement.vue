<template>
  <div class="inventory-management">
    <div class="inventory-header">
      <h3>库存管理 - 友金农资库存与账单管理系统</h3>
      <button class="btn btn-primary" @click="refreshData">刷新</button>
    </div>
    
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <div class="stat-value">{{ totalProducts }}</div>
          <div class="stat-label">商品种类</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatAmount(totalStockValue) }}</div>
          <div class="stat-label">库存总值</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <div class="stat-value">{{ lowStockCount }}</div>
          <div class="stat-label">库存不足</div>
        </div>
      </div>
      <div class="stat-card danger">
        <div class="stat-icon">⏰</div>
        <div class="stat-content">
          <div class="stat-value">{{ expiringCount }}</div>
          <div class="stat-label">临期商品</div>
        </div>
      </div>
    </div>
    
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <div v-if="activeTab === 'stock'" class="stock-panel">
      <div class="filter-bar">
        <input v-model="searchKeyword" type="text" class="search-input" placeholder="搜索商品名称" />
        <select v-model="selectedCategory" class="category-select">
          <option value="">全部分类</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </div>
      
      <div class="stock-table">
        <table class="table">
          <thead>
            <tr>
              <th>商品名称</th>
              <th>规格</th>
              <th>单位</th>
              <th>库存数量</th>
              <th>批次数量</th>
              <th>库存预警</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in stockSummary" :key="item.product_id">
              <td>{{ item.product_name }}</td>
              <td>{{ item.spec }}</td>
              <td>{{ item.unit }}</td>
              <td :class="{ warning: item.total_quantity < 10 }">{{ item.total_quantity }}</td>
              <td>{{ item.batch_count }}</td>
              <td>
                <span v-if="item.total_quantity < 10" class="warning-text">库存不足</span>
                <span v-else class="ok-text">正常</span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="stockSummary.length === 0" class="empty-state">
          <p>暂无库存数据</p>
        </div>
      </div>
    </div>
    
    <div v-if="activeTab === 'expiring'" class="expiring-panel">
      <div class="expiring-list">
        <div 
          v-for="item in expiringStock" 
          :key="item.id"
          class="expiring-card"
          :class="{ danger: isExpired(item.expiry_date) }"
        >
          <div class="card-header">
            <div class="product-info">
              <span class="product-name">{{ getProductName(item.product_id) }}</span>
              <span class="batch-no">{{ item.batch_no }}</span>
            </div>
            <span class="days-left">{{ getDaysLeft(item.expiry_date) }}天后到期</span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span>生产日期: {{ formatDate(item.production_date) }}</span>
              <span>保质期至: {{ formatDate(item.expiry_date) }}</span>
            </div>
            <div class="info-row">
              <span>库存数量: {{ item.quantity }}</span>
              <span>商品规格: {{ getProductSpec(item.product_id) }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="expiringStock.length === 0" class="empty-state">
          <p>暂无临期商品</p>
        </div>
      </div>
    </div>
    
    <div v-if="activeTab === 'batch'" class="batch-panel">
      <div class="filter-bar">
        <input v-model="batchKeyword" type="text" class="search-input" placeholder="搜索批次号或商品" />
      </div>
      
      <div class="batch-table">
        <table class="table">
          <thead>
            <tr>
              <th>商品名称</th>
              <th>批次号</th>
              <th>生产日期</th>
              <th>保质期至</th>
              <th>数量</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredStock" :key="item.id">
              <td>{{ getProductName(item.product_id) }}</td>
              <td>{{ item.batch_no }}</td>
              <td>{{ formatDate(item.production_date) }}</td>
              <td :class="{ danger: isExpired(item.expiry_date), warning: isExpiringSoon(item.expiry_date) }">
                {{ formatDate(item.expiry_date) }}
              </td>
              <td>{{ item.quantity }}</td>
              <td>
                <span v-if="isExpired(item.expiry_date)" class="status-tag expired">已过期</span>
                <span v-else-if="isExpiringSoon(item.expiry_date)" class="status-tag expiring">即将过期</span>
                <span v-else class="status-tag normal">正常</span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="filteredStock.length === 0" class="empty-state">
          <p>暂无批次数据</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { formatAmount, formatDate, getDaysUntilExpiry } from '@/utils/format'
import type { Product, Stock } from '@/types'

const appStore = useAppStore()

const activeTab = ref('stock')
const searchKeyword = ref('')
const batchKeyword = ref('')
const selectedCategory = ref('')

const tabs = [
  { key: 'stock', label: '实时库存' },
  { key: 'expiring', label: '临期预警' },
  { key: 'batch', label: '批次管理' }
]

const products = ref<Product[]>([])
const stock = ref<Stock[]>([])
const categories = ref<Category[]>([])

const totalProducts = computed(() => products.value.length)

const totalStockValue = computed(() => {
  let total = 0
  stock.value.forEach(s => {
    const product = products.value.find(p => p.id === s.product_id)
    if (product) {
      total += s.quantity * product.purchase_price
    }
  })
  return total
})

const stockSummary = computed(() => {
  const summary: Record<string, { product_id: string; product_name: string; spec: string; unit: string; total_quantity: number; batch_count: number }> = {}
  
  stock.value.forEach(s => {
    if (!summary[s.product_id]) {
      const product = products.value.find(p => p.id === s.product_id)
      summary[s.product_id] = {
        product_id: s.product_id,
        product_name: product?.name || '未知商品',
        spec: product?.spec || '',
        unit: product?.unit || '',
        total_quantity: 0,
        batch_count: 0
      }
    }
    summary[s.product_id].total_quantity += s.quantity
    summary[s.product_id].batch_count++
  })
  
  let result = Object.values(summary)
  
  if (selectedCategory.value) {
    const productIds = products.value.filter(p => p.category_id === selectedCategory.value).map(p => p.id)
    result = result.filter(item => productIds.includes(item.product_id))
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => item.product_name.toLowerCase().includes(keyword))
  }
  
  return result
})

const lowStockCount = computed(() => {
  return stockSummary.value.filter(item => item.total_quantity < 10).length
})

const expiringStock = computed(() => {
  const now = new Date()
  const thirtyDaysLater = new Date()
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
  
  return stock.value
    .filter(s => {
      const expiry = new Date(s.expiry_date)
      return expiry <= thirtyDaysLater && s.quantity > 0
    })
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
})

const expiringCount = computed(() => expiringStock.value.length)

const filteredStock = computed(() => {
  let result = stock.value
  
  if (batchKeyword.value) {
    const keyword = batchKeyword.value.toLowerCase()
    result = result.filter(s => 
      s.batch_no.toLowerCase().includes(keyword) ||
      getProductName(s.product_id).toLowerCase().includes(keyword)
    )
  }
  
  return result.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
})

function getProductName(productId: string): string {
  return products.value.find(p => p.id === productId)?.name || '未知商品'
}

function getProductSpec(productId: string): string {
  const product = products.value.find(p => p.id === productId)
  return product ? `${product.spec}/${product.unit}` : ''
}

function getDaysLeft(expiryDate: string): number {
  return getDaysUntilExpiry(expiryDate)
}

function isExpired(expiryDate: string): boolean {
  return getDaysUntilExpiry(expiryDate) <= 0
}

function isExpiringSoon(expiryDate: string): boolean {
  const days = getDaysUntilExpiry(expiryDate)
  return days > 0 && days <= 30
}

async function refreshData() {
  await appStore.loadAllData()
  products.value = appStore.products
  stock.value = appStore.stock
  categories.value = appStore.categories
}

onMounted(async () => {
  await appStore.loadAllData()
  products.value = appStore.products
  stock.value = appStore.stock
  categories.value = appStore.categories
})
</script>

<style lang="scss" scoped>
.inventory-management {
  padding-bottom: 20px;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  
  &.warning {
    background: #FFF3E0;
  }
  
  &.danger {
    background: #FFEBEE;
  }
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: #F5F5F5;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  
  .warning & {
    background: #FFE0B2;
  }
  
  .danger & {
    background: #FFCDD2;
  }
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1A1A1A;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fff;
  color: #666;
  
  &.active {
    background: #E53935;
    color: #fff;
  }
  
  &:hover:not(.active) {
    background: #F5F5F5;
  }
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  max-width: 300px;
  padding: 10px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
}

.category-select {
  padding: 10px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
}

.stock-table, .batch-table {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th, .table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #F0F0F0;
}

.table th {
  background: #F5F5F5;
  font-weight: 600;
  color: #666;
  font-size: 13px;
}

.table td {
  font-size: 14px;
}

.warning {
  color: #FF9800;
  font-weight: 600;
}

.warning-text {
  color: #FF9800;
  font-weight: 500;
}

.ok-text {
  color: #4CAF50;
  font-weight: 500;
}

.empty-state {
  padding: 60px;
  text-align: center;
  color: #999;
}

.expiring-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.expiring-card {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  border-left: 4px solid #FF9800;
  
  &.danger {
    border-left-color: #f44336;
    background: #FFEBEE;
  }
}

.expiring-card .card-header {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  background: #F5F5F5;
  
  .danger & {
    background: #FFCDD2;
  }
}

.product-info {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
}

.batch-no {
  font-size: 12px;
  color: #666;
}

.days-left {
  font-size: 14px;
  font-weight: 600;
  color: #FF9800;
  
  .danger & {
    color: #f44336;
  }
}

.expiring-card .card-body {
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.danger {
  color: #f44336;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  
  &.expired {
    background: #FFEBEE;
    color: #f44336;
  }
  
  &.expiring {
    background: #FFF3E0;
    color: #FF9800;
  }
  
  &.normal {
    background: #E8F5E9;
    color: #4CAF50;
  }
}
</style>
