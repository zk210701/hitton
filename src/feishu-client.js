import axios from 'axios';

class FeishuClient {
  constructor(appId, appSecret) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.baseUrl = 'https://open.feishu.cn/open-apis';
    this.accessToken = null;
    this.tokenExpireTime = 0;
  }

  async getTenantAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/auth/v3/tenant_access_token/internal`, {
        app_id: this.appId,
        app_secret: this.appSecret
      });

      if (response.data.code === 0) {
        this.accessToken = response.data.tenant_access_token;
        this.tokenExpireTime = Date.now() + (response.data.expire - 60) * 1000;
        return this.accessToken;
      } else {
        throw new Error(`获取访问令牌失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('[FeishuClient] 获取访问令牌错误:', error.message);
      throw error;
    }
  }

  async sendMessage(messageReceiveId, content, msgType = 'text') {
    const token = await this.getTenantAccessToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/im/v1/messages?receive_id_type=${messageReceiveId.type}`,
        {
          receive_id: messageReceiveId.id,
          msg_type: msgType,
          content: JSON.stringify(content)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.code === 0) {
        console.log('[FeishuClient] 消息发送成功');
        return response.data.data;
      } else {
        throw new Error(`发送消息失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('[FeishuClient] 发送消息错误:', error.message);
      throw error;
    }
  }

  async sendTextMessage(messageReceiveId, text) {
    return this.sendMessage(messageReceiveId, { text: text }, 'text');
  }

  async sendCardMessage(messageReceiveId, card) {
    return this.sendMessage(messageReceiveId, card, 'interactive');
  }

  async getUserInfo(userId) {
    const token = await this.getTenantAccessToken();

    try {
      const response = await axios.get(
        `${this.baseUrl}/contact/v3/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.code === 0) {
        return response.data.data.user;
      } else {
        throw new Error(`获取用户信息失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('[FeishuClient] 获取用户信息错误:', error.message);
      throw error;
    }
  }
}

export default FeishuClient;
