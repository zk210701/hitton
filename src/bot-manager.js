import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FeishuClient from './feishu-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BotManager {
  constructor() {
    this.bots = new Map();
    this.configPath = path.join(__dirname, '../config/bots.json');
    this.clients = new Map();
  }

  loadConfig() {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);
      console.log(`[BotManager] 已加载配置，共 ${this.config.bots.length} 个机器人`);
      return this.config;
    } catch (error) {
      console.error('[BotManager] 加载配置失败:', error.message);
      throw error;
    }
  }

  getBot(botId) {
    return this.bots.get(botId);
  }

  getAllBots() {
    return Array.from(this.bots.values());
  }

  getEnabledBots() {
    return this.getAllBots().filter(bot => bot.enabled);
  }

  getBotByAppId(appId) {
    return this.getAllBots().find(bot => bot.appId === appId);
  }

  getBotClient(botId) {
    return this.clients.get(botId);
  }

  async getBotSkill(botId) {
    const bot = this.getBot(botId);
    if (!bot) {
      throw new Error(`机器人 ${botId} 不存在`);
    }

    const skillPath = path.join(process.cwd(), bot.workspace, 'SKILL.md');
    try {
      const skillContent = fs.readFileSync(skillPath, 'utf-8');
      return skillContent;
    } catch (error) {
      console.error(`[BotManager] 读取 SKILL.md 失败:`, error.message);
      return null;
    }
  }

  async getBotMemory(botId) {
    const bot = this.getBot(botId);
    if (!bot) {
      throw new Error(`机器人 ${botId} 不存在`);
    }

    const memoryPath = path.join(process.cwd(), bot.workspace, 'MEMORY.md');
    try {
      const memoryContent = fs.readFileSync(memoryPath, 'utf-8');
      return memoryContent;
    } catch (error) {
      console.error(`[BotManager] 读取 MEMORY.md 失败:`, error.message);
      return null;
    }
  }

  updateBotMemory(botId, content) {
    const bot = this.getBot(botId);
    if (!bot) {
      throw new Error(`机器人 ${botId} 不存在`);
    }

    const memoryPath = path.join(process.cwd(), bot.workspace, 'MEMORY.md');
    try {
      fs.writeFileSync(memoryPath, content, 'utf-8');
      console.log(`[BotManager] 已更新 ${botId} 的记忆`);
      return true;
    } catch (error) {
      console.error(`[BotManager] 更新 MEMORY.md 失败:`, error.message);
      return false;
    }
  }

  initializeBots() {
    this.loadConfig();
    
    this.config.bots.forEach(botConfig => {
      if (botConfig.enabled) {
        this.bots.set(botConfig.id, botConfig);
        
        const client = new FeishuClient(botConfig.appId, botConfig.appSecret);
        this.clients.set(botConfig.id, client);
        
        console.log(`[BotManager] 已初始化机器人: ${botConfig.name} (${botConfig.id})`);
      }
    });

    console.log(`[BotManager] 已初始化 ${this.bots.size} 个机器人`);
  }
}

export default BotManager;
