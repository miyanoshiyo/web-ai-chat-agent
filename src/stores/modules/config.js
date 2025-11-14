const state = {
  // 模型配置
  models: {
    main: {
      provider: 'openai',
      modelName: 'gpt-3.5-turbo',
      apiKey: '',
      baseURL: 'https://api.openai.com/v1',
      maxTokens: 4000
    },
    task: {
      provider: 'openai', 
      modelName: 'gpt-3.5-turbo',
      apiKey: '',
      baseURL: 'https://api.openai.com/v1',
      maxTokens: 2000
    }
  },
  // 当前使用的模型指针
  currentModelPointer: 'main',
  // 工具配置
  tools: {},
  // 全局配置
  globalConfig: {
    temperature: 0.7,
    stream: false,
    safeMode: false
  }
}

const mutations = {
  SET_MODEL_CONFIG(state, { pointer, config }) {
    state.models[pointer] = { ...state.models[pointer], ...config }
    // 保存到localStorage
    localStorage.setItem('kode-config', JSON.stringify(state))
  },
  
  SET_CURRENT_MODEL_POINTER(state, pointer) {
    state.currentModelPointer = pointer
  },
  
  SET_GLOBAL_CONFIG(state, config) {
    state.globalConfig = { ...state.globalConfig, ...config }
    localStorage.setItem('kode-config', JSON.stringify(state))
  },
  
  LOAD_CONFIG(state) {
    const saved = localStorage.getItem('kode-config')
    if (saved) {
      const config = JSON.parse(saved)
      Object.assign(state, config)
    }
  }
}

const actions = {
  saveModelConfig({ commit }, { pointer, config }) {
    commit('SET_MODEL_CONFIG', { pointer, config })
  },
  
  switchModel({ commit }, pointer) {
    commit('SET_CURRENT_MODEL_POINTER', pointer)
  },
  
  updateGlobalConfig({ commit }, config) {
    commit('SET_GLOBAL_CONFIG', config)
  },
  
  loadConfig({ commit }) {
    commit('LOAD_CONFIG')
  }
}

const getters = {
  currentModel: (state) => state.models[state.currentModelPointer],
  availableModels: (state) => Object.keys(state.models),
  modelConfig: (state) => (pointer) => state.models[pointer]
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}