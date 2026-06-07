/**
 * 格式化 ISO 8601 时间字符串为可读格式
 * @param {string} isoStr - ISO 8601 格式的时间字符串，如 "2026-06-06T13:19:18"
 * @returns {string} 格式化后的时间字符串，如 "2026-06-06 13:19:18"
 */
export function formatTime(isoStr) {
  if (!isoStr) return ''
  return isoStr.replace('T', ' ')
}
