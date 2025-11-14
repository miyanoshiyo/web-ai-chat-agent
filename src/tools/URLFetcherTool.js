import axios from 'axios'

export const URLFetcherTool = {
  name: 'URLFetcher',
  description: '获取网页内容',
  
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: '要获取内容的URL地址'
      }
    },
    required: ['url']
  },

  async execute(input) {
    const { url } = input
    
    try {
      // 验证URL格式
      if (!this.isValidUrl(url)) {
        throw new Error('无效的URL格式')
      }

      // 获取网页内容
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      // 提取主要内容（简化版）
      const content = this.extractContent(response.data)
      
      return {
        success: true,
        url,
        title: this.extractTitle(response.data),
        content: content.substring(0, 2000), // 限制内容长度
        status: response.status,
        contentType: response.headers['content-type']
      }
    } catch (error) {
      throw new Error(`获取网页内容失败: ${error.message}`)
    }
  },

  isValidUrl(url) {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  extractTitle(html) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return titleMatch ? titleMatch[1].trim() : '无标题'
  },

  extractContent(html) {
    // 简单的HTML内容提取
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    return text || '无法提取内容'
  }
}