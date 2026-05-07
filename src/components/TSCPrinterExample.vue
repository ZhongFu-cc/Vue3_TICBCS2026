<template>
    <div class="tsc-printer-example">
        <h2>TSC 印表機控制範例</h2>

        <!-- 連接狀態 -->
        <div class="status-section">
            <p>連接狀態: {{ isConnected ? '已連接' : '未連接' }}</p>
            <p v-if="isLoading">載入中...</p>
            <p v-if="error" class="error">錯誤: {{ error }}</p>
        </div>

        <!-- 連接方式選擇 -->
        <div class="connection-section">
            <h3>連接方式</h3>
            <div>
                <input type="radio" id="usb" value="usb" :checked="connectionType === 'usb'"
                    @change="setConnectionType('usb')" />
                <label for="usb">USB</label>
            </div>
            <div>
                <input type="radio" id="network" value="network" :checked="connectionType === 'network'"
                    @change="setConnectionType('network')" />
                <label for="network">網路</label>
            </div>
            <div>
                <input type="radio" id="driver" value="driver" :checked="connectionType === 'driver'"
                    @change="setConnectionType('driver')" />
                <label for="driver">驅動</label>
            </div>
        </div>

        <!-- USB 印表機選擇 -->
        <div v-if="connectionType === 'usb'" class="printer-section">
            <h4>USB 印表機</h4>
            <select v-model="selectedPrinter">
                <option :value="null">請選擇印表機</option>
                <option v-for="printer in usbPrinters" :key="printer.path" :value="printer">
                    {{ printer.name }}
                </option>
            </select>
        </div>

        <!-- 網路配置 -->
        <div v-if="connectionType === 'network'" class="network-section">
            <h4>網路設定</h4>
            <div>
                <label>IP 位址:</label>
                <input type="text" v-model="networkIP" placeholder="192.168.1.100" @input="updateNetworkConfig" />
            </div>
            <div>
                <label>端口號:</label>
                <input type="text" v-model="networkPort" placeholder="9100" @input="updateNetworkConfig" />
            </div>
        </div>

        <!-- 驅動印表機選擇 -->
        <div v-if="connectionType === 'driver'" class="printer-section">
            <h4>驅動印表機</h4>
            <select v-model="selectedPrinter">
                <option :value="null">請選擇印表機</option>
                <option v-for="printer in driverPrinters" :key="printer.path" :value="printer">
                    {{ printer.name }}
                </option>
            </select>
        </div>

        <!-- 標籤配置 -->
        <div class="label-config-section">
            <h3>標籤設定</h3>
            <div class="config-row">
                <label>寬度 (mm):</label>
                <input type="number" v-model="labelWidth" @input="updateLabelConfig" />
            </div>
            <div class="config-row">
                <label>高度 (mm):</label>
                <input type="number" v-model="labelHeight" @input="updateLabelConfig" />
            </div>
            <div class="config-row">
                <label>左邊距 (mm):</label>
                <input type="number" step="0.1" v-model="labelMarginLeft" @input="updateLabelConfig" />
            </div>
            <div class="config-row">
                <label>右邊距 (mm):</label>
                <input type="number" step="0.1" v-model="labelMarginRight" @input="updateLabelConfig" />
            </div>
        </div>

        <!-- 列印內容 -->
        <div class="print-section">
            <h3>列印設定</h3>
            <div class="print-form">
                <div>
                    <label>列印文字:</label>
                    <input type="text" v-model="printText" placeholder="請輸入要列印的文字" />
                </div>
                <div>
                    <label>字體大小:</label>
                    <input type="number" v-model="fontSize" min="10" max="400" />
                </div>
                <div>
                    <label>旋轉角度:</label>
                    <select v-model="rotation">
                        <option value="0">0°</option>
                        <option value="90">90°</option>
                        <option value="180">180°</option>
                        <option value="270">270°</option>
                    </select>
                </div>
                <div>
                    <label>字體樣式:</label>
                    <select v-model="fontStyle">
                        <option value="0">一般</option>
                        <option value="1">斜體</option>
                        <option value="2">粗體</option>
                        <option value="3">粗斜體</option>
                    </select>
                </div>
                <div>
                    <label>底線:</label>
                    <select v-model="fontUnderline">
                        <option value="0">無底線</option>
                        <option value="1">有底線</option>
                    </select>
                </div>
                <div>
                    <label>字體:</label>
                    <input type="text" v-model="fontFamily" placeholder="Arial" />
                </div>
                <div>
                    <label>列印份數:</label>
                    <input type="number" v-model="copies" min="1" max="100" />
                </div>
            </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="action-section">
            <button @click="handlePrint" :disabled="isLoading || !printText" class="primary-button">
                列印標籤
            </button>
            <button @click="handleSelfTest" :disabled="isLoading" class="secondary-button">
                印表機自檢
            </button>
            <button @click="handleGetStatus" :disabled="isLoading" class="secondary-button">
                查詢狀態
            </button>
            <button @click="refreshPrinters" :disabled="isLoading" class="secondary-button">
                重新整理印表機
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTSC, type PrintData, type PrinterConnectionType } from '@/composables/useTSC'
import type { Rotation, FontStyle, FontUnderline } from '@/utils/TSC'

// 使用 TSC composable
const {
    isConnected,
    isLoading,
    error,
    connectionType,
    networkConfig,
    labelConfig,
    usbPrinters,
    driverPrinters,
    selectedPrinter,
    setConnectionType,
    setNetworkConfig,
    setLabelConfig,
    printLabel,
    runSelfTest,
    getPrinterStatus,
    initializePrinters
} = useTSC()


// 表單狀態 - 與 composable 狀態同步
const networkIP = ref('')
const networkPort = ref('')
const labelWidth = ref(80)
const labelHeight = ref(60)
const labelMarginLeft = ref(1.5)
const labelMarginRight = ref(1.5)

// 監聽 composable 的網路配置變化，同步到本地狀態
watch(networkConfig, (newConfig) => {
    networkIP.value = newConfig.ip
    networkPort.value = newConfig.port
}, { immediate: true })

// 監聽 composable 的標籤配置變化，同步到本地狀態
watch(labelConfig, (newConfig) => {
    labelWidth.value = newConfig.widthMm
    labelHeight.value = newConfig.heightMm
    labelMarginLeft.value = newConfig.marginLeftMm
    labelMarginRight.value = newConfig.marginRightMm
}, { immediate: true })

// 列印設定
const printText = ref('測試列印文字')
const fontSize = ref(150)
const rotation = ref<Rotation>('0')
const fontStyle = ref<FontStyle>('0')
const fontUnderline = ref<FontUnderline>('0')
const fontFamily = ref('Arial')
const copies = ref(1)

// 更新網路配置
const updateNetworkConfig = () => {
    setNetworkConfig({
        ip: networkIP.value,
        port: networkPort.value
    })
}

// 更新標籤配置
const updateLabelConfig = () => {
    setLabelConfig({
        widthMm: labelWidth.value,
        heightMm: labelHeight.value,
        marginLeftMm: labelMarginLeft.value,
        marginRightMm: labelMarginRight.value
    })
}

// 列印處理
const handlePrint = async () => {
    const printData: PrintData = {
        text: printText.value,
        fontSize: fontSize.value,
        rotation: rotation.value,
        fontStyle: fontStyle.value,
        fontUnderline: fontUnderline.value,
        fontFamily: fontFamily.value
    }

    const success = await printLabel(printData, copies.value)
    if (success) {
        alert('列印成功！')
    }
}

// 自檢處理
const handleSelfTest = async () => {
    const success = await runSelfTest()
    if (success) {
        alert('自檢完成！')
    }
}

// 狀態查詢處理
const handleGetStatus = async () => {
    const status = await getPrinterStatus()
    console.log('印表機狀態:', status)
    if (status) {
        let message = 'TSC 印表機狀態資訊：\n'
        if (status.status) message += `狀態: ${status.status}\n`
        if (status.name) message += `名稱: ${status.name}\n`
        if (status.serial) message += `序號: ${status.serial}\n`
        if (status.version) message += `版本: ${status.version}\n`
        if (status === 'Ready') {
            isConnected.value = true
        }
        alert(message)
    }
}

// 重新整理印表機列表
const refreshPrinters = () => {
    initializePrinters()
}
</script>

<style scoped>
.tsc-printer-example {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.status-section {
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
    margin-bottom: 20px;
}

.connection-section,
.printer-section,
.network-section,
.label-config-section,
.print-section {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 5px;
}

.config-row,
.print-form>div {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.config-row label,
.print-form>div label {
    width: 120px;
    margin-right: 10px;
}

input[type="text"],
input[type="number"],
select {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.action-section {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.primary-button,
.secondary-button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
}

.primary-button {
    background-color: #007bff;
    color: white;
}

.secondary-button {
    background-color: #6c757d;
    color: white;
}

.primary-button:hover,
.secondary-button:hover {
    opacity: 0.9;
}

.primary-button:disabled,
.secondary-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.error {
    color: #dc3545;
    font-weight: bold;
}

h2,
h3,
h4 {
    margin-top: 0;
    margin-bottom: 15px;
}
</style>