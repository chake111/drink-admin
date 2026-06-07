<script setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import request from '../api/request.js'
import * as echarts from 'echarts'

const todayData = ref({
  todayOrders: 0,
  todayAmount: 0,
  pendingOrders: 0,
  completedOrders: 0,
  ordersChange: 0,    // 订单环比变化
  amountChange: 0,    // 营收环比变化
  pendingChange: 0,   // 待接单环比变化
  completedChange: 0  // 已完成环比变化
})

const trendData = ref([])
const topData = ref([])
const hasTrendData = computed(() => trendData.value.length > 0)

// 监听数据变化，动态渲染图表
watch(trendData, async (newVal) => {
  if (newVal.length > 0) {
    await nextTick()
    renderTrendChart()
  }
})

// ECharts 实例引用
let trendChart = null

// ECharts 容器 ref
const trendChartRef = ref(null)

/** 渲染趋势图 */
function renderTrendChart() {
  const chartDom = trendChartRef.value
  if (!chartDom) return

  if (trendChart) {
    trendChart.dispose()
  }

  trendChart = echarts.init(chartDom)

  const dates = trendData.value.map(item => item.date)
  const amounts = trendData.value.map(item => item.amount)
  const counts = trendData.value.map(item => item.count)

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#EBE2D7',
      textStyle: { color: '#2B211C', fontSize: 13 },
      formatter(params) {
        let html = `<div style="font-weight:600;margin-bottom:4px">${params[0].axisValue}</div>`
        params.forEach(p => {
          const marker = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>`
          const val = p.seriesName === '营业额'
            ? `¥${Number(p.value).toFixed(2)}`
            : `${p.value} 单`
          html += `<div style="margin:2px 0">${marker}${p.seriesName}：${val}</div>`
        })
        return html
      }
    },
    legend: {
      data: ['营业额', '订单数'],
      right: 20,
      top: 0,
      textStyle: { color: '#7A6A5D', fontSize: 13 }
    },
    grid: {
      left: 20,
      right: 20,
      bottom: 16,
      top: 40,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#EBE2D7' } },
      axisLabel: { color: '#A8988B', fontSize: 12 },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#EBE2D7', type: 'dashed' } },
        axisLabel: { color: '#A8988B', fontSize: 12 }
      },
      {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#A8988B', fontSize: 12 }
      }
    ],
    series: [
      {
        name: '营业额',
        type: 'line',
        data: amounts,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 2.5, color: '#A6643C' },
        itemStyle: { color: '#A6643C', borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(166,100,60,0.25)' },
            { offset: 1, color: 'rgba(166,100,60,0.02)' }
          ])
        }
      },
      {
        name: '订单数',
        type: 'bar',
        yAxisIndex: 1,
        data: counts,
        barWidth: 24,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(94,138,85,0.6)' },
            { offset: 1, color: 'rgba(94,138,85,0.15)' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }

  trendChart.setOption(option)
}

/** 窗口 resize 处理 */
function handleResize() {
  trendChart && trendChart.resize()
}

onMounted(async () => {
  try {
    const [todayRes, trendRes, topRes] = await Promise.all([
      request.get('/dashboard/today'),
      request.get('/dashboard/trend'),
      request.get('/dashboard/top')
    ])
    todayData.value = todayRes.data || todayData.value
    trendData.value = trendRes.data || []
    topData.value = topRes.data || []
  } catch (e) {
    // 接口未实现时使用占位数据
  }

  await nextTick()
  if (hasTrendData.value) {
    renderTrendChart()
  }
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (trendChart) {
    trendChart.dispose()
    trendChart = null
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
          <span class="stat-change" :class="{ up: todayData.ordersChange > 0, down: todayData.ordersChange < 0 }" v-if="todayData.ordersChange !== 0">
            <svg v-if="todayData.ordersChange > 0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            {{ Math.abs(todayData.ordersChange) }}%
          </span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon amount">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">今日营收</span>
          <span class="stat-value">&yen;{{ Number(todayData.todayAmount || 0).toFixed(2) }}</span>
          <span class="stat-change" :class="{ up: todayData.amountChange > 0, down: todayData.amountChange < 0 }" v-if="todayData.amountChange !== 0">
            <svg v-if="todayData.amountChange > 0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            {{ Math.abs(todayData.amountChange) }}%
          </span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon pending">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">待接单</span>
          <span class="stat-value">{{ todayData.pendingOrders }}</span>
          <span class="stat-change" :class="{ up: todayData.pendingChange > 0, down: todayData.pendingChange < 0 }" v-if="todayData.pendingChange !== 0">
            <svg v-if="todayData.pendingChange > 0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            {{ Math.abs(todayData.pendingChange) }}%
          </span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon completed">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">已完成</span>
          <span class="stat-value">{{ todayData.completedOrders }}</span>
          <span class="stat-change" :class="{ up: todayData.completedChange > 0, down: todayData.completedChange < 0 }" v-if="todayData.completedChange !== 0">
            <svg v-if="todayData.completedChange > 0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            {{ Math.abs(todayData.completedChange) }}%
          </span>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-row">
      <div class="chart-card">
        <h3>近7日销售趋势</h3>
        <div v-if="hasTrendData" ref="trendChartRef" class="chart-container"></div>
        <div v-else class="chart-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          <span>暂无趋势数据</span>
        </div>
      </div>

      <div class="chart-card">
        <h3>热销 TOP5</h3>
        <div class="top-list">
          <div v-for="(item, index) in topData" :key="index" class="top-item">
            <span class="top-rank" :class="{ gold: index === 0, silver: index === 1, bronze: index === 2 }">{{ index + 1 }}</span>
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

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 18px;
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
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(58,40,28,.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
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
  background: var(--warn-weak);
  color: var(--warn);
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

.stat-change {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 500;
  margin-top: 4px;
  font-family: var(--font-en);
}

.stat-change svg {
  width: 14px;
  height: 14px;
}

.stat-change.up {
  color: var(--ok);
}

.stat-change.down {
  color: var(--el-color-danger, #F56C6C);
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

.chart-container {
  height: 300px;
  width: 100%;
}

.chart-empty {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--ink-3);
  font-size: 13px;
}

.chart-empty .empty-icon {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.top-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
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
  flex-shrink: 0;
}

.top-rank.gold {
  background: #FFF7E6;
  color: #D48806;
}

.top-rank.silver {
  background: #F0F0F0;
  color: #8C8C8C;
}

.top-rank.bronze {
  background: #FFF1E8;
  color: #D46B08;
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

/* 响应式布局 */
@media (max-width: 1200px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stat-cards {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
