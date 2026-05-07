<!--  -->
<template>
  <div class="content">
    <BasicComponent title="與會者管理" :totalCount="attendeeList.total + ' 人'">

      <template #option-box>
        <div class="btn-box">
          <el-button type="danger" @click="deleteAttendeeList" :disabled="selectList.length > 0 ? false : true">
            批量刪除<el-icon class="el-icon--right">
              <Delete />
            </el-icon>
          </el-button>

          <el-button type="success" @click="importExcelDialogState.openDialog()">
            Excel批量更新
          </el-button>

          <el-button type="success" @click="downloadExcel">
            下載Excel
          </el-button>
        </div>
      </template>

      <template #search-box>
        <el-input v-model="input" style="width: 240px" placeholder="輸入內容,Enter查詢" @input="getAttendeeList()" />
      </template>

      <template #data-table>
        <el-table class="news-table" :data="attendeeList.records" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column fixed prop="firstName" label="名字" width="90">
            <template #default="scope">
              {{ scope.row.member.firstName }}
            </template>
          </el-table-column>
          <el-table-column fixed prop="lastName" label="姓氏" width="90">
            <template #default="scope">
              {{ scope.row.member.lastName }}
            </template>
          </el-table-column>

          <el-table-column fixed prop="idCard" label="身分證" width="190">
            <template #default="scope">
              {{ scope.row.member.idCard }}
            </template>
          </el-table-column>
          <el-table-column fixed prop="lastName" label="飲食偏好" width="100">
            <template #default="scope">
              {{ scope.row.member.food }}
            </template>
          </el-table-column>

          <el-table-column prop="email" label="信箱">
            <template #default="scope">
              {{ scope.row.member.email }}
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="手機" width="140">
            <template #default="scope">
              {{ scope.row.member.phone }}
            </template>
          </el-table-column>
          <el-table-column prop="tagList" label="標籤" min-width="40" align="center">
            <template #default="scope">
              <el-popover v-if="scope.row.tagList.length > 0" placement="left-start" title="標籤" :width="200"
                trigger="hover">
                <template #reference>
                  <el-tag v-if="findFirstVaildTag(scope.row.tagList)" size="large" round
                    :color="findFirstVaildTag(scope.row.tagList).color" effect="light">{{
                      findFirstVaildTag(scope.row.tagList).name }}</el-tag>
                </template>
                <template #default>
                  <div class="tag-popover-box">
                    <div v-for="tag in scope.row.tagList" :key="tag.tagId" class="tag-item">
                      <el-tag v-if="tag.status === 0" size="large" round :color="tag.color">{{
                        tag.name }}</el-tag>
                    </div>
                  </div>
                </template>
              </el-popover>

            </template>
          </el-table-column>

          <el-table-column label="操作" width="150" align="center">
            <template #default="scope">
              <el-button link type="danger" @click="deleteAttendee(scope.row.attendeesId)">Delete</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template #pagination-box>
        <el-pagination layout="prev, pager, next" :page-count="Number(attendeeList.pages)"
          :default-page-size="Number(attendeeList.size)" v-model:current-page="currentPage"
          :hide-on-single-page="true" />
      </template>
    </BasicComponent>
  </div>

  <!-- Excel批量更新對話框 -->
  <el-dialog v-model="importExcelDialogState.isOpen" title="匯入 Excel 檔案">
    <div class="template-tips-content">
      <ul class="step-list" style="list-style-type: decimal;">
        <li>匯入與會者excel進行更新</li>
        <li>注意事項:
          <ul class="sub-list">
            <li>只允許「收據編號」欄位更新，其餘欄位無效</li>
          </ul>
        </li>
      </ul>
    </div>
    <div class="upload-excel-content">
      <el-upload ref="uploadRef" drag class="upload-demo" :limit="1" :on-change="handleUpload" :auto-upload="false"
        :on-remove="handleRemove">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          Drop file here or <em>click to upload</em>
        </div>
      </el-upload>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button type="danger" plain @click="importExcelDialogState.closeDialog()">取消</el-button>
      <el-button type="success" plain @click="handleImportExcel">確定</el-button>
    </span>
  </el-dialog>

  <el-dialog v-model="importExcelResultDialogState.isOpen" title="匯入結果" width="30%">
    <div v-if="importExcelResultDialogState.resultData">
      <p>總共 {{ importExcelResultDialogState.resultData.totalCount }} 條數據</p>
      <p>成功 {{ importExcelResultDialogState.resultData.successCount }} 條</p>
      <p>失敗 {{ importExcelResultDialogState.resultData.failCount }} 條</p>
      <div v-if="importExcelResultDialogState.resultData.failCount > 0">
        <h3>失敗詳情：</h3>
        <ul>
          <li v-for="(fail, index) in importExcelResultDialogState.resultData.failList" :key="index">
            行 {{ fail.rows }}: {{ fail.message }}
          </li>
        </ul>
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button type="primary" plain @click="importExcelResultDialogState.closeDialog()">確定</el-button>
    </span>

  </el-dialog>


</template>

<script setup lang='ts'>

import BasicComponent from '@/layout/components/Basic/index.vue'

import { ref, reactive } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadProps, UploadUserFile } from 'element-plus'

import { updateOrdersApi } from '@/api/order'
import { batchDeleteAttendeesApi, deleteAttendeeApi, downloadAttendeeExcelApi, getAttendeeListByTagAndPaginationApi, importExcelApi } from '@/api/attendees'


//獲取路由
const route = useRoute()
//獲取路由器
const router = useRouter()
//formLabel 寬度
const formLabelWidth = '140px'


/**--------------顯示數據相關---------------------------- */

//設定分頁組件,currentPage當前頁數
let currentPage = ref(1)

//獲取未審核的同意書
let memberCount = ref(0)

//查詢內容
let input = ref('')





//監聽當前頁數的變化,如果有更動就call API 獲取數組數據
watch(currentPage, (value, oldValue) => {
  getAttendeeList()
})

/** --------- 審核通過/駁回 相關variable及function -------------- */

//勾選的對象列表
let selectList = reactive<Record<string, any>[]>([])

//當checkbox狀態改變時的function,val是一個數組對象
const handleSelectionChange = (val: any) => {
  //重製selectList,移除所有屬性
  selectList.length = 0
  Object.assign(selectList, val)
}




/**------------編輯內容相關操作---------------------- */

let updateMemberRegistrationFeeOrder = reactive<Record<string, any>>({

})

const attendeeList = reactive<any>([])

const getAttendeeList = async () => {
  let res = await getAttendeeListByTagAndPaginationApi(currentPage.value, input.value)
  Object.assign(attendeeList, res.data)
}

const findFirstVaildTag = (tagList: any) => {
  for (let i = 0; i < tagList.length; i++) {
    if (tagList[i].status === 0) {
      return tagList[i];
    }
  }
  return '';
}
/**------------------刪除資料---------------------- */
const deleteAttendee = async (attendeesId: number) => {
  try {
    await ElMessageBox.confirm('確定要刪除這個與會者嗎?', '提示', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteAttendeeApi(attendeesId)
    getAttendeeList()
    ElMessage.success('刪除成功')
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消刪除')
      return
    }
    console.error("刪除與會者失敗: ", error)
    ElMessage.error('刪除失敗')
    return
  }
}

// 批量刪除
const deleteAttendeeList = async () => {
  selectList = selectList.map((item: any) => item.attendeesId)
  try {
    await ElMessageBox.confirm('確定要批量刪除這些與會者嗎?', '提示', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await batchDeleteAttendeesApi(selectList)
    getAttendeeList()
    ElMessage.success('批量刪除成功')
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消批量刪除')
      return
    }
    console.error("批量刪除與會者失敗: ", error)
    ElMessage.error('批量刪除失敗')
    return
  }
}

/**------------------刪除資料---------------------- */
const downloadExcel = async () => {
  try {
    let res = await downloadAttendeeExcelApi()
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '與會者列表.xlsx');
    document.body.appendChild(link);
    link.click();
  } catch (error) {
    ElMessage.error("下載失敗" + error)
  }
}

/**------------------- Excel 批量更新 ----------------------- */
const importExcelDialogState = ref({
  isOpen: false,
  openDialog: () => {
    importExcelDialogState.value.isOpen = true;
  },
  closeDialog: () => {
    importExcelDialogState.value.isOpen = false;
  }
})


interface ImportResult {
  failCount: number;
  failList: Array<{ rows: number, message: string }>;
  successCount: number;
  totalCount: number;
}

const importExcelResultDialogState = ref({
  isOpen: false,
  resultData: null as ImportResult | null,
  openDialog: (data: any) => {
    console.log('Import result data:', data);
    importExcelResultDialogState.value.resultData = data;
    importExcelResultDialogState.value.isOpen = true;
  },
  closeDialog: () => {
    importExcelResultDialogState.value.isOpen = false;
    importExcelResultDialogState.value.resultData = null;
    getAttendeeList();
    importExcelDialogState.value.closeDialog();

  }
})

const uploadRef = ref();
const uploadFileList = ref<any>([]);
const handleUpload: UploadProps['onChange'] = (file: UploadUserFile, uploadFiles) => {
  if (file.size == 0) {
    ElMessage.error('File is empty');
    return false;
  }

  if (file.status === 'ready' && file.size) {
    if (file.name.split('.').pop() !== 'xlsx' && file.name.split('.').pop() !== 'xls') {
      ElMessage.error('File must be xlsx');
      uploadFiles.pop();
      return;
    }
    uploadFileList.value.push(file);
  }
}

const handleRemove: UploadProps['onRemove'] = (file, fileList) => {
  uploadFileList.value = fileList;
}



const handleImportExcel = async () => {
  try {
    const data = new FormData();
    uploadFileList.value.forEach((file: any) => {
      data.append('file', file.raw);
    });
    let res = await importExcelApi(data);
    ElMessage.success("上傳成功");
    importExcelResultDialogState.value.openDialog(res.data);
    // getPaperList();
    // importExcelDialogState.value.closeDialog();
    // 清空組件內的文件列表
    uploadRef.value?.clearFiles();
    // 清空實際儲存的文件列表
    uploadFileList.value = [];
    console.log(res);
  } catch (error) {
    console.log(error);
    ElMessage.error("上傳失敗" + error)
  }
}





/**-------------------掛載頁面時執行-------------------- */

onMounted(() => {

  getAttendeeList()
})




</script>

<style scoped lang="scss">
.member-section {
  width: 95%;
  margin: 0 auto;

  .member-card {
    margin-top: 2%;
    margin-bottom: 2%;
  }

  h1 {
    text-align: center;
    font-size: 2rem;
    margin: 1% 0;
  }
}




.function-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: right;
  margin-bottom: 1%;


  .display-count {
    margin-left: 1%;
  }

}

.search-bar {
  margin-left: 1%;
}

.news-table {
  width: 100%;
  height: auto;
}


.news-pagination {
  margin-top: 1%;
  margin-bottom: 1%;
}

/**
  使用Vue3 element plus 專屬的改變UI組件CSS 寫法 '深層覆蓋'
  分頁組件引入盒子,重置分頁組件CSS */
:deep(.el-pagination) {

  justify-content: center;

  //重製將分頁組件背景色調為 '無'
  .el-pager li {
    background: none !important;
  }

  //按鈕背景色改成 '無'
  button {
    background: none !important;
  }

  &+& {
    margin-top: 10px;
  }

  .example-demonstration {
    margin-bottom: 16px;
  }

}

:deep(.el-tag__content) {
  color: white;
  font-size: 14px;
}

// 設置 table 內的標籤顯示為可滑動區塊
.tag-popover-box {
  overflow: scroll !important;
}
</style>
