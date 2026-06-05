import request from '../utils/request'

export function getToday() {
  return request({ url: '/dashboard/today', method: 'get' })
}

export function getTrend() {
  return request({ url: '/dashboard/trend', method: 'get' })
}

export function getTop() {
  return request({ url: '/dashboard/top', method: 'get' })
}
