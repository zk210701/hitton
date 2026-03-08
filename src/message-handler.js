import AIClient from './ai-client.js';

class MessageHandler {
  constructor(botManager) {
    this.botManager = botManager;
    this.aiClients = new Map();
    this.initializeAIClients();
  }

  initializeAIClients() {
    const aiApiKey = process.env.AI_API_KEY;
    const aiBaseUrl = process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/';
    const aiModel = process.env.AI_MODEL || 'glm-4.7';

    if (aiApiKey) {
      const aiClient = new AIClient(aiApiKey, aiBaseUrl, aiModel);
      this.aiClients.set('default', aiClient);
      console.log('[MessageHandler] AI 客户端已初始化');
    } else {
      console.warn('[MessageHandler] 未配置 AI_API_KEY，AI 功能将不可用');
    }
  }

  async handle(botId, messageReceiveId, content, eventData = null) {
    const bot = this.botManager.getBot(botId);
    if (!bot) {
      throw new Error(`机器人 ${botId} 不存在`);
    }

    console.log(`[MessageHandler] ${bot.name} 收到消息:`, content);

    try {
      const mentions = this.extractMentions(content);
      const isMentioned = this.isBotMentioned(mentions, bot.name);

      if (!isMentioned) {
        console.log(`[MessageHandler] 消息未@${bot.name}，跳过处理`);
        return { success: true, skipped: true };
      }

      const cleanedMessage = this.cleanMessage(content, mentions, bot.name);
      console.log(`[MessageHandler] 清理后的消息:`, cleanedMessage);

      const skill = await this.botManager.getBotSkill(botId);
      const memory = await this.botManager.getBotMemory(botId);

      const response = await this.generateResponse(bot, cleanedMessage, skill, memory);

      const client = this.botManager.getBotClient(botId);
      if (client) {
        await client.sendTextMessage(messageReceiveId, response);
        
        if (memory) {
          await this.updateMemory(botId, memory, cleanedMessage, response);
        }

        return { success: true, response };
      } else {
        throw new Error('机器人客户端未初始化');
      }
    } catch (error) {
      console.error('[MessageHandler] 处理消息失败:', error);
      throw error;
    }
  }

  extractMentions(text) {
    const mentionRegex = /@_user_1/g;
    const mentions = text.match(mentionRegex) || [];
    return mentions;
  }

  isBotMentioned(mentions, botName) {
    if (mentions.length === 0) {
      return true;
    }
    return mentions.length > 0;
  }

  cleanMessage(text, mentions, botName) {
    let cleanedText = text;

    mentions.forEach(mention => {
      cleanedText = cleanedText.replace(mention, '');
    });

    cleanedText = cleanedText.trim();

    const botNameMentions = [
      `@${botName}`,
      `@运营总监`,
      `@coo`
    ];

    botNameMentions.forEach(nameMention => {
      if (cleanedText.startsWith(nameMention)) {
        cleanedText = cleanedText.substring(nameMention.length).trim();
      }
      cleanedText = cleanedText.replace(nameMention, '');
    });

    cleanedText = cleanedText.trim();

    if (!cleanedText || cleanedText.length === 0) {
      return '你好，请问有什么可以帮助你的？';
    }

    return cleanedText;
  }

  async generateResponse(bot, userMessage, skill, memory) {
    const aiClient = this.aiClients.get('default');

    if (!aiClient) {
      return this.generateFallbackResponse(bot, userMessage, skill);
    }

    try {
      const capabilities = bot.capabilities;
      const response = await aiClient.generateResponse(
        userMessage,
        bot.name,
        capabilities,
        skill,
        memory
      );

      return response;
    } catch (error) {
      console.error('[MessageHandler] AI 生成响应失败:', error);
      return this.generateFallbackResponse(bot, userMessage, skill);
    }
  }

  generateFallbackResponse(bot, userMessage, skill) {
    const capabilities = bot.capabilities.join('、');
    const currentTime = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `🤖 ${bot.name}

您好！我是运营总监机器人。

⚠️ AI 服务暂时不可用，我将使用基础模式为您服务。

我的专业能力包括：
${bot.capabilities.map(cap => `  • ${cap}`).join('\n')}

收到您的消息："${userMessage}"

时间：${currentTime}

如需使用完整 AI 功能，请联系管理员配置 AI 服务。`;
  }

  async updateMemory(botId, currentMemory, userMessage, response) {
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newEntry = `\n\n## 交互记录 - ${timestamp}\n**用户消息:** ${userMessage}\n**AI回复:** ${response}`;

    const updatedMemory = currentMemory + newEntry;
    this.botManager.updateBotMemory(botId, updatedMemory);
  }
}

export default MessageHandler;
