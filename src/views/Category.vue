<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../api/request.js'
import { formatTime } from '../utils/format.js'

const loading = ref(false)
const tableData = ref([])
const searchText = ref('')
const statusFilter = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('新增分类')
const form = ref({ name: '', icon: '', sort: 0, status: 1 })
const formRef = ref(null)

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

const filteredData = computed(() => {
  return tableData.value.filter(item => {
    const matchName = !searchText.value || item.name.includes(searchText.value)
    const matchStatus = statusFilter.value === '' || item.status === statusFilter.value
    return matchName && matchStatus
  })
})

onMounted(() => { loadData() })

async function loadData() {
  loading.value = true
  try {
    const res = await request.get('/category/list')
    tableData.value = res.data
  } catch (e) {} finally { loading.value = false }
}

function handleAdd() {
  dialogTitle.value = '新增分类'
  form.value = { name: '', icon: '', sort: 0, status: 1 }
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑分类'
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    if (form.value.id) {
      await request.put('/category', form.value)
      ElMessage.success('修改成功')
    } else {
      await request.post('/category', form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {}
}

async function handleStatusChange(row) {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await request.post(`/category/status/${newStatus}`, null, { params: { id: row.id } })
    loadData()
  } catch (e) {}
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定删除该分类吗？', '提示', { type: 'warning' })
    await request.delete(`/category/${row.id}`)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {}
}
</script>

<template>
  <div class="category-page">
    <div class="page-header">
      <div>
        <h1>饮品分类</h1>
        <p>管理饮品分类，支持新增、编辑、启用停用</p>
      </div>
      <el-button type="primary" @click="handleAdd">新增分类</el-button>
    </div>

    <div class="search-bar">
      <el-input v-model="searchText" placeholder="搜索分类名称" clearable style="width: 220px" />
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 140px">
        <el-option label="启用" :value="1" />
        <el-option label="停用" :value="0" />
      </el-select>
    </div>

    <div class="table-card">
      <el-table :data="filteredData" v-loading="loading">
        <el-table-column label="分类名称" prop="name" min-width="150" />
        <el-table-column label="图标" prop="icon" width="100" />
        <el-table-column label="排序" prop="sort" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="handleStatusChange(row)">
              {{ row.status === 1 ? '停用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="图标标识">
          <el-input v-model="form.icon" placeholder="请输入图标标识" />
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; }
.page-header h1 { font-size: 21px; font-weight: 600; }
.page-header p { font-size: 13px; color: var(--ink-3); margin-top: 5px; }
.search-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.table-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow); overflow: hidden; }
</style>
