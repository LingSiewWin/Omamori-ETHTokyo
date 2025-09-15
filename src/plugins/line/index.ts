import { Plugin } from '@elizaos/core';
import { Client, middleware, WebhookEvent, MessageEvent, TextMessage } from '@line/bot-sdk';
import express from 'express';
import QRCode from 'qrcode';
import crypto from 'crypto';

interface LinePluginConfig {
  channelAccessToken: string;
  channelSecret: string;
  webhookUrl: string;
  elizaAgentUrl: string;
}

interface UserSession {
  userId: string;
  hasPurchased: boolean;
  transactionHash?: string;
  connectedAt: Date;
  omamoriLevel: number;
}

class LinePlugin implements Plugin {
  private client: Client;
  private app: express.Application;
  private config: LinePluginConfig;
  private userSessions: Map<string, UserSession> = new Map();

  constructor(config: LinePluginConfig) {
    this.config = config;
    this.client = new Client({
      channelAccessToken: config.channelAccessToken,
      channelSecret: config.channelSecret,
    });
    this.app = express();
    this.setupWebhook();
  }

  name = 'line';
  description = 'LINE Bot integration for personalized AI agent messaging';

  private setupWebhook() {
    this.app.post('/webhook', middleware({
      channelSecret: this.config.channelSecret
    }), (req, res) => {
      Promise.all(req.body.events.map((event: WebhookEvent) => this.handleEvent(event)))
        .then((result) => res.json(result))
        .catch((err) => {
          console.error('LINE Webhook Error:', err);
          res.status(500).end();
        });
    });

    this.app.get('/qr/:sessionId', async (req, res) => {
      try {
        const { sessionId } = req.params;
        const lineUrl = `https://line.me/R/ti/p/@omamori-bot?session=${sessionId}`;
        const qrCodeDataUrl = await QRCode.toDataURL(lineUrl);
        res.json({ qrCode: qrCodeDataUrl, lineUrl });
      } catch (error) {
        console.error('QR Code generation error:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
      }
    });

    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'omamori-line-plugin',
        connectedUsers: this.userSessions.size
      });
    });
  }

  private async handleEvent(event: WebhookEvent) {
    if (event.type === 'message' && event.message.type === 'text') {
      return this.handleTextMessage(event as MessageEvent);
    }
    if (event.type === 'follow') {
      return this.handleUserFollow(event);
    }
    return Promise.resolve(null);
  }

  private async handleTextMessage(event: MessageEvent) {
    const message = event.message as TextMessage;
    const userId = event.source.userId;

    if (!userId) return;

    const userSession = this.userSessions.get(userId);

    // Check if user has purchased the service
    if (!userSession?.hasPurchased) {
      return this.sendPurchaseRequiredMessage(event.replyToken);
    }

    // Forward message to ElizaOS agent for processing
    try {
      const elizaResponse = await this.queryElizaAgent(message.text, userSession);
      return this.client.replyMessage(event.replyToken, {
        type: 'text',
        text: elizaResponse
      });
    } catch (error) {
      console.error('ElizaOS query error:', error);
      return this.client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'すみません、一時的に応答できません。しばらく後でもう一度お試しください。'
      });
    }
  }

  private async handleUserFollow(event: any) {
    const userId = event.source.userId;

    if (!userId) return;

    // Create new user session
    this.userSessions.set(userId, {
      userId,
      hasPurchased: false,
      connectedAt: new Date(),
      omamoriLevel: 0
    });

    return this.client.replyMessage(event.replyToken, {
      type: 'text',
      text: `🌸 OMAMORI Villageへようこそ！\n\n個人化されたAIエージェントサービスをご利用いただくには、まずWebアプリでの取引が必要です。\n\n📱 アプリでMetaMaskを接続し、取引を完了してからもう一度お話しかけてください。`
    });
  }

  private async sendPurchaseRequiredMessage(replyToken: string) {
    const flexMessage = {
      type: 'flex',
      altText: 'サービス購入が必要です',
      contents: {
        type: 'bubble',
        hero: {
          type: 'image',
          url: 'https://example.com/omamori-hero.png', // Replace with actual image
          size: 'full',
          aspectRatio: '20:13',
          aspectMode: 'cover'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🔒 サービス未購入',
              weight: 'bold',
              size: 'xl',
              color: '#ff6b6b'
            },
            {
              type: 'text',
              text: '申し訳ございませんが、このサービスはご購入いただいていません。',
              size: 'md',
              color: '#666666',
              margin: 'md',
              wrap: true
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'text',
              text: '🌸 ご利用手順',
              weight: 'bold',
              size: 'lg',
              margin: 'lg'
            },
            {
              type: 'text',
              text: '1. WebアプリでMetaMaskを接続\n2. 取引を完了\n3. LINE Botサービスが利用可能に',
              size: 'sm',
              color: '#666666',
              margin: 'md',
              wrap: true
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              style: 'primary',
              color: '#1DB446',
              action: {
                type: 'uri',
                label: 'Webアプリで購入',
                uri: 'http://localhost:3001'
              }
            }
          ]
        }
      }
    };

    return this.client.replyMessage(replyToken, flexMessage as any);
  }

  private async queryElizaAgent(message: string, userSession: UserSession): Promise<string> {
    // This would integrate with the actual ElizaOS agent
    // For now, return contextual responses based on user's omamori level

    const responses = {
      greeting: [
        `こんにちは！あなたのお守りレベルは${userSession.omamoriLevel}です。今日はどのようなご相談でしょうか？ 🌸`,
        `いらっしゃいませ。文化的な貯蓄の旅はいかがですか？何かお手伝いできることはありますか？ ⛩️`,
      ],
      savings: [
        `もったいない精神で、無駄を省いた貯蓄を心がけましょう。小さな積み重ねが大切です。💰`,
        `おもてなしの心で、将来の自分への贈り物として貯蓄を続けていきましょう。🎁`,
      ],
      wisdom: [
        `「塵も積もれば山となる」- 小さな努力の積み重ねが、やがて大きな成果を生み出します。`,
        `「継続は力なり」- 毎日のコツコツとした取り組みが、確実に目標に近づけてくれます。`,
      ]
    };

    // Simple message classification (in production, this would use ElizaOS NLP)
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('こんにちは') || lowerMessage.includes('hello')) {
      return this.getRandomResponse(responses.greeting);
    } else if (lowerMessage.includes('貯金') || lowerMessage.includes('貯蓄') || lowerMessage.includes('save')) {
      return this.getRandomResponse(responses.savings);
    } else if (lowerMessage.includes('知恵') || lowerMessage.includes('アドバイス') || lowerMessage.includes('wisdom')) {
      return this.getRandomResponse(responses.wisdom);
    }

    // Default cultural response
    return `ありがとうございます。伝統的な日本の価値観を大切にしながら、あなたの金融的な目標達成をお手伝いいたします。具体的なご質問がございましたら、お気軽にお聞かせください。🌸`;
  }

  private getRandomResponse(responses: string[]): string {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Public methods for integration with main app
  public async generateQRCode(sessionId: string): Promise<string> {
    const lineUrl = `https://line.me/R/ti/p/@omamori-bot?session=${sessionId}`;
    return await QRCode.toDataURL(lineUrl);
  }

  public async verifyPurchase(userId: string, transactionHash: string): Promise<boolean> {
    const userSession = this.userSessions.get(userId);

    if (userSession) {
      // In production, this would verify the transaction on blockchain
      userSession.hasPurchased = true;
      userSession.transactionHash = transactionHash;
      userSession.omamoriLevel = 1;

      // Send welcome message
      await this.client.pushMessage(userId, {
        type: 'text',
        text: `🎉 購入確認完了！\n\nOMAMORI個人化AIエージェントサービスへようこそ！\n\n取引ハッシュ: ${transactionHash.substring(0, 10)}...\n\n今から私があなた専用のAIガーディアンとしてお手伝いいたします。何でもお気軽にお話しください！ 🌸⛩️`
      });

      return true;
    }

    return false;
  }

  public getUserSession(userId: string): UserSession | undefined {
    return this.userSessions.get(userId);
  }

  public getConnectedUsersCount(): number {
    return this.userSessions.size;
  }

  public async notifyUser(userId: string, message: string): Promise<void> {
    const userSession = this.userSessions.get(userId);

    if (userSession?.hasPurchased) {
      await this.client.pushMessage(userId, {
        type: 'text',
        text: message
      });
    }
  }

  public startServer(port: number = 3002): void {
    this.app.listen(port, () => {
      console.log(`🌸 OMAMORI LINE Plugin listening on port ${port}`);
      console.log(`Webhook URL: http://localhost:${port}/webhook`);
      console.log(`Health check: http://localhost:${port}/health`);
    });
  }
}

export { LinePlugin, type LinePluginConfig, type UserSession };
export default LinePlugin;