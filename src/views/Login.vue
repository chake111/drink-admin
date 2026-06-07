<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request.js'

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
        <div class="brand-top">
          <div class="brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12l-1 7a5 5 0 0 1-10 0L6 2Z"/><path d="M6 8H4a2 2 0 0 0 0 4h2"/><path d="M5 22h14"/><path d="M12 14v8"/></svg>
          </div>
          <b class="brand-name">茶优选</b>
        </div>
        <div class="brand-pitch">
          <h2>饮品店订购系统<br>管理后台</h2>
          <p>统一管理门店饮品、分类与订单，让每一杯都准时、对味地送到顾客手中。</p>
        </div>
        <div class="brand-foot">© 2026 茶优选 · 餐饮管理平台 · 内部员工专用</div>
      </div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="login-form-section">
      <div class="login-card">
        <h1>欢迎回来 👋</h1>
        <p class="sub">请使用员工账号登录管理后台</p>

        <el-form :model="loginForm" @submit.prevent="handleLogin">
          <div class="lf">
            <label>账号</label>
            <el-input
              v-model="loginForm.account"
              placeholder="请输入员工账号"
              size="large"
            >
              <template #prefix>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </template>
            </el-input>
          </div>
          <div class="lf">
            <label>密码</label>
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password
            >
              <template #prefix>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </template>
            </el-input>
          </div>

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

        <p class="demo-hint">演示账号已预填，点击「登录」直接进入</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: fixed;
  inset: 0;
  display: flex;
  background: var(--bg);
  z-index: 100;
}

/* 左侧品牌区 */
.login-brand {
  width: 46%;
  background: var(--side-bg);
  color: #F3E9DF;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 54px 56px;
}

.brand-glow {
  position: absolute;
  right: -120px;
  bottom: -120px;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(166, 100, 60, 0.45), transparent 68%);
}

.brand-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  position: relative;
  z-index: 2;
}

.brand-top {
  display: flex;
  align-items: center;
  gap: 13px;
}

.brand-logo {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: var(--primary);
  color: #fff;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.brand-logo svg {
  width: 26px;
  height: 26px;
}

.brand-name {
  font-family: var(--font-en), sans-serif;
  font-size: 21px;
  letter-spacing: 0.01em;
}

.brand-pitch h2 {
  font-size: 34px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0.01em;
  color: #F3E9DF;
}

.brand-pitch p {
  color: #C2AD9C;
  font-size: 15px;
  margin-top: 16px;
  max-width: 340px;
  line-height: 1.7;
}

.brand-foot {
  color: #8C7868;
  font-size: 12.5px;
}

/* 右侧表单区 */
.login-form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-card {
  width: 100%;
  max-width: 360px;
}

.login-card h1 {
  font-size: 25px;
  font-weight: 600;
  color: var(--ink);
}

.login-card .sub {
  color: var(--ink-3);
  font-size: 14px;
  margin-top: 8px;
  margin-bottom: 34px;
}

.lf {
  margin-bottom: 18px;
}

.lf label {
  display: block;
  font-size: 13px;
  color: var(--ink-2);
  margin-bottom: 8px;
  font-weight: 500;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 26px;
}

.forgot-link {
  color: var(--primary);
  text-decoration: none;
  font-size: 13px;
}

.forgot-link:hover {
  text-decoration: underline;
}

.demo-hint {
  margin-top: 18px;
  text-align: center;
  font-size: 12px;
  color: var(--ink-3);
}

/* 输入框内图标样式 */
:deep(.el-input__prefix) {
  display: flex;
  align-items: center;
}

:deep(.el-input__prefix svg) {
  width: 17px;
  height: 17px;
  color: var(--ink-3);
}

:deep(.el-input__wrapper) {
  border-radius: var(--radius);
  padding: 12px 14px;
}

/* 消除 el-form-item 额外间距，由 .lf 控制 */
:deep(.el-form-item) {
  margin-bottom: 0;
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
