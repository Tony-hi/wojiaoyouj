<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo-section">
        <div class="logo">
          <span class="logo-icon">🌾</span>
        </div>
        <h1 class="title">友金农资库存与账单管理系统</h1>
        <p class="subtitle">农资店管理好帮手</p>
      </div>
      
      <div class="form-section">
        <div v-if="isLockedOut" class="lockout-warning">
          <div class="lock-icon">🔒</div>
          <p>账户已锁定</p>
          <p>请等待 {{ formatLockoutTime(lockoutRemainingSeconds) }} 后再试</p>
        </div>
        
        <div v-else>
          <div class="form-group">
            <label class="form-label">登录密码</label>
            <input 
              v-model="password" 
              type="password" 
              class="form-input" 
              placeholder="请输入密码"
              :class="{ 'shake': shakeInput }"
              @keyup.enter="handleLogin"
            />
          </div>
          
          <div v-if="errorMsg" class="error-message">{{ errorMsg }}</div>
          
          <button class="login-btn" @click="handleLogin">
            <span>{{ loading ? '登录中...' : '登录' }}</span>
          </button>
          
          <p class="hint-text">默认密码：123456</p>
          <p class="attempts-text">剩余尝试次数：{{ 5 - loginAttempts }} 次</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const shakeInput = ref(false)

let lockoutTimer: ReturnType<typeof setInterval> | null = null

const loginAttempts = authStore.loginAttempts
const isLockedOut = authStore.isLockedOut
const lockoutRemainingSeconds = authStore.lockoutRemainingSeconds

function formatLockoutTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs}秒`
}

async function handleLogin() {
  if (loading.value) return
  
  if (!password.value.trim()) {
    errorMsg.value = '请输入密码'
    shakeInput.value = true
    setTimeout(() => shakeInput.value = false, 500)
    return
  }
  
  loading.value = true
  errorMsg.value = ''
  
  const success = await authStore.login(password.value)
  
  if (success) {
    uni.redirectTo({ url: '/pages/pc/main/index' })
  } else {
    if (authStore.isLockedOut) {
      errorMsg.value = '密码错误次数过多，账户已锁定'
    } else {
      errorMsg.value = '密码错误，请重试'
      shakeInput.value = true
      setTimeout(() => shakeInput.value = false, 500)
    }
  }
  
  loading.value = false
}

onMounted(() => {
  authStore.loadAuthState()
  
  if (authStore.isLockedOut) {
    lockoutTimer = setInterval(() => {
      if (!authStore.isLockedOut) {
        if (lockoutTimer) clearInterval(lockoutTimer)
        uni.reLaunch({ url: '/pages/pc/login/index' })
      }
    }, 1000)
  }
})

onUnmounted(() => {
  if (lockoutTimer) clearInterval(lockoutTimer)
})
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
}

.login-box {
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
  padding: 60rpx;
  width: 90%;
  max-width: 500px;
}

.logo-section {
  text-align: center;
  margin-bottom: 50rpx;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  margin: 0 auto 30rpx;
  background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(229, 57, 53, 0.4);
}

.logo-icon {
  font-size: 60rpx;
}

.title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 12rpx;
}

.subtitle {
  font-size: 26rpx;
  color: #999;
}

.form-section {
  padding: 0 20rpx;
}

.lockout-warning {
  text-align: center;
  padding: 40rpx 20rpx;
  background: #FFF3E0;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
}

.lock-icon {
  font-size: 60rpx;
  margin-bottom: 20rpx;
}

.lockout-warning p:first-of-type {
  font-size: 30rpx;
  font-weight: 600;
  color: #E53935;
  margin-bottom: 10rpx;
}

.lockout-warning p:last-of-type {
  font-size: 26rpx;
  color: #FF9800;
}

.form-group {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  padding: 24rpx;
  font-size: 30rpx;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #E53935;
    box-shadow: 0 0 0 6rpx rgba(229, 57, 53, 0.1);
  }
  
  &.shake {
    animation: shake 0.5s ease-in-out;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8rpx); }
  20%, 40%, 60%, 80% { transform: translateX(8rpx); }
}

.error-message {
  font-size: 26rpx;
  color: #f44336;
  margin-bottom: 20rpx;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 28rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
  border: none;
  border-radius: 16rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2rpx);
    box-shadow: 0 8rpx 24rpx rgba(229, 57, 53, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.hint-text {
  text-align: center;
  font-size: 24rpx;
  color: #999;
  margin-top: 24rpx;
}

.attempts-text {
  text-align: center;
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
}
</style>
