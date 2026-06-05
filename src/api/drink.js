import request from '../utils/request'

export function pageDrink(params) {
  return request({ url: '/drink/page', method: 'get', params })
}

export function getDrink(id) {
  return request({ url: `/drink/${id}`, method: 'get' })
}

export function addDrink(data) {
  return request({ url: '/drink', method: 'post', data, headers: { 'Content-Type': 'multipart/form-data' } })
}

export function updateDrink(data) {
  return request({ url: '/drink', method: 'put', data, headers: { 'Content-Type': 'multipart/form-data' } })
}

export function updateDrinkStatus(ids, status) {
  return request({ url: `/drink/status/${status}`, method: 'post', params: { ids } })
}

export function deleteDrink(ids) {
  return request({ url: '/drink', method: 'delete', params: { ids } })
}
