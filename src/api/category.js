import request from '../utils/request'

export function listCategory() {
  return request({ url: '/category/list', method: 'get' })
}

export function addCategory(data) {
  return request({ url: '/category', method: 'post', data })
}

export function updateCategory(data) {
  return request({ url: '/category', method: 'put', data })
}

export function deleteCategory(id) {
  return request({ url: `/category/${id}`, method: 'delete' })
}

export function updateCategoryStatus(id, status) {
  return request({ url: `/category/status/${status}`, method: 'post', params: { id } })
}

export function updateCategorySort(ids) {
  return request({ url: '/category/sort', method: 'put', data: { ids } })
}
