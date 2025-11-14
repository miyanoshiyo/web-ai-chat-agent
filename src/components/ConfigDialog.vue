<template>
  <el-dialog
    title="配置设置"
    :visible.sync="visible"
    width="600px"
    @close="handleClose">
    
    <el-tabs v-model="activeTab">
      <!-- 模型配置 -->
      <el-tab-pane label="模型配置" name="models">
        <div class="model-config">
          <div class="model-tabs">
            <el-tabs v-model="currentModelTab" type="card">
              <el-tab-pane 
                v-for="model in availableModels" 
                :key="model"
                :label="model" 
                :name="model">
                
                <el-form 
                  :model="modelForms[model]" 
                  label-width="100px"
                  class="model-form">
                  
                  <el-form-item label="提供商">
                    <el-select v-model="modelForms[model].provider">
                      <el-option label="OpenAI" value="openai"></el-option>
                      <el-option label="Anthropic" value="anthropic"></el-option>
                    </el-select>
                  </el-form-item>
                  
                  <el-form-item label="模型名称">
                    <el-input v-model="modelForms[model].modelName"></el-input>
                  </el-form-item>
                  
                  <el-form-item label="API密钥">
                    <el-input 
                      v-model="modelForms[model].apiKey"
                      type="password"
                      show-password>
                    </el-input>
                  </el-form-item>
                  
                  <el-form-item label="Base URL">
                    <el-input v-model="modelForms[model].baseURL">
                      <template slot="prepend">https://</template>
                    </el-input>
                  </el-form-item>
                  
                  <el-form-item label="最大Token">
                    <el-input-number 
                      v-model="modelForms[model].maxTokens"
                      :min="100"
                      :max="8000"
                      :step="100">
                    </el-input-number>
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button 
                      type="primary" 
                      @click="testModelConnection(model)"
                      :loading="testingModel === model">
                      测试连接
                    </el-button>
                    <el-button @click="saveModelConfig(model)">
                      保存配置
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 全局配置 -->
      <el-tab-pane label="全局配置" name="global">
        <el-form :model="globalForm" label-width="100px">
          <el-form-item label="温度">
            <el-slider 
              v-model="globalForm.temperature"
              :min="0"
              :max="2"
              :step="0.1"
              show-stops>
            </el-slider>
            <span class="slider-value">{{ globalForm.temperature }}</span>
          </el-form-item>
          
          <el-form-item label="流式响应">
            <el-switch v-model="globalForm.stream"></el-switch>
          </el-form-item>
          
          <el-form-item label="安全模式">
            <el-switch v-model="globalForm.safeMode"></el-switch>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="saveGlobalConfig">
              保存配置
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <!-- 工具配置 -->
      <el-tab-pane label="工具管理" name="tools">
        <div class="tools-config">
          <h3>可用工具</h3>
          <div class="tools-list">
            <div 
              v-for="tool in availableTools" 
              :key="tool.name"
              class="tool-config-item">
              
              <div class="tool-info">
                <strong>{{ tool.name }}</strong>
                <span class="tool-description">{{ tool.description }}</span>
              </div>
              
              <div class="tool-schema">
                <el-collapse>
                  <el-collapse-item title="输入参数">
                    <pre>{{ JSON.stringify(tool.inputSchema, null, 2) }}</pre>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleClose">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'ConfigDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      activeTab: 'models',
      currentModelTab: 'main',
      modelForms: {},
      globalForm: {
        temperature: 0.7,
        stream: true,
        safeMode: false
      },
      testingModel: null,
      availableTools: []
    }
  },
  computed: {
    ...mapGetters('config', [
      'availableModels',
      'modelConfig'
    ])
  },
  watch: {
    visible: {
      handler(newVal) {
        if (newVal) {
          this.initializeForms()
        }
      },
      immediate: true
    }
  },
  async mounted() {
    // 加载工具列表
    const { ToolManager } = await import('@/services/toolManager')
    this.availableTools = ToolManager.getAvailableTools()
  },
  methods: {
    ...mapActions('config', [
      'saveModelConfig',
      'updateGlobalConfig'
    ]),
    
    initializeForms() {
      // 初始化模型表单
      this.availableModels.forEach(model => {
        const config = this.modelConfig(model)
        this.$set(this.modelForms, model, {
          provider: config.provider || 'openai',
          modelName: config.modelName || '',
          apiKey: config.apiKey || '',
          baseURL: config.baseURL || '',
          maxTokens: config.maxTokens || 4000
        })
      })
      
      // 初始化全局配置
      this.globalForm = { ...this.$store.state.config.globalConfig }
    },
    
    async saveModelConfig(modelPointer) {
      const config = this.modelForms[modelPointer]
      
      if (!config.apiKey) {
        this.$message.warning('请填写API密钥')
        return
      }
      
      try {
        await this.$store.dispatch('config/saveModelConfig', {
          pointer: modelPointer,
          config
        })
        this.$message.success('模型配置保存成功')
      } catch (error) {
        this.$message.error(`保存失败: ${error.message}`)
      }
    },
    
    async testModelConnection(modelPointer) {
      const config = this.modelForms[modelPointer]
      
      if (!config.apiKey) {
        this.$message.warning('请填写API密钥')
        return
      }
      
      this.testingModel = modelPointer
      
      try {
        const { AIService } = await import('@/services/aiService')
        const isValid = await AIService.verifyAPIKey(
          config.provider,
          config.apiKey,
          config.baseURL
        )
        
        if (isValid) {
          this.$message.success('API连接测试成功')
        } else {
          this.$message.error('API连接测试失败，请检查配置')
        }
      } catch (error) {
        this.$message.error(`连接测试失败: ${error.message}`)
      } finally {
        this.testingModel = null
      }
    },
    
    saveGlobalConfig() {
      this.$store.dispatch('config/updateGlobalConfig', this.globalForm)
      this.$message.success('全局配置保存成功')
    },
    
    handleClose() {
      this.$emit('update:visible', false)
      this.$emit('config-updated')
    }
  }
}
</script>

<style scoped>
.model-config {
  padding: 10px 0;
}

.model-form {
  padding: 20px 0;
}

.slider-value {
  margin-left: 10px;
  color: #409eff;
  font-weight: bold;
}

.tools-config {
  padding: 10px 0;
}

.tools-config h3 {
  margin-bottom: 15px;
  color: #303133;
}

.tool-config-item {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fafafa;
}

.tool-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.tool-info strong {
  margin-right: 10px;
  color: #303133;
}

.tool-description {
  color: #909399;
  font-size: 14px;
}

.tool-schema pre {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}

.dialog-footer {
  text-align: right;
}
</style>