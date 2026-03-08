class MessageHandler {
  constructor(botManager) {
    this.botManager = botManager;
  }

  async handle(botId, messageReceiveId, content) {
    const bot = this.botManager.getBot(botId);
    if (!bot) {
      throw new Error(`机器人 ${botId} 不存在`);
    }

    console.log(`[MessageHandler] ${bot.name} 收到消息:`, content);

    try {
      const skill = await this.botManager.getBotSkill(botId);
      const memory = await this.botManager.getBotMemory(botId);

      const response = await this.generateResponse(bot, content, skill, memory);

      const client = this.botManager.getBotClient(botId);
      if (client) {
        await client.sendTextMessage(messageReceiveId, response);
        return { success: true, response };
      } else {
        throw new Error('机器人客户端未初始化');
      }
    } catch (error) {
      console.error('[MessageHandler] 处理消息失败:', error);
      throw error;
    }
  }

  async generateResponse(bot, userMessage, skill, memory) {
    const capabilities = bot.capabilities.join('、');

    return `[${bot.name}] 

您好！我是运营总监机器人。

我的专业能力包括：${capabilities}

收到您的消息："${userMessage}"

正在为您分析...（消息处理逻辑待完善）
`;
  }
}

export default MessageHandler;
