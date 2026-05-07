import type { Product } from '@/types'

export interface BarcodeResult {
  success: boolean
  barcode?: string
  product?: Product
  error?: string
}

export interface ScannerConfig {
  fps?: number
  qrbox?: { width: number; height: number }
  aspectRatio?: number
  formats?: string[]
  facingMode?: string
}

export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  fps: 10,
  qrbox: { width: 280, height: 120 },
  aspectRatio: 1.777,
  formats: ['code_128', 'ean_13', 'ean_8', 'code_39', 'upc_a'],
  facingMode: 'environment'
}

export const BARCODE_FORMAT_LABELS: Record<string, string> = {
  'code_128': 'Code 128',
  'ean_13': 'EAN-13',
  'ean_8': 'EAN-8',
  'code_39': 'Code 39',
  'upc_a': 'UPC-A'
}

export async function lookupProductByBarcode(barcode: string): Promise<BarcodeResult> {
  if (!barcode || barcode.trim() === '') {
    return { success: false, error: '条形码不能为空' }
  }

  try {
    const { supabase } = await import('@/utils/supabase')
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode.trim())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: '该商品未建档，请先创建商品', barcode: barcode.trim() }
      }
      return { success: false, error: `查询失败: ${error.message}` }
    }

    if (!data) {
      return { success: false, error: '该商品未建档，请先创建商品', barcode: barcode.trim() }
    }

    return { success: true, product: data as Product, barcode: barcode.trim() }
  } catch (err: any) {
    console.error('Barcode lookup error:', err)
    return { success: false, error: '网络异常，请检查连接' }
  }
}

export function validateBarcode(barcode: string): { valid: boolean; error?: string } {
  if (!barcode || barcode.trim() === '') {
    return { valid: false, error: '请输入条形码' }
  }

  const cleanBarcode = barcode.trim()

  if (!/^\d{8,14}$/.test(cleanBarcode) && !/^[A-Za-z0-9\-\.]+$/.test(cleanBarcode)) {
    return { valid: false, error: '条形码格式不正确' }
  }

  return { valid: true }
}

export function vibrateOnSuccess(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([100, 50, 100])
  }
}

export function vibrateOnError(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([200, 100, 200])
  }
}

export function formatBarcodeDisplay(barcode: string): string {
  if (!barcode) return ''

  if (/^\d{13}$/.test(barcode)) {
    return `${barcode.slice(0, 1)} ${barcode.slice(1, 7)} ${barcode.slice(7)}`
  }
  if (/^\d{12}$/.test(barcode)) {
    return `${barcode.slice(0, 1)} ${barcode.slice(1, 6)} ${barcode.slice(6, 11)} ${barcode.slice(11)}`
  }
  if (/^\d{8}$/.test(barcode)) {
    return `${barcode.slice(0, 4)} ${barcode.slice(4)}`
  }

  return barcode
}

export function detectBarcodeFormat(barcode: string): string {
  if (/^\d{13}$/.test(barcode)) return 'EAN-13'
  if (/^\d{12}$/.test(barcode)) return 'UPC-A'
  if (/^\d{8}$/.test(barcode)) return 'EAN-8'
  if (/^[A-Za-z0-9\-\.]+$/.test(barcode)) return 'Code 128'
  return 'Unknown'
}
