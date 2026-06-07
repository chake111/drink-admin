<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../api/request.js'

const router = useRouter()

// 从 localStorage 读取记住的账号
const savedAccount = localStorage.getItem('remembered_account') || ''

const loginForm = ref({
  account: savedAccount,
  password: ''
})
const rememberMe = ref(!!savedAccount)  // 有保存的账号则默认勾选
const loading = ref(false)

async function handleLogin() {
  if (!loginForm.value.account || !loginForm.value.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    const res = await request.post('/admin/login', loginForm.value)
    localStorage.setItem('admin_token', res.data.token)
    localStorage.setItem('admin_info', JSON.stringify({
      id: res.data.id,
      name: res.data.name,
      account: res.data.account,
      role: res.data.role
    }))

    // 记住我：保存或清除账号
    if (rememberMe.value) {
      localStorage.setItem('remembered_account', loginForm.value.account)
    } else {
      localStorage.removeItem('remembered_account')
    }

    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (e) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- 左侧品牌展示区 -->
    <div class="login-brand">
      <div class="brand-glow"></div>
      <div class="brand-content">
        <div class="brand-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12l-1 7a5 5 0 0 1-10 0L6 2Z"/><path d="M6 8H4a2 2 0 0 0 0 4h2"/><path d="M5 22h14"/><path d="M12 14v8"/></svg>
        </div>
        <h1>饮品店订购系统管理后台</h1>
        <p class="brand-slogan">让每一杯，都值得回味</p>
        <div class="brand-features">
          <div class="feature-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
            <span>高效门店管理</span>
          </div>
          <div class="feature-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
            <span>实时订单追踪</span>
          </div>
          <div class="feature-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
            <span>智能数据分析</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="login-form-section">
      <div class="login-form-wrapper">
        <div class="form-header">
          <h2>欢迎回来</h2>
          <p>请登录您的员工账号</p>
        </div>

        <el-form :model="loginForm" @submit.prevent="handleLogin">
          <el-form-item>
            <el-input
              v-model="loginForm.account"
              placeholder="请输入员工账号"
              size="large"
            >
              <template #prefix>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password
            >
              <template #prefix>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </template>
            </el-input>
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <a href="javascript:;" class="forgot-link">忘记密码？</a>
          </div>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              style="width: 100%"
              @click="handleLogin"
            >
              登 录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <p class="demo-hint">演示账号：admin / 123456</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
}

/* 左侧品牌区 */
.login-brand {
  width: 46%;
  background: var(--side-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.brand-glow {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(166, 100, 60, 0.3) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.brand-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: var(--side-fg);
}

.brand-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  border-radius: 20px;
  background: var(--primary);
  color: #fff;
  display: grid;
  place-items: center;
}

.brand-logo svg {
  width: 44px;
  height: 44px;
}

.brand-content h1 {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.brand-slogan {
  font-size: 16px;
  opacity: 0.7;
  margin-bottom: 40px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  margin-left: 80px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  opacity: 0.8;
}

.feature-item svg {
  width: 20px;
  height: 20px;
  color: var(--primary);
  flex-shrink: 0;
}

/* 右侧表单区 */
.login-form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
}

.login-form-wrapper {
  width: 400px;
  padding: 0 20px;
}

.form-header {
  margin-bottom: 36px;
}

.form-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 8px;
}

.form-header p {
  font-size: 15px;
  color: var(--ink-3);
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.forgot-link {
  font-size: 14px;
  color: var(--primary);
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

.form-footer {
  margin-top: 24px;
  text-align: center;
}

.demo-hint {
  font-size: 13px;
  color: var(--ink-3);
  background: var(--surface-2);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
}

/* 输入框内图标样式 */
:deep(.el-input__prefix) {
  display: flex;
  align-items: center;
}

:deep(.el-input__prefix svg) {
  width: 18px;
  height: 18px;
  color: var(--ink-3);
}

/* 响应式：小屏幕隐藏品牌区 */
@media (max-width: 900px) {
  .login-brand {
    display: none;
  }

  .login-form-section {
    width: 100%;
  }
}
</style>
