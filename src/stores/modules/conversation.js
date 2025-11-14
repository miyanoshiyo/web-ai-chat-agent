import { v4 as uuidv4 } from 'uuid'

const state = {
  messages: [],
  isLoading: false,
  currentTask: null,
  toolExecutions: []
}

const mutations = {
  ADD_MESSAGE(state, message) {
    state.messages.push({
      ...message,
      id: uuidv4(),
      timestamp: Date.now()
    })
  },
  
  SET_LOADING(state, loading) {
    state.isLoading = loading
  },
  
  SET_CURRENT_TASK(state, task) {
    state.currentTask = task
  },
  
  ADD_TOOL_EXECUTION(state, execution) {
    state.toolExecutions.push(execution)
  },
  
  CLEAR_CONVERSATION(state) {
    state.messages = []
    state.toolExecutions = []
    state.currentTask = null
  }
}

const actions = {
  async sendMessage({ commit, dispatch, rootState }, content) {
    commit('SET_LOADING', true)
    
    // 添加用户消息
    commit('ADD_MESSAGE', {
      type: 'user',
      content,
      role: 'user'
    })
    
    try {
      // 获取工具定义
      const { ToolManager } = await import('@/services/toolManager')
      const tools = await ToolManager.getToolDefinitions()
      
      // 调用AI服务，传递工具定义
      await dispatch('queryAI', { 
        messages: rootState.conversation.messages,
        modelPointer: rootState.config.currentModelPointer,
        tools
      })
    } catch (error) {
      commit('ADD_MESSAGE', {
        type: 'assistant',
        content: `错误: ${error.message}`,
        role: 'assistant',
        isError: true
      })
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async queryAI({ commit, dispatch, rootState }, { messages, modelPointer, tools = [] }) {
    const modelConfig = rootState.config.models[modelPointer]
    const { AIService } = await import('@/services/aiService')
    
    // 构建消息历史
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
      ...(msg.tool_calls && { tool_calls: msg.tool_calls })
    }))
    
    // 调用AI服务，传递工具
    const response = await AIService.queryModel(
      conversationHistory,
      modelConfig,
      {
        ...rootState.config.globalConfig,
        tools
      }
    )
    
    // 处理AI响应
    await dispatch('processAIResponse', {
      response,
      modelPointer
    })
  },
  
  async processAIResponse({ commit, dispatch, rootState }, { response, modelPointer }) {
    // 添加助手消息
    commit('ADD_MESSAGE', {
      type: 'assistant',
      content: response.content,
      role: 'assistant',
      tool_calls: response.tool_calls
    })
    
    // 如果有工具调用，执行工具
    if (response.tool_calls && response.tool_calls.length > 0) {
      await dispatch('executeTools', {
        tool_calls: response.tool_calls,
        modelPointer
      })
    }
  },
  
  async executeTools({ commit, dispatch, rootState }, { tool_calls, modelPointer }) {
    const { ToolManager } = await import('@/services/toolManager')
    
    for (const toolCall of tool_calls) {
      try {
        commit('ADD_TOOL_EXECUTION', {
          id: uuidv4(),
          toolName: toolCall.function?.name || toolCall.name,
          input: toolCall.function?.arguments || toolCall.input,
          status: 'executing',
          timestamp: Date.now()
        })
        
        // 解析工具参数
        let toolInput = toolCall.function?.arguments || toolCall.input
        if (typeof toolInput === 'string') {
          try {
            toolInput = JSON.parse(toolInput)
          } catch (e) {
            // 如果不是JSON，保持原样
          }
        }
        
        // 执行工具
        const toolName = toolCall.function?.name || toolCall.name
        const result = await ToolManager.executeTool(toolName, toolInput)
        const tools = await ToolManager.getToolDefinitions()
        // 添加工具结果消息
        commit('ADD_MESSAGE', {
          type: 'tool_result',
          content:JSON.stringify(result.results)||"没有执行结果",
          toolName: toolName,
          role: 'tool',
          tool_call_id:toolCall.id
        })
        // 如果工具执行成功，继续调用AI处理结果
        await dispatch('queryAI', {
          messages: rootState.conversation.messages,
          modelPointer,
          tools:tools
        })
        
      } catch (error) {
        console.log("error----1")
        commit('ADD_MESSAGE', {
          type: 'tool_result',
          content: `工具执行失败: ${error.message}`,
          toolName: toolCall.function?.name || toolCall.name,
          role: 'tool',
          isError: true
        })
      }
    }
  },
  
  clearConversation({ commit }) {
    commit('CLEAR_CONVERSATION')
  }
}

const getters = {
  conversationHistory: (state) => state.messages,
  isProcessing: (state) => state.isLoading,
  currentTask: (state) => state.currentTask
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}