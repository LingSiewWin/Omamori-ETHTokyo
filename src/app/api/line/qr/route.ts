import { NextRequest, NextResponse } from 'next/server';
import elizaLineService from '@/services/elizaLineService';

export async function GET(request: NextRequest) {
  try {
    // Generate a unique session ID for this connection attempt
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Generate QR code using the ElizaLineService
    const qrCode = await elizaLineService.generateQRCode(sessionId);

    return NextResponse.json({
      success: true,
      qrCode,
      sessionId,
      instructions: 'Scan this QR code with LINE to connect to your personalized AI agent'
    });

  } catch (error) {
    console.error('QR Code generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate QR code',
        message: 'Please make sure LINE Bot is properly configured'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, transactionHash } = body;

    if (!userId || !transactionHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId and transactionHash'
        },
        { status: 400 }
      );
    }

    // Verify transaction and grant LINE Bot access
    const verified = await elizaLineService.verifyTransactionAndGrantAccess(
      userId,
      transactionHash
    );

    if (verified) {
      return NextResponse.json({
        success: true,
        message: 'Transaction verified. LINE Bot access granted.',
        userId,
        transactionHash
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction verification failed'
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Transaction verification error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Transaction verification failed',
        message: 'Please try again later'
      },
      { status: 500 }
    );
  }
}