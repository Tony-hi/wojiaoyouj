<template>
  <view class="settings-container">
    <view class="settings-content">
      <view class="settings-section">
        <text class="section-title">系统设置</text>
        
        <view class="setting-item" @click="showPasswordModal = true">
          <view class="item-left">
            <text class="item-icon">🔐</text>
            <text class="item-label">修改密码</text>
          </view>
          <text class="item-arrow">›</text>
        </view>
        
        <view class="setting-item">
          <view class="item-left">
            <text class="item-icon">📊</text>
            <text class="item-label">库存预警阈值</text>
          </view>
          <view class="item-right">
            <input v-model.number="stockThreshold" type="number" class="threshold-input" />
            <text class="threshold-unit">件</text>
          </view>
        </view>
        
        <view class="setting-item">
          <view class="item-left">
            <text class="item-icon">⏰</text>
            <text class="item-label">临期预警天数</text>
          </view>
          <view class="item-right">
            <input v-model.number="expiryDays" type="number" class="threshold-input" />
            <text class="threshold-unit">天</text>
          </view>
        </view>
        
        <view class="setting-item" @click="handleBackup">
          <view class="item-left">
            <text class="item-icon">💾</text>
            <text class="item-label">数据备份</text>
          </view>
          <text class="item-arrow">›</text>
        </view>
        
        <view class="setting-item" @click="handleRestore">
          <view class="item-left">
            <text class="item-icon">🔄</text>
            <text class="item-label">数据恢复</text>
          </view>
          <text class="item-arrow">›</text>
        </view>
      </view>
      
      <view class="settings-section">
        <text class="section-title">关于系统</text>
        
        <view class="setting-item">
          <view class="item-left">
            <text class="item-icon">📱</text>
            <text class="item-label">系统名称</text>
          </view>
          <text class="item-value">友金农资库存与账单管理系统</text>
        </view>
        
        <view class="setting-item">
          <view class="item-left">
            <text class="item-icon">📅</text>
            <text class="item-label">版本号</text>
          </view>
          <text class="item-value">v1.0.0</text>
        </view>
        
        <view class="setting-item">
          <view class="item-left">
            <text class="item-icon">📧</text>
            <text class="item-label">技术支持</text>
          </view>
          <text class="item-value">support@youjin.com</text>
        </view>
      </view>
      
      <view class="settings-section">
        <button class="btn btn-danger btn-lg" @click="handleLogout">退出登录</button>
      </view>
    </view>
    
    <view v-if="showPasswordModal" class="modal-overlay" @click="showPasswordModal = false">
      <view class="modal-content small" @click.stop>
        <view class="modal-header">
          <text class="modal-title">修改密码</text>
          <button class="modal-close" @click="showPasswordModal = false">×</button>
        </view>
        <view class="modal-body">
          <view class="form-row">
            <text class="label">原密码 *</text>
            <input v-model="oldPassword" type="password" class="input" placeholder="请输入原密码" />
          </view>
          <view class="form-row">
            <text class="label">新密码 *</text>
            <input v-model="newPassword" type="password" class="input" placeholder="请输入新密码" />
          </view>
          <view class="form-row">
            <text class="label">确认新密码 *</text>
            <input v-model="confirmPassword" type="password" class="input" placeholder="请再次输入新密码" />
          </view>
          <view v-if="passwordError" class="error-tip">
            <text class="text-error">{{ passwordError }}</text>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn btn-secondary" @click="showPasswordModal = false">取消</button>
          <button class="btn btn-primary" @click="changePassword">确认修改</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const stockThreshold = ref(10)
const expiryDays = ref(30)
const showPasswordModal = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')

function changePassword() {
  passwordError.value = ''
  
  if (!oldPassword.value) {
    passwordError.value = '请输入原密码'
    return
  }
  
  if (oldPassword.value !== '123456') {
    passwordError.value = '原密码错误'
    return
  }
  
  if (!newPassword.value) {
    passwordError.value = '请输入新密码'
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = '两次输入的密码不一致'
    return
  }
  
  uni.showToast({ title: '密码修改成功', icon: 'success' })
  showPasswordModal.value = false
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

function handleBackup() {
  uni.showToast({ title: '正在备份...', icon: 'loading' })
  setTimeout(() => {
    uni.showToast({ title: '备份成功', icon: 'success' })
  }, 1500)
}

function handleRestore() {
  uni.showModal({
    title: '数据恢复',
    content: '确定要恢复数据吗？将覆盖当前所有数据。',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '正在恢复...', icon: 'loading' })
        setTimeout(() => {
          uni.showToast({ title: '恢复成功', icon: 'success' })
        }, 1500)
      }
    }
  })
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        authStore.logout()
        uni.redirectTo({ url: '/pages/pc/login/index' })
      }
    }
  })
}

onMounted(() => {})
</script>

<style lang="scss" scoped>
.settings-container {
  height: 100%;
  display: flex;
  justify-content: center;
}

.settings-content {
  width: 100%;
  max-width: 600rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.settings-section {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 20rpx;
  display: block;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  cursor: pointer;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background: #fafafa;
  }
}

.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.item-icon {
  font-size: 36rpx;
}

.item-label {
  font-size: 28rpx;
  color: #1a1a1a;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.threshold-input {
  width: 100rpx;
  height: 64rpx;
  text-align: center;
  border: 1rpx solid #eeeeee;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.threshold-unit {
  font-size: 24rpx;
  color: #999999;
}

.item-value {
  font-size: 26rpx;
  color: #999999;
}

.item-arrow {
  font-size: 36rpx;
  color: #cccccc;
}

.btn {
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
  width: 100%;
  
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
  
  &-lg {
    height: 96rpx;
    font-size: 30rpx;
  }
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
  max-width: 500rpx;
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

.error-tip {
  padding: 16rpx;
  background: rgba(229, 57, 53, 0.1);
  border-radius: 12rpx;
  text-align: center;
}

.text-error {
  color: #e53935;
  font-size: 24rpx;
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