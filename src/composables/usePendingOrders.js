import { ref, onMounted, onUnmounted } from 'vue'
import { getPendingCount } from '../api/order'

/**
 * 待接单数量 WebSocket 监听
 * 页面初始化时 REST 获取初始值，之后 WebSocket 实时更新
 */
export function usePendingOrders() {
  const pendingCount = ref(0)
  let ws = null
  let reconnectTimer = null
  let reconnectDelay = 1000

  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    ws = new WebSocket(`${protocol}//${location.host}/ws/order`)

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'pending') {
          pendingCount.value = data.count
        }
      } catch (_) {}
    }

    ws.onclose = () => {
      reconnectTimer = setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, 30000)
        connect()
      }, reconnectDelay)
    }

    ws.onopen = () => {
      reconnectDelay = 1000
    }
  }

  onMounted(async () => {
    try {
      const res = await getPendingCount()
      pendingCount.value = res.data
    } catch (_) {}
    connect()
  })

  onUnmounted(() => {
    clearTimeout(reconnectTimer)
    if (ws) ws.close()
  })

  return { pendingCount }
}
