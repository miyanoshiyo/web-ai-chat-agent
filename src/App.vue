<template>
  <div id="app" class="app-container">
    <el-container class="main-container">
      <!-- 侧边栏 -->
      <el-aside width="300px" class="sidebar">
        <div class="sidebar-header">
          <h2>AI Assistant</h2>
        </div>
        
        <!-- 模型选择器 -->
        <div class="model-selector">
          <h3>模型选择</h3>
          <el-select 
            v-model="currentModelPointer" 
            @change="switchModel"
            class="model-select"
            placeholder="选择模型">
            <el-option
              v-for="model in availableModels"
              :key="model"
              :label="model"
              :value="model">
            </el-option>
          </el-select>
        </div>

        <!-- 工具列表 -->
        <div class="tools-section">
          <h3>可用工具</h3>
          <div class="tools-list">
            <div 
              v-for="tool in availableTools" 
              :key="tool.name"
              class="tool-item">
              <el-tag type="info">{{ tool.name }}</el-tag>
              <span class="tool-desc">{{ tool.description }}</span>
            </div>
          </div>
        </div>

        <!-- 配置按钮 -->
        <div class="config-section">
          <el-button 
            type="primary" 
            icon="el-icon-setting"
            @click="showConfig = true">
            配置
          </el-button>
          <el-button 
            type="default" 
            icon="el-icon-delete"
            @click="clearConversation">
            清空对话
          </el-button>
        </div>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <!-- 对话区域 -->
        <div class="chat-container">
          <div class="messages-container" ref="messagesContainer">
            <div 
              v-for="message in conversationHistory" 
              :key="message.id"
              :class="['message', message.role, { error: message.isError }]">
              
              <div class="message-header">
                <span class="message-role">
                  {{ getRoleDisplayName(message.role) }}
                </span>
                <span class="message-time">
                  {{ formatTime(message.timestamp) }}
                </span>
              </div>
              
              <div class="message-content">
                <pre v-if="message.tool_calls">{{ JSON.stringify(message.tool_calls, null, 2) }}</pre>
                <div v-else>{{ message.content }}</div>
              </div>

              <!-- 工具执行状态 -->
              <div v-if="message.role === 'tool'" class="tool-status">
                <el-tag 
                  :type="message.isError ? 'danger' : 'success'">
                  {{ message.isError ? '执行失败' : '执行成功' }}
                </el-tag>
              </div>
            </div>

            <!-- 加载指示器 -->
            <div v-if="isProcessing" class="loading-indicator">
              <el-icon class="is-loading">
                <el-icon-loading />
              </el-icon>
              <span>AI正在思考...</span>
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="input-container">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="3"
              placeholder="输入您的问题..."
              @keydown.enter.exact.prevent="sendMessage"
              class="message-input">
            </el-input>
            <el-button 
              type="primary" 
              :loading="isProcessing"
              @click="sendMessage"
              class="send-button">
              发送
            </el-button>
          </div>
        </div>
      </el-main>
    </el-container>

    <!-- 配置对话框 -->
    <ConfigDialog 
      v-if="showConfig"
      :visible.sync="showConfig"
      @config-updated="handleConfigUpdated" />
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import ConfigDialog from '@/components/ConfigDialog'

export default {
  name: 'App',
  components: {
    ConfigDialog
  },
  data() {
    return {
      inputMessage: '',
      showConfig: false,
      availableTools: []
    }
  },
  computed: {
    ...mapState({
      conversationHistory: state => state.conversation.messages,
      isProcessing: state => state.conversation.isLoading
    }),
    ...mapGetters('config', [
      'currentModel',
      'availableModels'
    ]),
    currentModelPointer: {
      get() {
        return this.$store.state.config.currentModelPointer
      },
      set(value) {
        this.switchModel(value)
      }
    }
  },
  async mounted() {
    // 加载配置
    this.$store.dispatch('config/loadConfig')
    
    // 加载工具列表
    const { ToolManager } = await import('@/services/toolManager')
    this.availableTools = ToolManager.getAvailableTools()
    // this.testHmtl()
  },
  methods: {
    ...mapActions('conversation', [
      'sendMessage',
      'clearConversation'
    ]),
    ...mapActions('config', [
      'switchModel'
    ]),
    async testHmtl(){
      const response = await fetch('https://www.sznews.com/', {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; URLFetcher/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          signal:  new AbortController().signal,
          redirect: 'follow',
      })
      const contentType = response.headers.get('content-type') || ''
      const html = await response.text()
        console.log("response--------》",response,"contentType------>",contentType)
      console.log("html--------->",html)
    },
    async sendMessage() {
      if (!this.inputMessage.trim()) return
      
      const message = this.inputMessage.trim()
      this.inputMessage = ''
      
      await this.$store.dispatch('conversation/sendMessage', message)
      
      // 滚动到底部
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    
    scrollToBottom() {
      const container = this.$refs.messagesContainer
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    },
    
    getRoleDisplayName(role) {
      const roleMap = {
        'user': '用户',
        'assistant': 'AI助手',
        'tool': '工具'
      }
      return roleMap[role] || role
    },
    
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString()
    },
    
    handleConfigUpdated() {
      this.showConfig = false
    }
  },
  watch: {
    conversationHistory: {
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  background-color: #f5f7fa;
}

.main-container {
  height: 100%;
}

.sidebar {
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  text-align: center;
  margin-bottom: 30px;
}

.sidebar-header h2 {
  margin: 0;
  color: #409eff;
}

.subtitle {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.model-selector {
  margin-bottom: 30px;
}

.model-selector h3 {
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.model-select {
  width: 100%;
}

.tools-section {
  flex: 1;
  margin-bottom: 20px;
}

.tools-section h3 {
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.tools-list {
  max-height: 200px;
  overflow-y: auto;
}

.tool-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.tool-item .el-tag {
  margin-right: 8px;
  flex-shrink: 0;
}

.tool-desc {
  font-size: 12px;
  color: #909399;
  flex: 1;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-content {
  padding: 0;
  background-color: #fff;
}

.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.messages-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #fafafa;
}

.message {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message.user {
  border-left: 4px solid #409eff;
}

.message.assistant {
  border-left: 4px solid #67c23a;
}

.message.tool {
  border-left: 4px solid #e6a23c;
}

.message.error {
  border-left: 4px solid #f56c6c;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.message-content {
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.tool-status {
  margin-top: 8px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #909399;
}

.input-container {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  background-color: #fff;
}

.message-input {
  margin-bottom: 10px;
}

.send-button {
  width: 100%;
}
</style>