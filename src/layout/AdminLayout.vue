<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePendingOrders } from '../composables/usePendingOrders'

const router = useRouter()
const route = useRoute()

const isCollapse = ref(false)
const { pendingCount } = usePendingOrders()

// 搜索
const showSearch = ref(false)
const searchQuery = ref('')

// 通知
const notifications = ref([])
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

function toggleSearch() {
  showSearch.value = !showSearch.value
  if (!showSearch.value) searchQuery.value = ''
}

function markAllRead() {
  notifications.value.forEach(n => n.read = true)
}

const menuList = [
  {
    group: '概览',
    items: [
      { path: '/dashboard', title: '工作台', icon: 'dashboard' }
    ]
  },
  {
    group: '商品运营',
    items: [
      { path: '/drink', title: '饮品管理', icon: 'drink' },
      { path: '/category', title: '饮品分类', icon: 'category' }
    ]
  },
  {
    group: '交易',
    items: [
      { path: '/order', title: '订单管理', icon: 'order' }
    ]
  },
  {
    group: '系统',
    items: [
      { path: '/employee', title: '员工管理', icon: 'employee' }
    ]
  }
]

const breadcrumb = computed(() => {
  const matched = route.matched.filter(item => item.meta?.title)
  return matched.map(item => item.meta.title)
})

const userInfo = computed(() => {
  const raw = localStorage.getItem('admin_info')
  return raw ? JSON.parse(raw) : { name: '管理员', role: '店长' }
})

function handleMenuClick(path) {
  router.push(path)
}

function handleLogout() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_info')
  router.push('/login')
}
</script>

<template>
  <div class="admin-layout">
    <!-- 左侧菜单栏 -->
    <aside class="sidebar" :class="{ collapsed: isCollapse }">
      <div class="brand">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12l-1 7a5 5 0 0 1-10 0L6 2Z"/><path d="M6 8H4a2 2 0 0 0 0 4h2"/><path d="M5 22h14"/><path d="M12 14v8"/></svg>
        </div>
        <div v-show="!isCollapse" class="brand-text">
          <span class="brand-name">茶优选</span>
          <span class="brand-sub">餐饮管理后台</span>
        </div>
      </div>

      <nav class="nav-menu">
        <div v-for="group in menuList" :key="group.group" class="menu-group">
          <div v-show="!isCollapse" class="group-title">{{ group.group }}</div>
          <div
            v-for="item in group.items"
            :key="item.path"
            class="menu-item"
            :class="{ active: route.path === item.path }"
            @click="handleMenuClick(item.path)"
          >
            <span class="menu-icon">
              <svg v-if="item.icon === 'dashboard'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
              <svg v-else-if="item.icon === 'drink'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12l-1 7a5 5 0 0 1-10 0L6 2Z"/><path d="M6 8H4a2 2 0 0 0 0 4h2"/><path d="M5 22h14"/></svg>
              <svg v-else-if="item.icon === 'category'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              <svg v-else-if="item.icon === 'order'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2 6 6H2"/><path d="M2 6h20l-2 13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2L2 6Z"/><path d="M9 11v5"/><path d="M15 11v5"/></svg>
              <svg v-else-if="item.icon === 'employee'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>
            </span>
            <span v-show="!isCollapse" class="menu-text">{{ item.title }}</span>
            <span v-if="item.path === '/order' && pendingCount > 0" class="menu-badge">
              <span class="menu-badge-count">{{ pendingCount }}</span>
            </span>
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <span class="version">v1.0</span>
      </div>
    </aside>

    <!-- 右侧主区域 -->
    <div class="main-area">
      <!-- 顶部导航栏 -->
      <header class="topbar">
        <div class="topbar-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </el-icon>
          <div class="breadcrumb">
            <span v-for="(item, index) in breadcrumb" :key="index">
              <span v-if="index > 0" class="sep">/</span>
              <span :class="{ current: index === breadcrumb.length - 1 }">{{ item }}</span>
            </span>
          </div>
        </div>

        <div class="topbar-right">
          <!-- 搜索 -->
          <div class="search-box" v-if="showSearch">
            <input v-model="searchQuery" placeholder="搜索功能、订单、饮品..." autofocus @keyup.esc="toggleSearch" />
            <span class="search-close" @click="toggleSearch">&times;</span>
          </div>
          <el-icon v-else class="topbar-icon" @click="toggleSearch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </el-icon>

          <!-- 通知铃铛 -->
          <el-dropdown trigger="click" @command="markAllRead" placement="bottom-end">
            <el-icon class="topbar-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span class="notify-badge" v-if="unreadCount">{{ unreadCount }}</span>
            </el-icon>
            <template #dropdown>
              <el-dropdown-menu class="notify-dropdown">
                <div class="notify-header">
                  <span>通知</span>
                  <el-button link type="primary" size="small" @click.stop="markAllRead">全部已读</el-button>
                </div>
                <div v-for="n in notifications" :key="n.id" class="notify-item" :class="{ unread: !n.read }">
                  <div class="notify-text">{{ n.text }}</div>
                  <div class="notify-time">{{ n.time }}</div>
                </div>
                <div v-if="notifications.length === 0" class="notify-empty">暂无通知</div>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <div class="user-info">
            <div class="user-avatar">{{ userInfo.name?.charAt(0) || '管' }}</div>
            <div class="user-detail">
              <span class="user-name">{{ userInfo.name }}</span>
              <span class="user-role">{{ userInfo.role }}</span>
            </div>
          </div>
          <el-dropdown @command="handleLogout">
            <span class="logout-btn">
              退出
              <el-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  background: var(--bg);
}

/* 侧栏 */
.sidebar {
  width: 228px;
  flex-shrink: 0;
  background: var(--side-bg);
  color: var(--side-fg);
  display: flex;
  flex-direction: column;
  transition: width 0.2s;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 22px 22px 18px;
}

.logo {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  flex-shrink: 0;
  background: var(--primary);
  color: #fff;
  display: grid;
  place-items: center;
}

.logo svg {
  width: 22px;
  height: 22px;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-family: var(--font-en);
  font-weight: 700;
  font-size: 17px;
  color: var(--side-active-fg);
}

.brand-sub {
  font-size: 11px;
  color: var(--side-fg-dim);
  margin-top: 1px;
}

.nav-menu {
  flex: 1;
  overflow-y: auto;
  padding: 8px 14px;
}

.menu-group {
  margin-bottom: 4px;
}

.group-title {
  font-size: 11px;
  color: var(--side-fg-dim);
  padding: 14px 12px 7px;
  letter-spacing: 0.08em;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--side-fg);
  cursor: pointer;
  font-size: 13.5px;
  margin-bottom: 2px;
  transition: all 0.15s;
}

.menu-item:hover {
  background: var(--side-active-bg);
  color: var(--side-active-fg);
}

.menu-item.active {
  background: var(--side-active-bg);
  color: var(--side-active-fg);
  font-weight: 600;
}

.menu-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-icon svg {
  width: 18px;
  height: 18px;
  opacity: 0.85;
}

.sidebar-footer {
  padding: 14px 20px;
  border-top: 1px solid rgba(255,255,255,0.07);
  font-size: 12px;
  color: var(--side-fg-dim);
}

/* 主区域 */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶栏 */
.topbar {
  height: 62px;
  flex-shrink: 0;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  padding: 0 26px;
  gap: 16px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--ink-2);
  cursor: pointer;
}

.collapse-btn:hover {
  background: var(--surface-2);
}

.collapse-btn svg {
  width: 18px;
  height: 18px;
}

.breadcrumb {
  font-size: 13px;
  color: var(--ink-3);
}

.breadcrumb .sep {
  margin: 0 8px;
}

.breadcrumb .current {
  color: var(--ink);
  font-weight: 600;
}

.topbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 18px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding-left: 18px;
  border-left: 1px solid var(--line);
}

/* 顶栏图标 */
.topbar-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--ink-2);
  cursor: pointer;
  position: relative;
  transition: background 0.15s;
}

.topbar-icon:hover {
  background: var(--surface-2);
  color: var(--ink);
}

.topbar-icon svg {
  width: 18px;
  height: 18px;
}

/* 通知红点 */
.notify-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: var(--el-color-danger);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  display: grid;
  place-items: center;
  padding: 0 4px;
  line-height: 1;
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  background: var(--surface-2);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  padding: 0 12px;
  height: 36px;
  width: 240px;
  transition: border-color 0.15s;
}

.search-box:focus-within {
  border-color: var(--primary);
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--ink);
}

.search-box input::placeholder {
  color: var(--ink-3);
}

.search-close {
  font-size: 18px;
  color: var(--ink-3);
  cursor: pointer;
  padding: 0 2px;
}

.search-close:hover {
  color: var(--ink);
}

/* 通知下拉 */
.notify-dropdown {
  width: 320px;
  padding: 0;
}

.notify-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  border-bottom: 1px solid var(--line);
}

.notify-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: background 0.15s;
}

.notify-item:last-child {
  border-bottom: none;
}

.notify-item:hover {
  background: var(--surface-2);
}

.notify-item.unread {
  background: var(--primary-weak);
}

.notify-text {
  font-size: 13px;
  color: var(--ink);
  line-height: 1.5;
}

.notify-time {
  font-size: 11px;
  color: var(--ink-3);
  margin-top: 4px;
}

.notify-empty {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--ink-3);
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--primary-weak);
  color: var(--primary);
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 14px;
}

.user-detail {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.user-name {
  font-size: 13px;
  color: var(--ink);
}

.user-role {
  font-size: 11px;
  color: var(--ink-3);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--ink-2);
  cursor: pointer;
}

.logout-btn:hover {
  color: var(--primary);
}

.logout-btn svg {
  width: 14px;
  height: 14px;
}

/* 内容区域 */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 26px 40px;
}

/* 菜单 badge */
.menu-badge {
  margin-left: auto;
}

.menu-badge-count {
  font-family: var(--font-en);
  font-size: 11px;
  background: var(--primary);
  color: #fff;
  padding: 1px 7px;
  border-radius: 999px;
}

</style>
