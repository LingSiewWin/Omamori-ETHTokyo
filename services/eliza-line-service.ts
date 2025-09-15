import { LinePlugin, LinePluginConfig } from '../plugins/line/index';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

class ElizaLineService {
  private linePlugin: LinePlugin;
  private isInitialized = false;

  constructor() {
    const config: LinePluginConfig = {
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
      channelSecret: process.env.LINE_CHANNEL_SECRET!,
      webhookUrl: process.env.WEBHOOK_URL || 'http://localhost:3002/webhook',
      elizaAgentUrl: process.env.ELIZA_AGENT_URL || 'http://localhost:3002'
    };

    this.linePlugin = new LinePlugin(config);
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('ElizaLineService already initialized');
      return;
    }

    try {
      // Start the LINE plugin server
      this.linePlugin.startServer(3002);
      this.isInitialized = true;
      console.log('🌸 ElizaLineService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ElizaLineService:', error);
      throw error;
    }
  }

  public async generateQRCode(sessionId?: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const uniqueSessionId = sessionId || this.generateSessionId();
    return await this.linePlugin.generateQRCode(uniqueSessionId);
  }

  public async verifyTransactionAndGrantAccess(
    userId: string,
    transactionHash: string
  ): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Verify transaction on blockchain (placeholder for real implementation)
    const isValidTransaction = await this.verifyTransaction(transactionHash);

    if (isValidTransaction) {
      return await this.linePlugin.verifyPurchase(userId, transactionHash);
    }

    return false;
  }

  public async notifyUser(userId: string, message: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await this.linePlugin.notifyUser(userId, message);
  }

  public getConnectedUsersCount(): number {
    return this.linePlugin.getConnectedUsersCount();
  }

  public getUserSession(userId: string) {
    return this.linePlugin.getUserSession(userId);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async verifyTransaction(transactionHash: string): Promise<boolean> {
    try {
      // In production, this would call Etherscan API or blockchain RPC
      // For demo, we'll simulate verification
      const fromAddress = process.env.FROM_ADDRESS?.toLowerCase();
      const toAddress = process.env.TO_ADDRESS?.toLowerCase();

      console.log('Verifying transaction:', {
        hash: transactionHash,
        expectedFrom: fromAddress,
        expectedTo: toAddress
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, accept any transaction hash longer than 10 characters
      return transactionHash && transactionHash.length > 10;

    } catch (error) {
      console.error('Transaction verification failed:', error);
      return false;
    }
  }

  // Cultural wisdom delivery methods
  public async sendDailyWisdom(userId: string): Promise<void> {
    const wisdom = this.getDailyWisdom();
    await this.notifyUser(userId, `🌸 今日の知恵\n\n${wisdom}\n\n良い一日をお過ごしください。`);
  }

  public async sendOmamoriUpdate(userId: string, level: number): Promise<void> {
    const message = `🎉 おめでとうございます！\n\nあなたのお守りがレベル${level}に進化しました！\n\n継続的な貯蓄の努力が実を結んでいます。この調子で頑張りましょう！ ⛩️✨`;
    await this.notifyUser(userId, message);
  }

  public async sendTransactionConfirmation(userId: string, transactionHash: string, amount: string): Promise<void> {
    const etherscanUrl = `https://etherscan.io/tx/${transactionHash}`;
    const message = `✅ 取引が確認されました\n\n金額: ${amount}\n取引ハッシュ: ${transactionHash.substring(0, 10)}...\n\n詳細: ${etherscanUrl}\n\nお守りの成長をお楽しみください！ 🌸`;
    await this.notifyUser(userId, message);
  }

  private getDailyWisdom(): string {
    const wisdoms = [
      '「もったいない」の心で、今日も無駄のない一日を過ごしましょう。',
      '「おもてなし」の気持ちで、家族や友人を大切にしましょう。',
      '「協働」の精神で、みんなで支え合いながら前進しましょう。',
      '「伝統」を大切にし、先祖の知恵を現代に活かしましょう。',
      '小さな積み重ねが、やがて大きな実りをもたらします。',
      '感謝の気持ちを忘れずに、今日という日を大切に過ごしましょう。',
      '自然との調和を保ちながら、持続可能な生活を心がけましょう。',
      '家族の絆を深め、次世代に文化を継承していきましょう。'
    ];

    const today = new Date();
    const dayIndex = today.getDate() % wisdoms.length;
    return wisdoms[dayIndex];
  }
}

// Singleton instance
const elizaLineService = new ElizaLineService();

export default elizaLineService;
export { ElizaLineService };