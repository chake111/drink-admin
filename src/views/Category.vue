<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import request from '../utils/request.js'
import { updateCategorySort } from '../api/category.js'

const loading = ref(false)
const tableData = ref([])
const drawerVisible = ref(false)
const drawerTitle = ref('新增分类')
const form = ref({ name: '', icon: '', sort: 0, status: 1 })
const formRef = ref(null)

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

// 图标映射
const iconMap = {
  cup: '<path d="M6 2h12l-1 7a5 5 0 0 1-10 0L6 2Z"/><path d="M6 8H4a2 2 0 0 0 0 4h2"/><path d="M5 22h14"/>',
  coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>',
  fruit: '<path d="M12 2a3 3 0 0 0 3 3"/><path d="M18.5 7.5C20 9 21 11.5 21 14a9 9 0 0 1-18 0c0-3 1.5-6 4-7.5C9 5 11 6 12 6s3-1 4.5 0Z"/>',
  soda: '<path d="M5 7h14l-1.5 13a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1L5 7Z"/><path d="M5 7l1-3h12l1 3"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  cake: '<path d="M3 21h18M4 16h16v5H4zM5 16v-4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/><path d="M12 6V3M9 6V4M15 6V4"/>'
}

// 可选图标列表（用于 picker）
const iconOptions = Object.keys(iconMap)

onMounted(() => { loadData() })

async function loadData() {
  loading.value = true
  try {
    const res = await request.get('/category/list')
    console.log('[loadData] 返回数据 =', res.data)
    tableData.value = res.data
  } catch (e) {} finally { loading.value = false }
}

function handleAdd() {
  drawerTitle.value = '新增分类'
  form.value = { name: '', icon: '', sort: 0, status: 1 }
  drawerVisible.value = true
}

function handleEdit(row) {
  drawerTitle.value = '编辑分类'
  form.value = { ...row }
  drawerVisible.value = true
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    if (!form.value.icon) {
      ElMessage.warning('请选择一个图标')
      return
    }
    if (form.value.id) {
      await request.put('/category', form.value)
      ElMessage.success('修改成功')
    } else {
      await request.post('/category', form.value)
      ElMessage.success('新增成功')
    }
    drawerVisible.value = false
    loadData()
  } catch (e) {}
}

async function handleStatusChange(row) {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await request.post(`/category/status/${newStatus}`, null, { params: { id: row.id } })
    loadData()
    ElMessage.success(newStatus === 1 ? '已启用：' + row.name : '已停用：' + row.name)
  } catch (e) {}
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除分类「${row.name}」吗？`, '提示', { type: 'warning' })
    await request.delete(`/category/${row.id}`)
    ElMessage.success('已删除')
    loadData()
  } catch (e) {}
}

async function handleDragEnd() {
  const ids = tableData.value.map(c => c.id)
  console.log('[sort] 发送排序请求 ids =', ids)
  try {
    const res = await updateCategorySort(ids)
    console.log('[sort] 响应 =', res)
    ElMessage.success('排序已更新')
    loadData()
  } catch (e) {
    console.error('[sort] 失败 =', e)
    ElMessage.error('排序更新失败')
    loadData()
  }
}
</script>

<template>
  <div class="category-page">
    <div class="page-header">
      <div>
        <h1>饮品分类</h1>
        <p>管理饮品分类，支持排序、启用停用；停用后该分类饮品在用户端隐藏</p>
      </div>
      <el-button type="primary" @click="handleAdd">新增分类</el-button>
    </div>

    <!-- 卡片网格（可拖拽排序） -->
    <draggable
      v-model="tableData"
      item-key="id"
      handle=".drag-handle"
      animation="200"
      ghost-class="cat-ghost"
      chosen-class="cat-chosen"
      drag-class="cat-drag"
      :disabled="loading"
      v-loading="loading"
      class="cat-grid"
      @end="handleDragEnd"
    >
      <template #item="{ element: cat }">
        <div class="cat-card">
          <div class="drag-handle" title="拖拽排序">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="5" cy="3" r="1.5"/><circle cx="11" cy="3" r="1.5"/><circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/><circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="13" r="1.5"/></svg>
          </div>
          <div class="cat-icon">
            <svg v-if="iconMap[cat.icon]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="iconMap[cat.icon]"></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </div>
          <div class="cat-mid">
            <div class="cat-name">{{ cat.name }}</div>
            <div class="cat-meta">{{ cat.drinkCount ?? 0 }} 款饮品 · {{ cat.status === 1 ? '已启用' : '已停用' }}</div>
          </div>
          <div class="cat-actions">
            <span class="toggle" :class="{ on: cat.status === 1 }" @click="handleStatusChange(cat)"></span>
            <div class="cat-ops">
              <span class="op-text" @click="handleEdit(cat)">编辑</span>
              <span class="op-sep"></span>
              <span class="op-text del" @click="handleDelete(cat)">删除</span>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div v-if="!loading && tableData.length === 0" class="cat-empty">
          暂无分类数据
        </div>
      </template>
    </draggable>

    <p class="cat-foot" v-if="tableData.length > 0">共 {{ tableData.length }} 个分类</p>

    <!-- 新增/编辑抽屉 -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="如：奶茶、咖啡、鲜果茶" />
        </el-form-item>
        <el-form-item label="分类图标">
          <div class="icon-picker">
            <div
              v-for="key in iconOptions"
              :key="key"
              class="icon-opt"
              :class="{ picked: form.icon === key }"
              @click="form.icon = key"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="iconMap[key]"></svg>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="form.sort" :min="0" placeholder="数字越小越靠前" />
        </el-form-item>
        <el-form-item label="状态">
          <div class="switch-field">
            <div class="switch-text">启用<small>停用后该分类在用户端隐藏</small></div>
            <span class="toggle" :class="{ on: form.status === 1 }" @click="form.status = form.status === 1 ? 0 : 1"></span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存分类</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; }
.page-header h1 { font-size: 21px; font-weight: 600; }
.page-header p { font-size: 13px; color: var(--ink-3); margin-top: 5px; }

/* 卡片网格 */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.cat-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 18px;
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.15s;
  user-select: none;
}

.cat-card:hover {
  border-color: var(--line-strong);
  transform: translateY(-2px);
}

/* 拖拽手柄 */
.drag-handle {
  cursor: grab;
  color: var(--ink-3);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
}

.drag-handle:hover {
  color: var(--primary);
  background: var(--primary-weak);
}

.drag-handle:active {
  cursor: grabbing;
}

/* 拖拽占位符（ghost） */
.cat-ghost {
  opacity: 0.4;
  border: 2px dashed var(--primary) !important;
  background: var(--primary-weak) !important;
  box-shadow: none !important;
}

/* 被选中时 */
.cat-chosen {
  box-shadow: var(--shadow-lg) !important;
  transform: scale(1.02);
}

/* 拖拽中 */
.cat-drag {
  opacity: 0.9;
  transform: rotate(1.5deg);
}

.cat-icon {
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: var(--primary-weak);
  color: var(--primary);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.cat-icon svg {
  width: 24px;
  height: 24px;
}

.cat-mid {
  flex: 1;
  min-width: 0;
}

.cat-name {
  font-size: 15px;
  font-weight: 600;
}

.cat-meta {
  font-size: 12.5px;
  color: var(--ink-3);
  margin-top: 3px;
}

.cat-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.cat-ops {
  display: flex;
  gap: 2px;
}

.op-text {
  font-size: 13px;
  color: var(--primary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 5px;
}

.op-text:hover { background: var(--primary-weak); }
.op-text.del { color: var(--off); }
.op-text.del:hover { background: var(--off-weak); }

.op-sep {
  width: 1px;
  height: 12px;
  background: var(--line-strong);
  margin: 0 2px;
  align-self: center;
}

/* toggle 开关 */
.toggle {
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: var(--line-strong);
  position: relative;
  cursor: pointer;
  transition: 0.18s;
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}

.toggle.on { background: var(--ok); }

.toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: 0.18s;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}

.toggle.on::after { left: 20px; }

.cat-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: var(--ink-3);
  font-size: 14px;
}

.cat-foot {
  margin-top: 22px;
  font-size: 13px;
  color: var(--ink-3);
}

/* 图标选择器 */
.icon-picker {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.icon-opt {
  width: 56px;
  height: 56px;
  border-radius: var(--radius);
  border: 2px solid var(--line);
  background: var(--surface);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--ink-2);
}

.icon-opt:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.icon-opt.picked {
  border-color: var(--primary);
  background: var(--primary-weak);
  color: var(--primary);
}

.icon-opt svg {
  width: 26px;
  height: 26px;
}

/* switch-field */
.switch-field {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 13px 16px;
  width: 100%;
}

.switch-text {
  font-size: 13.5px;
}

.switch-text small {
  display: block;
  color: var(--ink-3);
  font-size: 12px;
  margin-top: 2px;
}

.switch-field .toggle {
  margin-left: auto;
}
</style>
