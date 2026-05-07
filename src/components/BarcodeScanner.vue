<template>
  <Teleport to="body">
    <div v-if="visible" class="barcode-scanner-overlay" @click.self="handleClose">
      <div class="barcode-scanner-modal" :class="{ 'is-mobile': isMobile }">
        <div class="scanner-header">
          <h3>扫码{{ titleSuffix }}</h3>
          <button class="close-btn" @click="handleClose">
            <span>&times;</span>
          </button>
        </div>

        <div class="scanner-tip">
          <div v-if="!permissionGranted" class="permission-tip">
            <span class="tip-icon">⚠️</span>
            <span>首次使用请允许摄像头权限</span>
          </div>
          <div v-else class="normal-tip">
            <span class="tip-icon">📷</span>
            <span>将商品条形码放入框内，自动识别</span>
          </div>
        </div>

        <div class="scanner-container" ref="scannerRef">
          <div v-if="!scanning" class="scanner-placeholder">
            <div class="placeholder-icon">📷</div>
            <p>点击下方按钮开始扫码</p>
          </div>
          <div v-show="scanning" id="qr-reader" ref="qrReaderRef"></div>
        </div>

        <div class="scan-frame">
          <div class="frame-corner top-left"></div>
          <div class="frame-corner top-right"></div>
          <div class="frame-corner bottom-left"></div>
          <div class="frame-corner bottom-right"></div>
          <div class="scan-line"></div>
        </div>

        <div v-if="loading" class="scanner-loading">
          <div class="loading-spinner"></div>
          <p>正在识别...</p>
        </div>

        <div v-if="errorMessage" class="scanner-error">
          <span class="error-icon">❌</span>
          <span>{{ errorMessage }}</span>
        </div>

        <div class="scanner-actions">
          <button
            v-if="!scanning"
            class="btn-scan"
            @click="startScanning"
            :disabled="loading"
          >
            {{ scanning ? '扫码中...' : '开始扫码' }}
          </button>
          <button
            v-else
            class="btn-scan scanning"
            @click="stopScanning"
          >
            停止扫码
          </button>
          <button class="btn-manual" @click="showManualInput = true">
            手动输入
          </button>
          <button class="btn-cancel" @click="handleClose">
            取消
          </button>
        </div>

        <div v-if="showManualInput" class="manual-input-section">
          <div class="input-row">
            <input
              v-model="manualBarcode"
              type="text"
              placeholder="请输入条形码"
              class="manual-input"
              @keyup.enter="handleManualSubmit"
            />
            <button class="btn-submit" @click="handleManualSubmit">
              查询
            </button>
          </div>
        </div>

        <div v-if="lastResult" class="scan-result">
          <div class="result-icon">✅</div>
          <div class="result-info">
            <p class="result-barcode">条码: {{ lastResult.barcode }}</p>
            <p v-if="lastResult.product" class="result-product">
              商品: {{ lastResult.product.name }} ({{ lastResult.product.spec }})
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import {
  DEFAULT_SCANNER_CONFIG,
  lookupProductByBarcode,
  validateBarcode,
  vibrateOnSuccess,
  vibrateOnError,
  type BarcodeResult,
  type ScannerConfig
} from '@/utils/barcodeUtils'

interface Props {
  visible: boolean
  mode?: 'inbound' | 'outbound'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'inbound'
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'scanned', result: BarcodeResult): void
  (e: 'notFound', barcode: string): void
}>()

const scannerRef = ref<HTMLElement | null>(null)
const qrReaderRef = ref<HTMLElement | null>(null)
const scanning = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const permissionGranted = ref(false)
const showManualInput = ref(false)
const manualBarcode = ref('')
const lastResult = ref<BarcodeResult | null>(null)
const isMobile = ref(false)
const html5QrCode = ref<Html5Qrcode | null>(null)

const titleSuffix = props.mode === 'inbound' ? '入库' : '出库'

onMounted(() => {
  checkDevice()
})

onUnmounted(() => {
  stopScanning()
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetState()
    nextTick(() => {
      if (qrReaderRef.value) {
        qrReaderRef.value.innerHTML = ''
      }
    })
  } else {
    stopScanning()
  }
})

function checkDevice() {
  isMobile.value = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function resetState() {
  scanning.value = false
  loading.value = false
  errorMessage.value = ''
  permissionGranted.value = false
  showManualInput.value = false
  manualBarcode.value = ''
  lastResult.value = null
}

function handleClose() {
  stopScanning()
  emit('close')
}

async function startScanning() {
  if (loading.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    await checkCameraPermission()

    if (!permissionGranted.value) {
      errorMessage.value = '摄像头权限被拒绝，请在系统设置中开启'
      loading.value = false
      return
    }

    await nextTick()

    if (!qrReaderRef.value) {
      errorMessage.value = '扫码组件初始化失败'
      loading.value = false
      return
    }

    qrReaderRef.value.innerHTML = ''

    html5QrCode.value = new Html5Qrcode('qr-reader')

    const config: ScannerConfig = {
      ...DEFAULT_SCANNER_CONFIG,
      fps: 10,
      qrbox: { width: 280, height: 120 },
      aspectRatio: 1.777,
      formatsToSupport: [
        0,
        1,
        2,
        3,
        4
      ]
    }

    await html5QrCode.value.start(
      { facingMode: 'environment' },
      {
        fps: config.fps,
        qrbox: config.qrbox,
        aspectRatio: config.aspectRatio
      },
      onScanSuccess,
      onScanFailure
    )

    scanning.value = true
    loading.value = false
    vibrateOnSuccess()

  } catch (err: any) {
    console.error('Scanner start error:', err)
    loading.value = false
    scanning.value = false

    if (err.message?.includes('Permission')) {
      errorMessage.value = '摄像头权限被拒绝，请在系统设置中开启'
    } else if (err.message?.includes('NotFoundError') || err.message?.includes('no cameras')) {
      errorMessage.value = '未找到摄像头，请检查设备'
    } else if (err.message?.includes('NotAllowedError')) {
      errorMessage.value = '摄像头权限被拒绝，请允许访问'
    } else {
      errorMessage.value = '摄像头启动失败，请重试'
    }
  }
}

async function stopScanning() {
  if (html5QrCode.value && scanning.value) {
    try {
      await html5QrCode.value.stop()
    } catch (err) {
      console.error('Stop scanner error:', err)
    }
    html5QrCode.value = null
    scanning.value = false
  }
}

async function checkCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach(track => track.stop())
    permissionGranted.value = true
    return true
  } catch {
    permissionGranted.value = false
    return false
  }
}

async function onScanSuccess(decodedText: string) {
  if (loading.value) return

  loading.value = true
  vibrateOnSuccess()

  const result = await lookupProductByBarcode(decodedText)

  if (result.success && result.product) {
    lastResult.value = result
    emit('scanned', result)
    await stopScanning()
    setTimeout(() => {
      handleClose()
    }, 1000)
  } else {
    lastResult.value = result
    vibrateOnError()
    emit('notFound', decodedText)
  }

  loading.value = false
}

function onScanFailure(error: string) {
  // Silent failure for continuous scanning
}

async function handleManualSubmit() {
  const validation = validateBarcode(manualBarcode.value)
  if (!validation.valid) {
    errorMessage.value = validation.error || '条形码格式不正确'
    return
  }

  loading.value = true
  errorMessage.value = ''

  const result = await lookupProductByBarcode(manualBarcode.value)

  if (result.success && result.product) {
    lastResult.value = result
    emit('scanned', result)
    setTimeout(() => {
      handleClose()
    }, 1000)
  } else {
    lastResult.value = result
    vibrateOnError()
    emit('notFound', manualBarcode.value)
  }

  loading.value = false
}
</script>

<style lang="scss" scoped>
.barcode-scanner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.barcode-scanner-modal {
  width: 90%;
  max-width: 400px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  position: relative;

  &.is-mobile {
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
}

.scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
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
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #e8e8e8;
    }
  }
}

.scanner-tip {
  padding: 12px 20px;
  background: #FFF4E6;
  border-bottom: 1px solid #FFE7CC;

  .permission-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #FF4D4F;
    font-size: 14px;
    font-weight: 500;
  }

  .normal-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #666;
    font-size: 14px;
  }

  .tip-icon {
    font-size: 16px;
  }
}

.scanner-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background: #000;
  overflow: hidden;

  .scanner-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #999;

    .placeholder-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    p {
      font-size: 14px;
    }
  }

  #qr-reader {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    :deep(video) {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover;
    }

    :deep(#qr-shaded-region) {
      border: none !important;
    }
  }
}

.scan-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 140px;
  pointer-events: none;

  .frame-corner {
    position: absolute;
    width: 24px;
    height: 24px;
    border-color: #FF4D4F;
    border-style: solid;
    border-width: 0;

    &.top-left {
      top: 0;
      left: 0;
      border-top-width: 4px;
      border-left-width: 4px;
      border-top-left-radius: 8px;
    }

    &.top-right {
      top: 0;
      right: 0;
      border-top-width: 4px;
      border-right-width: 4px;
      border-top-right-radius: 8px;
    }

    &.bottom-left {
      bottom: 0;
      left: 0;
      border-bottom-width: 4px;
      border-left-width: 4px;
      border-bottom-left-radius: 8px;
    }

    &.bottom-right {
      bottom: 0;
      right: 0;
      border-bottom-width: 4px;
      border-right-width: 4px;
      border-bottom-right-radius: 8px;
    }
  }

  .scan-line {
    position: absolute;
    top: 10%;
    left: 10%;
    right: 10%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #FF4D4F, transparent);
    animation: scanMove 2s ease-in-out infinite;
  }
}

@keyframes scanMove {
  0%, 100% {
    top: 10%;
  }
  50% {
    top: 85%;
  }
}

.scanner-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.7);
  padding: 20px 32px;
  border-radius: 12px;

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 77, 79, 0.3);
    border-top-color: #FF4D4F;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.scanner-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #FFF2F0;
  color: #FF4D4F;
  font-size: 14px;

  .error-icon {
    font-size: 16px;
  }
}

.scanner-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;

  button {
    flex: 1;
    height: 44px;
    border: none;
    border-radius: 24px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-scan {
    background: linear-gradient(135deg, #FF4D4F, #FF6B6B);
    color: #fff;

    &:hover {
      background: linear-gradient(135deg, #E63E3F, #E85A5A);
    }

    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    &.scanning {
      background: #666;
    }
  }

  .btn-manual {
    background: #f5f5f5;
    color: #333;

    &:hover {
      background: #e8e8e8;
    }
  }

  .btn-cancel {
    background: #f5f5f5;
    color: #666;

    &:hover {
      background: #e8e8e8;
    }
  }
}

.manual-input-section {
  padding: 0 20px 16px;
  background: #fff;

  .input-row {
    display: flex;
    gap: 12px;

    .manual-input {
      flex: 1;
      height: 44px;
      padding: 0 16px;
      border: 1px solid #d9d9d9;
      border-radius: 8px;
      font-size: 15px;
      outline: none;

      &:focus {
        border-color: #FF4D4F;
        box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.1);
      }
    }

    .btn-submit {
      width: 80px;
      height: 44px;
      background: #FF4D4F;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      cursor: pointer;

      &:hover {
        background: #E63E3F;
      }
    }
  }
}

.scan-result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #F6FFED;
  border-top: 1px solid #B7EB8F;

  .result-icon {
    font-size: 24px;
  }

  .result-info {
    flex: 1;

    .result-barcode {
      margin: 0 0 4px;
      font-size: 14px;
      color: #333;
      font-family: monospace;
    }

    .result-product {
      margin: 0;
      font-size: 14px;
      color: #52C41A;
      font-weight: 500;
    }
  }
}
</style>
