import request from '../utils/request'

export function pageOrder(params) {
  return request({ url: '/order/page', method: 'get', params })
}

export function getOrder(id) {
  return request({ url: `/order/${id}`, method: 'get' })
}

export function confirmOrder(id) {
  return request({ url: `/order/confirm/${id}`, method: 'post' })
}

export function completeOrder(id) {
  return request({ url: `/order/complete/${id}`, method: 'post' })
}

export function pickupOrder(id) {
  return request({ url: `/order/pickup/${id}`, method: 'post' })
}

export function rejectOrder(id, reason) {
  return request({ url: `/order/reject/${id}`, method: 'post', data: { rejectReason: reason } })
}
