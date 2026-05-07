<template>
  <div class="document-management">
    <div class="document-header">
      <h3>单据管理 - 友金农资库存与账单管理系统</h3>
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
        <span class="badge" v-if="getTabCount(tab.key) > 0">{{ getTabCount(tab.key) }}</span>
      </button>
    </div>
    
    <div class="filter-bar">
      <select v-model="statusFilter" class="status-select">
        <option value="">全部状态</option>
        <option value="pending">待审核</option>
        <option value="approved">已审核</option>
        <option value="cancelled">已作废</option>
      </select>
      <input v-model="searchKeyword" type="text" class="search-input" placeholder="搜索单据号或客户/供应商" />
    </div>
    
    <div class="document-table">
      <table class="table">
        <thead>
          <tr>
            <th>单据号</th>
            <th v-if="activeTab === 'purchase'">供应商</th>
            <th v-if="activeTab === 'sale'">客户</th>
            <th>金额</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in filteredDocuments" :key="doc.id">
            <td>{{ doc.id.slice(-8) }}</td>
            <td>{{ activeTab === 'purchase' ? doc.supplier_name : doc.customer_name }}</td>
            <td class="text-primary">{{ formatAmount(doc.total_amount) }}</td>
            <td>
              <span 
                class="status-tag" 
                :class="doc.status"
              >{{ getStatusText(doc.status) }}</span>
            </td>
            <td>{{ formatDateTime(doc.created_at) }}</td>
            <td>
              <button class="btn btn-outline btn-sm" @click="viewDocument(doc)">查看</button>
              <button 
                v-if="doc.status === 'pending'" 
                class="btn btn-primary btn-sm" 
                @click="approveDocument(doc)"
              >审核</button>
              <button 
                v-if="doc.status !== 'cancelled'" 
                class="btn btn-danger btn-sm" 
                @click="cancelDocument(doc)"
              >作废</button>
              <button class="btn btn-secondary btn-sm" @click="printDocument(doc)">打印</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="filteredDocuments.length === 0" class="empty-state">
        <p>暂无单据</p>
      </div>
    </div>
    
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-content detail-modal">
        <div class="modal-header">
          <h3>单据详情</h3>
          <button class="close-btn" @click="showDetailModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="doc-info">
            <div class="info-row">
              <span class="label">单据类型:</span>
              <span>{{ activeTab === 'purchase' ? '采购入库单' : '销售出库单' }}</span>
            </div>
            <div class="info-row">
              <span class="label">单据号:</span>
              <span>{{ currentDocument?.id }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ activeTab === 'purchase' ? '供应商:' : '客户:' }}</span>
              <span>{{ activeTab === 'purchase' ? currentDocument?.supplier_name : currentDocument?.customer_name }}</span>
            </div>
            <div class="info-row">
              <span class="label">状态:</span>
              <span 
                class="status-tag" 
                :class="currentDocument?.status"
              >{{ getStatusText(currentDocument?.status || '') }}</span>
            </div>
            <div class="info-row">
              <span class="label">创建时间:</span>
              <span>{{ formatDateTime(currentDocument?.created_at || '') }}</span>
            </div>
            <div v-if="currentDocument?.remark" class="info-row">
              <span class="label">备注:</span>
              <span>{{ currentDocument?.remark }}</span>
            </div>
          </div>
          
          <div class="items-section">
            <h4>商品明细</h4>
            <table class="detail-table">
              <thead>
                <tr>
                  <th>商品名称</th>
                  <th>规格</th>
                  <th>单位</th>
                  <th>数量</th>
                  <th>单价</th>
                  <th>金额</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in currentDocument?.items" :key="index">
                  <td>{{ item.product_name }}</td>
                  <td>{{ item.spec }}</td>
                  <td>{{ item.unit }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ formatAmount(item.unit_price) }}</td>
                  <td>{{ formatAmount(item.amount) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5" class="text-right">合计:</td>
                  <td class="text-primary font-bold">{{ formatAmount(currentDocument?.total_amount || 0) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDetailModal = false">关闭</button>
          <button class="btn btn-primary" @click="printDocument(currentDocument)">打印</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getPurchaseOrders, getSaleOrders, updatePurchaseOrderStatus, updateSaleOrderStatus, createOperationLog } from '@/utils/supabase'
import { formatAmount, formatDateTime, getStatusText } from '@/utils/format'
import type { PurchaseOrder, SaleOrder } from '@/types'

const activeTab = ref('purchase')
const purchaseOrders = ref<PurchaseOrder[]>([])
const saleOrders = ref<SaleOrder[]>([])
const statusFilter = ref('')
const searchKeyword = ref('')

const showDetailModal = ref(false)
const currentDocument = ref<PurchaseOrder | SaleOrder | null>(null)

const tabs = [
  { key: 'purchase', label: '采购入库单' },
  { key: 'sale', label: '销售出库单' }
]

const filteredDocuments = computed(() => {
  const docs = activeTab.value === 'purchase' ? purchaseOrders.value : saleOrders.value
  let result = docs as (PurchaseOrder | SaleOrder)[]
  
  if (statusFilter.value) {
    result = result.filter(d => d.status === statusFilter.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    const nameField = activeTab.value === 'purchase' ? 'supplier_name' : 'customer_name'
    result = result.filter(d => 
      d.id.toLowerCase().includes(keyword) || 
      d[nameField].toLowerCase().includes(keyword)
    )
  }
  
  return result
})

function getTabCount(tab: string): number {
  if (tab === 'purchase') {
    return purchaseOrders.value.filter(p => p.status === 'pending').length
  }
  return saleOrders.value.filter(s => s.status === 'pending').length
}

function viewDocument(doc: PurchaseOrder | SaleOrder) {
  currentDocument.value = doc
  showDetailModal.value = true
}

async function approveDocument(doc: PurchaseOrder | SaleOrder) {
  uni.showModal({
    title: '确认审核',
    content: '确定要审核此单据吗？',
    success: async (res) => {
      if (res.confirm) {
        if (activeTab.value === 'purchase') {
          await updatePurchaseOrderStatus(doc.id, 'approved')
        } else {
          await updateSaleOrderStatus(doc.id, 'approved')
        }
        
        await createOperationLog({
          action: 'document_approve',
          module: 'documents',
          description: `审核${activeTab.value === 'purchase' ? '采购' : '销售'}单据 ${doc.id}`,
          operator: 'admin'
        })
        
        await loadDocuments()
        uni.showToast({ title: '审核成功', icon: 'success' })
      }
    }
  })
}

async function cancelDocument(doc: PurchaseOrder | SaleOrder) {
  uni.showModal({
    title: '确认作废',
    content: '确定要作废此单据吗？此操作不可恢复。',
    success: async (res) => {
      if (res.confirm) {
        if (activeTab.value === 'purchase') {
          await updatePurchaseOrderStatus(doc.id, 'cancelled')
        } else {
          await updateSaleOrderStatus(doc.id, 'cancelled')
        }
        
        await createOperationLog({
          action: 'document_cancel',
          module: 'documents',
          description: `作废${activeTab.value === 'purchase' ? '采购' : '销售'}单据 ${doc.id}`,
          operator: 'admin'
        })
        
        await loadDocuments()
        uni.showToast({ title: '已作废', icon: 'success' })
      }
    }
  })
}

function printDocument(doc: PurchaseOrder | SaleOrder | null) {
  if (!doc) return
  
  const content = `
友金农资库存与账单管理系统
${activeTab.value === 'purchase' ? '采购入库单' : '销售出库单'}

单据号: ${doc.id}
${activeTab.value === 'purchase' ? '供应商' : '客户'}: ${activeTab.value === 'purchase' ? (doc as PurchaseOrder).supplier_name : (doc as SaleOrder).customer_name}
状态: ${getStatusText(doc.status)}
创建时间: ${formatDateTime(doc.created_at)}

商品明细:
`
  
  let itemsContent = ''
  doc.items.forEach((item, index) => {
    itemsContent += `${index + 1}. ${item.product_name} - ${item.spec}/${item.unit} × ${item.quantity} = ${formatAmount(item.amount)}\n`
  })
  
  const totalContent = content + itemsContent + `\n合计金额: ${formatAmount(doc.total_amount)}`
  
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(`<pre>${totalContent}</pre>`)
    printWindow.document.close()
    printWindow.print()
  }
}

async function loadDocuments() {
  purchaseOrders.value = await getPurchaseOrders()
  saleOrders.value = await getSaleOrders()
}

onMounted(async () => {
  await loadDocuments()
})
</script>

<style lang="scss" scoped>
.document-management {
  padding-bottom: 20px;
}

.document-header {
  margin-bottom: 20px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
  }
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
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

.badge {
  padding: 2px 8px;
  background: rgba(229, 57, 53, 0.2);
  color: #E53935;
  border-radius: 10px;
  font-size: 12px;
  
  .active & {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.status-select {
  padding: 10px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
}

.search-input {
  flex: 1;
  max-width: 300px;
  padding: 10px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
}

.document-table {
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

.text-primary {
  color: #E53935;
  font-weight: 600;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  
  &.pending {
    background: #FFF3E0;
    color: #FF9800;
  }
  
  &.approved {
    background: #E8F5E9;
    color: #4CAF50;
  }
  
  &.cancelled {
    background: #FFEBEE;
    color: #f44336;
  }
}

.empty-state {
  padding: 60px;
  text-align: center;
  color: #999;
}

.detail-modal {
  max-width: 800px;
}

.doc-info {
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #F0F0F0;
  
  .label {
    width: 100px;
    color: #666;
    font-weight: 500;
  }
}

.items-section {
  h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
  }
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #F0F0F0;
    font-size: 13px;
  }
  
  th {
    background: #F5F5F5;
    font-weight: 600;
    color: #666;
  }
  
  .text-right {
    text-align: right;
  }
  
  .font-bold {
    font-weight: 700;
  }
}
</style>
