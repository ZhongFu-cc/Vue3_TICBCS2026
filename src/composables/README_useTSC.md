# TSC 印表機通用組合式函數 (useTSC)

這是一個重構過的 Vue 3 組合式函數，用於控制 TSC 標籤印表機。原始檔案已經從硬編碼的 DOM 操作重構為一個靈活、可重用的 composable。

## 主要改進

### ✅ 已修正的問題
- ❌ 移除了所有 `document.getElementById` 的 DOM 操作
- ❌ 移除了 `window.onload` 全域事件處理
- ❌ 移除了硬編碼的設定값
- ❌ 移除了 `alert()` 彈窗，改為響應式錯誤狀態

### ✅ 新增的改進
- ✅ Vue 3 響應式系統 (ref, computed, readonly)
- ✅ TypeScript 類型支援
- ✅ 可配置的印表機設定
- ✅ Promise-based 非同步操作
- ✅ 完整的錯誤處理
- ✅ 組件化的設計模式

## 類型定義

```typescript
interface PrinterConfiguration {
  connectionType: PrinterConnectionType
  serverUrl?: string
  networkConfig?: NetworkConfig
  labelConfig?: LabelConfiguration
}

interface PrintData {
  text: string
  x?: number | string
  y?: number | string
  fontSize?: number
  rotation?: string
  fontStyle?: string
  fontFamily?: string
}

type PrinterConnectionType = 'usb' | 'network' | 'driver'
```

## 基本用法

### 1. 在組件中導入

```vue
<script setup lang="ts">
import { useTSC, type PrintData } from '@/composables/useTSC'

// 基本初始化
const {
  isConnected,
  isLoading,
  error,
  usbPrinters,
  driverPrinters,
  selectedPrinter,
  setConnectionType,
  setNetworkConfig,
  printLabel,
  runSelfTest,
  getPrinterStatus
} = useTSC()
</script>
```

### 2. 自定義配置初始化

```typescript
const tscConfig = {
  connectionType: 'network' as const,
  serverUrl: 'ws://localhost:8888',
  networkConfig: {
    ip: '192.168.1.100',
    port: '9100'
  },
  labelConfig: {
    widthMm: 105,
    heightMm: 148,
    marginLeftMm: 2,
    marginRightMm: 2
  }
}

const {
  // ... 解構你需要的方法和狀態
} = useTSC(tscConfig)
```

## 主要方法

### 列印標籤
```typescript
const printData: PrintData = {
  text: '測試列印',
  fontSize: 150,
  rotation: '180',
  fontStyle: '2', // 粗體
  fontFamily: 'Arial'
}

const success = await printLabel(printData, 2) // 列印 2 份
if (success) {
  console.log('列印成功！')
}
```

### 印表機自檢
```typescript
const success = await runSelfTest()
if (success) {
  console.log('自檢完成！')
}
```

### 查詢印表機狀態
```typescript
const status = await getPrinterStatus()
if (status) {
  console.log('印表機狀態:', status)
  // status 可能包含: { status, name, serial, version }
}
```

### 設定連接方式
```typescript
// 設定為 USB 連接
setConnectionType('usb')

// 設定網路連接
setConnectionType('network')
setNetworkConfig({
  ip: '192.168.1.100',
  port: '9100'
})

// 設定驅動連接
setConnectionType('driver')
```

## 響應式狀態

### 連接狀態
```vue
<template>
  <div>
    <p>連接狀態: {{ isConnected ? '已連接' : '未連接' }}</p>
    <p v-if="isLoading">處理中...</p>
    <p v-if="error" class="error">錯誤: {{ error }}</p>
  </div>
</template>
```

### 印表機列表
```vue
<template>
  <select v-model="selectedPrinter">
    <option :value="null">請選擇印表機</option>
    <option
      v-for="printer in usbPrinters"
      :key="printer.path"
      :value="printer"
    >
      {{ printer.name }}
    </option>
  </select>
</template>
```

## 標籤配置

### 動態更新標籤設定
```typescript
// 更新標籤尺寸
setLabelConfig({
  widthMm: 80,
  heightMm: 60,
  marginLeftMm: 1.5,
  marginRightMm: 1.5
})

// 取得計算後的點數設定 (readonly)
console.log('標籤寬度 (dots):', labelConfigDots.value.widthDots)
console.log('可列印寬度 (dots):', labelConfigDots.value.printableWidthDots)
```

## 錯誤處理

所有非同步操作都會自動更新 `error` 狀態，你可以在組件中監聽：

```vue
<script setup lang="ts">
import { watch } from 'vue'

const { error } = useTSC()

watch(error, (newError) => {
  if (newError) {
    console.error('印表機錯誤:', newError)
    // 顯示錯誤訊息給用戶
  }
})
</script>
```

## 完整範例

請參考 `src/components/TSCPrinterExample.vue` 以獲得完整的使用範例，包含：

- 連接方式選擇 UI
- 印表機列表顯示
- 網路設定表單
- 標籤配置設定
- 列印參數設定
- 錯誤狀態顯示

## 注意事項

1. **TSC PrintServer**: 確保 TSC PrintServer 在 `ws://127.0.0.1:8888` 運行
2. **網路設定**: 網路印表機需要正確的 IP 和端口配置
3. **字體**: 確保指定的字體在系統中可用
4. **權限**: USB 和驅動連接可能需要管理員權限

## 遷移指南

如果你之前使用舊版的 TSC 代碼，請參考以下遷移步驟：

### 替換全域變數
```typescript
// ❌ 舊寫法
var usb_check = document.getElementById("usb_check")
var net_ip = document.getElementById("net_ip")

// ✅ 新寫法
const { connectionType, networkConfig } = useTSC()
```

### 替換硬編碼配置
```typescript
// ❌ 舊寫法
const LABEL_CONFIG = {
  WIDTH_MM: 80,
  HEIGHT_MM: 60,
  // ...
}

// ✅ 新寫法
setLabelConfig({
  widthMm: 80,
  heightMm: 60
})
```

### 替換直接函數調用
```typescript
// ❌ 舊寫法
printTemplate_Onclick()

// ✅ 新寫法
const printData = { text: '列印內容', fontSize: 150 }
await printLabel(printData)
```