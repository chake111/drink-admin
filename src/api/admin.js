import request from '../utils/request'

// 管理端登录
export function login(data) {
  return request({ url: '/admin/login', method: 'post', data })
}
