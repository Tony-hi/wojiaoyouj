<template>
  <div class="account-management">
    <div class="account-header">
      <h3>往来账单 - 友金农资库存与账单管理系统</h3>
    </div>
    
    <div class="stats-cards">
      <div class="stat-card receivable">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatAmount(totalReceivable) }}</div>
          <div class="stat-label">应收账款</div>
        </div>
      </div>
      <div class="stat-card payable">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatAmount(totalPayable) }}</div>
          <div class="stat-label">应付账款</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatAmount(totalReceived) }}</div>
          <div class="stat-label">已收金额</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💳</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatAmount(totalPaid) }}</div>
          <div class="stat-label">已付金额</div>
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
    
    <div v-if="activeTab === 'receivable'" class="receivable-panel">
      <button class="btn btn-primary mb-20" @click="showAddReceivableModal = true">新增应收款</button>
      
      <div class="account-table">
        <table class="table">
          <thead>
            <tr>
              <th>客户名称</th>
              <th>金额</th>
              <th>已收</th>
              <th>未收</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in receivableAccounts" :key="account.id">
              <td>{{ account.related_name }}</td>
              <td>{{ formatAmount(account.amount) }}</td>
              <td>{{ formatAmount(account.paid_amount) }}</td>
              <td>{{ formatAmount(account.amount - account.paid_amount) }}</td>
              <td>
                <span class="status-tag" :class="account.status">
                  {{ getStatusText(account.status) }}
                </span>
              </td>
              <td>{{ formatDate(account.created_at) }}</td>
              <td>
                <button class="btn btn-outline btn-sm" @click="recordReceipt(account)">收款</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="receivableAccounts.length === 0" class="empty-state">
          <p>暂无应收款记录</p>
        </div>
      </div>
    </div>
    
    <div v-if="activeTab === 'payable'" class="payable-panel">
      <button class="btn btn-primary mb-20" @click="showAddPayableModal = true">新增应付款</button>
      
      <div class="account-table">
        <table class="table">
          <thead>
            <tr>
              <th>供应商名称</th>
              <th>金额</th>
              <th>已付</th>
              <th>未付</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in payableAccounts" :key="account.id">
              <td>{{ account.related_name }}</td>
              <td>{{ formatAmount(account.amount) }}</td>
              <td>{{ formatAmount(account.paid_amount) }}</td>
              <td>{{ formatAmount(account.amount - account.paid_amount) }}</td>
              <td>
                <span class="status-tag" :class="account.status">
                  {{ getStatusText(account.status) }}
                </span>
              </td>
              <td>{{ formatDate(account.created_at) }}</td>
              <td>
                <button class="btn btn-outline btn-sm" @click="recordPayment(account)">付款</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="payableAccounts.length === 0" class="empty-state">
          <p>暂无应付款记录</p>
        </div>
      </div>
    </div>
    
    <div v-if="showAddReceivableModal" class="modal-overlay" @click.self="showAddReceivableModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>新增应收款</h3>
          <button class="close-btn" @click="showAddReceivableModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>客户名称 *</label>
            <input v-model="newReceivable.name" type="text" class="form-input" />
          </div>
          <div class="form-row">
            <label>金额 *</label>
            <input v-model.number="newReceivable.amount" type="number" class="form-input" />
          </div>
          <div class="form-row">
            <label>备注</label>
            <textarea v-model="newReceivable.remark" class="form-textarea"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddReceivableModal = false">取消</button>
          <button class="btn btn-primary" @click="saveReceivable">保存</button>
        </div>
      </div>
    </div>
    
    <div v-if="showAddPayableModal" class="modal-overlay" @click.self="showAddPayableModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>新增应付款</h3>
          <button class="close-btn" @click="showAddPayableModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>供应商名称 *</label>
            <input v-model="newPayable.name" type="text" class="form-input" />
          </div>
          <div class="form-row">
            <label>金额 *</label>
            <input v-model.number="newPayable.amount" type="number" class="form-input" />
          </div>
          <div class="form-row">
            <label>备注</label>
            <textarea v-model="newPayable.remark" class="form-textarea"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddPayableModal = false">取消</button>
          <button class="btn btn-primary" @click="savePayable">保存</button>
        </div>
      </div>
    </div>
    
    <div v-if="showPaymentModal" class="modal-overlay" @click.self="showPaymentModal = false">
      <div class="modal-content small-modal">
        <div class="modal-header">
          <h3>{{ paymentType === 'receipt' ? '收款登记' : '付款登记' }}</h3>
          <button class="close-btn" @click="showPaymentModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>{{ paymentType === 'receipt' ? '客户' : '供应商' }}</label>
            <input :value="currentAccount?.related_name" readonly class="form-input" />
          </div>
          <div class="form-row">
            <label>待{{ paymentType === 'receipt' ? '收' : '付' }}金额</label>
            <input :value="formatAmount((currentAccount?.amount || 0) - (currentAccount?.paid_amount || 0))" readonly class="form-input" />
          </div>
          <div class="form-row">
            <label>{{ paymentType === 'receipt' ? '收款' : '付款' }}金额 *</label>
            <input v-model.number="paymentAmount" type="number" class="form-input" />
          </div>
          <div class="form-row">
            <label>支付方式</label>
            <select v-model="paymentMethod" class="form-select">
              <option value="cash">现金</option>
              <option value="transfer">转账</option>
              <option value="wechat">微信</option>
              <option value="alipay">支付宝</option>
            </select>
          </div>
          <div class="form-row">
            <label>备注</label>
            <textarea v-model="paymentRemark" class="form-textarea"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showPaymentModal = false">取消</button>
          <button class="btn btn-primary" @click="confirmPayment">确认{{ paymentType === 'receipt' ? '收款' : '付款' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getAccounts, createAccount, updateAccountPayment, createTransaction, createOperationLog } from '@/utils/supabase'
import { formatAmount, formatDate, getStatusText } from '@/utils/format'
import type { Account } from '@/types'

const activeTab = ref('receivable')
const accounts = ref<Account[]>([])

const tabs = [
  { key: 'receivable', label: '应收账款' },
  { key: 'payable', label: '应付账款' }
]

const showAddReceivableModal = ref(false)
const showAddPayableModal = ref(false)
const showPaymentModal = ref(false)

const newReceivable = ref({
  name: '',
  amount: 0,
  remark: ''
})

const newPayable = ref({
  name: '',
  amount: 0,
  remark: ''
})

const currentAccount = ref<Account | null>(null)
const paymentType = ref<'receipt' | 'payment'>('receipt')
const paymentAmount = ref(0)
const paymentMethod = ref('cash')
const paymentRemark = ref('')

const receivableAccounts = computed(() => {
  return accounts.value.filter(a => a.type === 'receivable')
})

const payableAccounts = computed(() => {
  return accounts.value.filter(a => a.type === 'payable')
})

const totalReceivable = computed(() => {
  return receivableAccounts.value.reduce((sum, a) => sum + a.amount, 0)
})

const totalPayable = computed(() => {
  return payableAccounts.value.reduce((sum, a) => sum + a.amount, 0)
})

const totalReceived = computed(() => {
  return receivableAccounts.value.reduce((sum, a) => sum + a.paid_amount, 0)
})

const totalPaid = computed(() => {
  return payableAccounts.value.reduce((sum, a) => sum + a.paid_amount, 0)
})

async function saveReceivable() {
  if (!newReceivable.value.name.trim()) {
    uni.showToast({ title: '请输入客户名称', icon: 'none' })
    return
  }
  
  if (newReceivable.value.amount <= 0) {
    uni.showToast({ title: '金额必须大于0', icon: 'none' })
    return
  }
  
  await createAccount({
    type: 'receivable',
    related_id: '',
    related_name: newReceivable.value.name,
    amount: newReceivable.value.amount,
    paid_amount: 0,
    status: 'pending',
    remark: newReceivable.value.remark
  })
  
  await createOperationLog({
    action: 'account_receivable_create',
    module: 'accounts',
    description: `新增应收款，客户: ${newReceivable.value.name}，金额: ${newReceivable.value.amount}`,
    operator: 'admin'
  })
  
  await loadAccounts()
  showAddReceivableModal.value = false
  newReceivable.value = { name: '', amount: 0, remark: '' }
  
  uni.showToast({ title: '保存成功', icon: 'success' })
}

async function savePayable() {
  if (!newPayable.value.name.trim()) {
    uni.showToast({ title: '请输入供应商名称', icon: 'none' })
    return
  }
  
  if (newPayable.value.amount <= 0) {
    uni.showToast({ title: '金额必须大于0', icon: 'none' })
    return
  }
  
  await createAccount({
    type: 'payable',
    related_id: '',
    related_name: newPayable.value.name,
    amount: newPayable.value.amount,
    paid_amount: 0,
    status: 'pending',
    remark: newPayable.value.remark
  })
  
  await createOperationLog({
    action: 'account_payable_create',
    module: 'accounts',
    description: `新增应付款，供应商: ${newPayable.value.name}，金额: ${newPayable.value.amount}`,
    operator: 'admin'
  })
  
  await loadAccounts()
  showAddPayableModal.value = false
  newPayable.value = { name: '', amount: 0, remark: '' }
  
  uni.showToast({ title: '保存成功', icon: 'success' })
}

function recordReceipt(account: Account) {
  currentAccount.value = account
  paymentType.value = 'receipt'
  paymentAmount.value = account.amount - account.paid_amount
  showPaymentModal.value = true
}

function recordPayment(account: Account) {
  currentAccount.value = account
  paymentType.value = 'payment'
  paymentAmount.value = account.amount - account.paid_amount
  showPaymentModal.value = true
}

async function confirmPayment() {
  if (!currentAccount.value) return
  
  if (paymentAmount.value <= 0) {
    uni.showToast({ title: '金额必须大于0', icon: 'none' })
    return
  }
  
  await updateAccountPayment(currentAccount.value.id, paymentAmount.value)
  
  await createTransaction({
    type: paymentType.value,
    account_id: currentAccount.value.id,
    amount: paymentAmount.value,
    payment_method: paymentMethod.value as 'cash' | 'transfer' | 'wechat' | 'alipay',
    remark: paymentRemark.value
  })
  
  await createOperationLog({
    action: paymentType.value === 'receipt' ? 'account_receipt' : 'account_payment',
    module: 'accounts',
    description: `${paymentType.value === 'receipt' ? '收款' : '付款'}，${currentAccount.value.related_name}，金额: ${paymentAmount.value}`,
    operator: 'admin'
  })
  
  await loadAccounts()
  showPaymentModal.value = false
  currentAccount.value = null
  paymentAmount.value = 0
  paymentMethod.value = 'cash'
  paymentRemark.value = ''
  
  uni.showToast({ title: `${paymentType.value === 'receipt' ? '收款' : '付款'}成功`, icon: 'success' })
}

async function loadAccounts() {
  accounts.value = await getAccounts()
}

onMounted(async () => {
  await loadAccounts()
})
</script>

<style lang="scss" scoped>
.account-management {
  padding-bottom: 20px;
}

.account-header {
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
  
  &.receivable {
    background: #E3F2FD;
  }
  
  &.payable {
    background: #FFF3E0;
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
  
  .receivable & {
    background: #BBDEFB;
  }
  
  .payable & {
    background: #FFE0B2;
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

.mb-20 {
  margin-bottom: 20px;
}

.account-table {
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

.empty-state {
  padding: 60px;
  text-align: center;
  color: #999;
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
  
  &.partial {
    background: #E3F2FD;
    color: #2196F3;
  }
  
  &.paid {
    background: #E8F5E9;
    color: #4CAF50;
  }
}

.form-row {
  margin-bottom: 16px;
  
  label {
    display: block;
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .form-input, .form-select {
    width: 100%;
    padding: 12px;
    border: 1px solid #E0E0E0;
    border-radius: 8px;
    font-size: 14px;
  }
  
  .form-textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #E0E0E0;
    border-radius: 8px;
    font-size: 14px;
    min-height: 80px;
    resize: none;
  }
}

.small-modal {
  max-width: 400px;
}
</style>
