<template>
  <section class="abstract-section">
    <el-card class="abstract-card">
      <h1>稿件列表</h1>

      <div class="function-bar">
        <div class="display-count">
          <div>當前查詢數量為： {{ paperList.total }} 件</div>
        </div>
      </div>

      <div class="search-bar">
        <div class="query-box">
          <el-input v-model="input" placeholder="輸入內容,Enter查詢" @input="getPaperList()" />
          <el-select v-model="filterAbsType" class="filter-abs-type" placeholder="請選擇投稿類型" @change="getPaperList()">
            <el-option value="Poster Presentation"></el-option>
            <el-option value="Video Presentation"></el-option>
            <el-option value="Young Investigator"></el-option>
            <el-option value="" label="All"></el-option>
          </el-select>
        </div>

        <div class="operate-btn-box">
          <el-button v-for="action in primaryActions" :key="action.label" :type="action.type || 'primary'"
            @click="action.action">
            {{ action.label }}
          </el-button>

          <el-dropdown placement="bottom-start" trigger="hover">
            <el-button><el-icon>
                <MoreFilled />
              </el-icon></el-button>

            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="action in overflowActions" :key="action.label" @click="action.action">
                  {{ action.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <el-table :data="paperList.records" style="width: 100%">
        <el-table-column prop="absType" label="投稿類別" width="200"></el-table-column>
        <el-table-column prop="absTitle" label="稿件主題"></el-table-column>
        <el-table-column prop="firstAuthor" label="第一作者" width="150"></el-table-column>
        <el-table-column prop="speaker" label="主講者" width="150"></el-table-column>
        <el-table-column prop="tagSet" label="標籤" min-width="40" align="center">
          <template #default="scope">
            <el-popover v-if="scope.row.tagList.length > 0" placement="left-start" title="標籤" :width="200"
              trigger="hover">
              <template #reference>
                <el-tag v-if="findFirstVaildTag(scope.row.tagList)" size="large" round
                  :color="findFirstVaildTag(scope.row.tagList).color" effect="light">
                  {{ findFirstVaildTag(scope.row.tagList).name }}
                </el-tag>
              </template>
              <template #default>
                <div v-for="tag in scope.row.tagList" :key="tag.tagId" class="tag-item">
                  <el-tag v-if="tag.status === 0" size="large" round :color="tag.color">
                    {{ tag.name }}
                  </el-tag>
                </div>
              </template>
            </el-popover>
          </template>
        </el-table-column>

        <el-table-column prop="memberPaymentStatus" label="繳費狀態" width="100">
          <template #default="scope">
            <span v-if="scope.row.memberPaymentStatus == '未付款'" style="color: red;">未付款</span>
            <span v-else style="color: black;">{{ scope.row.memberPaymentStatus }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="審核狀態" width="80">
          <template #default="scope">
            <span :style="{ color: statusEnums.find(item => item.value === scope.row.status)?.color || 'black' }">
              {{statusEnums.find(item => item.value === scope.row.status)?.label || '未知狀態'}}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="" width="150">
          <template #default="scope">
            <el-button link type="success" @click="toggleEdit(scope.row)">Edit</el-button>
            <el-button v-for="item in scope.row.paperFileUpload" type="primary" link @click="openFile(item.path)">
              下載{{ item.type.split('_')[1] }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-box">
        <el-pagination layout="prev, pager, next" :page-count="Number(paperList.pages)"
          :default-page-size="Number(paperList.size)" v-model:current-page="currentPage" :hide-on-single-page="true" />
      </div>
    </el-card>

    <!-- 編輯抽屜 -->
    <el-drawer v-model="isEdit" title="詳細資訊">
      <p>投稿類別 : {{ reviewPaper.absType }}</p>
      <el-divider></el-divider>
      <p>稿件主題 : {{ reviewPaper.absTitle }}</p>
      <el-divider></el-divider>
      <p>第一作者 : {{ reviewPaper.firstAuthor }}</p>
      <el-divider></el-divider>
      <p v-if="reviewPaper.absType === 'Young Investigator'">第一作者生日 : {{ reviewPaper.firstAuthorBirthday }}</p>
      <el-divider v-if="reviewPaper.absType === 'Young Investigator'"></el-divider>
      <p>主要講者 : {{ reviewPaper.speaker }}</p>
      <el-divider></el-divider>
      <p>講者單位 : {{ reviewPaper.speakerAffiliation }}</p>
      <el-divider></el-divider>
      <p>通訊作者 : {{ reviewPaper.correspondingAuthor }}</p>
      <el-divider></el-divider>
      <p>通訊作者Email : {{ reviewPaper.correspondingAuthorEmail }}</p>
      <el-divider></el-divider>
      <p>通訊作者電話 : {{ reviewPaper.correspondingAuthorPhone }}</p>
      <el-divider></el-divider>
      <p>所有作者 : {{ reviewPaper.allAuthor }}</p>
      <el-divider></el-divider>
      <p>所有作者單位 : {{ reviewPaper.allAuthorAffiliation }}</p>
      <el-divider></el-divider>

      <el-form :model="updateForm">
        <el-form-item label="發表編號" prop="publicationNumber">
          <el-input v-model="updateForm.publicationNumber"></el-input>
        </el-form-item>
        <el-form-item label="發表組別" prop="publicationGroup">
          <el-input v-model="updateForm.publicationGroup"></el-input>
        </el-form-item>
        <el-form-item label="報告地點" prop="reportLocation">
          <el-input v-model="updateForm.reportLocation"></el-input>
        </el-form-item>
        <el-form-item label="報告時間" prop="reportTime">
          <el-input v-model="updateForm.reportTime"></el-input>
        </el-form-item>
        <el-form-item label="審稿通過" prop="status">
          <el-select v-model="updateForm.status" placeholder="請選擇">
            <el-option v-for="status in updateForm.statusList" :key="status.value" :label="status.label"
              :value="status.value" :disabled="status.isDisabled">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="updatePaper">更新</el-button>
          <el-button @click="isEdit = false">關閉</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>

    <!-- Excel 匯入對話框 -->
    <el-dialog v-model="importExcelDialogState.isOpen" title="匯入 Excel 檔案">
      <div class="template-tips-content">
        <ul class="step-list" style="list-style-type: decimal;">
          <li>匯入稿件excel進行更新</li>
          <li>注意事項:
            <ul class="sub-list">
              <li>只允許「發表方式」、「發表群組」、「發表編號」、「演講時間」、「演講地點」、「審核狀態」等欄位更新，其餘欄位無效</li>
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

    <!-- Excel 匯入結果對話框 -->
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
  </section>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { MoreFilled, UploadFilled } from '@element-plus/icons-vue';
import type { UploadProps, UploadUserFile } from 'element-plus';
import {
  getPaperPageApi,
  updatePaperApi,
  downloadPaperScoreExcelApi,
  getDownloadAbstractsUrlApi,
  getDownloadSlidesUrlApi,
  importPaperScoreExcelApi
} from '@/api/abstract';
import { tryCatch } from '@/utils/tryCatch';

const currentPage = ref(1);
const input = ref('');
const filterStatus = ref();
const filterAbsType = ref('');
const filterAbsProp = ref('');

const paperList = reactive<any>([]);

const getPaperList = async () => {
  const { res, error } = await tryCatch(getPaperPageApi(currentPage.value, 10, input.value, filterStatus.value, filterAbsType.value, filterAbsProp.value));
  if (error) return;
  res.data.records.forEach((item: any) => {
    item.paperFileUpload = item.paperFileUpload.filter((file: any) => file.type !== 'supplementary_material');
  });
  Object.assign(paperList, res.data);
};

watch(filterStatus, () => getPaperList());
watch(currentPage, () => getPaperList());

// ---------- 編輯 ----------
const isEdit = ref(false);
const reviewPaper = reactive<any>({});
const updateForm = reactive<any>({
  paperId: '',
  publicationNumber: '',
  publicationGroup: '',
  reportLocation: '',
  reportTime: '',
  status: '',
  statusList: []
});

const toggleEdit = (paper: any) => {
  isEdit.value = true;
  Object.assign(reviewPaper, paper);
  updateForm.paperId = paper.paperId;
  updateForm.status = paper.status;
  updateForm.publicationNumber = paper.publicationNumber;
  updateForm.publicationGroup = paper.publicationGroup;
  updateForm.reportLocation = paper.reportLocation;
  updateForm.reportTime = paper.reportTime;
  updateForm.statusList = statusListMap.value.get(paper.status) || [];
};

const updatePaper = async () => {
  await updatePaperApi(updateForm);
  ElMessage.success('更新成功');
  isEdit.value = false;
  getPaperList();
};

// ---------- 附件下載 ----------
const openFile = async (filePath: string) => {
  const fileUrl = import.meta.env.VITE_MINIO_API_URL + filePath;
  window.open(fileUrl, '_blank');
};

// ---------- 標籤處理 ----------
const findFirstVaildTag = (tagSet: any) => {
  for (let i = 0; i < tagSet.length; i++) {
    if (tagSet[i].status === 0) return tagSet[i];
  }
  return '';
};

// ---------- 狀態枚舉 ----------
const statusEnums = [
  { label: '未審核', value: 0, color: 'gray' },
  { label: '入選', value: 1, color: 'green' },
  { label: '未入選', value: 2, color: 'red' },
  { label: '獲獎', value: 3, color: 'gold' },
  { label: '未獲獎(二階段)', value: 4, color: 'orange' },
];

const statusListMap = computed(() => new Map([
  [0, [{ label: '未審核', value: 0, isDisabled: true }, { label: '入選', value: 1, isDisabled: false }, { label: '未入選', value: 2, isDisabled: false }]],
  [1, [{ label: '入選', value: 1, isDisabled: true }, { label: '未審核', value: 0, isDisabled: false }, { label: '獲獎', value: 3, isDisabled: false }, { label: '未獲獎', value: 4, isDisabled: false }]],
  [2, [{ label: '未入選', value: 2, isDisabled: true }, { label: '未審核', value: 0, isDisabled: false }]],
  [3, [{ label: '獲獎', value: 3, isDisabled: true }, { label: '入選', value: 1, isDisabled: false }]],
  [4, [{ label: '未獲獎', value: 4, isDisabled: true }, { label: '入選', value: 1, isDisabled: false }]],
]));

// ---------- 功能按鈕 ----------
const downloadAbstracts = async () => {
  const { res, error }: any = await tryCatch(getDownloadAbstractsUrlApi());
  if (error || res.code !== 200) return;
  window.open(import.meta.env.VITE_APP_BASE_API + res.data, '_blank');
};


const downloadSlides = async () => {
  const { res, error }: any = await tryCatch(getDownloadSlidesUrlApi());
  if (error || res.code !== 200) return;
  window.open(import.meta.env.VITE_APP_BASE_API + res.data, '_blank');
};

const downloadExcel = async (reviewStage: string) => {
  const fileName = reviewStage === 'first_review' ? '一階評分.xlsx' : '二階評分.xlsx';
  const res = await downloadPaperScoreExcelApi(reviewStage);
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ---------- Excel 匯入 ----------
const importExcelDialogState = ref({
  isOpen: false,
  openDialog: () => { importExcelDialogState.value.isOpen = true; },
  closeDialog: () => { importExcelDialogState.value.isOpen = false; }
});

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
    importExcelResultDialogState.value.resultData = data;
    importExcelResultDialogState.value.isOpen = true;
  },
  closeDialog: () => {
    importExcelResultDialogState.value.isOpen = false;
    importExcelResultDialogState.value.resultData = null;
    getPaperList();
    importExcelDialogState.value.closeDialog();
  }
});

const uploadRef = ref();
const uploadFileList = ref<any>([]);
const handleUpload: UploadProps['onChange'] = (file: UploadUserFile, uploadFiles) => {
  if (file.size == 0) {
    ElMessage.error('File is empty');
    return false;
  }
  if (file.status === 'ready' && file.size) {
    if (!['xlsx', 'xls'].includes(file.name.split('.').pop()!)) {
      ElMessage.error('File must be xlsx');
      uploadFiles.pop();
      return;
    }
    uploadFileList.value.push(file);
  }
};

const handleRemove: UploadProps['onRemove'] = (file, fileList) => {
  uploadFileList.value = fileList;
};

const handleImportExcel = async () => {
  try {
    const data = new FormData();
    uploadFileList.value.forEach((file: any) => {
      data.append('file', file.raw);
    });
    const res = await importPaperScoreExcelApi(data);
    ElMessage.success("上傳成功");
    importExcelResultDialogState.value.openDialog(res.data);
    uploadRef.value?.clearFiles();
    uploadFileList.value = [];
  } catch (error) {
    ElMessage.error("上傳失敗" + error);
  }
};

// ---------- 按鈕分組 ----------
const allActions = ref([
  { label: "下載摘要", action: downloadAbstracts, type: 'primary' as any, isPrimary: true },
  { label: "下載Slide", action: downloadSlides, type: 'primary' as any, isPrimary: true },
  { label: "下載一階評分表", action: () => downloadExcel('first_review'), type: 'success' as any, isPrimary: false },
  { label: "下載二階評分表", action: () => downloadExcel('second_review'), type: 'success' as any, isPrimary: false },
  { label: "Excel批量更新", action: () => importExcelDialogState.value.openDialog(), type: 'success' as any, isPrimary: false },
]);

const primaryActions = computed(() => allActions.value.filter(a => a.isPrimary));
const overflowActions = computed(() => allActions.value.filter(a => !a.isPrimary));

onMounted(() => {
  getPaperList();
});
</script>

<style lang="scss" scoped>
.abstract-section {
  width: 95%;
  margin: 0 auto;

  .abstract-card {
    margin-top: 2%;
    margin-bottom: 2%;

    .pagination-box {
      margin-top: 2%;
      display: flex;
      justify-content: center;
    }
  }

  h1 {
    text-align: center;
    font-size: 2rem;
    margin: 1% 0;
  }
}

.search-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  .query-box {
    display: flex;
    align-items: center;
    gap: 8px;

    .el-input,
    .el-select {
      width: 240px;
    }
  }

  .operate-btn-box {
    display: flex;
    align-items: center;
    gap: 8px;

    .el-button {
      margin: 0;
    }
  }
}

:deep(.el-tag__content) {
  color: white;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>