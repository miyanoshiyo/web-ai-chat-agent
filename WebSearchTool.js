import axios from 'axios'

export const WebSearchTool = {
  name: 'WebSearch',
  description: '在互联网上搜索信息，提供当前事件和最近数据的最新信息',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词'
      },
      maxResults: {
        type: 'number',
        description: '最大结果数量',
        default: 5
      },
      searchEngine: {
        type: 'string',
        description: '搜索引擎类型',
        enum: ['bing', 'duckduckgo'],
        default: 'duckduckgo'
      }
    },
    required: ['query']
  },

  async execute(input) {
    const { query, maxResults = 5, searchEngine = 'duckduckgo' } = input

    try {
      const searchResults = await this.performSearch(query, maxResults, searchEngine)

      return {
        success: true,
        query,
        searchEngine,
        results: searchResults,
        summary: `使用${searchEngine}搜索"${query}"，找到 ${searchResults.length} 个相关结果`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        query,
        searchEngine
      }
    }
  },

  async performSearch(query, maxResults, searchEngine) {
    switch (searchEngine) {
      case 'duckduckgo':
      default:
        return await this.searchDuckDuckGo(query, maxResults)
    }
  },

  // DuckDuckGo Instant Answer API
  async searchDuckDuckGo(query, maxResults) {
    try {
      // const response = await axios.get('https://api.duckduckgo.com/', {
      //   params: {
      //     q: query,
      //     format: 'json',
      //     no_html: 1,
      //     skip_disambig: 1
      //   },
      //   timeout: 10000
      // })
      const myHeaders = new Headers();
      myHeaders.append("X-API-KEY", "");
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        "q":query,
        "num":maxResults
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      try {
        const response = await fetch("https://google.serper.dev/search", requestOptions);
        const data = await response.text();
        const result = JSON.parse(data)
        const results = []
        if (result.organic && result.organic.length > 0) {
          result.organic.forEach((topic, index) => {
              results.push({
                title: topic.title || `结果 ${index + 1}`,
                // url: topic.link,
                snippet: topic.snippet,
                source: 'serper'
              })
          })
        }

        return results&&results.length > 0 ? results : [{
          title: '未找到相关结果',
          url: '',
          snippet: `没有找到关于"${query}"的搜索结果`,
          source: 'DuckDuckGo'
        }]

      } catch (error) {
        console.error(error);
      };

      // const results = []
      // console.log("response------------>>>",response)
      // // 提取相关主题
      // if (response.data.RelatedTopics && response.data.RelatedTopics.length > 0) {
      //   response.data.RelatedTopics.slice(0, maxResults).forEach((topic, index) => {
      //     if (topic.Text && topic.FirstURL) {
      //       results.push({
      //         title: topic.Text.split(' - ')[0] || `结果 ${index + 1}`,
      //         url: topic.FirstURL,
      //         snippet: topic.Text,
      //         source: 'DuckDuckGo'
      //       })
      //     }
      //   })
      // }

      // 如果没有相关主题，返回摘要
      // if (results.length === 0 && result.data.Abstract) {
      //   results.push({
      //     title: response.data.Heading || '摘要',
      //     url: response.data.AbstractURL || '',
      //     snippet: response.data.Abstract,
      //     source: 'DuckDuckGo'
      //   })
      // }
    } catch (error) {
      throw new Error(`DuckDuckGo搜索失败: ${error.message}`)
    }
  }
}