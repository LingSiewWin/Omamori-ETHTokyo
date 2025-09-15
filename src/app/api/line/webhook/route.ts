import { NextRequest, NextResponse } from 'next/server';
import lineBotService from '@/services/lineBot';

// LINE Bot Webhook endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events } = body;

    if (!events || events.length === 0) {
      return NextResponse.json({ success: true, message: 'No events to process' });
    }

    for (const event of events) {
      await handleLineEvent(event);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ LINE Webhook Error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleLineEvent(event: any) {
  const { type, source, message } = event;

  if (type !== 'message' || message.type !== 'text') {
    return;
  }

  const userId = source.userId;
  const messageText = message.text.toLowerCase().trim();

  console.log('📱 LINE Message:', userId, '->', messageText);

  try {
    // Command handling
    if (messageText.startsWith('/')) {
      await handleCommand(userId, messageText);
    } else {
      await handleGeneralMessage(userId, messageText);
    }
  } catch (error) {
    console.error('❌ LINE Event Handler Error:', error);
    await sendReply(userId, '❌ Sorry, I encountered an error. Please try again.');
  }
}

async function handleCommand(userId: string, command: string) {
  const cmd = command.split(' ')[0];
  const args = command.split(' ').slice(1);

  switch (cmd) {
    case '/start':
    case '/register':
      await handleRegister(userId);
      break;

    case '/kyc':
      await handleKYC(userId);
      break;

    case '/wallet':
      if (args.length > 0) {
        await handleWalletLink(userId, args[0]);
      } else {
        await sendReply(userId, '🦊 Please provide your wallet address:\n/wallet 0x...');
      }
      break;

    case '/deposit':
      if (args.length > 0) {
        await handleDeposit(userId, parseInt(args[0]) || 1000);
      } else {
        await sendReply(userId, '💰 Please specify amount:\n/deposit 5000');
      }
      break;

    case '/family':
      await handleFamilyCommand(userId, args);
      break;

    case '/status':
      await handleStatus(userId);
      break;

    case '/help':
      await handleHelp(userId);
      break;

    default:
      await sendReply(userId, '❓ Unknown command. Type /help for available commands.');
  }
}

async function handleGeneralMessage(userId: string, messageText: string) {
  // Simple AI-like responses for demo
  const responses = {
    'hello': '👋 Hello! Welcome to OMAMORI! Type /help to see what I can do.',
    'savings': '💰 Great question about savings! Use /deposit to add money to your OMAMORI.',
    'family': '👨‍👩‍👧‍👦 Family savings are important! Use /family create to start a family group.',
    'help': 'ℹ️ Here to help! Type /help for available commands.',
    'omamori': '🌸 OMAMORI are protective charms that grow stronger with your savings!',
    'japan': '🇯🇵 Our platform follows Japanese cultural values of mindful saving.',
  };

  for (const [keyword, response] of Object.entries(responses)) {
    if (messageText.includes(keyword)) {
      await sendReply(userId, response);
      return;
    }
  }

  // Default response
  await sendReply(userId, '🤔 I understand you\'re interested in savings! Type /help to see how I can assist you.');
}

async function handleRegister(userId: string) {
  try {
    const user = await lineBotService.registerUser(userId, `User_${userId.substring(0, 8)}`);
    await sendReply(userId,
      `✅ Welcome to OMAMORI!\n\n🌸 You're now registered!\n\nNext steps:\n1. Complete KYC: /kyc\n2. Link wallet: /wallet 0x...\n3. Start saving: /deposit 1000\n\nType /help anytime!`
    );
  } catch (error) {
    await sendReply(userId, '❌ Registration failed. Please try again.');
  }
}

async function handleKYC(userId: string) {
  try {
    await lineBotService.verifyKYC(userId);
    await sendReply(userId,
      `✅ KYC Verified!\n\n🏛️ Japan Smart Chain KYC completed successfully!\n\nYou can now:\n• Link your wallet\n• Make deposits\n• Join family groups\n\nNext: /wallet 0x...`
    );
  } catch (error) {
    await sendReply(userId, '❌ KYC verification failed. Please register first with /start');
  }
}

async function handleWalletLink(userId: string, walletAddress: string) {
  try {
    await lineBotService.linkWallet(userId, walletAddress);
    await sendReply(userId,
      `🦊 Wallet Linked!\n\nAddress: ${walletAddress.substring(0, 10)}...\n\n✅ You're all set! Now you can:\n• Make deposits: /deposit 5000\n• Check status: /status\n• Create family group: /family create\n\nStart your OMAMORI journey! 🌸`
    );
  } catch (error) {
    await sendReply(userId, '❌ Wallet linking failed. Make sure you completed KYC first: /kyc');
  }
}

async function handleDeposit(userId: string, amount: number) {
  try {
    const userInfo = lineBotService.getUserInfo(userId);

    if (userInfo?.familyGroupId) {
      // Family deposit
      await lineBotService.processFamilyTransaction(userId, amount, 'JPYC');
    } else {
      // Individual deposit
      await lineBotService.processIndividualDeposit(userId, amount, 'JPYC');
    }
  } catch (error) {
    await sendReply(userId, '❌ Deposit failed. Make sure you completed setup: /status');
  }
}

async function handleFamilyCommand(userId: string, args: string[]) {
  const subCommand = args[0];

  switch (subCommand) {
    case 'create':
      try {
        const groupName = args.slice(1).join(' ') || 'My Family';
        await lineBotService.createFamilyGroup(userId, groupName);
        await sendReply(userId,
          `👨‍👩‍👧‍👦 Family Group Created!\n\nName: ${groupName}\n\n🔗 Share this ID with family:\nfamily_${userId.substring(0, 8)}\n\nFamily members can join with:\n/family join family_${userId.substring(0, 8)}`
        );
      } catch (error) {
        await sendReply(userId, '❌ Failed to create family group. Complete KYC first: /kyc');
      }
      break;

    case 'join':
      if (args[1]) {
        try {
          await lineBotService.joinFamilyGroup(userId, args[1]);
        } catch (error) {
          await sendReply(userId, '❌ Failed to join family group. Check the group ID.');
        }
      } else {
        await sendReply(userId, '📝 Please provide group ID:\n/family join family_12345678');
      }
      break;

    case 'heir':
      if (args[1]) {
        try {
          await lineBotService.setFamilyHeir(userId, args[1]);
          await sendReply(userId, '⚖️ Family heir designated successfully!');
        } catch (error) {
          await sendReply(userId, '❌ Failed to set heir. Make sure you\'re in a family group.');
        }
      } else {
        await sendReply(userId, '⚖️ Please provide heir wallet address:\n/family heir 0x...');
      }
      break;

    default:
      await sendReply(userId,
        `👨‍👩‍👧‍👦 Family Commands:\n\n/family create [name] - Create family group\n/family join [groupId] - Join family group\n/family heir [address] - Set inheritance heir\n\nFamily savings strengthen bonds! 🌸`
      );
  }
}

async function handleStatus(userId: string) {
  try {
    const userInfo = lineBotService.getUserInfo(userId);

    if (!userInfo) {
      await sendReply(userId, '❌ Not registered. Use /start to begin!');
      return;
    }

    const transactions = lineBotService.getUserTransactions(userId);
    const totalDeposits = transactions
      .filter(tx => tx.type === 'deposit')
      .reduce((sum, tx) => sum + tx.amount, 0);

    let statusMessage = `📊 Your OMAMORI Status\n\n`;
    statusMessage += `👤 User: ${userInfo.displayName}\n`;
    statusMessage += `✅ KYC: ${userInfo.kycVerified ? 'Verified' : 'Pending'}\n`;
    statusMessage += `🦊 Wallet: ${userInfo.walletAddress ? 'Linked' : 'Not linked'}\n`;
    statusMessage += `💰 Total Deposits: ¥${totalDeposits.toLocaleString()}\n`;
    statusMessage += `📈 Transactions: ${transactions.length}\n`;

    if (userInfo.familyGroupId) {
      const familyGroup = lineBotService.getFamilyGroupInfo(userInfo.familyGroupId);
      if (familyGroup) {
        statusMessage += `\n👨‍👩‍👧‍👦 Family: ${familyGroup.name}\n`;
        statusMessage += `👥 Members: ${familyGroup.members.length}\n`;
        statusMessage += `💰 Family Total: ¥${familyGroup.totalSavings.toLocaleString()}\n`;
        statusMessage += `🎯 Goal: ¥${familyGroup.savingsGoal.toLocaleString()}\n`;
      }
    }

    statusMessage += `\n🌸 Keep growing your OMAMORI!`;

    await sendReply(userId, statusMessage);
  } catch (error) {
    await sendReply(userId, '❌ Failed to get status. Please try again.');
  }
}

async function handleHelp(userId: string) {
  const helpMessage = `🌸 OMAMORI Bot Commands\n\n` +
    `🆕 Setup:\n` +
    `/start - Register with OMAMORI\n` +
    `/kyc - Complete KYC verification\n` +
    `/wallet 0x... - Link wallet address\n\n` +
    `💰 Savings:\n` +
    `/deposit [amount] - Deposit money\n` +
    `/status - Check your progress\n\n` +
    `👨‍👩‍👧‍👦 Family:\n` +
    `/family - Family commands\n` +
    `/family create [name] - Create family group\n` +
    `/family join [id] - Join family group\n` +
    `/family heir [address] - Set inheritance\n\n` +
    `ℹ️ General:\n` +
    `/help - Show this help\n\n` +
    `🌸 OMAMORI grows stronger with every deposit!\n` +
    `Start your journey of mindful wealth cultivation! 🎋`;

  await sendReply(userId, helpMessage);
}

async function sendReply(userId: string, message: string) {
  // Mock LINE reply - in production, use LINE Messaging API
  console.log(`📱 LINE Reply to ${userId}:`, message);

  // In real implementation:
  // await lineClient.replyMessage(replyToken, { type: 'text', text: message });
}