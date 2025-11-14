export const CalculatorTool = {
  name: 'Calculator',
  description: '执行数学计算',
  
  inputSchema: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: '数学表达式，如：2 + 3 * 4'
      }
    },
    required: ['expression']
  },

  async execute(input) {
    const { expression } = input
    
    try {
      // 安全地评估数学表达式
      const result = this.safeEvaluate(expression)
      
      return {
        success: true,
        expression,
        result,
        type: typeof result
      }
    } catch (error) {
      throw new Error(`计算失败: ${error.message}`)
    }
  },

  safeEvaluate(expression) {
    // 移除所有空格
    const cleanExpression = expression.replace(/\s+/g, '')
    
    // 验证表达式只包含安全的字符
    if (!/^[0-9+\-*/().\s]+$/.test(cleanExpression)) {
      throw new Error('表达式包含不安全字符')
    }

    // 验证括号匹配
    let bracketCount = 0
    for (const char of cleanExpression) {
      if (char === '(') bracketCount++
      if (char === ')') bracketCount--
      if (bracketCount < 0) {
        throw new Error('括号不匹配')
      }
    }
    if (bracketCount !== 0) {
      throw new Error('括号不匹配')
    }

    // 使用Function构造器安全地执行计算
    try {
      // 创建一个只包含数学运算的环境
      const result = Function(`"use strict"; return (${cleanExpression})`)()
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('计算结果不是有效数字')
      }
      
      return result
    } catch (error) {
      throw new Error(`表达式计算错误: ${error.message}`)
    }
  }
}