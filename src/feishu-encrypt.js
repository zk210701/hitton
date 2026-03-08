// CommonJS 版本（使用 require）
const CryptoJS = require('crypto-js');

class FeishuEncrypt {
  constructor(encryptKey, verificationToken) {
    this.encryptKey = encryptKey;
    this.verificationToken = verificationToken;
  }

  verifySignature(timestamp, nonce, body, signature) {
    if (!this.verificationToken) {
      console.log('[FeishuEncrypt] 未配置 verification_token，跳过签名验证');
      return true;
    }

    const signString = `${timestamp}${nonce}${body}`;
    const sign = CryptoJS.HmacSHA256(signString, this.verificationToken).toString(CryptoJS.enc.Base64);

    const isValid = sign === signature;
    console.log('[FeishuEncrypt] 签名验证:', isValid ? '通过' : '失败');
    
    if (!isValid) {
      console.log('[FeishuEncrypt] 预期签名:', sign);
      console.log('[FeishuEncrypt] 实际签名:', signature);
    }

    return isValid;
  }

  decrypt(encryptedData) {
    if (!this.encryptKey) {
      console.log('[FeishuEncrypt] 未配置 encrypt_key，跳过解密');
      return encryptedData;
    }

    try {
      const encryptedBytes = CryptoJS.enc.Base64.parse(encryptedData);
      const keyBytes = CryptoJS.enc.Base64.parse(this.encryptKey);

      const iv = CryptoJS.lib.WordArray.create(encryptedBytes.words.slice(0, 4));
      const cipherText = CryptoJS.lib.WordArray.create(encryptedBytes.words.slice(4));

      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: cipherText },
        keyBytes,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      console.log('[FeishuEncrypt] 解密成功');

      return decryptedString;
    } catch (error) {
      console.error('[FeishuEncrypt] 解密失败:', error.message);
      throw error;
    }
  }

  decryptEvent(encryptedBody) {
    try {
      const body = typeof encryptedBody === 'string' ? JSON.parse(encryptedBody) : encryptedBody;

      if (body.encrypt) {
        const decryptedString = this.decrypt(body.encrypt);
        const decryptedData = JSON.parse(decryptedString);
        console.log('[FeishuEncrypt] 事件解密成功');
        return decryptedData;
      }

      console.log('[FeishuEncrypt] 消息未加密，直接返回');
      return body;
    } catch (error) {
      console.error('[FeishuEncrypt] 事件解密失败:', error.message);
      throw error;
    }
  }
}

export default FeishuEncrypt;
