<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('友金农资库存与账单管理系统已启动')
})
</script>

<style>
#app {
  width: 100%;
  height: 100%;
}
</style>
