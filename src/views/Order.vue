<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../api/request.js'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const activeTab = ref('all')
const queryParams = ref({ page: 1, pageSize: 10, orderNo: '', status: null })

const statusMap = {
  1: { label: '待接单', type: 'warning' },
  2: { label: '制作中', type: '' },
  3: { label: '待取餐', type: 'primary' },
  4: { label: '已完成', type: 'success' },
  5: { label: '已取消', type: 'info' }
}

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
  activeTab.value = 'all'
  queryParams.value = { page: 1, pageSize: 10, orderNo: '', status: null }
  loadData()
}
function handleTabChange(name) {
  queryParams.value.status = name === 'all' ? null : Number(name)
  queryParams.value.page = 1
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

    <!-- 状态Tab -->
    <el-tabs v-model="activeTab" class="status-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="待接单" name="1" />
      <el-tab-pane label="制作中" name="2" />
      <el-tab-pane label="待取餐" name="3" />
      <el-tab-pane label="已完成" name="4" />
      <el-tab-pane label="已取消" name="5" />
    </el-tabs>

    <div class="filter-bar">
      <el-input v-model="queryParams.orderNo" placeholder="订单号" clearable style="width: 200px" @clear="handleSearch" @keyup.enter="handleSearch" />
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" @click="handleSearch">查询</el-button>
    </div>

    <div class="table-card">
      <el-table :data="tableData" v-loading="loading">
        <el-table-column label="订单号" prop="orderNo" width="150" />
        <el-table-column label="用户" prop="userName" width="100" />
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
        <el-table-column label="下单时间" prop="createTime" width="180" />
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
    <el-drawer v-model="drawerVisible" title="订单详情" size="480px">
      <template v-if="currentOrder">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusMap[currentOrder.status]?.type" size="small">{{ statusMap[currentOrder.status]?.label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="取餐方式">{{ currentOrder.pickupType }}</el-descriptions-item>
          <el-descriptions-item label="取餐号">{{ currentOrder.pickupNo }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">&yen;{{ currentOrder.amount?.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ currentOrder.createTime }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin: 16px 0 8px">商品明细</h4>
        <el-table :data="currentOrder.details" size="small">
          <el-table-column label="饮品" prop="drinkName" />
          <el-table-column label="规格" prop="spec" />
          <el-table-column label="数量" prop="quantity" width="80" />
          <el-table-column label="单价" width="100">
            <template #default="{ row }">&yen;{{ row.price?.toFixed(2) }}</template>
          </el-table-column>
        </el-table>
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
.status-tabs { margin-bottom: 4px; }
.status-tabs :deep(.el-tabs__header) { margin-bottom: 0; }
.filter-bar { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 16px 18px; margin-bottom: 18px; box-shadow: var(--shadow); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.table-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow); overflow: hidden; }
.price { font-family: var(--font-mono); font-weight: 600; font-size: 14px; }
.order-item { font-size: 13px; line-height: 1.8; }
.spec { color: var(--ink-3); font-size: 12px; }
.pager { display: flex; align-items: center; padding: 16px; gap: 14px; }
.pager-info { font-size: 13px; color: var(--ink-3); }
</style>
