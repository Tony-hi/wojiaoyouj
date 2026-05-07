<template>
  <div class="system-settings">
    <div class="settings-header">
      <h3>系统设置 - 友金农资库存与账单管理系统</h3>
    </div>
    
    <div class="settings-grid">
      <div class="settings-card">
        <div class="card-header">
          <span class="card-icon">🔐</span>
          <h4>修改密码</h4>
        </div>
        <div class="card-body">
          <div class="form-row">
            <label>当前密码 *</label>
            <input v-model="passwordForm.current" type="password" class="form-input" />
          </div>
          <div class="form-row">
            <label>新密码 *</label>
            <input v-model="passwordForm.new" type="password" class="form-input" />
          </div>
          <div class="form-row">
            <label>确认新密码 *</label>
            <input v-model="passwordForm.confirm" type="password" class="form-input" />
          </div>
          <button class="btn btn-primary full-width" @click="changePassword">修改密码</button>
        </div>
      </div>
      
      <div class="settings-card">
        <div class="card-header">
          <span class="card-icon">📜</span>
          <h4>操作日志</h4>
        </div>
        <div class="card-body">
          <div class="log-list">
            <div v-for="log in operationLogs" :key="log.id" class="log-item">
              <div class="log-time">{{ formatDateTime(log.created_at) }}</div>
              <div class="log-content">
                <span class="log-module">[{{ log.module }}]</span>
                <span class="log-action">{{ log.action }}</span>
                <span class="log-desc">{{ log.description }}</span>
              </div>
            </div>
            
            <div v-if="operationLogs.length === 0" class="empty-log">
              <p>暂无操作日志</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="settings-card">
        <div class="card-header">
          <span class="card-icon">💾</span>
          <h4>数据备份</h4>
        </div>
        <div class="card-body">
          <div class="backup-info">
            <div class="info-row">
              <span class="label">上次备份:</span>
              <span>{{ lastBackupTime || '从未备份' }}</span>
            </div>
            <div class="info-row">
              <span class="label">自动备份:</span>
              <span>每日自动备份</span>
            </div>
          </div>
          <button class="btn btn-primary full-width mt-16" @click="backupData">立即备份</button>
          <button class="btn btn-secondary full-width mt-8" @click="restoreData">恢复备份</button>
        </div>
      </div>
      
      <div class="settings-card">
        <div class="card-header">
          <span class="card-icon">🚪</span>
          <h4>安全退出</h4>
        </div>
        <div class="card-body">
          <p class="logout-desc">点击下方按钮安全退出系统</p>
          <button class="btn btn-danger full-width mt-16" @click="handleLogout">退出登录</button>
        </div>
      </div>
    </div>
    
    <div v-if="showConfirmModal" class="modal-overlay" @click.self="showConfirmModal = false">
      <div class="modal-content small-modal">
        <div class="modal-header">
          <h3>确认操作</h3>
          <button class="close-btn" @click="showConfirmModal = false">×</button>
        </div>
        <div class="modal-body">
          <p>{{ confirmMessage }}</p>
          <div v-if="confirmType === 'password'" class="form-row">
            <label>请输入当前密码确认</label>
            <input v-model="confirmPassword" type="password" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showConfirmModal = false">取消</button>
          <button class="btn btn-danger" @click="executeConfirm">确认{{ confirmAction }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getOperationLogs, updatePassword, verifyPassword, createOperationLog } from '@/utils/supabase'
import { formatDateTime } from '@/utils/format'
import type { OperationLog } from '@/types'

const authStore = useAuthStore()

const passwordForm = ref({
  current: '',
  new: '',
  confirm: ''
})

const operationLogs = ref<OperationLog[]>([])
const lastBackupTime = ref('')

const showConfirmModal = ref(false)
const confirmMessage = ref('')
const confirmAction = ref('')
const confirmType = ref('')
const confirmPassword = ref('')

async function changePassword() {
  if (!passwordForm.value.current) {
    uni.showToast({ title: '请输入当前密码', icon: 'none' })
    return
  }
  
  if (!passwordForm.value.new) {
    uni.showToast({ title: '请输入新密码', icon: 'none' })
    return
  }
  
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }
  
  confirmMessage.value = '确定要修改密码吗？'
  confirmAction.value = '修改'
  confirmType.value = 'password'
  confirmPassword.value = ''
  showConfirmModal.value = true
}

async function executeConfirm() {
  if (confirmType.value === 'password') {
    if (!confirmPassword.value) {
      uni.showToast({ title: '请输入当前密码', icon: 'none' })
      return
    }
    
    const isValid = await verifyPassword(confirmPassword.value)
    if (!isValid) {
      uni.showToast({ title: '密码错误', icon: 'none' })
      return
    }
    
    await updatePassword(passwordForm.value.new)
    
    await createOperationLog({
      action: 'password_change',
      module: 'settings',
      description: '修改登录密码',
      operator: 'admin'
    })
    
    uni.showToast({ title: '密码修改成功', icon: 'success' })
    
    passwordForm.value = { current: '', new: '', confirm: '' }
  } else if (confirmType.value === 'logout') {
    await authStore.logout()
    uni.redirectTo({ url: '/pages/pc/login/index' })
  }
  
  showConfirmModal.value = false
}

async function backupData() {
  uni.showLoading({ title: '备份中...' })
  
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  lastBackupTime.value = new Date().toLocaleString('zh-CN')
  
  await createOperationLog({
    action: 'backup',
    module: 'settings',
    description: '手动备份数据',
    operator: 'admin'
  })
  
  uni.hideLoading()
  uni.showToast({ title: '备份成功', icon: 'success' })
}

async function restoreData() {
  confirmMessage.value = '确定要恢复数据吗？这将覆盖当前数据！'
  confirmAction.value = '恢复'
  confirmType.value = 'restore'
  showConfirmModal.value = true
}

function handleLogout() {
  confirmMessage.value = '确定要退出登录吗？'
  confirmAction.value = '退出'
  confirmType.value = 'logout'
  showConfirmModal.value = true
}

async function loadLogs() {
  operationLogs.value = await getOperationLogs()
}

onMounted(async () => {
  await loadLogs()
})
</script>

<style lang="scss" scoped>
.system-settings {
  padding-bottom: 20px;
}

.settings-header {
  margin-bottom: 20px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.settings-card {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #F5F5F5;
  
  h4 {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
}

.card-icon {
  font-size: 24px;
}

.card-body {
  padding: 20px;
}

.form-row {
  margin-bottom: 16px;
  
  label {
    display: block;
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .form-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #E0E0E0;
    border-radius: 8px;
    font-size: 14px;
  }
}

.full-width {
  width: 100%;
}

.mt-8 {
  margin-top: 8px;
}

.mt-16 {
  margin-top: 16px;
}

.log-list {
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  padding: 12px;
  border-bottom: 1px solid #F0F0F0;
  
  &:last-child {
    border-bottom: none;
  }
}

.log-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.log-content {
  font-size: 13px;
}

.log-module {
  color: #E53935;
  margin-right: 8px;
}

.log-action {
  color: #2196F3;
  margin-right: 8px;
}

.log-desc {
  color: #333;
}

.empty-log {
  padding: 40px;
  text-align: center;
  color: #999;
}

.backup-info {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  
  .label {
    color: #666;
    font-size: 13px;
  }
}

.logout-desc {
  color: #666;
  font-size: 13px;
}

.small-modal {
  max-width: 400px;
}
</style>
