import OpenAI from 'openai';

class AIClient {
  constructor(apiKey, baseUrl = 'https://open.bigmodel.cn/api/paas/v4/', model = 'glm-4.7') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl
    });
  }

  async generateResponse(userMessage, botName, capabilities, skill = null, memory = null) {
    try {
      const systemPrompt = this.buildSystemPrompt(botName, capabilities, skill, memory);

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      console.log('[AIClient] 发送请求到 AI 服务:', this.model);
      console.log('[AIClient] 用户消息:', userMessage);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9
      });

      const aiResponse = response.choices[0].message.content;
      console.log('[AIClient] AI 回复成功');
      console.log('[AIClient] AI 回复内容:', aiResponse.substring(0, 100) + '...');

      return aiResponse;
    } catch (error) {
      console.error('[AIClient] AI 请求失败:', error.message);
      if (error.response) {
        console.error('[AIClient] API 响应:', error.response.data);
      }
      throw error;
    }
  }

  buildSystemPrompt(botName, capabilities, skill, memory) {
    let prompt = `你是一个专业的${botName}，负责团队运营管理工作。

你的专业能力包括：
${capabilities.map(cap => `- ${cap}`).join('\n')}

请以专业、务实、有洞察力的方式回答用户问题。回答时请注意：
1. 提供具体的可执行建议
2. 结合实际业务场景
3. 用数据和事实支撑观点
4. 保持简洁清晰的表达
5. 必要时可以提问以获取更多信息
`;

    if (skill) {
      prompt += `\n\n专业技能说明：\n${skill}\n`;
    }

    if (memory) {
      prompt += `\n\n历史上下文和记忆：\n${memory}\n`;
    }

    prompt += `
现在，请根据你的专业能力，回答用户的问题。`;
    
    return prompt;
  }

  async generate运营策略(userMessage, context) {
    const prompt = `作为运营总监，请针对以下问题提供专业的运营策略建议：
${userMessage}

背景信息：
${JSON.stringify(context, null, 2)}

请从以下维度分析：
1. 用户洞察
2. 市场机会
3. 运营策略
4. 执行步骤
5. 风险评估
6. 数据指标`;

    return this.generateResponse(prompt, '运营总监', ['运营策略']);
  }

  async generate数据分析(userMessage) {
    const prompt = `作为运营总监，请对以下数据进行分析：
${userMessage}

请从以下维度分析：
1. 数据趋势
2. 关键指标
3. 异常发现
4. 优化建议
5. 行动计划`;

    return this.generateResponse(prompt, '运营总监', ['数据分析']);
  }

  async generate内容运营(userMessage) {
    const prompt = `作为内容运营专家，请针对以下需求提供内容运营方案：
${userMessage}

请从以下维度提供方案：
1. 内容策略
2. 内容形式
3. 发布渠道
4. 内容日历
5. 效果评估`;

    return this.generateResponse(prompt, '运营总监', ['内容运营']);
  }

  async generate活动策划(userMessage) {
    const prompt = `作为活动策划专家，请针对以下需求设计活动方案：
${userMessage}

请从以下维度设计：
1. 活动目标
2. 活动主题
3. 活动形式
4. 推广策略
5. 执行流程
6. 预算规划
7. 效果评估`;

    return this.generateResponse(prompt, '运营总监', ['活动策划']);
  }

  async generate竞品分析(userMessage) {
    const prompt = `作为市场分析师，请对竞品进行分析：
${userMessage}

请从以下维度分析：
1. 产品定位
2. 核心功能
3. 商业模式
4. 用户画像
5. 优劣势分析
6. 竞争策略`;

    return this.generateResponse(prompt, '运营总监', ['竞品分析']);
  }
}

export default AIClient;
