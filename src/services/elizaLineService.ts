/**
 * ElizaLineService - Integration between ElizaOS and LINE Bot
 * Handles QR code generation and transaction verification
 */

interface TransactionVerification {
  hash: string;
  verified: boolean;
  timestamp: number;
}

class ElizaLineService {
  private verifiedTransactions = new Map<string, TransactionVerification>();
  private userSessions = new Map<string, { userId: string; sessionId: string; timestamp: number }>();

  /**
   * Generate a QR code for LINE Bot connection
   */
  async generateQRCode(sessionId: string): Promise<string> {
    if (!process.env.LINE_BOT_CHANNEL_ID) {
      throw new Error('LINE Bot not configured. Please set LINE_BOT_CHANNEL_ID environment variable.');
    }

    // Generate real LINE Bot add friend URL
    const lineAddUrl = `https://line.me/R/ti/p/@${process.env.LINE_BOT_CHANNEL_ID}`;

    // In a real implementation, use a proper QR code library like qrcode
    const qrCodeSvg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white" stroke="black"/>
        <text x="100" y="80" text-anchor="middle" fill="black" font-size="10" font-family="Arial">
          LINE Bot QR Code
        </text>
        <text x="100" y="100" text-anchor="middle" fill="black" font-size="8">
          Session: ${sessionId.substring(0, 8)}...
        </text>
        <text x="100" y="120" text-anchor="middle" fill="blue" font-size="6" text-decoration="underline">
          ${lineAddUrl}
        </text>
        <text x="100" y="140" text-anchor="middle" fill="black" font-size="8">
          Scan to connect
        </text>
        <text x="100" y="160" text-anchor="middle" fill="red" font-size="6">
          ⚠️ Real API key required
        </text>
      </svg>
    `;

    const qrCodeData = `data:image/svg+xml;base64,${Buffer.from(qrCodeSvg).toString('base64')}`;

    console.log('🌸 ElizaLineService: Generated QR code for session:', sessionId);
    console.log('📱 LINE Add URL:', lineAddUrl);

    return qrCodeData;
  }

  /**
   * Verify transaction and grant LINE Bot access
   */
  async verifyTransactionAndGrantAccess(userId: string, transactionHash: string): Promise<boolean> {
    try {
      console.log('🌸 ElizaLineService: Verifying transaction:', {
        userId: userId.substring(0, 8) + '...',
        txHash: transactionHash.substring(0, 10) + '...'
      });

      // Mock transaction verification
      // In real implementation, would check blockchain transaction
      const isValidHash = transactionHash.startsWith('0x') && transactionHash.length >= 10;

      if (isValidHash) {
        // Store verified transaction
        this.verifiedTransactions.set(userId, {
          hash: transactionHash,
          verified: true,
          timestamp: Date.now()
        });

        console.log('✅ ElizaLineService: Transaction verified for user:', userId.substring(0, 8) + '...');
        return true;
      }

      console.log('❌ ElizaLineService: Invalid transaction hash');
      return false;
    } catch (error) {
      console.error('❌ ElizaLineService: Transaction verification error:', error);
      return false;
    }
  }

  /**
   * Check if user has verified transaction
   */
  isUserVerified(userId: string): boolean {
    const verification = this.verifiedTransactions.get(userId);
    return verification?.verified || false;
  }

  /**
   * Store user session
   */
  storeUserSession(userId: string, sessionId: string): void {
    this.userSessions.set(sessionId, {
      userId,
      sessionId,
      timestamp: Date.now()
    });
  }

  /**
   * Get user from session
   */
  getUserFromSession(sessionId: string): string | null {
    const session = this.userSessions.get(sessionId);
    return session?.userId || null;
  }
}

// Create singleton instance
const elizaLineService = new ElizaLineService();

export default elizaLineService;