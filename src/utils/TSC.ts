/**
 * TSC Label Printer Command Library
 * TypeScript version for Vue 3
 */

// ====================================================
// Types
// ====================================================

export type BarcodeType =
  | '128' | '128M' | 'EAN128'
  | '25' | '25C' | '39' | '39C' | '93'
  | 'EAN13' | 'EAN13+2' | 'EAN13+5'
  | 'EAN8' | 'EAN8+2' | 'EAN8+5'
  | 'CODA' | 'POST'
  | 'UPCA' | 'UPCA+2' | 'UPCA+5'
  | 'UPCE' | 'UPCE+2' | 'UPCE+5'
  | 'CPOST' | 'MSI' | 'MSIC' | 'PLESSEY'
  | 'ITF14' | 'EAN14' | '11'
  | 'TELEPEN' | 'TELEPENN' | 'PLANET'
  | 'CODE49' | 'DPI' | 'DPL';

export type Rotation = '0' | '90' | '180' | '270';
export type BarcodeReadable = '0' | '1' | '2' | '3';
export type FontStyle = '0' | '1' | '2' | '3';
export type FontUnderline = '0' | '1';
export type SensorType = '0' | '1'; // '0':GAP, '1':BLINE

export type TSCCommand =
  | { openport_usb: string }
  | { openport_net: string }
  | { openport_driver: string }
  | { closeport: string }
  | { clearbuffer: string }
  | { setup: string }
  | { barcode: string }
  | { printerfont: string }
  | { sendcommand: string }
  | { sendcommand_crlf: string }
  | { printlabel: string }
  | { downloadpcx: string }
  | { formfeed: string }
  | { nobackfeed: string }
  | { windowsfont: string }
  | { sendUint8Array: string }
  | { printerstatus: string }
  | { printername: string }
  | { printerserial: string };

// ====================================================
// Base64 utility — 使用瀏覽器原生 btoa()
// ====================================================

/**
 * Uint8Array → Base64
 *
 * 原版 base64.js 在有 btoa 的瀏覽器環境走的也是同一條路：
 *   Uint8Array → binary string (分批避免 call stack overflow) → btoa()
 * 這裡完全複製相同策略，行為與原版一致。
 */
function uint8ArrayToBase64(u8a: Uint8Array): string {
  // 分批處理，每次 4096 bytes，與原版 base64.js CHUNK 大小一致
  // 避免超大陣列用 spread 展開時造成 Maximum call stack size exceeded
  const CHUNK = 0x1000;
  let binaryStr = '';
  for (let i = 0; i < u8a.length; i += CHUNK) {
    binaryStr += String.fromCharCode(...Array.from(u8a.subarray(i, i + CHUNK)));
  }
  return btoa(binaryStr);
}

// ====================================================
// TSC Printer Class
// ====================================================

export class TSCPrinter {
  private functionsInOrder: TSCCommand[] = [];

  // --------------------------------------------------
  // 清空数据
  // --------------------------------------------------
  init(): void {
    this.functionsInOrder = [];
  }

  // --------------------------------------------------
  // 取得所有指令 (用來賦值給 obj.functions_inorder)
  // --------------------------------------------------
  getCommands(): TSCCommand[] {
    return this.functionsInOrder;
  }

  // --------------------------------------------------
  // 连接打印机 USB
  // @param usbPrinter USB路徑，空字串則自動連接第一台
  // --------------------------------------------------
  openport_usb(usbPrinter: string): void {
    this.functionsInOrder.push({ openport_usb: usbPrinter });
  }

  // --------------------------------------------------
  // 连接打印机网络
  // @param ip    打印机IP地址
  // @param port  打印机网络端口
  // --------------------------------------------------
  openport_net(ip: string, port: string | number): void {
    this.functionsInOrder.push({ openport_net: `${ip},${port}` });
  }

  // --------------------------------------------------
  // 连接打印机 Driver
  // @param driverName driver名稱
  // --------------------------------------------------
  openport_driver(driverName: string): void {
    this.functionsInOrder.push({ openport_driver: driverName });
  }

  // --------------------------------------------------
  // 中断打印机连线
  // --------------------------------------------------
  closeport(): void {
    this.functionsInOrder.push({ closeport: '' });
  }

  // --------------------------------------------------
  // 清除打印机 Buffer
  // --------------------------------------------------
  clearbuffer(): void {
    this.functionsInOrder.push({ clearbuffer: '' });
  }

  // --------------------------------------------------
  // 设定标签资讯
  // @param width_mm    标签宽度(mm)
  // @param height_mm   标签高度(mm)
  // @param speed       打印速度
  // @param density     打印浓度
  // @param sensor      標籤種類 '0':GAP / '1':BLINE
  // @param gap_height  间隙高度(mm)
  // @param gap_offset  间隙偏移(mm)
  // --------------------------------------------------
  setup(
    width_mm: string | number,
    height_mm: string | number,
    speed: string | number,
    density: string | number,
    sensor: SensorType,
    gap_height: string | number,
    gap_offset: string | number,
  ): void {
    this.functionsInOrder.push({
      setup: `${width_mm},${height_mm},${speed},${density},${sensor},${gap_height},${gap_offset}`,
    });
  }

  // --------------------------------------------------
  // 打印条码
  // @param x         x轴座标(dot)
  // @param y         y轴座标(dot)
  // @param type      条码类型
  // @param height    条码高度
  // @param readable  可读性 '0':无 '1':左 '2':中 '3':右
  // @param rotation  旋转 '0'/'90'/'180'/'270'
  // @param narrow    窄元件宽度
  // @param wide      宽元件宽度
  // @param code      条码内容
  // --------------------------------------------------
  barcode(
    x: string | number,
    y: string | number,
    type: BarcodeType,
    height: string | number,
    readable: BarcodeReadable,
    rotation: Rotation,
    narrow: string | number,
    wide: string | number,
    code: string,
  ): void {
    const codeStr =
      code.charAt(0) === '@'
        ? code
        : `"${code}"`;
    this.functionsInOrder.push({
      barcode: `${x},${y},"${type}",${height},${readable},${rotation},${narrow},${wide},${codeStr}`,
    });
  }

  // --------------------------------------------------
  // 打印文字 (内建字型)
  // @param x        x轴座标(dot)
  // @param y        y轴座标(dot)
  // @param fonttype 内建字型名称 或 下载字型名称
  // @param rotation 旋转
  // @param xmul     x轴放大率
  // @param ymul     y轴放大率
  // @param text     打印文字
  // --------------------------------------------------
  printerfont(
    x: string | number,
    y: string | number,
    fonttype: string,
    rotation: Rotation,
    xmul: string | number,
    ymul: string | number,
    text: string,
  ): void {
    const textStr = text.charAt(0) === '@' ? text : `"${text}"`;
    this.functionsInOrder.push({
      printerfont: `${x},${y},"${fonttype}",${rotation},${xmul},${ymul},${textStr}`,
    });
  }

  // --------------------------------------------------
  // 发送指令到打印机
  // --------------------------------------------------
  sendcommand(cmd: string): void {
    this.functionsInOrder.push({ sendcommand: cmd });
  }

  // --------------------------------------------------
  // 发送指令到打印机（加上換行 \r\n）
  // --------------------------------------------------
  sendcommand_crlf(cmd: string): void {
    this.functionsInOrder.push({ sendcommand_crlf: cmd });
  }

  // --------------------------------------------------
  // 打印标签
  // @param sets    份数
  // @param copies  张数
  // --------------------------------------------------
  printlabel(sets: string | number, copies: string | number): void {
    this.functionsInOrder.push({ printlabel: `${sets},${copies}` });
  }

  // --------------------------------------------------
  // 下载 PCX
  // @param file_path   档案路径
  // @param image_name  保存名称
  // --------------------------------------------------
  downloadpcx(file_path: string, image_name: string): void {
    this.functionsInOrder.push({ downloadpcx: `${file_path},${image_name}` });
  }

  // --------------------------------------------------
  // 跳过下一张标签
  // --------------------------------------------------
  formfeed(): void {
    this.functionsInOrder.push({ formfeed: '' });
  }

  // --------------------------------------------------
  // 关闭 backfeed 功能
  // --------------------------------------------------
  nobackfeed(): void {
    this.functionsInOrder.push({ nobackfeed: '' });
  }

  // --------------------------------------------------
  // 打印文字 (Windows 字型)
  // @param x              x轴座标(dot)
  // @param y              y轴座标(dot)
  // @param fontheight     文字大小
  // @param rotation       旋转
  // @param fontstyle      文字樣式 '0':无 '1':斜体 '2':粗体 '3':斜体+粗体
  // @param fontunderline  文字底線 '0':无 '1':底线
  // @param szFaceName     字型名称 (例: "Arial")
  // @param text           打印文字
  // --------------------------------------------------
  windowsfont(
    x: string | number,
    y: string | number,
    fontheight: string | number,
    rotation: Rotation,
    fontstyle: FontStyle,
    fontunderline: FontUnderline,
    szFaceName: string,
    text: string,
  ): void {
    this.functionsInOrder.push({
      windowsfont: `${x},${y},${fontheight},${rotation},${fontstyle},${fontunderline},${szFaceName},${text}`,
    });
  }

  // --------------------------------------------------
  // 发送位元组数据到打印机
  // --------------------------------------------------
  sendUint8Array(uint8_arr: Uint8Array): void {
    this.functionsInOrder.push({ sendUint8Array: uint8ArrayToBase64(uint8_arr) });
  }

  // --------------------------------------------------
  // 返回打印机状态
  // --------------------------------------------------
  printerstatus(): void {
    this.functionsInOrder.push({ printerstatus: '' });
  }

  // --------------------------------------------------
  // 返回打印机名称
  // --------------------------------------------------
  printername(): void {
    this.functionsInOrder.push({ printername: '' });
  }

  // --------------------------------------------------
  // 返回打印机序号
  // --------------------------------------------------
  printerserial(): void {
    this.functionsInOrder.push({ printerserial: '' });
  }
}

// ====================================================
// 預設匯出單例（向下相容舊 script 寫法）
// 若需要多台印表機同時操作，請自行 new TSCPrinter()
// ====================================================
export const tsc = new TSCPrinter();
