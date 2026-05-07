import { ref, onMounted, onUnmounted } from 'vue'

interface BarcodeGunOptions {
    enableScanCallback?: boolean  // 是否啟用掃描回調
    debounceTime?: number        // 防抖時間，毫秒
    maxScanLength?: number       // 掃碼最大長度限制
    autoSubmit?: boolean         // 自動提交(遇到Enter或指定字符)
    submitKeys?: string[]        // 提交鍵列表，默認 ['Enter']
}

interface BarcodeGunResult {
    scannedCode: Ref<string>     // 當前掃描的代碼
    isScanning: Ref<boolean>     // 是否正在掃描
    scanHistory: Ref<string[]>   // 掃描歷史記錄
    startScan: () => void        // 開始監聽掃描
    stopScan: () => void         // 停止監聽掃描
    clearCode: () => void        // 清除當前代碼
    setScanCallback: (callback: (code: string) => void) => void  // 設置掃描成功回調
}

/**
 * USB 掃碼槍組合函數
 * 支持監聽鍵盤事件，解析掃碼槍輸入的 QR 碼
 * 
 * @param options 配置選項
 * @returns 掃碼槍相關響應式數據和方法
 */
export const useBarcodeGun = (options: BarcodeGunOptions = {}): BarcodeGunResult => {
    const {
        enableScanCallback = true,
        debounceTime = 100,
        maxScanLength = 1000,
        autoSubmit = true,
        submitKeys = ['Enter']
    } = options

    // 響應式狀態
    const scannedCode = ref('')
    const isScanning = ref(false)
    const scanHistory = ref<string[]>([])

    // 內部狀態
    let scanBuffer = ''
    let scanCallback: ((code: string) => void) | null = null
    let lastKeyTime = 0
    let scanTimeout: ReturnType<typeof setTimeout> | null = null
    let isListening = false

    /**
     * 處理鍵盤事件
     */
    const handleKeydown = (event: KeyboardEvent) => {
        if (!isListening) return

        const currentTime = Date.now()

        // 檢查是否為提交鍵（通常是 Enter）
        if (submitKeys.includes(event.key)) {
            event.preventDefault()
            processScanResult()
            return
        }

        // 檢查是否為可打印字符
        if (event.key.length === 1) {
            event.preventDefault()

            // 如果距離上次按鍵時間間隔過長，重新開始掃描
            if (currentTime - lastKeyTime > debounceTime) {
                scanBuffer = ''
                isScanning.value = true
            }

            // 添加字符到緩衝區
            scanBuffer += event.key
            lastKeyTime = currentTime

            // 檢查長度限制
            if (scanBuffer.length > maxScanLength) {
                resetScan()
                return
            }

            // 設置超時，如果在指定時間內沒有新的輸入，則處理掃描結果
            if (scanTimeout) {
                clearTimeout(scanTimeout)
            }

            scanTimeout = setTimeout(() => {
                if (autoSubmit) {
                    processScanResult()
                }
            }, debounceTime)
        }
    }

    /**
     * 處理掃描結果
     */
    const processScanResult = () => {
        if (scanBuffer.trim().length === 0) {
            resetScan()
            return
        }

        const code = scanBuffer.trim()

        // 更新響應式數據
        scannedCode.value = code
        scanHistory.value.unshift(code)

        // 限制歷史記錄數量
        if (scanHistory.value.length > 50) {
            scanHistory.value = scanHistory.value.slice(0, 50)
        }

        console.log('掃碼槍掃描成功:', code)

        // 執行回調
        if (enableScanCallback && scanCallback) {
            try {
                scanCallback(code)
            } catch (error) {
                console.error('掃描回調執行錯誤:', error)
            }
        }

        resetScan()
    }

    /**
     * 重置掃描狀態
     */
    const resetScan = () => {
        scanBuffer = ''
        isScanning.value = false
        if (scanTimeout) {
            clearTimeout(scanTimeout)
            scanTimeout = null
        }
    }

    /**
     * 開始監聽掃描
     */
    const startScan = () => {
        if (isListening) return

        isListening = true
        resetScan()
        document.addEventListener('keydown', handleKeydown, true)

        console.log('掃碼槍監聽已啟動')
    }

    /**
     * 停止監聽掃描
     */
    const stopScan = () => {
        if (!isListening) return

        isListening = false
        resetScan()
        document.removeEventListener('keydown', handleKeydown, true)

        console.log('掃碼槍監聽已停止')
    }

    /**
     * 清除當前代碼
     */
    const clearCode = () => {
        scannedCode.value = ''
        resetScan()
    }

    /**
     * 設置掃描成功回調函數
     */
    const setScanCallback = (callback: (code: string) => void) => {
        scanCallback = callback
    }

    // 組件掛載時自動開始監聽
    onMounted(() => {
        if (enableScanCallback) {
            startScan()
        }
    })

    // 組件卸載時自動停止監聽
    onUnmounted(() => {
        stopScan()
    })

    return {
        scannedCode,
        isScanning,
        scanHistory,
        startScan,
        stopScan,
        clearCode,
        setScanCallback
    }
}

/**
 * 簡化版掃碼槍組合函數
 * 適用於只需要基本掃描功能的場景
 * 
 * @param callback 掃描成功回調函數
 * @returns 簡化的掃碼槍接口
 */
export const useSimpleBarcodeGun = (callback: (code: string) => void) => {
    const { startScan, stopScan, isScanning, scannedCode, setScanCallback } = useBarcodeGun({
        enableScanCallback: true,
        debounceTime: 50,
        autoSubmit: true
    })

    // 設置回調
    setScanCallback(callback)

    return {
        startScan,
        stopScan,
        isScanning,
        scannedCode
    }
}