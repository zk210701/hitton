# Team Bots - 飞书多机器人协作系统

基于 Node.js + Express 的飞书多机器人协作平台，支持配置驱动的机器人扩展。

## 项目结构

```
team-bots/
├── config/
│   └── bots.json              # 机器人配置文件
├── src/
│   ├── server.js              # Webhook 服务器
│   └── bot-manager.js         # 机器人管理器
├── bots/
│   └── coo-bot/               # 运营总监机器人工作空间
│       ├── SKILL.md           # 能力定义
│       └── MEMORY.md          # 记忆文件
├── .env                       # 环境变量
├── .gitignore
└── package.json
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
编辑 `.env` 文件，设置机器人的 AppID 和 AppSecret：
```
PORT=3000
COO_BOT_APP_ID=cli_a929b8ebb5f81bc8
COO_BOT_APP_SECRET=Cko31GaqXjUkKmQ0WLfh6bwNQFEIfwhd
```

### 3. 启动服务器
```bash
npm start
# 或
npm run dev
```

### 4. 配置飞书 Webhook
在飞书开放平台配置事件订阅地址：
```
https://your-domain.com/webhook/coo-bot
```

## 当前机器人

### 运营总监 (COO Bot)
- **能力**: 运营策略、数据分析、内容运营、活动策划、竞品分析
- **AppID**: cli_a929b8ebb5f81bc8

## 添加新机器人

### 步骤

1. 在 `bots/` 下创建新的机器人目录（如 `bots/cmo-bot/`）
2. 创建 `SKILL.md` 和 `MEMORY.md`
3. 在 `config/bots.json` 添加新机器人配置：
```json
{
  "id": "cmo-bot",
  "name": "市场总监",
  "type": "cmo",
  "workspace": "bots/cmo-bot",
  "appId": "your_app_id",
  "appSecret": "your_app_secret",
  "capabilities": ["市场推广", "品牌建设", "公关活动"],
  "webhook": {
    "path": "/webhook/cmo-bot",
    "enabled": true
  },
  "enabled": true
}
```
4. 在 `.env` 添加环境变量
5. 在 `src/server.js` 添加对应的 Webhook 路由

## API 端点

- `GET /` - 服务信息和机器人列表
- `GET /health` - 健康检查
- `POST /webhook/coo-bot` - COO Bot Webhook

## 技术栈

- Node.js
- Express
- dotenv
- OpenClaw (feishu 工具)

## 开发计划

- [ ] 集成 OpenClaw feishu 消息工具
- [ ] 实现消息处理和响应逻辑
- [ ] 添加更多机器人角色
- [ ] 支持机器人间协作
- [ ] 添加数据分析功能
