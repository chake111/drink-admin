<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../api/request.js'

const router = useRouter()
const loginForm = ref({
  account: '',
  password: ''
})
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
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12l-1 7a5 5 0 0 1-10 0L6 2Z"/><path d="M6 8H4a2 2 0 0 0 0 4h2"/><path d="M5 22h14"/><path d="M12 14v8"/></svg>
        </div>
        <h1>茶咖优选</h1>
        <p>餐饮管理后台</p>
      </div>

      <el-form :model="loginForm" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="loginForm.account"
            placeholder="请输入员工账号"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
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
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  border: 1px solid var(--line);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  border-radius: 16px;
  background: var(--primary);
  color: #fff;
  display: grid;
  place-items: center;
}

.login-logo svg {
  width: 32px;
  height: 32px;
}

.login-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 4px;
}

.login-header p {
  font-size: 14px;
  color: var(--ink-3);
}
</style>
