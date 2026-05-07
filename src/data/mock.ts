import type { Category, Product, Supplier, Customer, Stock } from '@/types'

export const mockCategories: Category[] = [
  { id: 'c1', name: '杀虫剂', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 'c2', name: '杀菌剂', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 'c3', name: '除草剂', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 'c4', name: '化肥', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 'c5', name: '种子', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' }
]

export const mockProducts: Product[] = [
  { id: 'p1', name: '草甘膦', spec: '41%水剂', unit: '升', brand: '农达', pesticide_no: 'PD20080888', purchase_price: 15.00, sale_price: 18.00, category_id: 'c3', category_name: '除草剂', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 'p2', name: '吡虫啉', spec: '10%可湿性粉剂', unit: '克', brand: '艾美乐', pesticide_no: 'PD20100222', purchase_price: 8.50, sale_price: 10.00, category_id: 'c1', category_name: '杀虫剂', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 'p3', name: '多菌灵', spec: '50%可湿性粉剂', unit: '克', brand: '江苏蓝丰', pesticide_no: 'PD20090333', purchase_price: 6.00, sale_price: 7.50, category_id: 'c2', category_name: '杀菌剂', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 'p4', name: '尿素', spec: '46%含量', unit: '公斤', brand: '云天化', pesticide_no: '', purchase_price: 2.50, sale_price: 3.00, category_id: 'c4', category_name: '化肥', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 'p5', name: '玉米种子', spec: '郑单958', unit: '袋', brand: '登海种业', pesticide_no: '', purchase_price: 45.00, sale_price: 55.00, category_id: 'c5', category_name: '种子', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 'p6', name: '小麦种子', spec: '济麦22', unit: '袋', brand: '山东农科院', pesticide_no: '', purchase_price: 35.00, sale_price: 42.00, category_id: 'c5', category_name: '种子', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 'p7', name: '磷酸二铵', spec: '18-46-0', unit: '公斤', brand: '中化', pesticide_no: '', purchase_price: 4.20, sale_price: 5.00, category_id: 'c4', category_name: '化肥', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 'p8', name: '氯氟氰菊酯', spec: '2.5%乳油', unit: '毫升', brand: '功夫', pesticide_no: 'PD20070666', purchase_price: 12.00, sale_price: 15.00, category_id: 'c1', category_name: '杀虫剂', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' }
]

export const mockSuppliers: Supplier[] = [
  { id: 's1', name: '农资批发中心', phone: '13800138001', address: '农资市场A区12号', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 's2', name: '农化有限公司', phone: '13900139002', address: '工业园区B路88号', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 's3', name: '种子公司', phone: '13700137003', address: '农业科技园区', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' }
]

export const mockCustomers: Customer[] = [
  { id: 'cu1', name: '张三', phone: '13500135001', address: '城东村', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 'cu2', name: '李四', phone: '13600136002', address: '西洼村', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 'cu3', name: '王五', phone: '13400134003', address: '南山村', created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' }
]

export const mockStocks: Stock[] = [
  { id: 'st1', product_id: 'p1', product_name: '草甘膦', spec: '41%水剂', batch: '20240101', production_date: '2024-01-01', expiry_date: '2025-01-01', quantity: 50, created_at: '2024-01-01 00:00:00', updated_at: '2024-01-01 00:00:00' },
  { id: 'st2', product_id: 'p2', product_name: '吡虫啉', spec: '10%可湿性粉剂', batch: '20240201', production_date: '2024-02-01', expiry_date: '2025-02-01', quantity: 100, created_at: '2024-02-01 00:00:00', updated_at: '2024-02-01 00:00:00' },
  { id: 'st3', product_id: 'p3', product_name: '多菌灵', spec: '50%可湿性粉剂', batch: '20240301', production_date: '2024-03-01', expiry_date: '2025-03-01', quantity: 80, created_at: '2024-03-01 00:00:00', updated_at: '2024-03-01 00:00:00' },
  { id: 'st4', product_id: 'p4', product_name: '尿素', spec: '46%含量', batch: '20240401', production_date: '2024-04-01', expiry_date: '2026-04-01', quantity: 200, created_at: '2024-04-01 00:00:00', updated_at: '2024-04-01 00:00:00' },
  { id: 'st5', product_id: 'p5', product_name: '玉米种子', spec: '郑单958', batch: '20240501', production_date: '2024-05-01', expiry_date: '2025-05-01', quantity: 30, created_at: '2024-05-01 00:00:00', updated_at: '2024-05-01 00:00:00' }
]