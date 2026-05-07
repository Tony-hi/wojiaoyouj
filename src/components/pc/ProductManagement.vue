<template>
  <div class="product-management">
    <div class="product-header">
      <h3>商品管理 - 友金农资库存与账单管理系统</h3>
      <button class="btn btn-primary" @click="showAddModal = true">新增商品</button>
    </div>
    
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <div v-if="activeTab === 'products'" class="products-panel">
      <div class="filter-bar">
        <input v-model="searchKeyword" type="text" class="search-input" placeholder="搜索商品名称、规格或条形码" />
        <select v-model="selectedCategory" class="category-select">
          <option value="">全部分类</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </div>
      
      <div class="product-table">
        <table class="table">
          <thead>
            <tr>
              <th>商品名称</th>
              <th>规格</th>
              <th>单位</th>
              <th>品牌</th>
              <th>条形码</th>
              <th>进价</th>
              <th>售价</th>
              <th>分类</th>
              <th>库存</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filteredProducts" :key="product.id">
              <td>{{ product.name }}</td>
              <td>{{ product.spec }}</td>
              <td>{{ product.unit }}</td>
              <td>{{ product.brand || '-' }}</td>
              <td>
                <span v-if="product.barcode" class="barcode-text">{{ product.barcode }}</span>
                <span v-else class="no-barcode">-</span>
              </td>
              <td>{{ formatAmount(product.purchase_price) }}</td>
              <td>{{ formatAmount(product.sale_price) }}</td>
              <td>{{ getCategoryName(product.category_id) }}</td>
              <td>{{ getStockQuantity(product.id) }}</td>
              <td>
                <button class="btn btn-outline btn-sm" @click="editProduct(product)">编辑</button>
                <button class="btn btn-danger btn-sm" @click="confirmDeleteProduct(product)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="filteredProducts.length === 0" class="empty-state">
          <p>暂无商品数据</p>
        </div>
      </div>
    </div>
    
    <div v-if="activeTab === 'categories'" class="categories-panel">
      <div class="categories-list">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="category-card"
        >
          <div class="category-info">
            <span class="category-name">{{ category.name }}</span>
            <span class="product-count">{{ getProductCount(category.id) }} 个商品</span>
          </div>
          <div class="category-actions">
            <button class="btn btn-outline btn-sm" @click="editCategory(category)">编辑</button>
            <button 
              class="btn btn-danger btn-sm" 
              :disabled="getProductCount(category.id) > 0"
              @click="confirmDeleteCategory(category)"
            >删除</button>
          </div>
        </div>
        
        <div v-if="categories.length === 0" class="empty-state">
          <p>暂无分类数据</p>
        </div>
      </div>
      
      <button class="add-category-btn" @click="showAddCategoryModal = true">+ 新增分类</button>
    </div>
    
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingProduct ? '编辑商品' : '新增商品' }}</h3>
          <button class="close-btn" @click="closeAddModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>商品名称 *</label>
            <input v-model="formData.name" type="text" class="form-input" placeholder="请输入商品名称" />
          </div>
          <div class="form-row">
            <label>规格 *</label>
            <input v-model="formData.spec" type="text" class="form-input" placeholder="如：500ml、1kg" />
          </div>
          <div class="form-row">
            <label>单位 *</label>
            <input v-model="formData.unit" type="text" class="form-input" placeholder="如：瓶、袋、公斤" />
          </div>
          <div class="form-row">
            <label>品牌</label>
            <input v-model="formData.brand" type="text" class="form-input" placeholder="请输入品牌名称" />
          </div>
          <div class="form-row">
            <label>农药登记证号</label>
            <input v-model="formData.pesticide_reg_no" type="text" class="form-input" placeholder="如：PD20180001" />
          </div>
          <div class="form-row barcode-row">
            <label>商品条形码</label>
            <div class="barcode-input-group">
              <input 
                v-model="formData.barcode" 
                type="text" 
                class="form-input" 
                placeholder="请输入或扫描条形码"
              />
              <button type="button" class="btn-scan-barcode" @click="openBarcodeScanner">
                📷 扫码
              </button>
            </div>
            <span class="form-hint">扫码可快速录入条形码</span>
          </div>
          <div class="form-row">
            <label>进价 *</label>
            <input v-model.number="formData.purchase_price" type="number" class="form-input" placeholder="0.00" step="0.01" />
          </div>
          <div class="form-row">
            <label>售价 *</label>
            <input v-model.number="formData.sale_price" type="number" class="form-input" placeholder="0.00" step="0.01" />
          </div>
          <div class="form-row">
            <label>分类</label>
            <select v-model="formData.category_id" class="form-select">
              <option value="">请选择分类</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-row">
            <label>或新建分类</label>
            <input v-model="newCategoryName" type="text" class="form-input" placeholder="输入新分类名称" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAddModal">取消</button>
          <button class="btn btn-primary" @click="saveProduct">保存</button>
        </div>
      </div>
    </div>
    
    <div v-if="showAddCategoryModal" class="modal-overlay" @click.self="showAddCategoryModal = false">
      <div class="modal-content small-modal">
        <div class="modal-header">
          <h3>{{ editingCategory ? '编辑分类' : '新增分类' }}</h3>
          <button class="close-btn" @click="showAddCategoryModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>分类名称 *</label>
            <input v-model="categoryName" type="text" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddCategoryModal = false">取消</button>
          <button class="btn btn-primary" @click="saveCategory">保存</button>
        </div>
      </div>
    </div>

    <BarcodeScanner
      :visible="showScanner"
      mode="inbound"
      @close="showScanner = false"
      @scanned="handleBarcodeScanned"
      @not-found="handleBarcodeNotFound"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { createCategory, updateCategory, deleteCategory, createProduct, updateProduct, deleteProduct, checkProductExists, createOperationLog } from '@/utils/supabase'
import { formatAmount } from '@/utils/format'
import type { Product, Category } from '@/types'
import BarcodeScanner from '@/components/BarcodeScanner.vue'

const appStore = useAppStore()

const activeTab = ref('products')
const searchKeyword = ref('')
const selectedCategory = ref('')

const tabs = [
  { key: 'products', label: '商品列表' },
  { key: 'categories', label: '分类管理' }
]

const products = ref<Product[]>([])
const categories = ref<Category[]>([])

const showAddModal = ref(false)
const showAddCategoryModal = ref(false)
const showScanner = ref(false)
const editingProduct = ref<Product | null>(null)
const editingCategory = ref<Category | null>(null)
const newCategoryName = ref('')
const categoryName = ref('')

const formData = ref({
  name: '',
  spec: '',
  unit: '',
  brand: '',
  pesticide_reg_no: '',
  purchase_price: 0,
  sale_price: 0,
  barcode: '',
  category_id: ''
})

const filteredProducts = computed(() => {
  let result = products.value
  
  if (selectedCategory.value) {
    result = result.filter(p => p.category_id === selectedCategory.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(p => 
      p.name.toLowerCase().includes(keyword) || 
      p.spec.toLowerCase().includes(keyword) ||
      (p.barcode && p.barcode.toLowerCase().includes(keyword))
    )
  }
  
  return result
})

function getCategoryName(categoryId: string): string {
  return categories.value.find(c => c.id === categoryId)?.name || '-'
}

function getStockQuantity(productId: string): number {
  return appStore.stock
    .filter(s => s.product_id === productId)
    .reduce((sum, s) => sum + s.quantity, 0)
}

function getProductCount(categoryId: string): number {
  return products.value.filter(p => p.category_id === categoryId).length
}

function closeAddModal() {
  showAddModal.value = false
  editingProduct.value = null
  formData.value = {
    name: '',
    spec: '',
    unit: '',
    brand: '',
    pesticide_reg_no: '',
    purchase_price: 0,
    sale_price: 0,
    barcode: '',
    category_id: ''
  }
  newCategoryName.value = ''
}

function openBarcodeScanner() {
  showScanner.value = true
}

function handleBarcodeScanned(result: any) {
  if (result.product) {
    formData.value.barcode = result.barcode
  }
  showScanner.value = false
}

function handleBarcodeNotFound(barcode: string) {
  alert(`未找到条形码 "${barcode}" 对应的商品，请先创建商品！`)
  showScanner.value = false
}

async function saveProduct() {
  if (!formData.value.name.trim()) {
    alert('请输入商品名称')
    return
  }
  
  if (!formData.value.spec.trim()) {
    alert('请输入规格')
    return
  }
  
  if (!formData.value.unit.trim()) {
    alert('请输入单位')
    return
  }
  
  if (formData.value.purchase_price <= 0) {
    alert('进价必须大于0')
    return
  }
  
  if (formData.value.sale_price <= 0) {
    alert('售价必须大于0')
    return
  }
  
  if (newCategoryName.value.trim()) {
    const existing = categories.value.find(c => c.name === newCategoryName.value)
    if (existing) {
      formData.value.category_id = existing.id
    } else {
      const newCat = await createCategory(newCategoryName.value)
      formData.value.category_id = newCat.id
      categories.value.push(newCat)
    }
  }
  
  const exists = await checkProductExists(formData.value.name, formData.value.spec, editingProduct.value?.id)
  if (exists) {
    alert('相同名称和规格的商品已存在')
    return
  }
  
  if (formData.value.barcode) {
    const { data: existingBarcode } = await import('@/utils/supabase').then(m => 
      m.supabase.from('products').select('id').eq('barcode', formData.value.barcode).neq('id', editingProduct.value?.id || '').single()
    )
    if (existingBarcode) {
      alert('该条形码已被其他商品使用')
      return
    }
  }
  
  if (editingProduct.value) {
    await updateProduct(editingProduct.value.id, {
      name: formData.value.name,
      spec: formData.value.spec,
      unit: formData.value.unit,
      brand: formData.value.brand,
      pesticide_reg_no: formData.value.pesticide_reg_no,
      purchase_price: formData.value.purchase_price,
      sale_price: formData.value.sale_price,
      barcode: formData.value.barcode || null,
      category_id: formData.value.category_id
    })
    
    await createOperationLog({
      action: 'product_update',
      module: 'products',
      description: `修改商品 ${editingProduct.value.name}`,
      operator: 'admin'
    })
  } else {
    await createProduct({
      name: formData.value.name,
      spec: formData.value.spec,
      unit: formData.value.unit,
      brand: formData.value.brand,
      pesticide_reg_no: formData.value.pesticide_reg_no,
      purchase_price: formData.value.purchase_price,
      sale_price: formData.value.sale_price,
      barcode: formData.value.barcode || null,
      category_id: formData.value.category_id || null
    })
    
    await createOperationLog({
      action: 'product_create',
      module: 'products',
      description: `新增商品 ${formData.value.name}`,
      operator: 'admin'
    })
  }
  
  await appStore.loadProducts()
  products.value = appStore.products
  
  closeAddModal()
  alert('保存成功')
}

function editProduct(product: Product) {
  editingProduct.value = product
  formData.value = {
    name: product.name,
    spec: product.spec,
    unit: product.unit,
    brand: product.brand || '',
    pesticide_reg_no: product.pesticide_reg_no || '',
    purchase_price: product.purchase_price,
    sale_price: product.sale_price,
    barcode: product.barcode || '',
    category_id: product.category_id || ''
  }
  showAddModal.value = true
}

function confirmDeleteProduct(product: Product) {
  if (confirm(`确定要删除商品 "${product.name}" 吗？`)) {
    deleteProductItem(product)
  }
}

async function deleteProductItem(product: Product) {
  await deleteProduct(product.id)
  
  await createOperationLog({
    action: 'product_delete',
    module: 'products',
    description: `删除商品 ${product.name}`,
    operator: 'admin'
  })
  
  await appStore.loadProducts()
  products.value = appStore.products
  
  alert('删除成功')
}

function editCategory(category: Category) {
  editingCategory.value = category
  categoryName.value = category.name
  showAddCategoryModal.value = true
}

async function saveCategory() {
  if (!categoryName.value.trim()) {
    alert('请输入分类名称')
    return
  }
  
  if (editingCategory.value) {
    await updateCategory(editingCategory.value.id, categoryName.value)
    
    await createOperationLog({
      action: 'category_update',
      module: 'products',
      description: `修改分类 ${categoryName.value}`,
      operator: 'admin'
    })
  } else {
    await createCategory(categoryName.value)
    
    await createOperationLog({
      action: 'category_create',
      module: 'products',
      description: `新增分类 ${categoryName.value}`,
      operator: 'admin'
    })
  }
  
  await appStore.loadCategories()
  categories.value = appStore.categories
  
  showAddCategoryModal.value = false
  editingCategory.value = null
  categoryName.value = ''
  
  alert('保存成功')
}

function confirmDeleteCategory(category: Category) {
  if (confirm(`确定要删除分类 "${category.name}" 吗？`)) {
    deleteCategoryItem(category)
  }
}

async function deleteCategoryItem(category: Category) {
  await deleteCategory(category.id)
  
  await createOperationLog({
    action: 'category_delete',
    module: 'products',
    description: `删除分类 ${category.name}`,
    operator: 'admin'
  })
  
  await appStore.loadCategories()
  categories.value = appStore.categories
  
  alert('删除成功')
}

onMounted(async () => {
  await appStore.loadAllData()
  products.value = appStore.products
  categories.value = appStore.categories
})
</script>

<style lang="scss" scoped>
.product-management {
  padding-bottom: 20px;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
  }
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fff;
  color: #666;
  
  &.active {
    background: #E53935;
    color: #fff;
  }
  
  &:hover:not(.active) {
    background: #F5F5F5;
  }
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  max-width: 300px;
  padding: 10px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
}

.category-select {
  padding: 10px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
}

.product-table {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th, .table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #F0F0F0;
}

.table th {
  background: #F5F5F5;
  font-weight: 600;
  color: #666;
  font-size: 13px;
}

.table td {
  font-size: 14px;
}

.barcode-text {
  font-family: monospace;
  font-size: 13px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.no-barcode {
  color: #ccc;
}

.empty-state {
  padding: 60px;
  text-align: center;
  color: #999;
}

.categories-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.category-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-info {
  display: flex;
  flex-direction: column;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
}

.product-count {
  font-size: 12px;
  color: #666;
}

.add-category-btn {
  width: 100%;
  padding: 16px;
  border: 2px dashed #E0E0E0;
  border-radius: 16px;
  background: #fff;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #E53935;
    color: #E53935;
  }
}

.form-row {
  margin-bottom: 16px;
  
  label {
    display: block;
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .form-input, .form-select {
    width: 100%;
    padding: 12px;
    border: 1px solid #E0E0E0;
    border-radius: 8px;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: #E53935;
    }
  }
}

.barcode-row {
  .barcode-input-group {
    display: flex;
    gap: 8px;
    
    .form-input {
      flex: 1;
    }
    
    .btn-scan-barcode {
      padding: 12px 16px;
      background: linear-gradient(135deg, #FF4D4F, #FF6B6B);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      white-space: nowrap;
      
      &:hover {
        background: linear-gradient(135deg, #E63E3F, #E85A5A);
      }
    }
  }
  
  .form-hint {
    display: block;
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }
}

.small-modal {
  max-width: 400px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.btn-primary {
    background: #E53935;
    color: #fff;
    
    &:hover {
      background: #C62828;
    }
  }
  
  &.btn-secondary {
    background: #f5f5f5;
    color: #666;
    
    &:hover {
      background: #e8e8e8;
    }
  }
  
  &.btn-outline {
    background: #fff;
    color: #E53935;
    border: 1px solid #E53935;
    
    &:hover {
      background: #FFF5F5;
    }
  }
  
  &.btn-danger {
    background: #fff;
    color: #FF4D4F;
    border: 1px solid #FF4D4F;
    
    &:hover {
      background: #FFF2F0;
    }
  }
  
  &.btn-sm {
    padding: 6px 12px;
    font-size: 12px;
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
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: #f5f5f5;
    border-radius: 50%;
    font-size: 20px;
    color: #666;
    cursor: pointer;
    
    &:hover {
      background: #e8e8e8;
    }
  }
}

.modal-body {
  margin-bottom: 24px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
