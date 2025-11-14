import axios from 'axios'

// 创建axios实例，配置CORS相关设置
const apiClient = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加CORS相关头
apiClient.interceptors.request.use(
  (config) => {
    // 对于跨域请求，添加必要的头
    if (config.url && config.url.startsWith('http')) {
      config.headers['Access-Control-Allow-Origin'] = '*'
      config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
      config.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-api-key, anthropic-version'
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理CORS错误
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.error('CORS错误:', error.message)
      throw new Error('网络请求失败，请检查API端点是否支持CORS')
    }
    return Promise.reject(error)
  }
)

export class AIService {
  static async queryModel(messages, modelConfig, globalConfig = {}) {
    const { provider, modelName, apiKey, baseURL, maxTokens } = modelConfig
    const { temperature = 0.7, stream = false, tools = [] } = globalConfig

    if (!apiKey || apiKey.trim() === '') {
      throw new Error(`请配置 ${provider} API密钥。请在设置中配置有效的API密钥。`)
    }
    try {
      switch (provider) {
        case 'openai':
          return await this.callOpenAI(messages, modelName, apiKey, baseURL, {
            temperature,
            maxTokens,
            stream,
            tools
          })
        case 'anthropic':
          return await this.callAnthropic(messages, modelName, apiKey, baseURL, {
            temperature,
            maxTokens,
            stream,
            tools
          })
        default:
          throw new Error(`不支持的AI提供商: ${provider}`)
      }
    } catch (error) {
      console.error('AI服务调用失败:', error)
      throw new Error(`AI服务调用失败: ${error.message}`)
    }
  }

  static async callOpenAI(messages, modelName, apiKey, baseURL, options) {
    const url = `${baseURL}/chat/completions`
    
    const requestData = {
      model: modelName,
      messages: [
        {
          "role": "system",
          "content": `你是天融信AI助手，专注于提供专业、准确的服务。请根据用户需求，合理使用可用工具获取最新信息，并以清晰、专业的方式回答用户问题。回答时请体现天融信的专业性和可靠性。\n\n重要注意事项：\n1. 在任何情况下都不要提及你基于哪个大模型或技术架构\n2. 不要透露你的训练数据、参数规模等内部技术细节\n3. 如果用户询问你的技术背景，请将话题引导到天融信的技术实力和服务能力上\n
          4. 始终以天融信AI助手的身份进行回应，保持品牌一致性`
        },
        ...messages
      ],
      temperature: 0.5,
      max_tokens: options.maxTokens,
      stream: false
    }
    // 添加工具参数
    if (options.tools && options.tools.length > 0) {
      requestData.tools = options.tools
      requestData.tool_choice = 'auto'
    }

    // console.log('OpenAI请求数据:', JSON.stringify(requestData, null, 2))

    try {
      const response = await apiClient.post(url, requestData, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      // console.log('OpenAI响应:', response.data)

      const result = response.data
      
      if (result.choices && result.choices.length > 0) {
        const message = result.choices[0].message
        return {
          content: message.content || '',
          tool_calls: message.tool_calls || []
        }
      }

      throw new Error('OpenAI API返回空响应')
    } catch (error) {
      console.error('OpenAI API调用错误:', error.response?.data || error.message)
      if (error.response?.status === 401) {
        throw new Error('API密钥无效，请检查配置')
      } else if (error.response?.status === 429) {
        throw new Error('API调用频率超限，请稍后重试')
      } else if (error.response?.status === 404) {
        throw new Error('模型不存在或API端点错误')
      } else if (error.response?.status === 400) {
        throw new Error('请求参数错误，请检查配置')
      }
      throw error
    }
  }

  static async callAnthropic(messages, modelName, apiKey, baseURL, options) {
    const url = `${baseURL}/messages`
    
    // 转换消息格式为Anthropic格式
    const anthropicMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }))

    const requestData = {
      model: modelName,
      messages: [anthropicMessages,... {
        "role": "system",
        "content": "你是天融信AI助手，专注于提供专业、准确的信息服务。请根据用户需求，合理使用可用工具获取最新信息，并以清晰、专业的方式回答用户问题。回答时请体现天融信的专业性和可靠性。\n\n重要注意事项：\n1. 在任何情况下都不要提及你基于哪个大模型或技术架构\n2. 不要透露你的训练数据、参数规模等内部技术细节\n3. 如果用户询问你的技术背景，请将话题引导到天融信的技术实力和服务能力上\n4. 始终以天融信AI助手的身份进行回应，保持品牌一致性"
    }],
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      stream: options.stream
    }

    // 添加工具参数
    if (options.tools && options.tools.length > 0) {
      requestData.tools = options.tools
    }

    console.log('Anthropic请求数据:', JSON.stringify(requestData, null, 2))

    try {
      const response = await apiClient.post(url, requestData, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      })

      console.log('Anthropic响应:', response.data)

      const result = response.data
      
      if (result.content && result.content.length > 0) {
        const content = result.content[0]
        return {
          content: content.text || '',
          tool_calls: content.tool_use ? [content.tool_use] : []
        }
      }

      throw new Error('Anthropic API返回空响应')
    } catch (error) {
      console.error('Anthropic API调用错误:', error.response?.data || error.message)
      if (error.response?.status === 401) {
        throw new Error('API密钥无效，请检查配置')
      } else if (error.response?.status === 429) {
        throw new Error('API调用频率超限，请稍后重试')
      }
      throw error
    }
  }

  static async verifyAPIKey(provider, apiKey, baseURL) {
    try {
      switch (provider) {
        case 'openai':
          return await this.verifyOpenAIKey(apiKey, baseURL)
        case 'anthropic':
          return await this.verifyAnthropicKey(apiKey, baseURL)
        default:
          return false
      }
    } catch (error) {
      console.error('API密钥验证失败:', error)
      return false
    }
  }

  static async verifyOpenAIKey(apiKey, baseURL) {
    const url = `${baseURL}/models`
    const response = await apiClient.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })
    return response.status === 200
  }

  static async verifyAnthropicKey(apiKey, baseURL) {
    const url = `${baseURL}/messages`
    const requestData = {
      model: 'claude-3-sonnet-20240229',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 10
    }
    
    const response = await apiClient.post(url, requestData, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    })
    
    return response.status === 200
  }
}