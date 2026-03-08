import express from 'express';
import dotenv from 'dotenv';
import BotManager from './bot-manager.js';
import MessageHandler from './message-handler.js';
import FeishuEncrypt from './feishu-encrypt.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const botManager = new BotManager();
const messageHandler = new MessageHandler(botManager);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

botManager.initializeBots();

const encryptManager = {
  'coo-bot': new FeishuEncrypt(
    process.env.COO_BOT_ENCRYPT_KEY,
    process.env.COO_BOT_VERIFICATION_TOKEN
  )
};

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
    console.log('[Webhook] 收到 COO Bot 请求');

    const timestamp = req.headers['x-lark-request-timestamp'];
    const nonce = req.headers['x-lark-request-nonce'];
    const signature = req.headers['x-lark-signature'];

    let event = req.body;
    let isEncrypted = false;

    if (event.encrypt) {
      isEncrypted = true;
      console.log('[Webhook] 检测到加密消息，开始解密');

      const encrypt = encryptManager['coo-bot'];
      if (!encrypt) {
        console.error('[Webhook] 加密管理器未初始化');
        return res.status(500).json({ error: '加密管理器未初始化' });
      }

      const bodyString = JSON.stringify(req.body);
      if (timestamp && nonce && signature && encrypt.verificationToken) {
        const isValid = encrypt.verifySignature(timestamp, nonce, bodyString, signature);
        if (!isValid) {
          console.error('[Webhook] 签名验证失败');
          return res.status(403).json({ error: '签名验证失败' });
        }
      }

      try {
        event = encrypt.decryptEvent(req.body);
        console.log('[Webhook] 消息解密成功');
      } catch (error) {
        console.error('[Webhook] 消息解密失败:', error.message);
        return res.status(400).json({ error: '消息解密失败' });
      }
    }

    const challenge = event.challenge;
    if (challenge) {
      console.log('[Webhook] 响应 URL 验证');
      return res.json({ challenge });
    }

    const bot = botManager.getBot('coo-bot');
    if (!bot) {
      return res.status(404).json({ error: '机器人未找到' });
    }

    if (event.event) {
      console.log('[Webhook] 处理事件类型:', event.event.type);

      if (event.event.type === 'message' && event.event.content) {
        const content = typeof event.event.content === 'string' 
          ? JSON.parse(event.event.content) 
          : event.event.content;
        
        const messageReceiveId = { 
          id: event.event.sender.sender_id.open_id, 
          type: 'open_id' 
        };
        
        console.log('[Webhook] 收到消息内容:', content.text);
        
        await messageHandler.handle('coo-bot', messageReceiveId, content.text, event.event);
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
