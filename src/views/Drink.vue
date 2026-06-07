<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import request from '../utils/request.js'
import ImageUpload from '../components/ImageUpload.vue'
import { formatTime } from '../utils/format.js'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const queryParams = ref({ page: 1, pageSize: 10, name: '', categoryId: null, status: null })
const categoryList = ref([])
const selectedIds = ref([])

// 抽屉相关
const drawerVisible = ref(false)
const drawerTitle = ref('新增饮品')
const form = ref({ name: '', categoryId: null, price: null, description: '', flavors: [], image: '', status: 1 })
const formRef = ref(null)

const rules = {
  name: [{ required: true, message: '请输入饮品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

onMounted(() => { loadData(); loadCategories() })

async function loadData() {
  loading.value = true
  try {
    const res = await request.get('/drink/page', { params: queryParams.value })
    tableData.value = res.data.records
    total.value = res.data.total
  } catch (e) { } finally { loading.value = false }
}

async function loadCategories() {
  try {
    const res = await request.get('/category/list')
    categoryList.value = res.data
  } catch (e) { }
}

function handleSearch() { queryParams.value.page = 1; loadData() }
function handleReset() { queryParams.value = { page: 1, pageSize: 10, name: '', categoryId: null, status: null }; loadData() }
function handlePageChange(page) { queryParams.value.page = page; loadData() }
function handleSizeChange(size) { queryParams.value.pageSize = size; queryParams.value.page = 1; loadData() }
function handleSelectionChange(rows) { selectedIds.value = rows.map(r => r.id) }

function handleAdd() {
  drawerTitle.value = '新增饮品'
  form.value = { name: '', categoryId: null, price: null, description: '', flavors: [], image: '', status: 1 }
  drawerVisible.value = true
}

function handleEdit(row) {
  drawerTitle.value = '编辑饮品'
  form.value = {
    id: row.id,
    name: row.name,
    categoryId: row.categoryId,
    price: row.price,
    description: row.description,
    flavors: row.flavors ? row.flavors.map(f => ({ ...f })) : [],
    image: row.image || '',
    status: row.status
  }
  drawerVisible.value = true
}

function addFlavor() {
  form.value.flavors.push({ name: '', value: '' })
}

function removeFlavor(index) {
  form.value.flavors.splice(index, 1)
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    if (!form.value.image) {
      ElMessage.warning('请上传饮品图片')
      return
    }
    const formData = new FormData()
    if (form.value.id) formData.append('id', form.value.id)
    formData.append('name', form.value.name)
    formData.append('categoryId', form.value.categoryId)
    formData.append('price', form.value.price)
    formData.append('image', form.value.image)
    formData.append('status', form.value.status)
    if (form.value.description) formData.append('description', form.value.description)
    if (form.value.flavors.length > 0) {
      formData.append('flavors', JSON.stringify(form.value.flavors.filter(f => f.name && f.value)))
    }

    if (form.value.id) {
      await request.put('/drink', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      ElMessage.success('修改成功')
    } else {
      await request.post('/drink', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      ElMessage.success('新增成功')
    }
    drawerVisible.value = false
    loadData()
  } catch (e) { }
}

async function handleStatusChange(id, status) {
  try {
    await request.post(`/drink/status/${status}`, null, { params: { ids: String(id) } })
    loadData()
  } catch (e) { }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定删除该饮品吗？', '提示', { type: 'warning' })
    await request.delete('/drink', { params: { ids: String(id) } })
    ElMessage.success('删除成功')
    loadData()
  } catch (e) { }
}

async function handleBatchStatus(status) {
  if (!selectedIds.value.length) return
  try {
    await request.post(`/drink/status/${status}`, null, { params: { ids: selectedIds.value.join(',') } })
    loadData()
  } catch (e) { }
}

async function handleBatchDelete() {
  if (!selectedIds.value.length) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 个饮品吗？`, '提示', { type: 'warning' })
    await request.delete('/drink', { params: { ids: selectedIds.value.join(',') } })
    ElMessage.success('删除成功')
    loadData()
  } catch (e) { }
}
</script>

<template>
  <div class="drink-page">
    <div class="page-header">
      <div>
        <h1>饮品管理</h1>
        <p>维护门店在售饮品，支持分类筛选、起售停售与口味设置</p>
      </div>
      <el-button type="primary" @click="handleAdd">新增饮品</el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="category-tabs">
        <span class="cat-tab" :class="{ active: !queryParams.categoryId }"
          @click="queryParams.categoryId = null; handleSearch()">全部</span>
        <span v-for="cat in categoryList" :key="cat.id" class="cat-tab"
          :class="{ active: queryParams.categoryId === cat.id }"
          @click="queryParams.categoryId = cat.id; handleSearch()">{{ cat.name }}</span>
      </div>
      <div class="filter-row">
        <el-input v-model="queryParams.name" placeholder="饮品名称" clearable style="width: 200px" @clear="handleSearch"
          @keyup.enter="handleSearch" />
        <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px"
          @change="handleSearch">
          <el-option label="起售" :value="1" /><el-option label="停售" :value="0" />
        </el-select>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="handleSearch">查询</el-button>
      </div>
    </div>

    <!-- 批量操作 -->
    <div v-if="selectedIds.length > 0" class="batch-bar">
      <span>已选 <b>{{ selectedIds.length }}</b> 项</span>
      <div class="batch-actions">
        <el-button size="small" @click="handleBatchStatus(1)">批量起售</el-button>
        <el-button size="small" @click="handleBatchStatus(0)">批量停售</el-button>
        <el-button size="small" type="danger" @click="handleBatchDelete">批量删除</el-button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-card">
      <el-table :data="tableData" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="46" />
        <el-table-column label="饮品" min-width="200">
          <template #default="{ row }">
            <div class="drink-info">
              <div class="drink-thumb"><img v-if="row.image" :src="row.image" alt="" /><span v-else>☕</span></div>
              <div>
                <div class="drink-name">{{ row.name }}</div>
                <div class="drink-desc">{{ row.description }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="100">
          <template #default="{ row }"><span class="cat-pill">{{ row.categoryName }}</span></template>
        </el-table-column>
        <el-table-column label="价格" width="100">
          <template #default="{ row }"><span class="price">{{ row.price?.toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column label="口味规格" min-width="100">
          <template #default="{ row }">
            <div class="flavors"><span v-for="f in row.flavors" :key="f.name" class="flavor-tag">{{ f.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span class="st-wrap">
              <span class="toggle" :class="{ on: row.status === 1 }"
                @click="handleStatusChange(row.id, row.status === 1 ? 0 : 1)"></span>
              <span class="txt">{{ row.status === 1 ? '起售' : '停售' }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间">
          <template #default="{ row }">{{ formatTime(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <span class="op-text" @click="handleEdit(row)">编辑</span>
            <span class="op-sep"></span>
            <span class="op-text del" @click="handleDelete(row.id)">删除</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <span class="pager-info">共 {{ total }} 条</span>
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :total="total"
          :page-sizes="[10, 20, 50]" layout="sizes, prev, pager, next" @current-change="handlePageChange"
          @size-change="handleSizeChange" />
      </div>
    </div>

    <!-- 新增/编辑抽屉 -->
    <el-drawer v-model="drawerVisible" size="540px" class="drink-drawer">
      <template #header>
        <div class="drawer-title-group">
          <h2 class="drawer-title">{{ drawerTitle }}</h2>
          <p class="drawer-subtitle">填写饮品基本信息与口味规格</p>
        </div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" class="drink-form">
        <el-form-item label="饮品图片" class="image-upload-item">
          <ImageUpload v-model="form.image" />
        </el-form-item>
        <div class="form-two-col">
          <el-form-item label="饮品名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入饮品名称" />
          </el-form-item>
          <el-form-item label="所属分类" prop="categoryId">
            <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
              <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
            </el-select>
          </el-form-item>
        </div>
        <div class="form-two-col">
          <el-form-item label="价格" prop="price">
            <div class="price-input">
              <span class="price-prefix">¥</span>
              <el-input v-model="form.price" placeholder="0.00" />
            </div>
          </el-form-item>
          <el-form-item label="初始状态">
            <div class="switch-field">
              <div class="txt">起售</div>
              <span class="toggle" :class="{ on: form.status === 1 }" @click="form.status = form.status === 1 ? 0 : 1"></span>
            </div>
          </el-form-item>
        </div>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="饮品描述" />
        </el-form-item>
        <el-form-item label="口味规格" class="flavor-item">
          <div class="flavor-list">
            <div v-for="(flavor, index) in form.flavors" :key="index" class="flavor-row">
              <el-input v-model="flavor.name" placeholder="口味名" class="flavor-name-input" />
              <el-input v-model="flavor.value" placeholder="选项（逗号分隔）" class="flavor-value-input" />
              <el-button type="danger" link @click="removeFlavor(index)" class="flavor-del-btn">
                <el-icon>
                  <Delete />
                </el-icon>
              </el-button>
            </div>
            <el-button type="primary" link @click="addFlavor" class="add-flavor-btn">
              + 添加口味规格
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存饮品</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 18px;
}

.page-header h1 {
  font-size: 21px;
  font-weight: 600;
}

.page-header p {
  font-size: 13px;
  color: var(--ink-3);
  margin-top: 5px;
}

.filter-bar {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  margin-bottom: 18px;
  box-shadow: var(--shadow);
}

.category-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.cat-tab {
  font-size: 13px;
  padding: 7px 15px;
  border-radius: 999px;
  cursor: pointer;
  color: var(--ink-2);
  background: var(--surface-2);
  border: 1px solid transparent;
  transition: all 0.15s;
}

.cat-tab:hover {
  color: var(--primary);
}

.cat-tab.active {
  background: var(--primary-weak);
  color: var(--primary);
  font-weight: 600;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* 筛选栏 input/select 尺寸覆盖 */
.filter-row :deep(.el-input__wrapper),
.filter-row :deep(.el-select__wrapper) {
  height: 36px !important;
  min-height: 36px !important;
  max-height: 36px !important;
  padding: 0 12px !important;
}

.batch-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 16px;
  margin-bottom: 14px;
  border-radius: var(--radius);
  background: var(--primary-weak);
  color: var(--primary);
  font-size: 13px;
}

.batch-bar b {
  font-family: var(--font-en);
}

.batch-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.table-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.drink-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drink-thumb {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-sm);
  background: var(--primary-weak);
  display: grid;
  place-items: center;
  color: var(--primary);
  flex-shrink: 0;
  overflow: hidden;
}

.drink-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.drink-name {
  font-weight: 600;
  font-size: 14px;
}

.drink-desc {
  font-size: 12px;
  color: var(--ink-3);
  margin-top: 2px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cat-pill {
  display: inline-block;
  font-size: 12.5px;
  padding: 4px 11px;
  border-radius: var(--radius-sm);
  background: var(--primary-weak);
  color: var(--primary);
  font-weight: 500;
}

.price {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 14px;
  color: var(--ink);
}

.price::before {
  content: '¥';
  font-size: 11px;
  color: var(--ink-3);
  margin-right: 1px;
}

.flavors {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.flavor-tag {
  display: inline-block;
  font-size: 12px;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--ink-2);
  border: 1px solid var(--line);
}

.pager {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 14px;
}

.pager-info {
  font-size: 13px;
  color: var(--ink-3);
}

.op-text {
  font-size: 13px;
  color: var(--primary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 5px;
}

.op-text:hover {
  background: var(--primary-weak);
}

.op-text.del {
  color: var(--off);
}

.op-text.del:hover {
  background: var(--off-weak);
}

.op-sep {
  width: 1px;
  height: 12px;
  background: var(--line-strong);
  margin: 0 2px;
  display: inline-block;
  vertical-align: middle;
}

.toggle {
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: var(--line-strong);
  position: relative;
  cursor: pointer;
  transition: .18s;
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}

.toggle.on {
  background: var(--ok);
}

.toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: .18s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .2);
}

.toggle.on::after {
  left: 20px;
}

.st-wrap {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.st-wrap .txt {
  font-size: 13px;
  color: var(--ink-2);
}

/* ========== 抽屉样式覆盖，匹配原型 ========== */
:deep(.el-drawer) {
  background: var(--bg) !important;
  box-shadow: var(--shadow-lg) !important;
}

:deep(.el-drawer__header) {
  padding: 22px 26px !important;
  margin-bottom: 0 !important;
  background: var(--surface) !important;
  border-bottom: 1px solid var(--line) !important;
}

:deep(.el-drawer__body) {
  padding: 24px 26px !important;
  background: var(--bg) !important;
}

:deep(.el-drawer__footer) {
  padding: 16px 26px !important;
  background: var(--surface) !important;
  border-top: 1px solid var(--line) !important;
  justify-content: flex-end !important;
}

/* 抽屉标题（自定义 header slot） */
.drawer-title-group {
  display: flex;
  flex-direction: column;
}

.drawer-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.4;
}

.drawer-subtitle {
  font-size: 12.5px;
  color: var(--ink-3);
  margin-top: 3px;
}

/* 表单项间距 — 垂直布局（label 在上，input 在下） */
.drink-form :deep(.el-form-item) {
  margin-bottom: 20px !important;
  display: block !important;
}

.drink-form :deep(.el-form-item__label) {
  display: block !important;
  width: auto !important;
  text-align: left !important;
  padding: 0 0 9px 0 !important;
  font-size: 13px !important;
  color: var(--ink-2) !important;
  font-weight: 500 !important;
  line-height: 1.4 !important;
  height: auto !important;
  box-sizing: border-box !important;
}

.drink-form :deep(.el-form-item__content) {
  margin-left: 0 !important;
}

.status-item :deep(.el-form-item__label) {
  padding-bottom: 0 !important;
  margin-bottom: -4px !important;
}

.switch-field-label {
  font-size: 13px;
  color: var(--ink-2);
  font-weight: 500;
}

/* 输入框、选择器、文本域统一样式 */
:deep(.el-input__wrapper),
:deep(.el-select__wrapper),
:deep(.el-textarea__inner) {
  background: var(--surface) !important;
  border: 1px solid var(--line-strong) !important;
  border-radius: var(--radius) !important;
  box-shadow: none !important;
  padding: 0 14px !important;
  font-family: var(--font-cn) !important;
  font-size: 14px !important;
  color: var(--ink) !important;
  transition: all 0.15s !important;
  height: 40px !important;
  min-height: 40px !important;
  max-height: 40px !important;
  box-sizing: border-box !important;
}
:deep(.el-input__inner) {
  height: 100% !important;
  line-height: 1 !important;
}

:deep(.el-input__wrapper:hover),
:deep(.el-select__wrapper:hover),
:deep(.el-select__wrapper.is-hovering),
:deep(.el-textarea__inner:hover) {
  border-color: var(--primary) !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused),
:deep(.el-textarea__inner:focus) {
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 3px var(--primary-weak) !important;
}

:deep(.el-input__inner) {
  font-family: var(--font-cn) !important;
  font-size: 14px !important;
  color: var(--ink) !important;
}

:deep(.el-input__inner::placeholder) {
  color: var(--ink-3) !important;
}

:deep(.el-textarea__inner) {
  resize: vertical !important;
  min-height: 74px !important;
}

/* 价格输入框（¥ 前缀） */
.price-input {
  display: flex;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  padding: 0 14px;
  transition: 0.15s;
  width: 100%;
  height: 40px;
  box-sizing: border-box;
}

.price-input:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-weak);
}

.price-prefix {
  color: var(--ink-3);
  font-family: var(--font-mono);
  font-size: 14px;
  flex-shrink: 0;
  margin-right: 8px;
}

.price-input :deep(.el-input__wrapper) {
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  background: transparent !important;
  height: 100% !important;
}

.price-input :deep(.el-input__inner) {
  font-family: var(--font-mono) !important;
}

/* 两列布局 */
.form-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

/* 状态开关卡片 — 与 input 高度一致 */
.switch-field {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  padding: 0 14px;
  height: 40px;
  box-sizing: border-box;
  width: 100%;
}

.switch-field .txt {
  font-size: 13.5px;
  color: var(--ink);
  flex: 1;
}

.switch-field .txt small {
  display: block;
  color: var(--ink-3);
  font-size: 12px;
  margin-top: 2px;
}

/* 自定义 toggle（与原型完全一致） */
.toggle {
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: var(--line-strong);
  position: relative;
  cursor: pointer;
  transition: .18s;
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
  margin-left: auto;
}

.toggle.on {
  background: var(--ok);
}

.toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: .18s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .2);
}

.toggle.on::after {
  left: 20px;
}

/* 图片上传项 */
.image-upload-item {
  margin-bottom: 20px !important;
}

/* 按钮样式匹配原型 */
:deep(.el-button--primary) {
  background: var(--primary) !important;
  border-color: var(--primary) !important;
  color: #fff !important;
  font-size: 13.5px !important;
  padding: 9px 16px !important;
  border-radius: var(--radius-sm) !important;
}

:deep(.el-button--primary:hover) {
  background: var(--primary-2) !important;
  border-color: var(--primary-2) !important;
}

:deep(.el-button--default) {
  background: var(--surface) !important;
  border: 1px solid var(--line-strong) !important;
  color: var(--ink-2) !important;
  font-size: 13.5px !important;
  padding: 9px 16px !important;
  border-radius: var(--radius-sm) !important;
}

:deep(.el-button--default:hover) {
  border-color: var(--primary) !important;
  color: var(--primary) !important;
}

:deep(.el-button--danger.is-link) {
  color: var(--off) !important;
  font-size: 13px !important;
}

:deep(.el-button--primary.is-link) {
  color: var(--primary) !important;
  font-size: 13.5px !important;
}

/* 关闭按钮 */
:deep(.el-drawer__close-btn) {
  width: 34px !important;
  height: 34px !important;
  border-radius: 8px !important;
}

:deep(.el-drawer__close-btn:hover) {
  background: var(--surface-2) !important;
}

:deep(.el-drawer__close-btn .el-dialog__close) {
  font-size: 18px !important;
  color: var(--ink-2) !important;
}

/* 口味规格区域 */
.flavor-item {
  margin-bottom: 0 !important;
}

.flavor-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
  width: 100%;
}

.flavor-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.flavor-row :deep(.el-input__wrapper) {
  height: 40px !important;
}

.flavor-name-input {
  width: 120px !important;
  flex-shrink: 0;
}

.flavor-value-input {
  flex: 1;
}

.flavor-del-btn {
  width: 38px !important;
  height: 40px !important;
  border-radius: var(--radius-sm) !important;
  border: 1px solid var(--line-strong) !important;
  background: var(--surface) !important;
  color: var(--off) !important;
  display: grid !important;
  place-items: center !important;
  flex-shrink: 0;
  padding: 0 !important;
}

.flavor-del-btn:hover {
  background: var(--off-weak) !important;
  border-color: var(--off) !important;
}

.add-flavor-btn {
  width: 100% !important;
  border: 1.5px dashed var(--line-strong) !important;
  background: transparent !important;
  color: var(--primary) !important;
  border-radius: var(--radius) !important;
  padding: 10px !important;
  font-size: 13.5px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 7px !important;
}

.add-flavor-btn:hover {
  background: var(--primary-weak) !important;
}
</style>
