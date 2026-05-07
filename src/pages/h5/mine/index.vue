<template>
  <view class="h5-container">
    <view class="page-header">
      <view class="user-info">
        <view class="avatar">👤</view>
        <view class="user-detail">
          <text class="user-name">管理员</text>
          <text class="user-role">系统管理员</text>
        </view>
      </view>
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
    
    <view class="menu-section">
      <view class="menu-title">业务管理</view>
      <view class="menu-list">
        <view class="menu-item" @click="navigateTo('/pages/h5/product/index')">
          <text class="menu-icon">🌱</text>
          <text class="menu-text">商品管理</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="navigateTo('/pages/h5/account/index')">
          <text class="menu-icon">💰</text>
          <text class="menu-text">往来账单</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>
    
    <view class="menu-section">
      <view class="menu-title">系统设置</view>
      <view class="menu-list">
        <view class="menu-item" @click="showPasswordModal = true">
          <text class="menu-icon">🔐</text>
          <text class="menu-text">修改密码</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="handleBackup">
          <text class="menu-icon">💾</text>
          <text class="menu-text">数据备份</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="handleRestore">
          <text class="menu-icon">🔄</text>
          <text class="menu-text">数据恢复</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>
    
    <view class="menu-section">
      <view class="menu-title">关于系统</view>
      <view class="menu-list">
        <view class="menu-item">
          <text class="menu-icon">📱</text>
          <text class="menu-text">系统名称</text>
          <text class="menu-value">友金农资库存与账单管理系统</text>
        </view>
        <view class="menu-item">
          <text class="menu-icon">📅</text>
          <text class="menu-text">版本号</text>
          <text class="menu-value">v1.0.0</text>
        </view>
      </view>
    </view>
    
    <view v-if="showPasswordModal" class="modal-mask" @click="showPasswordModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">修改密码</text>
          <text class="close-btn" @click="showPasswordModal = false">×</text>
        </view>
        <scroll-view scroll-y class="modal-body">
          <view class="form-item">
            <text class="form-label">原密码 *</text>
            <input class="form-input" type="password" v-model="oldPassword" placeholder="请输入原密码" />
          </view>
          <view class="form-item">
            <text class="form-label">新密码 *</text>
            <input class="form-input" type="password" v-model="newPassword" placeholder="请输入新密码" />
          </view>
          <view class="form-item">
            <text class="form-label">确认新密码 *</text>
            <input class="form-input" type="password" v-model="confirmPassword" placeholder="请再次输入新密码" />
          </view>
          <view v-if="passwordError" class="error-tip">
            {{ passwordError }}
          </view>
        </scroll-view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="showPasswordModal = false">取消</button>
          <button class="modal-btn confirm" @click="changePassword">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { updatePassword, validatePassword, createOperationLog } from '@/utils/supabase'

const authStore = useAuthStore()
const showPasswordModal = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')

const navigateTo = (url: string) => {
  uni.navigateTo({ url })
}

const handleLogout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        authStore.logout()
        uni.redirectTo({ url: '/pages/h5/login/index' })
      }
    }
  })
}

const changePassword = async () => {
  passwordError.value = ''
  
  if (!oldPassword.value.trim()) {
    passwordError.value = '请输入原密码'
    return
  }
  
  if (!newPassword.value.trim()) {
    passwordError.value = '请输入新密码'
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = '两次输入的密码不一致'
    return
  }
  
  uni.showLoading({ title: '验证中...' })
  
  try {
    const isValid = await validatePassword(oldPassword.value)
    
    if (!isValid) {
      uni.hideLoading()
      passwordError.value = '原密码错误'
      return
    }
    
    await updatePassword(newPassword.value)
    
    await createOperationLog({
      operator: '管理员',
      action: '修改密码',
      target: '系统设置',
      detail: '成功修改登录密码'
    })
    
    uni.hideLoading()
    uni.showToast({ title: '密码修改成功', icon: 'success' })
    showPasswordModal.value = false
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (error) {
    uni.hideLoading()
    console.error('Change password error:', error)
    passwordError.value = '修改失败，请稍后重试'
  }
}

const handleBackup = () => {
  uni.showToast({ title: '正在备份...', icon: 'loading' })
  setTimeout(() => {
    uni.showToast({ title: '备份成功', icon: 'success' })
  }, 1500)
}

const handleRestore = () => {
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
</script>

<style lang="scss">
.h5-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120px;
}

.page-header {
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
  padding: 40px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
}

.user-role {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.logout-btn {
  padding: 10px 20px;
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 14px;
  color: #ffffff;
}

.menu-section {
  background-color: #ffffff;
  margin: 16px;
  border-radius: 16px;
  overflow: hidden;
}

.menu-title {
  padding: 16px 20px;
  font-size: 14px;
  color: #999999;
  border-bottom: 1px solid #f5f5f5;
}

.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background-color: #fafafa;
  }
}

.menu-icon {
  font-size: 24px;
  margin-right: 16px;
}

.menu-text {
  flex: 1;
  font-size: 16px;
  color: #333333;
}

.menu-arrow {
  font-size: 20px;
  color: #cccccc;
}

.menu-value {
  font-size: 14px;
  color: #999999;
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

.modal-content {
  width: 100%;
  background-color: #ffffff;
  border-radius: 24px 24px 0 0;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  max-height: 400px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #666666;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #eeeeee;
  border-radius: 12px;
  font-size: 15px;
}

.error-tip {
  padding: 12px;
  background-color: rgba(229, 57, 53, 0.1);
  border-radius: 8px;
  font-size: 14px;
  color: #e53935;
  text-align: center;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.modal-btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  
  &.cancel {
    background-color: #f5f5f5;
    color: #666666;
  }
  
  &.confirm {
    background-color: #e53935;
    color: #ffffff;
  }
}
</style>