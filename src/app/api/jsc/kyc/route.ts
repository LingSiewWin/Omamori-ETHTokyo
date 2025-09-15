import { NextRequest, NextResponse } from 'next/server';

// JSC KYC API endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lineUserId, userData } = body;

    if (!lineUserId) {
      return NextResponse.json(
        { success: false, error: 'LINE User ID required' },
        { status: 400 }
      );
    }

    // Mock JSC KYC integration
    console.log('🏛️ JSC KYC: Starting verification for LINE user:', lineUserId);

    // Simulate KYC verification process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock successful KYC result
    const kycResult = {
      status: 'verified',
      kycId: `kyc_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      verificationLevel: 'standard',
      verifiedAt: new Date().toISOString(),
      documents: ['id_card', 'proof_of_address'],
      lineUserId
    };

    console.log('✅ JSC KYC: Verification completed for user:', lineUserId);

    return NextResponse.json({
      success: true,
      kyc: kycResult,
      message: 'KYC verification completed successfully'
    });

  } catch (error) {
    console.error('❌ JSC KYC Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'KYC verification failed',
        message: 'Please ensure you have completed LINE connection first'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lineUserId = searchParams.get('lineUserId');

  if (!lineUserId) {
    return NextResponse.json(
      { success: false, error: 'LINE User ID required' },
      { status: 400 }
    );
  }

  // Mock KYC status check
  return NextResponse.json({
    success: true,
    kycStatus: 'pending',
    message: 'KYC verification required. Please complete the verification process.'
  });
}