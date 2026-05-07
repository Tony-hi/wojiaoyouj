<template>
  <view class="account-container">
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
      <button class="btn btn-primary" @click="showAddModal = true">新增账单</button>
    </view>
    
    <view class="account-content">
      <view v-if="activeTab === 'receivable'" class="account-panel">
        <view class="summary-row">
          <view class="summary-card">
            <text class="summary-label">应收总额</text>
            <text class="summary-value">¥{{ receivableTotal.toFixed(2) }}</text>
          </view>
          <view class="summary-card warning">
            <text class="summary-label">未收金额</text>
            <text class="summary-value">¥{{ receivableUnpaid.toFixed(2) }}</text>
          </view>
        </view>
        
        <view class="account-list">
          <view v-for="account in receivableAccounts" :key="account.id" class="account-card">
            <view class="card-header">
              <text class="account-name">{{ account.related_name }}</text>
              <view class="status-tag" :class="account.status">
                {{ getStatusText(account.status) }}
              </view>
            </view>
            <view class="card-body">
              <view class="amount-info">
                <view class="amount-item">
                  <text class="amount-label">金额</text>
                  <text class="amount-value">¥{{ account.amount.toFixed(2) }}</text>
                </view>
                <view class="amount-item">
                  <text class="amount-label">已收</text>
                  <text class="amount-value success">¥{{ account.paid_amount.toFixed(2) }}</text>
                </view>
                <view class="amount-item">
                  <text class="amount-label">余额</text>
                  <text class="amount-value" :class="account.balance > 0 ? 'danger' : ''">¥{{ account.balance.toFixed(2) }}</text>
                </view>
              </view>
            </view>
            <view class="card-footer">
              <text class="create-time">{{ formatDateTime(account.created_at) }}</text>
              <view class="action-buttons">
                <button class="btn btn-primary btn-sm" @click="recordPayment(account)">收款</button>
                <button class="btn btn-secondary btn-sm" @click="viewTransactions(account)">流水</button>
              </view>
            </view>
          </view>
          
          <view v-if="receivableAccounts.length === 0" class="empty-state">
            <text>暂无应收账单</text>
          </view>
        </view>
      </view>
      
      <view v-else-if="activeTab === 'payable'" class="account-panel">
        <view class="summary-row">
          <view class="summary-card">
            <text class="summary-label">应付总额</text>
            <text class="summary-value">¥{{ payableTotal.toFixed(2) }}</text>
          </view>
          <view class="summary-card warning">
            <text class="summary-label">未付金额</text>
            <text class="summary-value">¥{{ payableUnpaid.toFixed(2) }}</text>
          </view>
        </view>
        
        <view class="account-list">
          <view v-for="account in payableAccounts" :key="account.id" class="account-card">
            <view class="card-header">
              <text class="account-name">{{ account.related_name }}</text>
              <view class="status-tag" :class="account.status">
                {{ getStatusText(account.status) }}
              </view>
            </view>
            <view class="card-body">
              <view class="amount-info">
                <view class="amount-item">
                  <text class="amount-label">金额</text>
                  <text class="amount-value">¥{{ account.amount.toFixed(2) }}</text>
                </view>
                <view class="amount-item">
                  <text class="amount-label">已付</text>
                  <text class="amount-value success">¥{{ account.paid_amount.toFixed(2) }}</text>
                </view>
                <view class="amount-item">
                  <text class="amount-label">余额</text>
                  <text class="amount-value" :class="account.balance > 0 ? 'danger' : ''">¥{{ account.balance.toFixed(2) }}</text>
                </view>
              </view>
            </view>
            <view class="card-footer">
              <text class="create-time">{{ formatDateTime(account.created_at) }}</text>
              <view class="action-buttons">
                <button class="btn btn-primary btn-sm" @click="recordPayment(account)">付款</button>
                <button class="btn btn-secondary btn-sm" @click="viewTransactions(account)">流水</button>
              </view>
            </view>
          </view>
          
          <view v-if="payableAccounts.length === 0" class="empty-state">
            <text>暂无应付账单</text>
          </view>
        </view>
      </view>
      
      <view v-else-if="activeTab === 'transactions'" class="transactions-panel">
        <view class="filter-bar">
          <picker :value="transactionTypeIndex" :range="transactionTypes" @change="onTransactionTypeChange">
            <view class="filter-picker">{{ transactionTypes[transactionTypeIndex] }}</view>
          </picker>
          <input v-model="transactionSearch" placeholder="搜索客户/供应商" class="search-input" />
        </view>
        
        <view class="transaction-list">
          <view v-for="transaction in filteredTransactions" :key="transaction.id" class="transaction-item">
            <view class="transaction-info">
              <text class="transaction-name">{{ transaction.related_name }}</text>
              <text class="transaction-type">{{ transaction.type === 'receive' ? '收款' : '付款' }}</text>
            </view>
            <view class="transaction-amount" :class="transaction.type">
              {{ transaction.type === 'receive' ? '+' : '-' }}¥{{ transaction.amount.toFixed(2) }}
            </view>
            <text class="transaction-time">{{ formatDateTime(transaction.created_at) }}</text>
          </view>
          
          <view v-if="filteredTransactions.length === 0" class="empty-state">
            <text>暂无交易记录</text>
          </view>
        </view>
      </view>
    </view>
    
    <view v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">新增账单</text>
          <button class="modal-close" @click="showAddModal = false">×</button>
        </view>
        <view class="modal-body">
          <view class="form-row">
            <text class="label">账单类型 *</text>
            <view class="radio-group">
              <view 
                class="radio-item" 
                :class="{ active: newAccount.type === 'receivable' }"
                @click="newAccount.type = 'receivable'"
              >
                <view class="radio-dot"></view>
                <text>应收</text>
              </view>
              <view 
                class="radio-item" 
                :class="{ active: newAccount.type === 'payable' }"
                @click="newAccount.type = 'payable'"
              >
                <view class="radio-dot"></view>
                <text>应付</text>
              </view>
            </view>
          </view>
          <view class="form-row">
            <text class="label">客户/供应商名称 *</text>
            <input v-model="newAccount.related_name" placeholder="输入名称" class="input" />
          </view>
          <view class="form-row">
            <text class="label">金额 *</text>
            <input v-model.number="newAccount.amount" type="digit" class="input" placeholder="0.00" />
          </view>
          <view class="form-row">
            <text class="label">备注</text>
            <textarea v-model="newAccount.remark" placeholder="输入备注" class="textarea" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn btn-secondary" @click="showAddModal = false">取消</button>
          <button class="btn btn-primary" @click="submitAccount">确认添加</button>
        </view>
      </view>
    </view>
    
    <view v-if="showPaymentModal" class="modal-overlay" @click="showPaymentModal = false">
      <view class="modal-content small" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ currentAccount?.type === 'receivable' ? '收款' : '付款' }}</text>
          <button class="modal-close" @click="showPaymentModal = false">×</button>
        </view>
        <view class="modal-body">
          <view class="payment-info">
            <view class="info-row">
              <text class="info-label">客户/供应商</text>
              <text class="info-value">{{ currentAccount?.related_name }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">当前余额</text>
              <text class="info-value danger">¥{{ currentAccount?.balance.toFixed(2) }}</text>
            </view>
          </view>
          <view class="form-row">
            <text class="label">{{ currentAccount?.type === 'receivable' ? '收款' : '付款' }}金额 *</text>
            <input v-model.number="paymentAmount" type="digit" class="input" placeholder="0.00" />
          </view>
          <view class="form-row">
            <text class="label">备注</text>
            <input v-model="paymentRemark" placeholder="输入备注" class="input" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn btn-secondary" @click="showPaymentModal = false">取消</button>
          <button class="btn btn-primary" @click="submitPayment">确认{{ currentAccount?.type === 'receivable' ? '收款' : '付款' }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Account, Transaction } from '@/types'
import { generateId, formatDateTime } from '@/utils/format'

const tabs = [
  { key: 'receivable', label: '应收账款' },
  { key: 'payable', label: '应付账款' },
  { key: 'transactions', label: '交易流水' }
]

const activeTab = ref('receivable')
const accounts = ref<Account[]>([])
const transactions = ref<Transaction[]>([])
const showAddModal = ref(false)
const showPaymentModal = ref(false)
const currentAccount = ref<Account | null>(null)
const paymentAmount = ref(0)
const paymentRemark = ref('')
const transactionTypeIndex = ref(0)
const transactionTypes = ['全部', '收款', '付款']
const transactionSearch = ref('')

const newAccount = ref({
  type: 'receivable' as 'receivable' | 'payable',
  related_name: '',
  amount: 0,
  remark: ''
})

const receivableAccounts = computed(() => {
  return accounts.value.filter(a => a.type === 'receivable')
})

const payableAccounts = computed(() => {
  return accounts.value.filter(a => a.type === 'payable')
})

const receivableTotal = computed(() => {
  return receivableAccounts.value.reduce((sum, a) => sum + a.amount, 0)
})

const receivableUnpaid = computed(() => {
  return receivableAccounts.value.reduce((sum, a) => sum + a.balance, 0)
})

const payableTotal = computed(() => {
  return payableAccounts.value.reduce((sum, a) => sum + a.amount, 0)
})

const payableUnpaid = computed(() => {
  return payableAccounts.value.reduce((sum, a) => sum + a.balance, 0)
})

const filteredTransactions = computed(() => {
  let result = transactions.value
  
  if (transactionTypeIndex.value > 0) {
    const type = transactionTypeIndex.value === 1 ? 'receive' : 'pay'
    result = result.filter(t => t.type === type)
  }
  
  if (transactionSearch.value) {
    const keyword = transactionSearch.value.toLowerCase()
    result = result.filter(t => t.related_name.toLowerCase().includes(keyword))
  }
  
  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    'unpaid': '未付款',
    'partial': '部分付款',
    'paid': '已付清'
  }
  return map[status] || status
}

function onTransactionTypeChange(e: any) {
  transactionTypeIndex.value = e.detail.value
}

function recordPayment(account: Account) {
  currentAccount.value = account
  paymentAmount.value = account.balance
  paymentRemark.value = ''
  showPaymentModal.value = true
}

function viewTransactions(account: Account) {
  activeTab.value = 'transactions'
}

function submitAccount() {
  if (!newAccount.value.related_name.trim()) {
    uni.showToast({ title: '请输入名称', icon: 'none' })
    return
  }
  if (!newAccount.value.amount || newAccount.value.amount <= 0) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' })
    return
  }
  
  const account: Account = {
    id: generateId(),
    type: newAccount.value.type,
    related_id: '',
    related_name: newAccount.value.related_name,
    amount: newAccount.value.amount,
    paid_amount: 0,
    balance: newAccount.value.amount,
    status: 'unpaid',
    remark: newAccount.value.remark,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  accounts.value.unshift(account)
  showAddModal.value = false
  newAccount.value = {
    type: 'receivable',
    related_name: '',
    amount: 0,
    remark: ''
  }
  uni.showToast({ title: '添加成功', icon: 'success' })
}

function submitPayment() {
  if (!paymentAmount.value || paymentAmount.value <= 0) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' })
    return
  }
  
  if (!currentAccount.value) return
  
  const accountIndex = accounts.value.findIndex(a => a.id === currentAccount.value!.id)
  if (accountIndex >= 0) {
    const account = accounts.value[accountIndex]
    const actualPayment = Math.min(paymentAmount.value, account.balance)
    
    const transaction: Transaction = {
      id: generateId(),
      account_id: account.id,
      type: account.type === 'receivable' ? 'receive' : 'pay',
      amount: actualPayment,
      remark: paymentRemark.value,
      created_at: new Date().toISOString()
    }
    transactions.value.unshift(transaction)
    
    accounts.value[accountIndex].paid_amount += actualPayment
    accounts.value[accountIndex].balance -= actualPayment
    
    if (accounts.value[accountIndex].balance <= 0) {
      accounts.value[accountIndex].status = 'paid'
    } else if (accounts.value[accountIndex].paid_amount > 0) {
      accounts.value[accountIndex].status = 'partial'
    }
    
    accounts.value[accountIndex].updated_at = new Date().toISOString()
  }
  
  showPaymentModal.value = false
  paymentAmount.value = 0
  paymentRemark.value = ''
  currentAccount.value = null
  uni.showToast({ title: '操作成功', icon: 'success' })
}

onMounted(() => {
  const now = new Date()
  accounts.value = [
    {
      id: 'a1',
      type: 'receivable',
      related_id: 'cu1',
      related_name: '张三',
      amount: 500,
      paid_amount: 200,
      balance: 300,
      status: 'partial',
      remark: '销售草甘膦',
      created_at: new Date(now.getTime() - 86400000).toISOString(),
      updated_at: new Date(now.getTime() - 3600000).toISOString()
    },
    {
      id: 'a2',
      type: 'receivable',
      related_id: 'cu2',
      related_name: '李四',
      amount: 300,
      paid_amount: 0,
      balance: 300,
      status: 'unpaid',
      remark: '销售尿素',
      created_at: new Date(now.getTime() - 172800000).toISOString(),
      updated_at: new Date(now.getTime() - 172800000).toISOString()
    },
    {
      id: 'a3',
      type: 'payable',
      related_id: 's1',
      related_name: '农资批发中心',
      amount: 1500,
      paid_amount: 1000,
      balance: 500,
      status: 'partial',
      remark: '采购农药',
      created_at: new Date(now.getTime() - 259200000).toISOString(),
      updated_at: new Date(now.getTime() - 86400000).toISOString()
    },
    {
      id: 'a4',
      type: 'payable',
      related_id: 's3',
      related_name: '种子公司',
      amount: 2250,
      paid_amount: 0,
      balance: 2250,
      status: 'unpaid',
      remark: '采购玉米种子',
      created_at: new Date(now.getTime() - 43200000).toISOString(),
      updated_at: new Date(now.getTime() - 43200000).toISOString()
    }
  ]
  
  transactions.value = [
    {
      id: 't1',
      account_id: 'a1',
      type: 'receive',
      amount: 200,
      remark: '现金收款',
      created_at: new Date(now.getTime() - 3600000).toISOString()
    },
    {
      id: 't2',
      account_id: 'a3',
      type: 'pay',
      amount: 1000,
      remark: '银行转账',
      created_at: new Date(now.getTime() - 86400000).toISOString()
    }
  ]
})
</script>

<style lang="scss" scoped>
.account-container {
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
  
  &-sm {
    height: 56rpx;
    padding: 0 20rpx;
    font-size: 22rpx;
  }
}

.account-content {
  flex: 1;
  overflow-y: auto;
}

.summary-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.summary-card {
  flex: 1;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  &.warning {
    background: #fff3e0;
  }
}

.summary-label {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 10rpx;
}

.summary-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.account-card {
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

.account-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.status-tag {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  
  &.unpaid {
    background: #fce4ec;
    color: #e53935;
  }
  
  &.partial {
    background: #fff3e0;
    color: #ff9800;
  }
  
  &.paid {
    background: #e8f5e9;
    color: #4caf50;
  }
}

.card-body {
  padding: 20rpx 0;
  border-top: 1rpx solid #f0f0f0;
  border-bottom: 1rpx solid #f0f0f0;
}

.amount-info {
  display: flex;
  gap: 40rpx;
}

.amount-item {
  display: flex;
  flex-direction: column;
}

.amount-label {
  font-size: 22rpx;
  color: #999999;
}

.amount-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  
  &.success {
    color: #4caf50;
  }
  
  &.danger {
    color: #e53935;
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
}

.create-time {
  font-size: 22rpx;
  color: #999999;
}

.action-buttons {
  display: flex;
  gap: 16rpx;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300rpx;
  color: #999999;
  font-size: 28rpx;
}

.filter-bar {
  display: flex;
  gap: 20rpx;
  align-items: center;
  padding: 20rpx;
  background: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
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

.search-input {
  flex: 1;
  height: 64rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #eeeeee;
  font-size: 24rpx;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.transaction-item {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.transaction-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.transaction-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #1a1a1a;
}

.transaction-type {
  font-size: 22rpx;
  color: #999999;
  padding: 6rpx 16rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
}

.transaction-amount {
  font-size: 28rpx;
  font-weight: bold;
  
  &.receive {
    color: #4caf50;
  }
  
  &.pay {
    color: #e53935;
  }
}

.transaction-time {
  font-size: 22rpx;
  color: #999999;
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
  max-height: 85vh;
  overflow: hidden;
  
  &.small {
    max-width: 500rpx;
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

.textarea {
  width: 100%;
  height: 120rpx;
  padding: 16rpx 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #eeeeee;
  font-size: 26rpx;
}

.radio-group {
  display: flex;
  gap: 40rpx;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  
  &.active .radio-dot {
    background: #e53935;
    
    &::after {
      display: block;
    }
  }
}

.radio-dot {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 2rpx solid #dddddd;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background: #ffffff;
    display: none;
  }
}

.payment-info {
  background: #fafafa;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  
  &:not(:last-child) {
    border-bottom: 1rpx solid #f0f0f0;
  }
}

.info-label {
  font-size: 24rpx;
  color: #999999;
}

.info-value {
  font-size: 24rpx;
  color: #333333;
  
  &.danger {
    color: #e53935;
    font-weight: bold;
  }
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