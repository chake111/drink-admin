<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request.js'
import { formatTime } from '../utils/format.js'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const queryParams = ref({ page: 1, pageSize: 10, orderNo: '', status: null })

const statusMap = {
  1: { label: '待接单', type: 'warning' },
  2: { label: '制作中', type: '' },
  3: { label: '待取餐', type: 'primary' },
  4: { label: '已完成', type: 'success' },
  5: { label: '已取消', type: 'info' }
}

// 时间线步骤配置
const timelineSteps = [
  { status: 1, label: '提交订单' },
  { status: 2, label: '商家接单' },
  { status: 3, label: '制作完成' },
  { status: 4, label: '已取餐' }
]

// 详情抽屉
const drawerVisible = ref(false)
const currentOrder = ref(null)

// 拒单对话框
const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const rejectOrderId = ref(null)

onMounted(() => { loadData() })

async function loadData() {
  loading.value = true
  try {
    const res = await request.get('/order/page', { params: queryParams.value })
    tableData.value = res.data.records
    total.value = res.data.total
  } catch (e) {} finally { loading.value = false }
}

function handleSearch() { queryParams.value.page = 1; loadData() }
function handleReset() {
  queryParams.value = { page: 1, pageSize: 10, orderNo: '', status: null }
  loadData()
}
function handlePageChange(page) { queryParams.value.page = page; loadData() }
function handleSizeChange(size) { queryParams.value.pageSize = size; queryParams.value.page = 1; loadData() }

async function handleConfirm(id) {
  try {
    await request.post(`/order/confirm/${id}`)
    ElMessage.success('接单成功')
    loadData()
  } catch (e) {}
}

async function handleComplete(id) {
  try {
    await request.post(`/order/complete/${id}`)
    ElMessage.success('制作完成')
    loadData()
  } catch (e) {}
}

async function handlePickup(id) {
  try {
    await request.post(`/order/pickup/${id}`)
    ElMessage.success('确认取餐')
    loadData()
  } catch (e) {}
}

function handleReject(id) {
  rejectOrderId.value = id
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

async function submitReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入拒单原因')
    return
  }
  try {
    await request.post(`/order/reject/${rejectOrderId.value}`, { rejectReason: rejectReason.value })
    ElMessage.success('已拒单')
    rejectDialogVisible.value = false
    loadData()
  } catch (e) {}
}

async function handleDetail(row) {
  try {
    const res = await request.get(`/order/${row.id}`)
    currentOrder.value = res.data
    drawerVisible.value = true
  } catch (e) {}
}
</script>

<template>
  <div class="order-page">
    <div class="page-header">
      <div>
        <h1>订单管理</h1>
        <p>查看和管理用户订单，支持接单、制作完成、取餐确认</p>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="status-tabs">
        <span class="status-tab" :class="{ active: !queryParams.status }" @click="queryParams.status = null; handleSearch()">全部</span>
        <span class="status-tab" :class="{ active: queryParams.status === 1 }" @click="queryParams.status = 1; handleSearch()">待接单</span>
        <span class="status-tab" :class="{ active: queryParams.status === 2 }" @click="queryParams.status = 2; handleSearch()">制作中</span>
        <span class="status-tab" :class="{ active: queryParams.status === 3 }" @click="queryParams.status = 3; handleSearch()">待取餐</span>
        <span class="status-tab" :class="{ active: queryParams.status === 4 }" @click="queryParams.status = 4; handleSearch()">已完成</span>
        <span class="status-tab" :class="{ active: queryParams.status === 5 }" @click="queryParams.status = 5; handleSearch()">已取消</span>
      </div>
      <div class="filter-row">
        <el-input v-model="queryParams.orderNo" placeholder="订单号" clearable style="width: 200px" @clear="handleSearch" @keyup.enter="handleSearch" />
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="handleSearch">查询</el-button>
      </div>
    </div>

    <div class="table-card">
      <el-table :data="tableData" v-loading="loading">
        <el-table-column label="订单号" prop="orderNo" width="150" />
        <el-table-column label="客户" width="150">
          <template #default="{ row }">
            <div class="customer-cell">
              <div class="customer-avatar">{{ (row.userName || '?').charAt(0) }}</div>
              <div class="customer-info">
                <span class="customer-name">{{ row.userName || '-' }}</span>
                <span class="customer-phone">{{ row.userPhone || '' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="{ row }"><span class="price">&yen;{{ row.amount?.toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type" size="small">{{ statusMap[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="取餐方式" prop="pickupType" width="100" />
        <el-table-column label="取餐号" prop="pickupNo" width="80" />
        <el-table-column label="下单时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="商品明细" min-width="200">
          <template #default="{ row }">
            <div v-for="item in row.details" :key="item.drinkName" class="order-item">
              {{ item.drinkName }} x{{ item.quantity }}
              <span v-if="item.spec" class="spec">{{ item.spec }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 1" link type="primary" size="small" @click="handleConfirm(row.id)">接单</el-button>
            <el-button v-if="row.status === 2" link type="primary" size="small" @click="handleComplete(row.id)">完成制作</el-button>
            <el-button v-if="row.status === 3" link type="primary" size="small" @click="handlePickup(row.id)">确认取餐</el-button>
            <el-button v-if="row.status === 1" link type="danger" size="small" @click="handleReject(row.id)">拒单</el-button>
            <el-button link type="primary" size="small" @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <span class="pager-info">共 {{ total }} 条</span>
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="sizes, prev, pager, next" @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </div>

    <!-- 订单详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="订单详情" size="520px">
      <template v-if="currentOrder">
        <!-- 当前状态 -->
        <div class="detail-status">
          <el-tag :type="statusMap[currentOrder.status]?.type" size="large" effect="dark">
            {{ statusMap[currentOrder.status]?.label }}
          </el-tag>
        </div>

        <!-- 客户信息 -->
        <div class="customer-card">
          <div class="customer-card-header">
            <div class="customer-card-avatar">{{ (currentOrder.userName || '?').charAt(0) }}</div>
            <div class="customer-card-info">
              <div class="customer-card-name">{{ currentOrder.userName || '未知用户' }}</div>
              <div class="customer-card-phone">{{ currentOrder.userPhone || '-' }}</div>
            </div>
          </div>
          <div class="customer-card-row">
            <span class="customer-card-label">取餐方式</span>
            <span class="customer-card-value">{{ currentOrder.pickupType }}</span>
          </div>
          <div class="customer-card-row" v-if="currentOrder.remark">
            <span class="customer-card-label">备注</span>
            <span class="customer-card-value">{{ currentOrder.remark }}</span>
          </div>
        </div>

        <!-- 订单进度时间线 -->
        <div class="order-timeline">
          <h4>订单进度</h4>
          <div class="timeline">
            <!-- 已取消状态特殊处理 -->
            <template v-if="currentOrder.status === 5">
              <div class="timeline-item completed">
                <div class="timeline-dot done">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 12l2 2 4-4"/></svg>
                </div>
                <div class="timeline-content">
                  <div class="timeline-title">提交订单</div>
                  <div class="timeline-time">{{ formatTime(currentOrder.createTime) }}</div>
                </div>
              </div>
              <div class="timeline-item cancelled">
                <div class="timeline-dot cancel">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </div>
                <div class="timeline-content">
                  <div class="timeline-title">订单已取消</div>
                  <div class="timeline-desc" v-if="currentOrder.rejectReason">原因：{{ currentOrder.rejectReason }}</div>
                </div>
              </div>
            </template>
            <!-- 正常状态时间线 -->
            <template v-else>
              <div v-for="step in timelineSteps" :key="step.status" class="timeline-item" :class="{ completed: currentOrder.status >= step.status }">
                <div class="timeline-dot" :class="{ done: currentOrder.status >= step.status, active: currentOrder.status === step.status }">
                  <svg v-if="currentOrder.status >= step.status" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 12l2 2 4-4"/></svg>
                  <span v-else>{{ step.status }}</span>
                </div>
                <div class="timeline-content">
                  <div class="timeline-title">{{ step.label }}</div>
                  <div class="timeline-time" v-if="step.status === 1">{{ formatTime(currentOrder.createTime) }}</div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 订单信息 -->
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="取餐方式">{{ currentOrder.pickupType }}</el-descriptions-item>
          <el-descriptions-item label="取餐号">
            <span class="pickup-no">{{ currentOrder.pickupNo }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="订单金额">
            <span class="price">&yen;{{ currentOrder.amount?.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatTime(currentOrder.createTime) }}</el-descriptions-item>
        </el-descriptions>

        <!-- 商品明细 -->
        <h4 class="section-title">商品明细</h4>
        <el-table :data="currentOrder.details" size="small" :show-header="false">
          <el-table-column>
            <template #default="{ row }">
              <div class="detail-item">
                <span class="detail-name">{{ row.drinkName }}</span>
                <span class="detail-spec" v-if="row.spec">{{ row.spec }}</span>
                <span class="detail-qty">x{{ row.quantity }}</span>
                <span class="detail-price price">&yen;{{ (row.price * row.quantity)?.toFixed(2) }}</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="detail-total">
          <span>合计</span>
          <span class="price">&yen;{{ currentOrder.amount?.toFixed(2) }}</span>
        </div>
      </template>
    </el-drawer>

    <!-- 拒单对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒单" width="400px">
      <el-form-item label="拒单原因">
        <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入拒单原因" />
      </el-form-item>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitReject">确认拒单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; }
.page-header h1 { font-size: 21px; font-weight: 600; }
.page-header p { font-size: 13px; color: var(--ink-3); margin-top: 5px; }
.filter-bar { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 16px 18px; margin-bottom: 18px; box-shadow: var(--shadow); }
.status-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.status-tab { font-size: 13px; padding: 7px 15px; border-radius: 999px; cursor: pointer; color: var(--ink-2); background: var(--surface-2); border: 1px solid transparent; transition: all 0.15s; }
.status-tab:hover { color: var(--primary); }
.status-tab.active { background: var(--primary-weak); color: var(--primary); font-weight: 600; }
.filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.table-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow); overflow: hidden; }
.price { font-family: var(--font-mono); font-weight: 600; color: var(--primary); }

/* 客户信息单元格 */
.customer-cell { display: flex; align-items: center; gap: 8px; }
.customer-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--primary-weak); color: var(--primary);
  display: grid; place-items: center;
  font-size: 12px; font-weight: 600; flex-shrink: 0;
}
.customer-info { display: flex; flex-direction: column; line-height: 1.3; }
.customer-name { font-size: 13px; color: var(--ink); }
.customer-phone { font-size: 11px; color: var(--ink-3); font-family: var(--font-mono); }

/* 客户信息卡片 */
.customer-card {
  background: var(--surface-2); border-radius: var(--radius); padding: 16px; margin-bottom: 20px;
}
.customer-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--line); }
.customer-card-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--primary-weak); color: var(--primary);
  display: grid; place-items: center;
  font-size: 16px; font-weight: 600; flex-shrink: 0;
}
.customer-card-info { display: flex; flex-direction: column; }
.customer-card-name { font-size: 15px; font-weight: 600; color: var(--ink); }
.customer-card-phone { font-size: 13px; color: var(--ink-2); font-family: var(--font-mono); margin-top: 2px; }
.customer-card-row { display: flex; justify-content: space-between; padding: 6px 0; }
.customer-card-label { font-size: 13px; color: var(--ink-3); }
.customer-card-value { font-size: 13px; color: var(--ink); font-weight: 500; }
.order-item { font-size: 13px; line-height: 1.8; }
.spec { color: var(--ink-3); font-size: 12px; }
.pager { display: flex; align-items: center; padding: 16px; gap: 14px; }
.pager-info { font-size: 13px; color: var(--ink-3); }

/* 详情抽屉样式 */
.detail-status { margin-bottom: 24px; }

.section-title { margin: 20px 0 12px; font-size: 15px; font-weight: 600; color: var(--ink); }

.pickup-no { font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: var(--primary); }

/* 时间线样式 */
.order-timeline { margin-bottom: 24px; }
.order-timeline h4 { font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 16px; }

.timeline { position: relative; padding-left: 28px; }
.timeline::before { content: ''; position: absolute; left: 11px; top: 4px; bottom: 4px; width: 2px; background: var(--line); }

.timeline-item { position: relative; display: flex; padding-bottom: 20px; }
.timeline-item:last-child { padding-bottom: 0; }

.timeline-dot {
  position: absolute; left: -28px; top: 0;
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--surface); border: 2px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: var(--ink-3); font-weight: 600;
  z-index: 1;
}
.timeline-dot svg { width: 14px; height: 14px; display: none; }

.timeline-item.completed .timeline-dot.done {
  background: var(--ok); border-color: var(--ok); color: #fff;
}
.timeline-item.completed .timeline-dot.done svg { display: block; }

.timeline-item.completed .timeline-dot.active {
  background: var(--primary); border-color: var(--primary); color: #fff;
  box-shadow: 0 0 0 4px var(--primary-weak);
}

.timeline-item.cancelled .timeline-dot.cancel {
  background: var(--el-color-danger); border-color: var(--el-color-danger); color: #fff;
}
.timeline-item.cancelled .timeline-dot.cancel svg { display: block; }

.timeline-content { flex: 1; min-height: 24px; display: flex; flex-direction: column; justify-content: center; }
.timeline-title { font-size: 14px; font-weight: 500; color: var(--ink); }
.timeline-time { font-size: 12px; color: var(--ink-3); margin-top: 2px; }
.timeline-desc { font-size: 12px; color: var(--el-color-danger); margin-top: 2px; }

/* 商品明细 */
.detail-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.detail-name { font-weight: 500; color: var(--ink); }
.detail-spec { color: var(--ink-3); font-size: 12px; }
.detail-qty { color: var(--ink-2); margin-left: auto; }
.detail-price { min-width: 60px; text-align: right; }

.detail-total {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; margin-top: 8px;
  border-top: 1px solid var(--line);
  font-weight: 600; color: var(--ink);
}
.detail-total .price { font-size: 18px; }
</style>
