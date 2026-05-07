<template>
  <section class="abstract-section">
    <el-card class="abstract-card">
      <h1>稿件分發</h1>

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
          <el-button type="warning" @click="openAutoAssignReviewerDialog">
            自動分配審稿委員
          </el-button>
        </div>
      </div>

      <el-table :data="paperList.records" style="width: 100%">
        <el-table-column prop="absType" label="投稿類別" width="200"></el-table-column>
        <el-table-column prop="absTitle" label="稿件主題"></el-table-column>
        <el-table-column prop="firstAuthor" label="第一作者" width="150"></el-table-column>
        <el-table-column prop="speakerAffiliation" label="主講者單位" width="150"></el-table-column>
        <el-table-column prop="status" label="審核狀態" width="100">
          <template #default="scope">
            <span :style="{ color: statusEnums.find(item => item.value === scope.row.status)?.color || 'black' }">
              {{statusEnums.find(item => item.value === scope.row.status)?.label || '未知狀態'}}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="" width="150">
          <template #default="scope">
            <el-button link type="primary" @click="openAssignReviewerDialog(scope.row)">
              分配審稿委員
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-box">
        <el-pagination layout="prev, pager, next" :page-count="Number(paperList.pages)"
          :default-page-size="Number(paperList.size)" v-model:current-page="currentPage" :hide-on-single-page="true" />
      </div>
    </el-card>

    <!-- 手動分配彈窗 -->
    <el-dialog v-model="isAssignReviewerVisible" title="分配審稿委員" width="50%">
      <div class="stage-btn-bar">
        <el-button class="first-stage" :class="{ 'is-active': reviewStage === 'first_review' }"
          @click="reviewStage = 'first_review'">一階</el-button>
        <el-button class="second-stage" :class="{ 'is-active': reviewStage === 'second_review' }"
          @click="reviewStage = 'second_review'">二階</el-button>
      </div>
      <el-transfer v-model="submitAssignData.targetPaperReviewerIdList" :data="assignPaperReviewData" filterable
        :titles="['可選審稿人', '已選審稿人']" />
      <el-button class="submit-btn" @click="submitAssignDataFn">確定</el-button>
    </el-dialog>

    <!-- 自動分配彈窗 -->
    <el-dialog v-model="isAutoAssignReviewerVisible" title="自動分配審稿委員" width="15%">
      <div>系統會根據「投稿類別」，自動分配相同類別的審稿人</div>
      <el-radio-group v-model="reviewStage">
        <el-radio value="first_review">一階審稿</el-radio>
        <el-radio value="second_review">二階審稿</el-radio>
      </el-radio-group>
      <el-button @click="autoAssignPaperReviewers">確定</el-button>
    </el-dialog>
  </section>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { MoreFilled } from '@element-plus/icons-vue';
import { getPaperPageApi, assignPaperReviewersApi, autoAssignPaperReviewersApi, downloadPaperScoreExcelApi } from '@/api/abstract';
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
  Object.assign(paperList, res.data);
};

watch(filterStatus, () => getPaperList());
watch(currentPage, () => getPaperList());

// ---------- 狀態枚舉 ----------
const statusEnums = [
  { label: '未審核', value: 0, color: 'gray' },
  { label: '入選', value: 1, color: 'green' },
  { label: '未入選', value: 2, color: 'red' },
  { label: '獲獎', value: 3, color: 'gold' },
  { label: '未獲獎(二階段)', value: 4, color: 'orange' },
];

// ---------- 分發相關 ----------
const isAssignReviewerVisible = ref(false);
const assignPaper = reactive<any>({});
const reviewStage = ref('first_review');
const submitAssignData = reactive<any>({
  reviewStage: '',
  targetPaperReviewerIdList: [],
  paperId: '',
});
const assignPaperReviewData = reactive<any>([]);

const openAssignReviewerDialog = (paper: any) => {
  submitAssignData.paperId = '';
  submitAssignData.targetPaperReviewerIdList = [];
  assignPaperReviewData.length = 0;
  Object.assign(assignPaper, paper);
  submitAssignData.paperId = paper.paperId;

  assignPaper.assignedPaperReviewers.forEach((paperReviewer: any) => {
    if (paperReviewer.reviewStage !== reviewStage.value) return;
    submitAssignData.targetPaperReviewerIdList.push(paperReviewer.paperReviewerId);
  });

  assignPaper.availablePaperReviewers.forEach((paperReviewer: any) => {
    assignPaperReviewData.push({
      label: paperReviewer.name,
      key: paperReviewer.paperReviewerId,
    });
  });

  isAssignReviewerVisible.value = true;
};

watch(() => reviewStage.value, () => {
  if (!isAssignReviewerVisible.value) return;
  submitAssignData.targetPaperReviewerIdList.length = 0;
  assignPaper.assignedPaperReviewers.forEach((paperReviewer: any) => {
    if (paperReviewer.reviewStage !== reviewStage.value) return;
    submitAssignData.targetPaperReviewerIdList.push(paperReviewer.paperReviewerId);
  });
}, { deep: true });

const submitAssignDataFn = async () => {
  submitAssignData.reviewStage = reviewStage.value;
  const { error } = await tryCatch(assignPaperReviewersApi(submitAssignData));
  if (error) return;
  isAssignReviewerVisible.value = false;
  getPaperList();
};

// ---------- 自動分配 ----------
const isAutoAssignReviewerVisible = ref(false);

const openAutoAssignReviewerDialog = () => {
  isAutoAssignReviewerVisible.value = true;
};

const autoAssignPaperReviewers = async () => {
  const submitData = { reviewStage: reviewStage.value };
  const { error } = await tryCatch(autoAssignPaperReviewersApi(submitData));
  if (error) return;
  ElMessage.success('自動分配審稿委員成功');
  isAutoAssignReviewerVisible.value = false;
  getPaperList();
};

// ---------- 下載評分表（可選功能）----------
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

.stage-btn-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;

  .el-button {
    margin: 0;

    &.is-active {
      background-color: #409eff;
      color: white;
    }

    &.first-stage {
      border-radius: 4px 0 0 4px;
    }

    &.second-stage {
      border-radius: 0 4px 4px 0;
    }
  }
}

.el-transfer {
  margin-top: 4rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.submit-btn {
  display: block;
  margin: 0 0 0 auto;
}
</style>