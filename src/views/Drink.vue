<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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
const form = ref({ name: '', categoryId: null, price: null, description: '', flavors: [], image: '' })
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
  } catch (e) {} finally { loading.value = false }
}

async function loadCategories() {
  try {
    const res = await request.get('/category/list')
    categoryList.value = res.data
  } catch (e) {}
}

function handleSearch() { queryParams.value.page = 1; loadData() }
function handleReset() { queryParams.value = { page: 1, pageSize: 10, name: '', categoryId: null, status: null }; loadData() }
function handlePageChange(page) { queryParams.value.page = page; loadData() }
function handleSizeChange(size) { queryParams.value.pageSize = size; queryParams.value.page = 1; loadData() }
function handleSelectionChange(rows) { selectedIds.value = rows.map(r => r.id) }

function handleAdd() {
  drawerTitle.value = '新增饮品'
  form.value = { name: '', categoryId: null, price: null, description: '', flavors: [], image: '' }
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
    image: row.image || ''
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
  } catch (e) {}
}

async function handleStatusChange(id, status) {
  try {
    await request.post(`/drink/status/${status}`, null, { params: { ids: String(id) } })
    loadData()
  } catch (e) {}
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定删除该饮品吗？', '提示', { type: 'warning' })
    await request.delete('/drink', { params: { ids: String(id) } })
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {}
}

async function handleBatchStatus(status) {
  if (!selectedIds.value.length) return
  try {
    await request.post(`/drink/status/${status}`, null, { params: { ids: selectedIds.value.join(',') } })
    loadData()
  } catch (e) {}
}

async function handleBatchDelete() {
  if (!selectedIds.value.length) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 个饮品吗？`, '提示', { type: 'warning' })
    await request.delete('/drink', { params: { ids: selectedIds.value.join(',') } })
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {}
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
        <span class="cat-tab" :class="{ active: !queryParams.categoryId }" @click="queryParams.categoryId = null; handleSearch()">全部</span>
        <span v-for="cat in categoryList" :key="cat.id" class="cat-tab" :class="{ active: queryParams.categoryId === cat.id }" @click="queryParams.categoryId = cat.id; handleSearch()">{{ cat.name }}</span>
      </div>
      <div class="filter-row">
        <el-input v-model="queryParams.name" placeholder="饮品名称" clearable style="width: 200px" @clear="handleSearch" @keyup.enter="handleSearch" />
        <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px" @change="handleSearch">
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
          <template #default="{ row }"><span class="price">&yen;{{ row.price?.toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column label="口味规格" min-width="180">
          <template #default="{ row }">
            <div class="flavors"><span v-for="f in row.flavors" :key="f.name" class="flavor-tag">{{ f.name }}</span></div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '起售' : '停售' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="160">
          <template #default="{ row }">{{ formatTime(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="handleStatusChange(row.id, row.status === 1 ? 0 : 1)">{{ row.status === 1 ? '停售' : '起售' }}</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <span class="pager-info">共 {{ total }} 条</span>
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="sizes, prev, pager, next" @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </div>

    <!-- 新增/编辑抽屉 -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="饮品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入饮品名称" />
        </el-form-item>
        <el-form-item label="所属分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="饮品图片">
          <ImageUpload v-model="form.image" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="饮品描述" />
        </el-form-item>
        <el-form-item label="口味规格">
          <div style="width: 100%">
            <div v-for="(flavor, index) in form.flavors" :key="index" style="display: flex; gap: 8px; margin-bottom: 8px">
              <el-input v-model="flavor.name" placeholder="口味名称（如甜度）" style="flex: 1" />
              <el-input v-model="flavor.value" placeholder="选项（逗号分隔）" style="flex: 2" />
              <el-button type="danger" link @click="removeFlavor(index)">删除</el-button>
            </div>
            <el-button type="primary" link @click="addFlavor">+ 添加口味</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; }
.page-header h1 { font-size: 21px; font-weight: 600; }
.page-header p { font-size: 13px; color: var(--ink-3); margin-top: 5px; }
.filter-bar { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 16px 18px; margin-bottom: 18px; box-shadow: var(--shadow); }
.category-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.cat-tab { font-size: 13px; padding: 7px 15px; border-radius: 999px; cursor: pointer; color: var(--ink-2); background: var(--surface-2); border: 1px solid transparent; transition: all 0.15s; }
.cat-tab:hover { color: var(--primary); }
.cat-tab.active { background: var(--primary-weak); color: var(--primary); font-weight: 600; }
.filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.batch-bar { display: flex; align-items: center; gap: 14px; padding: 11px 16px; margin-bottom: 14px; border-radius: var(--radius); background: var(--primary-weak); color: var(--primary); font-size: 13px; }
.batch-bar b { font-family: var(--font-en); }
.batch-actions { margin-left: auto; display: flex; gap: 8px; }
.table-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow); overflow: hidden; }
.drink-info { display: flex; align-items: center; gap: 12px; }
.drink-thumb { width: 46px; height: 46px; border-radius: var(--radius-sm); background: var(--primary-weak); display: grid; place-items: center; color: var(--primary); flex-shrink: 0; overflow: hidden; }
.drink-thumb img { width: 100%; height: 100%; object-fit: cover; }
.drink-name { font-weight: 600; font-size: 14px; }
.drink-desc { font-size: 12px; color: var(--ink-3); margin-top: 2px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cat-pill { display: inline-block; font-size: 12.5px; padding: 4px 11px; border-radius: var(--radius-sm); background: var(--primary-weak); color: var(--primary); font-weight: 500; }
.price { font-family: var(--font-mono); font-weight: 600; font-size: 14px; }
.flavors { display: flex; gap: 5px; flex-wrap: wrap; }
.flavor-tag { display: inline-block; font-size: 12px; padding: 3px 9px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); border: 1px solid var(--line); }
.pager { display: flex; align-items: center; padding: 16px; gap: 14px; }
.pager-info { font-size: 13px; color: var(--ink-3); }
</style>
