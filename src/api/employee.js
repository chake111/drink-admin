import request from '../utils/request'

export function pageEmployee(params) {
  return request({ url: '/employee/page', method: 'get', params })
}

export function addEmployee(data) {
  return request({ url: '/employee', method: 'post', data })
}

export function updateEmployee(data) {
  return request({ url: '/employee', method: 'put', data })
}

export function updateEmployeeStatus(id, status) {
  return request({ url: `/employee/status/${status}`, method: 'post', params: { id } })
}

export function deleteEmployee(id) {
  return request({ url: `/employee/${id}`, method: 'delete' })
}
