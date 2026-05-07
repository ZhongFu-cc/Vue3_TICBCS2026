<template>
  <main class="main-section">
    <el-card class="main-card" shadow="hover">
      <div class="main-header">
        <h1>Abstract Review</h1>
      </div>
      <div class="function-bar">
        <div class="paper-count">
          <el-tag type="info">總稿件: {{ paperCount.toBeReviewedCount }}</el-tag>
          <el-tag type="warning">待審核: {{ paperCount.notReviewedCount }}</el-tag>
          <el-tag type="success">已審核: {{ paperCount.reviewedCount }}</el-tag>
        </div>

        <el-form-item class="stage-select-form" label="審核階段:">
          <el-select class="stage-select" placeholder="Select Review Stage" v-model="reviewStage"
            @change="getPaperListByReviewer">
            <el-option label="第一階段" value="first_review"></el-option>
            <el-option label="第二階段" value="second_review"></el-option>
          </el-select>
        </el-form-item>
      </div>

      <div class="main-content">
        <el-table :data="paperList.records" style="width: 100%">
          <el-table-column prop="absTitle" label="標題"></el-table-column>
          <el-table-column prop="absType" label="類型" width="200"></el-table-column>
          <el-table-column prop="firstAuthor" label="第一作者"></el-table-column>
          <el-table-column prop="score" label="分數" width="80"></el-table-column>
          <el-table-column prop="option" label="操作">
            <template #default="scope">
              <el-button v-for="item in scope.row.fileList" link type="primary"
                @click="downloadFileFromMinio(item)">開啟{{
                  " " +
                  item.type.split("_")[1]
                }}</el-button>
              <el-button link type="success" @click="toggleSeeMoreDialog(scope.row)">查看更多</el-button>
              <el-button link type="warning" @click="openRatePaperDialog(scope.row)">評分</el-button>
            </template>
          </el-table-column>

        </el-table>
      </div>

      <el-pagination layout="prev, pager, next" @current-change="handlePageChange" :total="Number(paperList.total)"
        :page-size="Number(paperList.size)" :hide-on-single-page="false" />


    </el-card>

    <el-drawer v-model="isSeeMoreDialogVisible">
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
    </el-drawer>

    <el-dialog class="rate-box" v-model="isRatePaperDialogVisible" title="稿件評分" width="230px">

      <div>
        <p>最低分為:{{ minScore }} , 最高分為:{{ maxScore }}</p>
        <p>請於此範圍中評分</p>
        <el-input-number style="width: 100%" v-model="submitRateData.score" type="number" :max="maxScore"
          :min="minScore"></el-input-number>
      </div>


      <template #footer>
        <div class="dialog-footer">
          <el-button @click="isRatePaperDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="ratePaperFn">確定</el-button>
        </div>
      </template>

    </el-dialog>
  </main>
</template>
<script lang="ts" setup>
import { getPaperListByReviewerApi, paperReviewApi, getReviewStatsApi } from '@/api/abstract-reviewer';
import { useUserStore } from '@/store';
import { tryCatch } from '@/utils/tryCatch';
import type { Action } from 'element-plus'

const maxScore = 100;
const minScore = 60;

const route = useRoute();
const userStore = useUserStore();

const paperList = reactive<any>({});

const currentPage = ref(1);
const reviewStage = ref('');
// http://localhost:3001/background/reviewer-login?redirect=/abstract-review?stage=2
const initStageFromQuery = () => {
  const stage = route.query.stage;
  console.log('Query parameter stage:', stage);

  if (stage == '2') {
    reviewStage.value = 'second_review';
  } else {
    reviewStage.value = 'first_review';
  }

};

// 頁碼改變時的處理函數
const handlePageChange = (page: number) => {
  // console.log('Page changed to:', page);
  currentPage.value = page;
  getPaperListByReviewer();
}




const paperCount = ref({
  // 應審核的稿件數量
  toBeReviewedCount: 0,
  // 已審核的稿件數量
  reviewedCount: 0,
  // 未審核的稿件數量
  notReviewedCount: 0
})

const getReviewStats = async () => {
  const { res, error } = await tryCatch(getReviewStatsApi(reviewStage.value));
  if (error) {
    return;
  }

  Object.assign(paperCount.value, res.data);
}

const getPaperListByReviewer = async () => {
  console.log(reviewStage.value)
  const { res, error } = await tryCatch(getPaperListByReviewerApi(currentPage.value, 10, reviewStage.value))
  if (error) {
    return;
  }
  Object.assign(paperList, res.data);
  // 每次獲取稿件列表後，同步更新統計數據
  getReviewStats();

  // 如果沒有待審核的稿件，顯示提示框，告知審核已完成
  if (paperCount.value.notReviewedCount === 0) {
    ElMessageBox.alert('所有稿件已審核完成', '審核完畢', {
      confirmButtonText: 'OK',
      callback: (action: Action) => {
        // ElMessage({
        //   type: 'info',
        //   message: `action: ${action}`,
        // })
      },
    })
  }
}



const downloadFileFromMinio = (file: any) => {
  const minioUrl = import.meta.env.VITE_MINIO_API_URL;
  const fileUrl = minioUrl + file.path;
  const link = document.createElement('a');
  link.href = fileUrl;
  document.body.appendChild(link);
  link.setAttribute('download', '');
  window.open(fileUrl, '_blank');
  document.body.removeChild(link);
}

/**-------------------------------------------------------- */
const isSeeMoreDialogVisible = ref(false);

const reviewPaper = reactive<any>({});

const toggleSeeMoreDialog = (row: any) => {
  isSeeMoreDialogVisible.value = true;

  Object.assign(reviewPaper, row);
};
/**-------------------------------------------------------- */
const isRatePaperDialogVisible = ref(false);
const ratePaper = reactive<any>({});

const submitRateData = reactive({
  paperAndPaperReviewerId: '',
  score: 0,
  paperReviewerId: ''
})

const openRatePaperDialog = (row: any) => {
  isRatePaperDialogVisible.value = true;
  submitRateData.score = row.score;
  submitRateData.paperAndPaperReviewerId = row.paperAndPaperReviewerId;
  submitRateData.paperReviewerId = userStore.user.paperReviewerId;
  Object.assign(ratePaper, row);
};

const ratePaperFn = async () => {
  const { res, error } = await tryCatch(paperReviewApi(submitRateData));
  if (error) {
    console.error('Error rating paper:', error);
    return;
  }
  isRatePaperDialogVisible.value = false;
  await getPaperListByReviewer();


}

onMounted(() => {
  initStageFromQuery();
  getPaperListByReviewer();
});

</script>

<style lang="scss" scoped>
.main-card {
  width: 100%;
  min-height: 100vh;

  .function-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
}

.stage-select-form {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 1rem;
}

.stage-select {
  width: 200px;
  margin-right: 20px;
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
</style>