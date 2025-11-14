# AI Assistant

一个简单的纯前端实现的智能体demo，支持多轮对话，工具调用
对话显示还没写好

## 功能特性

### ✅ 核心功能
- **多模型配置** - 支持OpenAI、Anthropic等多种AI提供商
- **模型指针系统** - main、task、reasoning、quick等模型指针
- **任务分解** - 复杂任务自动拆解为子任务
- **工具调用** - Web友好的工具执行系统
- **对话管理** - 完整的对话历史管理


### 🛠️ 可用工具
- **WebSearchTool** - 使用serper进行网络搜索，自行配置myHeaders.append("X-API-KEY", "");
- **URLFetcherTool** - 网页内容获取
- **TaskTool** - 任务分解和执行
- **CalculatorTool** - 数学计算

## 项目结构

```
agentweb/
├── src/
│   ├── components/          # Vue组件
│   │   └── ConfigDialog.vue # 配置对话框
│   ├── services/           # 服务层
│   │   ├── aiService.js    # AI服务
│   │   └── toolManager.js  # 工具管理器
│   ├── stores/             # Vuex状态管理
│   │   ├── index.js        # 主store
│   │   └── modules/        # 模块
│   │       ├── config.js   # 配置管理
│   │       └── conversation.js # 对话管理
│   ├── tools/              # 工具实现
│   │   ├── WebSearchTool.js
│   │   ├── URLFetcherTool.js
│   │   ├── TaskTool.js
│   │   └── CalculatorTool.js
│   ├── App.vue             # 主应用组件
│   └── main.js             # 应用入口
├── public/
│   └── index.html          # HTML模板
├── package.json            # 项目配置
├── vue.config.js           # Vue配置
└── README.md               # 项目说明
```

## 快速开始

### 安装依赖
```bash
cd agentweb
npm install
```

### 开发模式
```bash
npm run serve
```

### 构建生产版本
```bash
npm run build
```

## 使用说明

### 1. 配置AI模型
1. 点击界面中的"配置"按钮
2. 在"模型配置"标签页中配置API密钥
3. 选择AI提供商（OpenAI/Anthropic）
4. 填写模型名称、Base URL等信息
5. 点击"测试连接"验证配置
6. 保存配置

### 2. 开始对话
1. 在左侧选择要使用的模型指针
2. 在输入框中输入问题
3. 点击"发送"或按Enter键
4. AI将自动分析任务并调用相应工具

### 3. 任务分解
- 当AI识别到复杂任务时，会自动调用TaskTool
- TaskTool会将任务分解为多个子任务
- 每个子任务独立执行
- 最终结果会被整合返回


### 工具执行流程
```
用户输入 → AI分析 → 工具调用 → 结果处理 → 最终响应
```

### 任务分解流程
```
复杂任务 → TaskTool分析 → 拆分子任务 → 执行子任务 → 整合结果
```

## 扩展开发

### 添加新工具
1. 在 `src/tools/` 目录下创建工具文件
2. 实现工具的基本结构：
   ```javascript
   export const MyTool = {
     name: 'MyTool',
     description: '工具描述',
     inputSchema: { /* 输入参数定义 */ },
     async execute(input) { /* 工具执行逻辑 */ }
   }
   ```
3. 在 `src/services/toolManager.js` 中注册工具

### 添加新AI提供商
1. 在 `src/services/aiService.js` 中添加新的provider处理
2. 实现对应的API调用方法
3. 更新配置界面支持新的provider



## 许可证
Apache 2.0
