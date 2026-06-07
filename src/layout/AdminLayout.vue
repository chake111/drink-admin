<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePendingOrders } from '../composables/usePendingOrders'

const router = useRouter()
const route = useRoute()

const { pendingCount } = usePendingOrders()

// 搜索
const searchQuery = ref('')

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
  if (!confirm('退出登录？')) return
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_info')
  router.push('/login')
}
</script>

<template>
  <div class="admin-layout">
    <!-- 左侧菜单栏 -->
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12l-1 7a5 5 0 0 1-10 0L6 2Z"/><path d="M6 8H4a2 2 0 0 0 0 4h2"/><path d="M5 22h14"/><path d="M12 14v8"/></svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">茶优选</span>
          <span class="brand-sub">餐饮管理后台</span>
        </div>
      </div>

      <nav class="nav-menu">
        <div v-for="group in menuList" :key="group.group" class="menu-group">
          <div class="group-title">{{ group.group }}</div>
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
            <span class="menu-text">{{ item.title }}</span>
            <span v-if="item.path === '/order' && pendingCount > 0" class="menu-badge">
              <span class="menu-badge-count">{{ pendingCount }}</span>
            </span>
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        <span>v1.0</span>
      </div>
    </aside>

    <!-- 右侧主区域 -->
    <div class="main-area">
      <!-- 顶部导航栏 -->
      <header class="topbar">
        <div class="crumb">
          <span v-for="(item, index) in breadcrumb" :key="index">
            <span v-if="index > 0"> / </span>
            <b v-if="index === breadcrumb.length - 1">{{ item }}</b>
            <span v-else>{{ item }}</span>
          </span>
        </div>
        <div class="search-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input v-model="searchQuery" placeholder="搜索…">
        </div>
        <div class="topbar-right">
          <div class="icon-btn" title="通知">
            <span class="ping"></span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
          <div class="user-area" @click="handleLogout" title="点击退出登录">
            <div class="user-avatar">{{ userInfo.name?.charAt(0) || '管' }}</div>
            <div class="user-detail">
              <span class="user-name">{{ userInfo.name }}</span>
              <span class="user-role">{{ userInfo.role }}</span>
            </div>
          </div>
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
  display: flex;
  align-items: center;
  gap: 9px;
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

.crumb {
  font-size: 13px;
  color: var(--ink-3);
}

.crumb b {
  color: var(--ink);
  font-weight: 600;
}

.search-pill {
  margin-left: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 240px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 8px 14px;
  color: var(--ink-3);
}

.search-pill svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.search-pill input {
  border: 0;
  background: transparent;
  outline: 0;
  font-family: var(--font-cn);
  font-size: 13px;
  color: var(--ink);
  width: 100%;
}

.search-pill input::placeholder {
  color: var(--ink-3);
}

.topbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--ink-2);
  cursor: pointer;
  position: relative;
}

.icon-btn:hover {
  background: var(--surface-2);
}

.icon-btn svg {
  width: 18px;
  height: 18px;
}

.icon-btn .ping {
  position: absolute;
  top: 8px;
  right: 9px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid var(--surface);
}

.user-area {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding-left: 16px;
  border-left: 1px solid var(--line);
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
