<template>
  <view class="documents-container">
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
        <input v-model="searchText" placeholder="搜索单号或客户" class="search-input" />
        <picker :value="statusIndex" :range="statusOptions" @change="onStatusChange">
          <view class="filter-picker">{{ statusOptions[statusIndex] }}</view>
        </picker>
      </view>
    </view>
    
    <view class="documents-list">
      <view v-for="doc in filteredDocuments" :key="doc.id" class="document-card">
        <view class="card-header">
          <view class="doc-info">
            <text class="doc-no">{{ doc.no }}</text>
            <text class="doc-type">{{ doc.type === 'purchase' ? '采购入库' : '销售出库' }}</text>
          </view>
          <view class="status-tag" :class="doc.status">
            {{ getStatusText(doc.status) }}
          </view>
        </view>
        
        <view class="card-body">
          <view class="doc-detail">
            <text class="detail-label">供应商/客户</text>
            <text class="detail-value">{{ doc.supplier_name || doc.customer_name }}</text>
          </view>
          <view class="doc-detail">
            <text class="detail-label">商品数量</text>
            <text class="detail-value">{{ doc.item_count }}种</text>
          </view>
          <view class="doc-detail">
            <text class="detail-label">总金额</text>
            <text class="detail-value price">¥{{ doc.total_amount.toFixed(2) }}</text>
          </view>
          <view class="doc-detail">
            <text class="detail-label">创建时间</text>
            <text class="detail-value">{{ formatDateTime(doc.created_at) }}</text>
          </view>
        </view>
        
        <view class="card-footer">
          <view class="action-buttons">
            <button 
              v-if="doc.status === 'draft'" 
              class="btn btn-primary btn-sm" 
              @click="handleApprove(doc)"
            >
              审核通过
            </button>
            <button 
              v-if="doc.status === 'draft'" 
              class="btn btn-danger btn-sm" 
              @click="handleCancel(doc)"
            >
              作废
            </button>
            <button class="btn btn-secondary btn-sm" @click="handleView(doc)">
              查看详情
            </button>
            <button class="btn btn-secondary btn-sm" @click="handlePrint(doc)">
              打印
            </button>
          </view>
        </view>
      </view>
      
      <view v-if="filteredDocuments.length === 0" class="empty-state">
        <text>暂无单据记录</text>
      </view>
    </view>
    
    <view v-if="showDetailModal" class="modal-overlay" @click="showDetailModal = false">
      <view class="modal-content large" @click.stop>
        <view class="modal-header">
          <text class="modal-title">单据详情</text>
          <button class="modal-close" @click="showDetailModal = false">×</button>
        </view>
        <view class="modal-body" v-if="selectedDoc">
          <view class="detail-section">
            <view class="detail-row">
              <text class="detail-label">单据编号</text>
              <text class="detail-value">{{ selectedDoc.no }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">单据类型</text>
              <text class="detail-value">{{ selectedDoc.type === 'purchase' ? '采购入库单' : '销售出库单' }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">供应商/客户</text>
              <text class="detail-value">{{ selectedDoc.supplier_name || selectedDoc.customer_name }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">单据状态</text>
              <text class="detail-value" :class="getStatusClass(selectedDoc.status)">
                {{ getStatusText(selectedDoc.status) }}
              </text>
            </view>
            <view class="detail-row">
              <text class="detail-label">总金额</text>
              <text class="detail-value price">¥{{ selectedDoc.total_amount.toFixed(2) }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">创建时间</text>
              <text class="detail-value">{{ formatDateTime(selectedDoc.created_at) }}</text>
            </view>
            <view v-if="selectedDoc.remark" class="detail-row">
              <text class="detail-label">备注</text>
              <text class="detail-value">{{ selectedDoc.remark }}</text>
            </view>
          </view>
          
          <view class="items-section">
            <text class="section-title">商品明细</text>
            <view class="items-table">
              <view class="table-header">
                <text class="th">商品名称</text>
                <text class="th">规格</text>
                <text class="th">批次</text>
                <text class="th">数量</text>
                <text class="th">单价</text>
                <text class="th">金额</text>
              </view>
              <view v-for="(item, index) in selectedDoc.items" :key="index" class="table-row">
                <text class="td">{{ item.product_name }}</text>
                <text class="td">{{ item.spec }}</text>
                <text class="td">{{ item.batch }}</text>
                <text class="td">{{ item.quantity }}</text>
                <text class="td">¥{{ item.price.toFixed(2) }}</text>
                <text class="td price">¥{{ item.amount.toFixed(2) }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn btn-secondary" @click="showDetailModal = false">关闭</button>
          <button class="btn btn-primary" @click="handlePrint(selectedDoc)">导出PDF</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatDateTime } from '@/utils/format'

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'purchase', label: '采购入库' },
  { key: 'sale', label: '销售出库' }
]

const activeTab = ref('all')
const searchText = ref('')
const statusIndex = ref(0)
const statusOptions = ['全部', '草稿', '已审核']
const showDetailModal = ref(false)
const selectedDoc = ref<any>(null)

interface DocumentItem {
  product_name: string
  spec: string
  batch: string
  quantity: number
  price: number
  amount: number
}

interface Document {
  id: string
  no: string
  type: 'purchase' | 'sale'
  supplier_name?: string
  customer_name?: string
  total_amount: number
  item_count: number
  status: 'draft' | 'approved'
  remark: string
  created_at: string
  items: DocumentItem[]
}

const documents = ref<Document[]>([])

const filteredDocuments = computed(() => {
  let result = documents.value
  
  if (activeTab.value !== 'all') {
    result = result.filter(d => d.type === activeTab.value)
  }
  
  if (statusIndex.value > 0) {
    const statusMap: Record<number, string> = {
      1: 'draft',
      2: 'approved'
    }
    result = result.filter(d => d.status === statusMap[statusIndex.value])
  }
  
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(d => 
      d.no.toLowerCase().includes(keyword) ||
      (d.supplier_name && d.supplier_name.toLowerCase().includes(keyword)) ||
      (d.customer_name && d.customer_name.toLowerCase().includes(keyword))
    )
  }
  
  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    'draft': '草稿',
    'approved': '已审核'
  }
  return map[status] || status
}

function getStatusClass(status: string): string {
  return status === 'approved' ? 'text-success' : 'text-warning'
}

function onStatusChange(e: any) {
  statusIndex.value = e.detail.value
}

function handleApprove(doc: Document) {
  uni.showModal({
    title: '审核单据',
    content: `确定审核通过 "${doc.no}" 吗？`,
    success: (res) => {
      if (res.confirm) {
        const index = documents.value.findIndex(d => d.id === doc.id)
        if (index >= 0) {
          documents.value[index].status = 'approved'
        }
        uni.showToast({ title: '审核成功', icon: 'success' })
      }
    }
  })
}

function handleCancel(doc: Document) {
  uni.showModal({
    title: '作废单据',
    content: `确定作废 "${doc.no}" 吗？此操作不可恢复。`,
    success: (res) => {
      if (res.confirm) {
        const index = documents.value.findIndex(d => d.id === doc.id)
        if (index >= 0) {
          documents.value.splice(index, 1)
        }
        uni.showToast({ title: '已作废', icon: 'success' })
      }
    }
  })
}

function handleView(doc: Document) {
  selectedDoc.value = doc
  showDetailModal.value = true
}

function handlePrint(doc: Document) {
  uni.showToast({ title: '正在生成打印文件...', icon: 'loading' })
  setTimeout(() => {
    uni.showToast({ title: '打印文件已生成', icon: 'success' })
    if (showDetailModal.value) {
      showDetailModal.value = false
    }
  }, 1500)
}

onMounted(() => {
  const now = new Date()
  documents.value = [
    {
      id: 'd1',
      no: 'CG20240501001',
      type: 'purchase',
      supplier_name: '农资批发中心',
      total_amount: 1500,
      item_count: 3,
      status: 'approved',
      remark: '常规采购',
      created_at: new Date(now.getTime() - 86400000).toISOString(),
      items: [
        { product_name: '草甘膦', spec: '41%水剂', batch: '20240501', quantity: 50, price: 15, amount: 750 },
        { product_name: '吡虫啉', spec: '10%可湿性粉剂', batch: '20240501', quantity: 100, price: 8.5, amount: 850 },
        { product_name: '尿素', spec: '46%含量', batch: '20240501', quantity: 200, price: 2.5, amount: 500 }
      ]
    },
    {
      id: 'd2',
      no: 'XS20240502001',
      type: 'sale',
      customer_name: '张三',
      total_amount: 360,
      item_count: 2,
      status: 'approved',
      remark: '',
      created_at: new Date(now.getTime() - 7200000).toISOString(),
      items: [
        { product_name: '草甘膦', spec: '41%水剂', batch: '20240101', quantity: 20, price: 18, amount: 360 }
      ]
    },
    {
      id: 'd3',
      no: 'XS20240502002',
      type: 'sale',
      customer_name: '李四',
      total_amount: 250,
      item_count: 2,
      status: 'draft',
      remark: '待审核',
      created_at: new Date(now.getTime() - 3600000).toISOString(),
      items: [
        { product_name: '尿素', spec: '46%含量', batch: '20240401', quantity: 50, price: 3, amount: 150 },
        { product_name: '玉米种子', spec: '郑单958', batch: '20240501', quantity: 2, price: 55, amount: 110 }
      ]
    },
    {
      id: 'd4',
      no: 'CG20240502002',
      type: 'purchase',
      supplier_name: '种子公司',
      total_amount: 2750,
      item_count: 2,
      status: 'draft',
      remark: '种子采购',
      created_at: new Date().toISOString(),
      items: [
        { product_name: '玉米种子', spec: '郑单958', batch: '20240502', quantity: 50, price: 45, amount: 2250 },
        { product_name: '小麦种子', spec: '济麦22', batch: '20240502', quantity: 14, price: 35, amount: 490 }
      ]
    }
  ]
})
</script>

<style lang="scss" scoped>
.documents-container {
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

.documents-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.document-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.doc-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.doc-no {
  font-size: 28rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.doc-type {
  font-size: 22rpx;
  color: #999999;
  padding: 6rpx 16rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
}

.status-tag {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  
  &.draft {
    background: #fff3e0;
    color: #ff9800;
  }
  
  &.approved {
    background: #e8f5e9;
    color: #4caf50;
  }
}

.card-body {
  display: flex;
  flex-wrap: wrap;
  gap: 30rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid #f0f0f0;
  border-bottom: 1rpx solid #f0f0f0;
}

.doc-detail {
  display: flex;
  flex-direction: column;
  min-width: 160rpx;
}

.detail-label {
  font-size: 22rpx;
  color: #999999;
}

.detail-value {
  font-size: 24rpx;
  color: #333333;
  
  &.price {
    color: #e53935;
    font-weight: bold;
  }
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20rpx;
}

.action-buttons {
  display: flex;
  gap: 16rpx;
}

.btn {
  height: 56rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
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
    max-width: 900rpx;
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
  max-height: 600rpx;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 30rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 20rpx;
  display: block;
}

.items-table {
  border: 1rpx solid #eeeeee;
  border-radius: 12rpx;
  overflow: hidden;
}

.table-header {
  display: flex;
  background: #fafafa;
  
  .th {
    flex: 1;
    padding: 16rpx;
    font-size: 24rpx;
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
  
  .td {
    flex: 1;
    padding: 16rpx;
    font-size: 24rpx;
    color: #333333;
    text-align: center;
    border-right: 1rpx solid #f5f5f5;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-right: none;
    }
    
    &.price {
      color: #e53935;
      font-weight: bold;
    }
  }
}

.text-success {
  color: #4caf50;
}

.text-warning {
  color: #ff9800;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  border-top: 1rpx solid #eeeeee;
  
  .btn {
    flex: 1;
    height: 80rpx;
    font-size: 26rpx;
  }
}
</style>