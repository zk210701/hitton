import express from 'express';
import dotenv from 'dotenv';
import BotManager from './bot-manager.js';
import MessageHandler from './message-handler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const botManager = new BotManager();
const messageHandler = new MessageHandler(botManager);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

botManager.initializeBots();

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    bots: botManager.getAllBots().length,
    activeBots: botManager.getEnabledBots().length 
  });
});

app.get('/', (req, res) => {
  const bots = botManager.getAllBots();
  const botList = bots.map(bot => ({
    id: bot.id,
    name: bot.name,
    capabilities: bot.capabilities,
    status: bot.enabled ? 'enabled' : 'disabled',
    webhook: bot.webhook.enabled ? `${req.protocol}://${req.get('host')}${bot.webhook.path}` : 'disabled'
  }));

  res.json({
    service: 'Team Bots - 飞书多机器人协作系统',
    version: '1.0.0',
    totalBots: bots.length,
    bots: botList
  });
});

app.post('/webhook/coo-bot', async (req, res) => {
  try {
    console.log('[Webhook] 收到 COO Bot 请求:', JSON.stringify(req.body, null, 2));

    const challenge = req.body.challenge;
    if (challenge) {
      console.log('[Webhook] 响应 URL 验证');
      return res.json({ challenge });
    }

    const bot = botManager.getBot('coo-bot');
    if (!bot) {
      return res.status(404).json({ error: '机器人未找到' });
    }

    const event = req.body.event;
    if (event) {
      console.log('[Webhook] 处理事件类型:', event.type);

      if (event.type === 'message' && event.content) {
        const content = JSON.parse(event.content);
        const messageReceiveId = { id: event.sender.sender_id.open_id, type: 'open_id' };
        
        await messageHandler.handle('coo-bot', messageReceiveId, content.text);
      }
    }

    res.json({ code: 0, msg: 'success' });

  } catch (error) {
    console.error('[Webhook] 处理失败:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`[Server] 飞书多机器人协作系统已启动`);
  console.log(`[Server] 服务运行在: http://localhost:${PORT}`);
  console.log(`[Server] 健康检查: http://localhost:${PORT}/health`);
  console.log(`[Server] Webhook 路径: http://localhost:${PORT}/webhook/coo-bot`);
});
