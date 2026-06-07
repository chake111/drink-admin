<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request.js'
import { formatTime } from '../utils/format.js'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const queryParams = ref({ page: 1, pageSize: 10, orderNo: '', status: null })

const statusMap = {
  1: { label: '待接单', cls: 'ob-wait' },
  2: { label: '制作中', cls: 'ob-making' },
  3: { label: '待取餐', cls: 'ob-ready' },
  4: { label: '已完成', cls: 'ob-done' },
  5: { label: '已取消', cls: 'ob-cancel' }
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
        <el-input v-model="queryParams.orderNo" placeholder="订单号"  @clear="handleSearch" @keyup.enter="handleSearch" />
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="handleSearch">查询</el-button>
      </div>
    </div>

    <div class="table-card">
      <el-table :data="tableData" v-loading="loading">
        <el-table-column label="取餐号" width="70">
          <template #default="{ row }"><b class="en" style="font-size:15px;color:var(--primary)">{{ row.pickupNo }}</b></template>
        </el-table-column>
        <el-table-column label="订单号" prop="orderNo"  />
        <el-table-column label="顾客" width="150">
          <template #default="{ row }">
            <div class="ocust">
              <span class="oav">{{ (row.userName || '?').charAt(0) }}</span>
              <div>
                <div class="on-name">{{ row.userName || '未知用户' }}</div>
                <div class="on-phone">{{ row.userPhone || '-' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品" show-overflow-tooltip width="150">
          <template #default="{ row }">
            <div v-for="item in row.details" :key="item.drinkName" class="order-item">
              {{ item.drinkName }} x{{ item.quantity }}
              <span v-if="item.spec" class="spec">{{ item.spec }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额">
          <template #default="{ row }"><span class="price">&yen;{{ row.amount?.toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column label="取餐方式" >
          <template #default="{ row }">{{ row.pickupType || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <span class="obadge" :class="statusMap[row.status]?.cls"><i></i>{{ statusMap[row.status]?.label }}</span>
          </template>
        </el-table-column>
        <el-table-column label="下单时间">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="{ row }">
            <span v-if="row.status === 1" class="op-text" @click="handleConfirm(row.id)">接单</span>
            <span v-if="row.status === 1" class="op-sep"></span>
            <span v-if="row.status === 1" class="op-text del" @click="handleReject(row.id)">拒单</span>
            <span v-if="row.status === 2" class="op-text" @click="handleComplete(row.id)">完成制作</span>
            <span v-if="row.status === 3" class="op-text" @click="handlePickup(row.id)">确认取餐</span>
            <span v-if="row.status >= 1 && row.status <= 3" class="op-sep"></span>
            <span class="op-text" @click="handleDetail(row)">详情</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <span class="pager-info">共 {{ total }} 条</span>
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="sizes, prev, pager, next" @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </div>

    <!-- 订单详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="订单详情" size="540px" class="order-drawer">
      <template v-if="currentOrder">
        <!-- 当前状态 -->
        <div class="od-sec">
          <h4>当前状态</h4>
          <div style="display:flex;align-items:center;gap:12px">
            <span class="obadge" :class="statusMap[currentOrder.status]?.cls"><i></i>{{ statusMap[currentOrder.status]?.label }}</span>
            <span style="font-size:14px;color:var(--ink-2)">取餐号 <b class="en" style="color:var(--primary)">{{ currentOrder.pickupNo }}</b></span>
          </div>
        </div>

        <!-- 顾客信息 -->
        <div class="od-sec">
          <h4>顾客信息</h4>
          <div class="od-card">
            <div class="od-info-row"><span class="k">顾客</span><span class="v">{{ currentOrder.userName || '未知用户' }}</span></div>
            <div class="od-info-row"><span class="k">联系电话</span><span class="v mono">{{ currentOrder.userPhone || '-' }}</span></div>
            <div class="od-info-row"><span class="k">取餐方式</span><span class="v">{{ currentOrder.pickupType }}</span></div>
            <div class="od-info-row" v-if="currentOrder.remark"><span class="k">备注</span><span class="v">{{ currentOrder.remark }}</span></div>
          </div>
        </div>

        <!-- 商品明细 -->
        <div class="od-sec">
          <h4>商品明细</h4>
          <div class="od-card">
            <div class="od-line" v-for="item in currentOrder.details" :key="item.drinkName">
              <div class="lthumb">
                <img v-if="item.image" :src="item.image" alt="" />
              </div>
              <div class="lmid">
                <div class="lname">{{ item.drinkName }}</div>
                <div class="lspec" v-if="item.spec">{{ item.spec }}</div>
              </div>
              <div class="lqty">x{{ item.quantity }}</div>
              <div class="lprice">&yen;{{ (item.price * item.quantity)?.toFixed(2) }}</div>
            </div>
            <div class="od-total">
              <span class="tl">合计</span>
              <span class="tv">&yen;{{ currentOrder.amount?.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- 订单进度 -->
        <div class="od-sec">
          <h4>订单进度</h4>
          <div class="od-steps">
            <!-- 已取消状态 -->
            <template v-if="currentOrder.status === 5">
              <div class="od-step done">
                <span class="sdot">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 12l2 2 4-4"/></svg>
                </span>
                <div class="stext">
                  <div class="st">提交订单</div>
                  <div class="stime mono">{{ formatTime(currentOrder.createTime) }}</div>
                </div>
              </div>
              <div class="od-step done">
                <span class="sdot" style="background:var(--off);border-color:var(--off)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </span>
                <div class="stext">
                  <div class="st" style="color:var(--off)">订单已取消</div>
                  <div class="stime mono" v-if="currentOrder.rejectReason">原因：{{ currentOrder.rejectReason }}</div>
                </div>
              </div>
            </template>
            <!-- 正常状态时间线 -->
            <template v-else>
              <div v-for="step in timelineSteps" :key="step.status" class="od-step" :class="{ done: currentOrder.status >= step.status }">
                <span class="sdot">
                  <svg v-if="currentOrder.status >= step.status" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 12l2 2 4-4"/></svg>
                  <template v-else>{{ step.status }}</template>
                </span>
                <div class="stext">
                  <div class="st">{{ step.label }}</div>
                  <div class="stime mono" v-if="step.status === 1">{{ formatTime(currentOrder.createTime) }}</div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- 底部操作按钮 -->
      <template #footer v-if="currentOrder">
        <div class="drawer-footer">
          <el-button v-if="currentOrder.status === 1" @click="handleReject(currentOrder.id)">拒单</el-button>
          <el-button v-if="currentOrder.status === 1" type="primary" @click="handleConfirm(currentOrder.id)">接单</el-button>
          <el-button v-if="currentOrder.status === 2" type="primary" @click="handleComplete(currentOrder.id)">完成制作</el-button>
          <el-button v-if="currentOrder.status === 3" type="primary" @click="handlePickup(currentOrder.id)">确认取餐</el-button>
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

/* 订单状态徽章 — 与原型 .obadge 一致 */
.obadge { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; padding: 4px 11px; border-radius: 999px; font-weight: 500; white-space: nowrap; }
.obadge i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; font-style: normal; }
.ob-wait { background: var(--warn-weak); color: var(--warn); }
.ob-making { background: #E4ECF5; color: #4B79A8; }
.ob-ready { background: var(--ok-weak); color: var(--ok); }
.ob-done { background: var(--surface-2); color: var(--ink-3); }
.ob-cancel { background: var(--off-weak); color: var(--off); }

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

/* 详情抽屉 — 对齐原型 od-sec / od-card / od-info-row */
.od-sec { margin-bottom: 22px; }
.od-sec h4 { font-size: 13px; color: var(--ink-3); font-weight: 600; margin-bottom: 12px; letter-spacing: .03em; }
.od-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; }
.od-info-row { display: flex; justify-content: space-between; font-size: 13.5px; padding: 7px 0; }
.od-info-row .k { color: var(--ink-3); }
.od-info-row .v { color: var(--ink); font-weight: 500; text-align: right; }
.od-info-row .v.mono { font-family: var(--font-mono); }

/* 商品行 — 对齐原型 od-line */
.od-line { display: flex; align-items: flex-start; gap: 12px; padding: 13px 0; border-bottom: 1px solid var(--line); }
.od-line:last-child { border-bottom: 0; }
.od-line .lthumb { width: 44px; height: 44px; border-radius: 8px; background: #F3E2D3; display: grid; place-items: center; color: var(--primary); flex-shrink: 0; overflow: hidden; }
.od-line .lthumb svg { width: 22px; height: 22px; }
.od-line .lthumb img { width: 100%; height: 100%; object-fit: cover; }
.od-line .lmid { flex: 1; }
.od-line .lname { font-size: 14px; font-weight: 600; }
.od-line .lspec { font-size: 12px; color: var(--ink-3); margin-top: 3px; }
.od-line .lqty { font-family: var(--font-mono); font-size: 13px; color: var(--ink-3); }
.od-line .lprice { font-family: var(--font-mono); font-size: 14px; font-weight: 600; text-align: right; min-width: 64px; }

/* 合计行 — 对齐原型 od-total */
.od-total { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; margin-top: 4px; border-top: 1.5px solid var(--line-strong); }
.od-total .tl { font-size: 14px; color: var(--ink-2); }
.od-total .tv { font-family: var(--font-mono); font-size: 22px; font-weight: 700; color: var(--primary); }

/* 时间线 — 对齐原型 od-steps / od-step */
.od-steps { display: flex; flex-direction: column; gap: 0; }
.od-step { display: flex; gap: 13px; position: relative; padding-bottom: 20px; }
.od-step:last-child { padding-bottom: 0; }
.od-step .sdot {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--surface-2); border: 2px solid var(--line-strong);
  display: grid; place-items: center; flex-shrink: 0; z-index: 2; color: var(--ink-3);
  font-size: 11px; font-weight: 600;
}
.od-step .sdot svg { width: 13px; height: 13px; display: none; }
.od-step.done .sdot { background: var(--ok); border-color: var(--ok); color: #fff; }
.od-step.done .sdot svg { display: block; }
.od-step:not(:last-child)::before { content: ''; position: absolute; left: 12px; top: 26px; bottom: 0; width: 2px; background: var(--line-strong); }
.od-step.done:not(:last-child)::before { background: var(--ok); }
.od-step .stext { padding-top: 3px; }
.od-step .st { font-size: 13.5px; font-weight: 500; }
.od-step.done .st { color: var(--ink); }
.od-step:not(.done) .st { color: var(--ink-3); }
.od-step .stime { font-size: 12px; color: var(--ink-3); font-family: var(--font-mono); margin-top: 2px; }

/* 抽屉底部按钮 */
.drawer-footer { display: flex; gap: 12px; justify-content: flex-end; }
.phone-cell { font-family: var(--font-mono); font-size: 13px; color: var(--ink-2); }
.ocust { display: flex; align-items: center; gap: 9px; }
.ocust .oav { width: 32px; height: 32px; border-radius: 50%; background: var(--primary-weak); color: var(--primary); display: grid; place-items: center; font-size: 12px; font-weight: 600; flex-shrink: 0; }
.ocust .on-name { font-size: 13.5px; font-weight: 500; }
.ocust .on-phone { font-size: 12px; color: var(--ink-3); font-family: var(--font-mono); }
.remark-cell { font-size: 13px; color: var(--ink-3); }
.order-item { font-size: 13px; line-height: 1.8; }
.spec { color: var(--ink-3); font-size: 12px; }
.pager { display: flex; align-items: center; padding: 16px; gap: 14px; }
.pager-info { font-size: 13px; color: var(--ink-3); }
.op-text { font-size: 13px; color: var(--primary); cursor: pointer; padding: 4px 8px; border-radius: 5px; }
.op-text:hover { background: var(--primary-weak); }
.op-text.del { color: var(--off); }
.op-text.del:hover { background: var(--off-weak); }
.op-sep { width: 1px; height: 12px; background: var(--line-strong); margin: 0 2px; display: inline-block; vertical-align: middle; }

/* 旧样式已移除，详情抽屉样式见上方 od-sec / od-card 系列 */

/* 覆盖 el-drawer 内部样式，对齐原型 .drawer / .dwr-head / .dwr-body / .dwr-foot */
:deep(.el-drawer) { background: var(--bg); box-shadow: 0 12px 40px rgba(58,40,28,.16); }
:deep(.el-drawer__header) {
  padding: 22px 26px; margin-bottom: 0;
  background: var(--surface); border-bottom: 1px solid var(--line);
  font-size: 18px; font-weight: 600; color: var(--ink);
}
:deep(.el-drawer__body) { padding: 24px 26px; flex: 1; overflow-y: auto; }
:deep(.el-drawer__footer) { padding: 16px 26px; background: var(--surface); border-top: 1px solid var(--line); }
</style>
