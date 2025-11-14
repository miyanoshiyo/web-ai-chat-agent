import { AIService } from '@/services/aiService'

export const TaskTool = {
  name: 'TaskTool',
  description: '将复杂任务分解为多个子任务并执行',
  
  inputSchema: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: '任务描述'
      },
      prompt: {
        type: 'string',
        description: '详细的任务说明'
      },
      model_name: {
        type: 'string',
        description: '使用的模型名称',
        default: 'task'
      }
    },
    required: ['description', 'prompt']
  },

  async execute(input) {
    const { description, prompt, model_name = 'task' } = input
    
    try {
      // 1. 分析任务复杂度
      const analysis = await this.analyzeTaskComplexity(prompt)
      
      if (!analysis.isComplex) {
        return {
          success: true,
          type: 'direct',
          result: '这是一个简单任务，可以直接处理',
          description
        }
      }

      // 2. 拆解任务
      const subTasks = await this.breakDownTask(prompt, model_name)
      
      // 3. 执行子任务
      const results = []
      for (const subTask of subTasks) {
        const result = await this.executeSubTask(subTask, model_name)
        results.push(result)
      }

      // 4. 整合结果
      const finalResult = await this.integrateResults(results, prompt, model_name)
      
      return {
        success: true,
        type: 'decomposed',
        description,
        subTasks: subTasks.length,
        results: finalResult
      }
    } catch (error) {
      throw new Error(`任务分解执行失败: ${error.message}`)
    }
  },

  async analyzeTaskComplexity(task) {
    // 使用AI分析任务复杂度
    const analysisPrompt = `
请分析以下任务的复杂度：
任务：${task}

请回答：
1. 这是一个简单任务还是复杂任务？
2. 是否需要拆分为多个子任务？
3. 预计需要多少步骤完成？

请以JSON格式返回分析结果。
    `

    const response = await AIService.queryModel(
      [{ role: 'user', content: analysisPrompt }],
      {
        provider: 'openai',
        modelName: 'gpt-3.5-turbo',
        apiKey: '', // 实际使用时会从配置中获取
        baseURL: 'https://api.openai.com/v1'
      }
    )

    // 解析AI响应
    try {
      const analysis = JSON.parse(response.content)
      return {
        isComplex: analysis.isComplex || false,
        steps: analysis.steps || 1,
        reason: analysis.reason || ''
      }
    } catch {
      // 如果解析失败，默认认为是复杂任务
      return {
        isComplex: true,
        steps: 3,
        reason: 'AI分析失败，默认按复杂任务处理'
      }
    }
  },

  async breakDownTask(task, modelName) {
    // 使用AI拆解任务
    const breakdownPrompt = `
请将以下复杂任务拆解为具体的子任务：
任务：${task}

要求：
1. 将任务分解为3-5个清晰的子任务
2. 每个子任务应该是可独立执行的
3. 子任务之间要有逻辑顺序
4. 返回JSON格式的子任务列表

格式：
{
  "subTasks": [
    {
      "id": 1,
      "description": "子任务描述",
      "action": "具体要执行的操作"
    }
  ]
}
    `

    const response = await AIService.queryModel(
      [{ role: 'user', content: breakdownPrompt }],
      {
        provider: 'openai',
        modelName: modelName,
        apiKey: '',
        baseURL: 'https://api.openai.com/v1'
      }
    )

    try {
      const result = JSON.parse(response.content)
      return result.subTasks || []
    } catch {
      // 如果解析失败，返回默认的子任务
      return [
        {
          id: 1,
          description: '分析任务需求',
          action: '理解任务的核心要求'
        },
        {
          id: 2,
          description: '执行主要操作',
          action: '完成任务的主要部分'
        },
        {
          id: 3,
          description: '验证和优化',
          action: '检查结果并进行优化'
        }
      ]
    }
  },

  async executeSubTask(subTask, modelName) {
    // 执行单个子任务
    const executionPrompt = `
请执行以下子任务：
${subTask.action}

要求：
1. 专注于完成这个具体的子任务
2. 提供详细的执行结果
3. 如果遇到问题，说明原因
    `

    const response = await AIService.queryModel(
      [{ role: 'user', content: executionPrompt }],
      {
        provider: 'openai',
        modelName: modelName,
        apiKey: '',
        baseURL: 'https://api.openai.com/v1'
      }
    )

    return {
      subTaskId: subTask.id,
      description: subTask.description,
      result: response.content,
      timestamp: new Date().toISOString()
    }
  },

  async integrateResults(results, originalTask, modelName) {
    // 整合所有子任务的结果
    const integrationPrompt = `
原始任务：${originalTask}

已完成以下子任务：
${results.map(r => `- ${r.description}: ${r.result.substring(0, 100)}...`).join('\n')}

请基于以上子任务结果，整合成完整的最终结果。
    `

    const response = await AIService.queryModel(
      [{ role: 'user', content: integrationPrompt }],
      {
        provider: 'openai',
        modelName: modelName,
        apiKey: '',
        baseURL: 'https://api.openai.com/v1'
      }
    )

    return {
      finalResult: response.content,
      subTaskCount: results.length,
      integrationTime: new Date().toISOString()
    }
  }
}