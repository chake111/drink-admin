<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../api/request.js'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const queryParams = ref({ page: 1, pageSize: 10, name: '', role: '' })
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')
const form = ref({ name: '', account: '', password: '', phone: '', role: '', note: '' })
const formRef = ref(null)

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择岗位', trigger: 'change' }]
}

onMounted(() => { loadData() })

async function loadData() {
  loading.value = true
  try {
    const res = await request.get('/employee/page', { params: queryParams.value })
    tableData.value = res.data.records
    total.value = res.data.total
  } catch (e) {} finally { loading.value = false }
}

function handleSearch() { queryParams.value.page = 1; loadData() }
function handleReset() { queryParams.value = { page: 1, pageSize: 10, name: '', role: '' }; loadData() }
function handlePageChange(page) { queryParams.value.page = page; loadData() }
function handleSizeChange(size) { queryParams.value.pageSize = size; queryParams.value.page = 1; loadData() }

function handleAdd() {
  dialogTitle.value = '新增员工'
  form.value = { name: '', account: '', password: '', phone: '', role: '', note: '' }
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑员工'
  form.value = { ...row, password: '' }
  dialogVisible.value = true
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    if (form.value.id) {
      await request.put('/employee', form.value)
      ElMessage.success('修改成功')
    } else {
      await request.post('/employee', form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {}
}

async function handleStatusChange(row) {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await request.post(`/employee/status/${newStatus}`, null, { params: { id: row.id } })
    loadData()
  } catch (e) {}
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定删除该员工吗？', '提示', { type: 'warning' })
    await request.delete(`/employee/${row.id}`)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {}
}
</script>

<template>
  <div class="employee-page">
    <div class="page-header">
      <div>
        <h1>员工管理</h1>
        <p>管理系统员工账号，支持新增、编辑、启用停用</p>
      </div>
      <el-button type="primary" @click="handleAdd">新增员工</el-button>
    </div>

    <div class="filter-bar">
      <el-input v-model="queryParams.name" placeholder="员工姓名" clearable style="width: 200px" @clear="handleSearch" @keyup.enter="handleSearch" />
      <el-select v-model="queryParams.role" placeholder="全部岗位" clearable style="width: 120px" @change="handleSearch">
        <el-option label="店长" value="店长" />
        <el-option label="咖啡师" value="咖啡师" />
        <el-option label="茶艺师" value="茶艺师" />
        <el-option label="收银员" value="收银员" />
      </el-select>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" @click="handleSearch">查询</el-button>
    </div>

    <div class="table-card">
      <el-table :data="tableData" v-loading="loading">
        <el-table-column label="姓名" prop="name" width="100" />
        <el-table-column label="账号" prop="account" width="120" />
        <el-table-column label="手机号" prop="phone" width="140" />
        <el-table-column label="岗位" prop="role" width="100">
          <template #default="{ row }"><el-tag size="small">{{ row.role }}</el-tag></template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="note" min-width="150" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="createTime" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="handleStatusChange(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)" :disabled="row.role === '店长'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <span class="pager-info">共 {{ total }} 条</span>
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="sizes, prev, pager, next" @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入登录账号" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="密码" :prop="form.id ? '' : 'password'">
          <el-input v-model="form.password" type="password" show-password :placeholder="form.id ? '不修改请留空' : '请输入密码'" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="岗位" prop="role">
          <el-select v-model="form.role" placeholder="请选择岗位">
            <el-option label="店长" value="店长" />
            <el-option label="咖啡师" value="咖啡师" />
            <el-option label="茶艺师" value="茶艺师" />
            <el-option label="收银员" value="收银员" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" placeholder="备注信息" />
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
.filter-bar { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 16px 18px; margin-bottom: 18px; box-shadow: var(--shadow); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.table-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow); overflow: hidden; }
.pager { display: flex; align-items: center; padding: 16px; gap: 14px; }
.pager-info { font-size: 13px; color: var(--ink-3); }
</style>
