<template>
  <section class="main-section">
    <el-card class="main-card">
      <h1>往年與會者管理</h1>

      <div class="function-bar">
        <el-button type="warning" @click="toggleDialog">
          下載Excel模板
        </el-button>
        <el-button type="success" @click="toggleUploadDialog">
          上傳Excel資料
        </el-button>
      </div>

      <el-table :data="attendeesHistoryList.records" style="width: 100%">
        <el-table-column prop="name" label="姓名" width="180"></el-table-column>
        <el-table-column prop="year" label="與會年分" width="180"></el-table-column>
        <el-table-column prop="idCard" label="身分證字號" width="180"></el-table-column>
        <el-table-column prop="email" label="E-mail"></el-table-column>
      </el-table>


    </el-card>

    <el-dialog class="template-tips" title="下載Excel模板" v-model="downloadDialogIsVisible" width="60%">
      <div class="template-tips-content">
        <ul class="step-list" style="list-style-type: decimal;">
          <li>下載 Excel模板，透過模板填入資料將往年與會者填入系統</li>
          <li>欄位說明：
            <ul class="sub-list">
              <li>year 為與會年分，統一填2024即可</li>
              <li>id_card 為身分證字號 或 護照號碼</li>
              <li>email 為電子信箱</li>
              <li>name 為用戶姓名</li>
            </ul>
          </li>
          <li>注意事項:
            <ul class="sub-list">
              <li>id_card ,name 欄位非必填，但email 和 year欄位為必填</li>
              <li>d_card 和 email 欄位不可有重複的值，否則系統會拒絕匯入</li>
              <li>如果有傳入 id_card 系統僅會依據此欄位做比對依據，如果沒填寫 id_card ，系統則會根據email欄位做比對依據</li>
            </ul>
          </li>
        </ul>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="danger" @click="downloadDialogIsVisible = false">取消</el-button>
        <el-button type="success" @click="downloadExcelTemplate">確定</el-button>
      </span>
    </el-dialog>

    <el-dialog class="upload-excel" title="上傳Excel資料" v-model="uploadDialogIsVisible" width="60%">
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
        <el-button type="danger" @click="uploadDialogIsVisible = false">取消</el-button>
        <el-button type="success" @click="uploadExcel">確定</el-button>
      </span>

    </el-dialog>


  </section>
</template>
<script lang="ts" setup>
import { getAttendeesHistoryByPaginationApi, getAttendeesHistoryExcelTemplateApi, importAttendeesHistoryExcelApi } from '@/api/attendeesHistory';
import type { UploadFile, UploadInstance, UploadProps, UploadUserFile, } from 'element-plus';

const downloadDialogIsVisible = ref(false);
const toggleDialog = () => {
  downloadDialogIsVisible.value = true;
}


const downloadExcelTemplate = async () => {
  downloadDialogIsVisible.value = false;
  try {
    let res = await getAttendeesHistoryExcelTemplateApi();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '往年與會者模板.xlsx');
    document.body.appendChild(link);
    link.click();
  } catch (error) {
    ElMessage.error("下載失敗" + error)
  }
}

const uploadRef = ref<UploadInstance>();
/**----------------------------------------------------- */
const uploadExcel = async () => {
  try {
    let data = new FormData();
    uploadData.fileList.forEach((file: any) => {
      data.append('file', file.raw);
    });
    let res = await importAttendeesHistoryExcelApi(data);
    ElMessage.success("上傳成功");
    findAllAttendeesHistoryApi();
    uploadDialogIsVisible.value = false;
    uploadData.fileList = [];
    uploadRef.value?.clearFiles();
  } catch (error) {
    console.log(error);
    ElMessage.error("上傳失敗" + error)
  }
}

const uploadData = reactive({
  fileList: [] as UploadUserFile[],
});

const uploadDialogIsVisible = ref(false);
const toggleUploadDialog = () => {
  uploadDialogIsVisible.value = true;
}

const handleUpload: UploadProps['onChange'] = (file: UploadUserFile, uploadFiles) => {
  console.log(file);
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
    uploadData.fileList.push(file);
  }

}
const handleRemove = (file: UploadUserFile, fileList: UploadUserFile[]) => {
  console.log(uploadData.fileList);
  uploadData.fileList = [];
  // if (formRef.value) {
  //     formRef.value.validateField('fileList');
  // }
}

const attendeesHistoryList = reactive<any>([]);
const currentPage = ref(1);
const findAllAttendeesHistoryApi = async () => {
  try {
    let res = await getAttendeesHistoryByPaginationApi(currentPage.value, 10);
    console.log(res);
    Object.assign(attendeesHistoryList, res.data);
  } catch (error) {
    console.log(error);
    Object.assign(attendeesHistoryList.records, []);
  }
}

onMounted(() => {
  findAllAttendeesHistoryApi();
});






function importAttendeesHistoryExcelTemplateApi() {
  throw new Error('Function not implemented.');
}
</script>
<style lang="scss" scoped>
.main-section {
  width: 95%;
  margin: 0 auto;
  position: relative;

  .main-card {
    margin-top: 2%;
    margin-bottom: 2%;
  }

  h1 {
    font-size: 2rem;
    text-align: center;
    margin-bottom: 1rem;
  }


  .function-bar {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;

    .el-button {
      // width: 200px;
      // height: 50px;
      // font-size: 1.2rem;
    }
  }

  .step-list {
    margin: 0;
    list-style-type: decimal;
    line-height: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .sub-list {
      list-style-type: disc;
      line-height: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  }

  .dialog-footer {
    margin-top: 2rem;
    display: flex;
    justify-content: flex-end;
    // gap: 1rem;
  }
}
</style>