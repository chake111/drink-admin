<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../api/request.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  width: { type: String, default: '120px' },
  height: { type: String, default: '120px' }
})

const emit = defineEmits(['update:modelValue'])

const previewUrl = ref(props.modelValue)
const uploading = ref(false)
const fileInputRef = ref(null)

// 监听外部值变化
watch(() => props.modelValue, (val) => {
  previewUrl.value = val
})

// 触发文件选择
function triggerSelect() {
  fileInputRef.value?.click()
}

// 文件选择后处理
async function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  // 客户端校验格式
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('仅支持JPG、PNG、WEBP格式')
    resetInput()
    return
  }

  // 客户端校验大小 2MB
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过2MB')
    resetInput()
    return
  }

  // 本地预览
  previewUrl.value = URL.createObjectURL(file)

  // 上传到服务器
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    // 用服务器返回的URL替换本地预览
    previewUrl.value = res.data
    emit('update:modelValue', res.data)
  } catch (e) {
    // 上传失败，清除预览
    previewUrl.value = props.modelValue || ''
  } finally {
    uploading.value = false
    resetInput()
  }
}

// 移除图片
function handleRemove() {
  previewUrl.value = ''
  emit('update:modelValue', '')
  resetInput()
}

// 重置input，允许重复上传同一文件
function resetInput() {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}
</script>

<template>
  <div class="image-upload-wrapper">
    <div
      class="upload-box"
      :style="{ width: width, height: height }"
      @click="triggerSelect"
    >
      <img v-if="previewUrl" :src="previewUrl" class="preview-img" />
      <div v-else class="upload-placeholder">
        <el-icon :size="24"><Plus /></el-icon>
        <span>上传图片</span>
      </div>
      <!-- 上传中遮罩 -->
      <div v-if="uploading" class="upload-loading">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      </div>
      <!-- 移除按钮 -->
      <div v-if="previewUrl && !uploading" class="remove-btn" @click.stop="handleRemove">
        <el-icon><Close /></el-icon>
      </div>
    </div>
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      style="display: none"
      @change="handleFileChange"
    />
    <div class="upload-tip">支持 JPG / PNG / WEBP，不超过 2MB</div>
  </div>
</template>

<script>
import { Plus, Close, Loading } from '@element-plus/icons-vue'
export default { components: { Plus, Close, Loading } }
</script>

<style scoped>
.image-upload-wrapper {
  display: inline-flex;
  flex-direction: column;
  gap: 6px;
}
.upload-box {
  border: 1px dashed var(--line-strong, #dcdfe6);
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  display: grid;
  place-items: center;
  transition: border-color 0.2s;
}
.upload-box:hover {
  border-color: var(--primary, #409eff);
}
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #8c939d;
  font-size: 12px;
}
.upload-loading {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: grid;
  place-items: center;
  color: var(--primary, #409eff);
}
.remove-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 12px;
}
.remove-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}
.upload-tip {
  font-size: 12px;
  color: #8c939d;
}
</style>
