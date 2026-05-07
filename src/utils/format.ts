export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

export function formatQuantity(quantity: number): string {
  return quantity.toString()
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '已审核',
    cancelled: '已作废',
    picked: '已提货',
    partial: '部分支付',
    paid: '已结清'
  }
  return statusMap[status] || status
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: '#FF9800',
    approved: '#4CAF50',
    cancelled: '#f44336',
    picked: '#2196F3',
    partial: '#FF9800',
    paid: '#4CAF50'
  }
  return colorMap[status] || '#666'
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function isExpiringSoon(expiryDate: string, days: number = 30): boolean {
  return getDaysUntilExpiry(expiryDate) <= days && getDaysUntilExpiry(expiryDate) > 0
}

export function isExpired(expiryDate: string): boolean {
  return getDaysUntilExpiry(expiryDate) <= 0
}

export function generateBatchNo(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `PO${year}${month}${day}${random}`
}

export function calculateAge(dateStr: string): number {
  const date = new Date(dateStr)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}
