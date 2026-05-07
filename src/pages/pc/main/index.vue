<template>
  <div class="pc-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span>🌾</span>
          <span class="logo-text">友金农资</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <button 
          v-for="item in menuItems" 
          :key="item.key"
          class="nav-item"
          :class="{ active: currentPage === item.key }"
          @click="handleNavClick(item.key)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">{{ item.label }}</span>
        </button>
      </nav>
      
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">
          <span>🚪</span>
          <span>退出登录</span>
        </button>
      </div>
    </aside>
    
    <main class="main-content">
      <header class="main-header">
        <div class="header-left">
          <h2 class="page-title">{{ currentPageTitle }}</h2>
        </div>
        <div class="header-right">
          <span class="current-time">{{ currentTime }}</span>
        </div>
      </header>
      
      <div class="content-body">
        <PurchaseInbound v-if="currentPage === 'purchase'" />
        <SaleOutbound v-if="currentPage === 'sale'" />
        <ProductReservation v-if="currentPage === 'reservation'" />
        <DocumentManagement v-if="currentPage === 'documents'" />
        <InventoryManagement v-if="currentPage === 'inventory'" />
        <ProductManagement v-if="currentPage === 'products'" />
        <AccountManagement v-if="currentPage === 'accounts'" />
        <SystemSettings v-if="currentPage === 'settings'" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import PurchaseInbound from '@/components/pc/PurchaseInbound.vue'
import SaleOutbound from '@/components/pc/SaleOutbound.vue'
import ProductReservation from '@/components/pc/ProductReservation.vue'
import DocumentManagement from '@/components/pc/DocumentManagement.vue'
import InventoryManagement from '@/components/pc/InventoryManagement.vue'
import ProductManagement from '@/components/pc/ProductManagement.vue'
import AccountManagement from '@/components/pc/AccountManagement.vue'
import SystemSettings from '@/components/pc/SystemSettings.vue'

const authStore = useAuthStore()
const appStore = useAppStore()

const currentPage = ref('purchase')
const currentTime = ref('')

const menuItems = [
  { key: 'purchase', label: '采购入库', icon: '📥' },
  { key: 'sale', label: '销售出库', icon: '📤' },
  { key: 'reservation', label: '商品预定', icon: '📋' },
  { key: 'documents', label: '单据管理', icon: '📑' },
  { key: 'inventory', label: '库存管理', icon: '📦' },
  { key: 'products', label: '商品管理', icon: '🌱' },
  { key: 'accounts', label: '往来账单', icon: '💰' },
  { key: 'settings', label: '系统设置', icon: '⚙️' }
]

const currentPageTitle = computed(() => {
  const item = menuItems.find(i => i.key === currentPage.value)
  return item ? item.label : ''
})

let timer: ReturnType<typeof setInterval> | null = null

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function handleNavClick(key: string) {
  currentPage.value = key
  authStore.recordActivity()
}

async function handleLogout() {
  await authStore.logout()
  uni.redirectTo({ url: '/pages/pc/login/index' })
}

onMounted(() => {
  if (!authStore.isLoggedIn) {
    uni.redirectTo({ url: '/pages/pc/login/index' })
    return
  }
  
  updateTime()
  timer = setInterval(updateTime, 1000)
  
  appStore.loadAllData()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.pc-container {
  display: flex;
  min-height: 100vh;
  background: #F5F5F5;
}

.sidebar {
  width: 240px;
  background: #1A1A1A;
  color: #fff;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid #333;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo span:first-child {
  font-size: 36px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.sidebar-nav {
  flex: 1;
  padding: 16px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #999;
  
  &:hover {
    background: #333;
    color: #fff;
  }
  
  &.active {
    background: #E53935;
    color: #fff;
  }
}

.nav-icon {
  font-size: 28px;
}

.nav-text {
  font-size: 14px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #333;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  width: 100%;
  background: transparent;
  border: 1px solid #333;
  border-radius: 12px;
  cursor: pointer;
  color: #999;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #333;
    color: #fff;
  }
}

.main-content {
  margin-left: 240px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-header {
  background: #fff;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1A1A1A;
}

.current-time {
  font-size: 14px;
  color: #666;
}

.content-body {
  flex: 1;
  padding: 24px;
}
</style>
