<template>
  <view class="h5-login-container">
    <view class="login-box">
      <view class="logo">
        <text class="logo-icon">🌾</text>
      </view>
      <text class="title">友金农资库存与账单管理系统</text>
      <view class="form">
        <view class="input-group">
          <text class="label">登录密码</text>
          <input 
            class="password-input" 
            type="password" 
            v-model="password" 
            placeholder="请输入密码"
            :disabled="isLocked"
            confirm-type="done"
            @confirm="handleLogin"
          />
        </view>
        <view v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </view>
        <view v-if="isLocked" class="lock-message">
          账户已锁定，请等待{{ remainingMinutes }}分钟后重试
        </view>
        <button 
          class="login-btn" 
          :disabled="!password || isLocked || isLoading"
          @click="handleLogin"
        >
          <text v-if="isLoading">登录中...</text>
          <text v-else>登录</text>
        </button>
      </view>
      <view class="tips">
        <text>默认密码：123456</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const isLocked = computed(() => authStore.isLockedOut)
const remainingMinutes = computed(() => Math.ceil(authStore.lockoutRemainingSeconds / 60))

onMounted(() => {
  authStore.loadAuthState()
  if (authStore.isLoggedIn) {
    uni.switchTab({ url: '/pages/h5/index/index' })
  }
})

const handleLogin = async () => {
  if (!password.value.trim()) {
    errorMessage.value = '请输入密码'
    return
  }
  
  isLoading.value = true
  errorMessage.value = ''
  
  const success = await authStore.login(password.value)
  
  isLoading.value = false
  
  if (success) {
    uni.switchTab({ url: '/pages/h5/index/index' })
  } else {
    if (authStore.isLockedOut) {
      errorMessage.value = '密码错误次数过多，账户已锁定'
    } else {
      errorMessage.value = '密码错误，请重试'
    }
  }
}
</script>

<style lang="scss">
.h5-login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 360px;
  background: #ffffff;
  border-radius: 24px;
  padding: 40px 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.logo {
  text-align: center;
  margin-bottom: 20px;
}

.logo-icon {
  font-size: 64px;
}

.title {
  display: block;
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 32px;
  line-height: 1.4;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 14px;
  color: #666666;
}

.password-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 2px solid #eeeeee;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #e53935;
    box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.1);
  }
  
  &:disabled {
    background-color: #f5f5f5;
    color: #999999;
  }
}

.login-btn {
  height: 52px;
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  
  &:active:not(:disabled) {
    transform: scale(0.98);
    opacity: 0.9;
  }
  
  &:disabled {
    background: #cccccc;
  }
}

.error-message {
  color: #e53935;
  font-size: 14px;
  text-align: center;
  padding: 12px;
  background-color: #fff5f5;
  border-radius: 8px;
}

.lock-message {
  color: #ff9800;
  font-size: 14px;
  text-align: center;
  padding: 12px;
  background-color: #fff8e1;
  border-radius: 8px;
}

.tips {
  text-align: center;
  margin-top: 24px;
}

.tips text {
  font-size: 12px;
  color: #999999;
}
</style>