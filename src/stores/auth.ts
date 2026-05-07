import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { verifyPassword, incrementLoginAttempts, resetLoginAttempts, getLoginAttempts, getLockoutUntil, setLockoutUntil } from '@/utils/supabase'
import { createOperationLog } from '@/utils/supabase'

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 30
const AUTO_LOGOUT_MINUTES = 30

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const loginAttempts = ref(0)
  const lockoutUntil = ref<string | null>(null)
  const lastActivity = ref(Date.now())
  
  let autoLogoutTimer: ReturnType<typeof setTimeout> | null = null

  const isLockedOut = computed(() => {
    if (!lockoutUntil.value) return false
    const lockoutTime = new Date(lockoutUntil.value).getTime()
    return Date.now() < lockoutTime
  })

  const lockoutRemainingSeconds = computed(() => {
    if (!lockoutUntil.value) return 0
    const remaining = Math.max(0, new Date(lockoutUntil.value).getTime() - Date.now())
    return Math.ceil(remaining / 1000)
  })

  async function loadAuthState() {
    const attempts = await getLoginAttempts()
    loginAttempts.value = attempts
    const lockout = await getLockoutUntil()
    lockoutUntil.value = lockout
    isLoggedIn.value = uni.getStorageSync('isLoggedIn') === 'true'
    if (isLoggedIn.value) {
      startAutoLogoutTimer()
    }
  }

  async function login(password: string): Promise<boolean> {
    if (isLockedOut.value) {
      return false
    }

    const isValid = await verifyPassword(password)
    
    if (isValid) {
      isLoggedIn.value = true
      loginAttempts.value = 0
      lockoutUntil.value = null
      await resetLoginAttempts()
      await setLockoutUntil('')
      uni.setStorageSync('isLoggedIn', 'true')
      lastActivity.value = Date.now()
      startAutoLogoutTimer()
      await createOperationLog({
        action: 'login',
        module: 'auth',
        description: '用户登录成功',
        operator: 'admin'
      })
      return true
    } else {
      loginAttempts.value++
      await incrementLoginAttempts()
      
      if (loginAttempts.value >= MAX_ATTEMPTS) {
        const lockoutTime = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
        lockoutUntil.value = lockoutTime.toISOString()
        await setLockoutUntil(lockoutUntil.value)
        await createOperationLog({
          action: 'lockout',
          module: 'auth',
          description: '账户因连续5次输错密码被锁定',
          operator: 'admin'
        })
      }
      return false
    }
  }

  async function logout() {
    isLoggedIn.value = false
    uni.setStorageSync('isLoggedIn', 'false')
    stopAutoLogoutTimer()
    await createOperationLog({
      action: 'logout',
      module: 'auth',
      description: '用户退出登录',
      operator: 'admin'
    })
  }

  function recordActivity() {
    lastActivity.value = Date.now()
    if (isLoggedIn.value) {
      stopAutoLogoutTimer()
      startAutoLogoutTimer()
    }
  }

  function startAutoLogoutTimer() {
    stopAutoLogoutTimer()
    autoLogoutTimer = setTimeout(async () => {
      if (isLoggedIn.value) {
        await logout()
        uni.navigateTo({ url: '/pages/pc/login/index' })
      }
    }, AUTO_LOGOUT_MINUTES * 60 * 1000)
  }

  function stopAutoLogoutTimer() {
    if (autoLogoutTimer) {
      clearTimeout(autoLogoutTimer)
      autoLogoutTimer = null
    }
  }

  return {
    isLoggedIn,
    loginAttempts,
    lockoutUntil,
    isLockedOut,
    lockoutRemainingSeconds,
    loadAuthState,
    login,
    logout,
    recordActivity
  }
})
