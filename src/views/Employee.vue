<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request.js'
import { formatTime } from '../utils/format.js'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const queryParams = ref({ page: 1, pageSize: 10, name: '', role: '' })
const roleFilter = ref('all')
const drawerVisible = ref(false)
const drawerTitle = ref('新增员工')
const form = ref({ name: '', account: '', password: '', phone: '', role: '', status: 1, note: '' })
const formRef = ref(null)

const roles = ['店长', '咖啡师', '茶艺师', '收银员']

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择岗位', trigger: 'change' }]
}

// 角色计数
const roleCounts = computed(() => {
  const counts = { all: tableData.value.length }
  roles.forEach(r => { counts[r] = tableData.value.filter(e => e.role === r).length })
  return counts
})

const filteredData = computed(() => {
  if (roleFilter.value === 'all') return tableData.value
  return tableData.value.filter(e => e.role === roleFilter.value)
})

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
  drawerTitle.value = '新增员工'
  form.value = { name: '', account: '', password: '', phone: '', role: '', status: 1, note: '' }
  drawerVisible.value = true
}

function handleEdit(row) {
  drawerTitle.value = '编辑员工'
  form.value = { ...row, password: '' }
  drawerVisible.value = true
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
    drawerVisible.value = false
    loadData()
  } catch (e) {}
}

async function handleStatusChange(row) {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await request.post(`/employee/status/${newStatus}`, null, { params: { id: row.id } })
    loadData()
    ElMessage.success(newStatus === 1 ? '已启用：' + row.name : '已停用：' + row.name)
  } catch (e) {}
}

async function handleDelete(row) {
  if (row.role === '店长') { ElMessage.warning('店长账号不可删除'); return }
  try {
    await ElMessageBox.confirm(`确认删除员工「${row.name}」？`, '提示', { type: 'warning' })
    await request.delete(`/employee/${row.id}`)
    ElMessage.success('已删除')
    loadData()
  } catch (e) {}
}

function setRoleFilter(role) {
  roleFilter.value = role
}
</script>

<template>
  <div class="employee-page">
    <div class="page-header">
      <div>
        <h1>员工管理</h1>
        <p>管理门店员工账号，新增岗位与权限控制</p>
      </div>
      <el-button type="primary" @click="handleAdd">新增员工</el-button>
    </div>

    <!-- 角色 tab 筛选 -->
    <div class="role-tabs">
      <button
        v-for="[key, label] in [['all', '全部'], ...roles.map(r => [r, r])]"
        :key="key"
        :class="{ on: roleFilter === key }"
        @click="setRoleFilter(key)"
      >{{ label }}<span class="cnt">{{ roleCounts[key] || 0 }}</span></button>
    </div>

    <div class="table-card">
      <el-table :data="filteredData" v-loading="loading">
        <el-table-column label="姓名" width="120">
          <template #default="{ row }">
            <div class="emp-name">
              <div class="emp-avatar">{{ row.name?.charAt(0) }}</div>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="账号" prop="account" width="120" />
        <el-table-column label="手机号" prop="phone" width="140" />
        <el-table-column label="岗位" width="100">
          <template #default="{ row }"><span class="role-pill">{{ row.role }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <span class="st-wrap">
              <span class="toggle" :class="{ on: row.status === 1 }" @click="handleStatusChange(row)"></span>
              <span class="txt">{{ row.status === 1 ? '启用' : '停用' }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="note" min-width="150" show-overflow-tooltip />
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <span class="op-text" @click="handleEdit(row)">编辑</span>
            <span class="op-sep"></span>
            <span class="op-text del" @click="handleDelete(row)" :class="{ disabled: row.role === '店长' }">删除</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <span class="pager-info">共 {{ total }} 条</span>
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="sizes, prev, pager, next" @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </div>

    <!-- 新增/编辑抽屉 -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="如：张晓雯" />
        </el-form-item>
        <el-form-item label="登录账号" prop="account">
          <el-input v-model="form.account" placeholder="如：zhangxw" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="密码" :prop="form.id ? '' : 'password'">
          <el-input v-model="form.password" type="password" show-password :placeholder="form.id ? '不修改请留空' : '请输入密码'" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="如：13800001234" />
        </el-form-item>
        <el-form-item label="岗位" prop="role">
          <el-select v-model="form.role" placeholder="请选择岗位" style="width: 100%">
            <el-option v-for="r in roles" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号状态">
          <div class="switch-field">
            <div class="switch-text">启用<small>停用后该员工无法登录管理后台</small></div>
            <span class="toggle" :class="{ on: form.status === 1 }" @click="form.status = form.status === 1 ? 0 : 1"></span>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="2" placeholder="如：擅长手冲与拉花，负责早班" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存员工</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; }
.page-header h1 { font-size: 21px; font-weight: 600; }
.page-header p { font-size: 13px; color: var(--ink-3); margin-top: 5px; }

/* 角色 tab 筛选 — 与原型 .ostat-tabs 一致 */
.role-tabs {
  display: flex;
  gap: 4px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 4px;
  margin-bottom: 18px;
  width: fit-content;
}

.role-tabs button {
  font-size: 13px;
  border: 0;
  background: transparent;
  color: var(--ink-2);
  padding: 8px 16px;
  border-radius: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 7px;
  transition: all 0.13s;
}

.role-tabs button .cnt {
  font-family: var(--font-en);
  font-size: 11px;
  background: var(--line-strong);
  color: var(--ink-2);
  padding: 0 6px;
  border-radius: 999px;
  min-width: 18px;
  text-align: center;
}

.role-tabs button.on {
  background: var(--surface);
  color: var(--primary);
  font-weight: 600;
  box-shadow: var(--shadow);
}

.role-tabs button.on .cnt {
  background: var(--primary);
  color: #fff;
}

.table-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow); overflow: hidden; }

.emp-name { display: flex; align-items: center; gap: 10px; }
.emp-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--primary-weak);
  color: var(--primary);
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.role-pill {
  display: inline-block;
  font-size: 12.5px;
  padding: 4px 11px;
  border-radius: var(--radius-sm);
  background: var(--primary-weak);
  color: var(--primary);
  font-weight: 500;
}

/* toggle 开关 */
.toggle {
  width: 40px; height: 22px; border-radius: 999px;
  background: var(--line-strong); position: relative;
  cursor: pointer; transition: .18s; flex-shrink: 0;
  display: inline-block; vertical-align: middle;
}
.toggle.on { background: var(--ok); }
.toggle::after {
  content: ''; position: absolute; top: 2px; left: 2px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #fff; transition: .18s; box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.toggle.on::after { left: 20px; }
.st-wrap { display: inline-flex; align-items: center; gap: 9px; }
.st-wrap .txt { font-size: 13px; color: var(--ink-2); }

/* 操作按钮 */
.op-text { font-size: 13px; color: var(--primary); cursor: pointer; padding: 4px 8px; border-radius: 5px; }
.op-text:hover { background: var(--primary-weak); }
.op-text.del { color: var(--off); }
.op-text.del:hover { background: var(--off-weak); }
.op-text.disabled { opacity: 0.4; cursor: not-allowed; }
.op-text.disabled:hover { background: transparent; }
.op-sep { width: 1px; height: 12px; background: var(--line-strong); margin: 0 2px; display: inline-block; vertical-align: middle; }

.pager { display: flex; align-items: center; padding: 16px; gap: 14px; }
.pager-info { font-size: 13px; color: var(--ink-3); }

/* switch-field */
.switch-field {
  display: flex; align-items: center; gap: 12px;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius); padding: 13px 16px; width: 100%;
}
.switch-text { font-size: 13.5px; }
.switch-text small { display: block; color: var(--ink-3); font-size: 12px; margin-top: 2px; }
.switch-field .toggle { margin-left: auto; }
</style>
