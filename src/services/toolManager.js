import { WebSearchTool } from '@/tools/WebSearchTool'
import { URLFetcherTool } from '@/tools/URLFetcherTool'
import { TaskTool } from '@/tools/TaskTool'
// import { CalculatorTool } from '@/tools/CalculatorTool'

export class ToolManager {
  static tools = {
    'WebSearch': WebSearchTool,
    'URLFetcher': URLFetcherTool,
    'TaskTool': TaskTool,
    // 'Calculator': CalculatorTool
  }

  static async executeTool(toolName, input) {
    const tool = this.tools[toolName]
    
    if (!tool) {
      throw new Error(`工具不存在: ${toolName}`)
    }

    try {
      // 验证输入
      if (tool.inputSchema) {
        // 简单的输入验证
        const required = tool.inputSchema.required || []
        for (const field of required) {
          if (!input[field]) {
            throw new Error(`缺少必要参数: ${field}`)
          }
        }
      }

      // 执行工具
      const result = await tool.execute(input)
      return result
    } catch (error) {
      console.log("error----222")
      console.error(`工具执行失败 ${toolName}:`, error)
      throw new Error(`工具执行失败: ${error.message}`)
    }
  }

  static getAvailableTools() {
    return Object.keys(this.tools).map(name => ({
      name,
      description: this.tools[name].description,
      inputSchema: this.tools[name].inputSchema
    }))
  }

  static async getToolDescription(toolName) {
    const tool = this.tools[toolName]
    if (!tool) {
      throw new Error(`工具不存在: ${toolName}`)
    }
    
    if (typeof tool.description === 'function') {
      return await tool.description()
    }
    
    return tool.description || '无描述'
  }

  // 获取工具定义，用于传递给AI模型
  static async getToolDefinitions() {
    const toolDefinitions = []
    
    for (const [name, tool] of Object.entries(this.tools)) {
      const description = await this.getToolDescription(name)
      
      const toolDefinition = {
        type: 'function',
        function: {
          name: name,
          description: description,
          parameters: tool.inputSchema || {
            type: 'object',
            properties: {},
            required: []
          }
        }
      }
      
      toolDefinitions.push(toolDefinition)
    }
    
    return toolDefinitions
  }
}