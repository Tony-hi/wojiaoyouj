import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/pc/login/index.vue')
  },
  {
    path: '/pc',
    component: () => import('@/pages/pc/main/index.vue'),
    children: [
      {
        path: '',
        redirect: '/pc/purchase'
      },
      {
        path: 'purchase',
        name: 'Purchase',
        component: () => import('@/components/pc/PurchaseInbound.vue')
      },
      {
        path: 'sale',
        name: 'Sale',
        component: () => import('@/components/pc/SaleOutbound.vue')
      },
      {
        path: 'reservation',
        name: 'Reservation',
        component: () => import('@/components/pc/ProductReservation.vue')
      },
      {
        path: 'documents',
        name: 'Documents',
        component: () => import('@/components/pc/DocumentManagement.vue')
      },
      {
        path: 'stock',
        name: 'Stock',
        component: () => import('@/components/pc/InventoryManagement.vue')
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/components/pc/ProductManagement.vue')
      },
      {
        path: 'accounts',
        name: 'Accounts',
        component: () => import('@/components/pc/AccountManagement.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/components/pc/SystemSettings.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
