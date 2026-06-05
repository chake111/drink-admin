<script setup>
import { ref, onMounted } from 'vue'
import request from '../api/request.js'

const todayData = ref({
  todayOrders: 0,
  todayAmount: 0,
  pendingOrders: 0,
  completedOrders: 0
})

const trendData = ref([])
const topData = ref([])

onMounted(async () => {
  try {
    const [todayRes, trendRes, topRes] = await Promise.all([
      request.get('/dashboard/today'),
      request.get('/dashboard/trend'),
      request.get('/dashboard/top')
    ])
    todayData.value = todayRes.data
    trendData.value = trendRes.data
    topData.value = topRes.data
  } catch (e) {
    // 接口未实现时使用占位数据
  }
})
</script>

<template>
  <div class="dashboard-page">
    <div class="page-header">
      <div>
        <h1>工作台</h1>
        <p>今日门店运营数据概览</p>
      </div>
    </div>

    <!-- 数据卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon orders">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2 6 6H2"/><path d="M2 6h20l-2 13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2L2 6Z"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">今日订单</span>
          <span class="stat-value">{{ todayData.todayOrders }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon amount">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">今日营收</span>
          <span class="stat-value">&yen;{{ todayData.todayAmount?.toFixed(2) }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon pending">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">待处理</span>
          <span class="stat-value">{{ todayData.pendingOrders }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon completed">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">已完成</span>
          <span class="stat-value">{{ todayData.completedOrders }}</span>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-row">
      <div class="chart-card">
        <h3>近7日销售趋势</h3>
        <div class="chart-placeholder">
          <p>图表区域（需集成 ECharts）</p>
        </div>
      </div>

      <div class="chart-card">
        <h3>热销 TOP5</h3>
        <div class="top-list">
          <div v-for="(item, index) in topData" :key="index" class="top-item">
            <span class="top-rank">{{ index + 1 }}</span>
            <span class="top-name">{{ item.drinkName }}</span>
            <span class="top-count">{{ item.count }} 杯</span>
          </div>
          <div v-if="topData.length === 0" class="empty-tip">暂无数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 24px;
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

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-icon.orders {
  background: var(--primary-weak);
  color: var(--primary);
}

.stat-icon.amount {
  background: var(--ok-weak);
  color: var(--ok);
}

.stat-icon.pending {
  background: #FFF3E0;
  color: #F57C00;
}

.stat-icon.completed {
  background: var(--ok-weak);
  color: var(--ok);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 13px;
  color: var(--ink-3);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--ink);
  font-family: var(--font-en);
}

.chart-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 18px;
}

.chart-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow);
}

.chart-card h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
}

.chart-placeholder {
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-3);
  font-size: 14px;
}

.top-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}

.top-item:last-child {
  border-bottom: none;
}

.top-rank {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--primary-weak);
  color: var(--primary);
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 13px;
}

.top-name {
  flex: 1;
  font-size: 14px;
}

.top-count {
  font-size: 13px;
  color: var(--ink-3);
  font-family: var(--font-en);
}

.empty-tip {
  text-align: center;
  color: var(--ink-3);
  padding: 40px 0;
}
</style>
