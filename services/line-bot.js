const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
require('dotenv').config({ path: '.env.local' });

console.log('🌸 Starting OMAMORI LINE Bot Server...');

// Validate environment
if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
  console.error('❌ Missing LINE_CHANNEL_ACCESS_TOKEN in .env.local');
  process.exit(1);
}

if (!process.env.LINE_CHANNEL_SECRET) {
  console.error('❌ Missing LINE_CHANNEL_SECRET in .env.local');
  process.exit(1);
}

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

console.log('✅ LINE Bot Config:', {
  hasToken: !!config.channelAccessToken,
  hasSecret: !!config.channelSecret,
  tokenLength: config.channelAccessToken?.length || 0
});

const client = new Client(config);
const app = express();

// Add JSON body parsing middleware
app.use(express.json());

// Japanese cultural responses with OMAMORI theme
const responses = {
  greeting: {
    ja: '🌸 こんにちは！私はお守りボットです。日本の伝統的な価値観を大切にしながら、あなたの貯蓄をお手伝いします。\\n\\n「ヘルプ」と送信すると使い方がわかります。',
    en: '🌸 Hello! I am OMAMORI Bot. I help with savings while preserving traditional Japanese values.\\n\\nSend "help" to learn how to use me.'
  },
  help: {
    ja: '📋 **OMAMORI Bot Commands**\\n\\n🌸 **基本コマンド:**\\n• こんにちは - 挨拶\\n• ヘルプ - このメッセージ\\n• ¥1000貯めたい - 貯蓄目標設定\\n\\n💰 **貯蓄コマンド:**\\n• JPYC - 日本円ステーブルコイン\\n• USDC - グローバル対応\\n\\n⛩️ **文化的価値:**\\n• もったいない - 無駄を防ぐ\\n• おもてなし - 思いやりの心\\n• 協働 - みんなで協力\\n• 伝統 - 文化を守る',
    en: '📋 **OMAMORI Bot Commands**\\n\\n🌸 **Basic:**\\n• hello - greeting\\n• help - this message\\n• save ¥1000 - set savings goal\\n\\n💰 **Savings:**\\n• JPYC - Japanese stablecoin\\n• USDC - Global support\\n\\n⛩️ **Cultural Values:**\\n• Mottainai - prevent waste\\n• Omotenashi - hospitality\\n• Kyodo - cooperation\\n• Dento - tradition'
  },
  wisdom: [
    '「もったいない」の心で、今日も無駄のない一日を。小さな節約が大きな財産になります。 🌸',
    '「おもてなし」の精神で、家族の将来も大切に。みんなの幸せのための貯蓄です。 ⛩️',
    '「協働」の力で、一緒に目標を達成しましょう。お守りがあなたを守ります。 🎌',
    '「伝統」を大切にしながら、現代の技術で賢く貯蓄。先祖の知恵を活かして。 🏯'
  ],
  transaction: {
    confirmed: '✅ **取引完了**\\n\\nお疲れ様でした！取引が正常に完了しました。\\n\\nあなたのお守りが成長しました！ 🌸✨\\n\\n継続は力なり。このまま頑張りましょう！',
    pending: '⏳ **取引処理中**\\n\\n少々お待ちください...\\nブロックチェーンで確認中です。',
    failed: '❌ **取引失敗**\\n\\n申し訳ございません。\\n再度お試しいただくか、サポートにお問い合わせください。'
  }
};

function createFlexMessage(type, data = {}) {
  switch (type) {
    case 'savings_options':
      return {
        type: 'flex',
        altText: `¥${data.amount}の貯蓄オプション`,
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '🌸 OMAMORI 貯蓄',
                weight: 'bold',
                size: 'xl',
                color: '#d63384'
              },
              {
                type: 'text',
                text: `¥${data.amount}を貯蓄しますか？`,
                size: 'lg',
                margin: 'md'
              },
              {
                type: 'separator',
                margin: 'lg'
              },
              {
                type: 'box',
                layout: 'vertical',
                margin: 'lg',
                spacing: 'sm',
                contents: [
                  {
                    type: 'button',
                    style: 'primary',
                    color: '#d63384',
                    action: {
                      type: 'uri',
                      label: '🇺🇸 USDC (グローバル)',
                      uri: `http://localhost:3001?amount=${data.amount}&currency=USDC`
                    }
                  },
                  {
                    type: 'button',
                    style: 'secondary',
                    action: {
                      type: 'uri',
                      label: '🇯🇵 JPYC (日本)',
                      uri: `http://localhost:3001?amount=${data.amount}&currency=JPYC`
                    }
                  }
                ]
              },
              {
                type: 'text',
                text: '⛩️ お守りNFTが進化します！',
                size: 'sm',
                color: '#6c757d',
                margin: 'lg',
                align: 'center'
              }
            ]
          }
        }
      };

    case 'cultural_wisdom':
      return {
        type: 'flex',
        altText: '日本の文化的知恵',
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '⛩️ 今日の知恵',
                weight: 'bold',
                size: 'lg',
                color: '#d63384'
              },
              {
                type: 'text',
                text: data.message || responses.wisdom[Math.floor(Math.random() * responses.wisdom.length)],
                wrap: true,
                margin: 'md'
              }
            ]
          }
        }
      };

    default:
      return { type: 'text', text: 'Unknown message type' };
  }
}

function parseMessage(text, isGroup = false) {
  const lower = text.toLowerCase().trim();

  // Family-specific commands (only in groups or when setting up)
  if (lower.includes('家族') || lower.includes('family')) {
    if (lower.includes('作成') || lower.includes('create')) {
      return { type: 'family_create' };
    }
    if (lower.includes('招待') || lower.includes('invite')) {
      return { type: 'family_invite' };
    }
    if (lower.includes('目標') || lower.includes('goal')) {
      return { type: 'family_goal' };
    }
    if (lower.includes('進捗') || lower.includes('progress')) {
      return { type: 'family_progress' };
    }
    return { type: 'family_info' };
  }

  // Inheritance commands
  if (lower.includes('相続') || lower.includes('inherit') || lower.includes('heir')) {
    const heirMatch = text.match(/相続人.*?(0x[a-fA-F0-9]{40})|heir.*?(0x[a-fA-F0-9]{40})/i);
    if (heirMatch) {
      return { type: 'set_heir', address: heirMatch[1] || heirMatch[2] };
    }
    return { type: 'inheritance_help' };
  }

  // Savings patterns
  const savingsMatch = text.match(/[¥￥]?(\\d+).*貯め|save.*[¥￥]?(\\d+)|¥(\\d+)/i);
  if (savingsMatch) {
    const amount = savingsMatch[1] || savingsMatch[2] || savingsMatch[3];
    return { type: 'savings', amount: parseInt(amount), isGroup };
  }

  // Greetings
  if (lower.includes('こんにちは') || lower.includes('hello') || lower.includes('hi') || lower.includes('おはよう')) {
    return { type: 'greeting', isGroup };
  }

  // Help
  if (lower.includes('ヘルプ') || lower.includes('help') || lower === '？' || lower === '?') {
    return { type: 'help', isGroup };
  }

  // Cultural values
  if (lower.includes('もったいない') || lower.includes('mottainai')) {
    return { type: 'cultural', value: 'mottainai' };
  }
  if (lower.includes('おもてなし') || lower.includes('omotenashi')) {
    return { type: 'cultural', value: 'omotenashi' };
  }

  // Wisdom request
  if (lower.includes('知恵') || lower.includes('wisdom') || lower.includes('今日')) {
    return { type: 'wisdom' };
  }

  return { type: 'unknown' };
}

// Family group storage (in production, use database)
const familyGroups = new Map(); // groupId -> { creator, members, savings_goal }
const userGroups = new Map(); // userId -> groupId

// Family notification functions
async function notifyFamilyTransaction(userId, amount, asset) {
  const groupId = userGroups.get(userId);
  if (groupId && familyGroups.has(groupId)) {
    const family = familyGroups.get(groupId);
    family.total_saved += amount;
    familyGroups.set(groupId, family);

    const progressPercent = family.savings_goal > 0 ?
      Math.round((family.total_saved / family.savings_goal) * 100) : 0;

    const message = {
      type: 'text',
      text: `🌸 **家族の貯蓄が更新されました！**\\n\\n💰 ${amount.toLocaleString()}円が追加されました (${asset})\\n📊 合計: ¥${family.total_saved.toLocaleString()}\\n🎯 目標まで: ¥${Math.max(0, family.savings_goal - family.total_saved).toLocaleString()}\\n📈 進捗: ${progressPercent}%\\n\\n${progressPercent >= 100 ? '🎉 目標達成おめでとうございます！' : 'みんなで頑張りましょう！'}`
    };

    try {
      await client.pushMessage(groupId, message);
      console.log('✅ Family notification sent to group:', groupId.substring(0, 8) + '...');
    } catch (error) {
      console.error('❌ Failed to send family notification:', error.message);
    }
  }
}

async function inviteFamilyMember(userId, groupId) {
  try {
    // Validate groupId format
    if (!groupId || typeof groupId !== 'string') {
      throw new Error('Invalid group ID provided');
    }

    // Check if family group exists
    if (!familyGroups.has(groupId)) {
      throw new Error(`Family group ${groupId} not found`);
    }

    const family = familyGroups.get(groupId);

    // Check if user is already a member
    if (family.members.includes(userId)) {
      console.log('👥 User already in family group:', userId.substring(0, 8) + '...');
      return { success: true, message: 'User already in family group' };
    }

    // Add user to family
    family.members.push(userId);
    familyGroups.set(groupId, family);
    userGroups.set(userId, groupId);

    // Try to send invitation message
    try {
      await client.pushMessage(userId, {
        type: 'text',
        text: `🌸 家族グループに招待されました！\n\nファミリー名: ${family.name}\nメンバー: ${family.members.length}人\n\n一緒に貯蓄目標を達成しましょう！ 💪`
      });
      console.log('✅ Family invitation sent to:', userId.substring(0, 8) + '...');
    } catch (inviteError) {
      console.warn('⚠️ Could not send invitation message:', inviteError.message);
      // Continue - user is still added to group even if message fails
    }

    return { success: true, message: 'User added to family group successfully' };
  } catch (error) {
    console.error('❌ Failed to invite family member:', error.message);
    return { success: false, error: error.message };
  }
}

async function handleMessage(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const sourceType = event.source.type; // 'user' or 'group'
  const userId = event.source.userId;
  const groupId = event.source.groupId; // undefined for individual messages
  const messageText = event.message.text;
  const isGroup = sourceType === 'group';
  const parsed = parseMessage(messageText, isGroup);

  console.log('📨 Received message:', {
    sourceType,
    userId: userId.substring(0, 8) + '...',
    groupId: groupId ? groupId.substring(0, 8) + '...' : 'individual',
    text: messageText,
    parsed: parsed
  });

  let replyMessage;

  switch (parsed.type) {
    case 'greeting':
      replyMessage = {
        type: 'text',
        text: responses.greeting.ja
      };
      break;

    case 'help':
      replyMessage = {
        type: 'text',
        text: responses.help.ja
      };
      break;

    case 'savings':
      if (parsed.amount) {
        replyMessage = createFlexMessage('savings_options', { amount: parsed.amount });
      } else {
        replyMessage = {
          type: 'text',
          text: '💰 金額を教えてください\\n\\n例: ¥1000貯めたい'
        };
      }
      break;

    case 'wisdom':
      replyMessage = createFlexMessage('cultural_wisdom', {});
      break;

    case 'cultural':
      const culturalMessage = parsed.value === 'mottainai'
        ? '🌸 もったいない精神\\n\\n無駄をなくし、物を大切にすることで、真の豊かさを手に入れましょう。'
        : '🌸 おもてなしの心\\n\\n相手を思いやる気持ちを大切に、みんなで協力して目標を達成しましょう。';
      replyMessage = {
        type: 'text',
        text: culturalMessage
      };
      break;

    // Family functionality
    case 'family_create':
      if (isGroup) {
        // Initialize family group
        familyGroups.set(groupId, {
          creator: userId,
          members: [userId],
          created: new Date().toISOString(),
          savings_goal: 0,
          total_saved: 0
        });
        userGroups.set(userId, groupId);
        replyMessage = {
          type: 'text',
          text: '🌸 **家族グループが作成されました！**\\n\\nこのグループで家族の貯蓄目標を共有し、お互いを励まし合いましょう。\\n\\n「家族目標 ¥100000」と送信して目標を設定してください。'
        };
      } else {
        replyMessage = {
          type: 'text',
          text: '❌ 家族グループの作成は、LINEグループチャット内でのみ可能です。\\n\\n家族をLINEグループに招待してから再度お試しください。'
        };
      }
      break;

    case 'family_goal':
      if (isGroup && familyGroups.has(groupId)) {
        const goalMatch = messageText.match(/[¥￥]?(\\d+)/);
        if (goalMatch) {
          const goal = parseInt(goalMatch[1]);
          const family = familyGroups.get(groupId);
          family.savings_goal = goal;
          familyGroups.set(groupId, family);
          replyMessage = {
            type: 'text',
            text: `🎯 **家族の貯蓄目標が設定されました！**\\n\\n目標金額: ¥${goal.toLocaleString()}\\n現在の進捗: ¥${family.total_saved.toLocaleString()}\\n\\nみんなで協力して頑張りましょう！ 💪`
          };
        } else {
          replyMessage = {
            type: 'text',
            text: '💰 目標金額を教えてください。\\n\\n例: 家族目標 ¥100000'
          };
        }
      } else {
        replyMessage = {
          type: 'text',
          text: '❌ 家族グループが見つかりません。\\n\\n「家族作成」でグループを初期化してください。'
        };
      }
      break;

    case 'family_progress':
      if (isGroup && familyGroups.has(groupId)) {
        const family = familyGroups.get(groupId);
        const progressPercent = family.savings_goal > 0 ?
          Math.round((family.total_saved / family.savings_goal) * 100) : 0;
        replyMessage = {
          type: 'text',
          text: `📊 **家族の貯蓄進捗**\\n\\n🎯 目標: ¥${family.savings_goal.toLocaleString()}\\n💰 現在: ¥${family.total_saved.toLocaleString()}\\n📈 進捗: ${progressPercent}%\\n👥 メンバー: ${family.members.length}人\\n\\n${progressPercent >= 100 ? '🎉 目標達成おめでとうございます！' : '頑張りましょう！'}`
        };
      } else {
        replyMessage = {
          type: 'text',
          text: '❌ 家族グループが見つかりません。'
        };
      }
      break;

    case 'family_info':
      if (isGroup) {
        replyMessage = {
          type: 'text',
          text: '👨‍👩‍👧‍👦 **OMAMORI 家族機能**\\n\\n🌸 **使い方:**\\n• 家族作成 - グループを初期化\\n• 家族目標 ¥100000 - 目標設定\\n• 家族進捗 - 現在の状況確認\\n• 相続人 0x... - 相続設定\\n\\n**日本の家族の絆を大切に** ⛩️'
        };
      } else {
        replyMessage = {
          type: 'text',
          text: '👨‍👩‍👧‍👦 **家族機能を使うには**\\n\\n1. 家族をLINEグループに招待\\n2. このボットをグループに追加\\n3. 「家族作成」でスタート\\n\\n**みんなで貯蓄を頑張りましょう！** 🌸'
        };
      }
      break;

    case 'set_heir':
      // This will be enhanced with smart contract integration
      replyMessage = {
        type: 'text',
        text: `👶 **相続人が設定されました**\\n\\n相続人アドレス: ${parsed.address.substring(0, 10)}...\\n\\n⚠️ **重要:** MetaMaskの秘密鍵を安全に保管し、相続人に伝える方法を検討してください。\\n\\n日本の伝統を次世代に継承しましょう 🌸`
      };
      break;

    case 'inheritance_help':
      replyMessage = {
        type: 'text',
        text: '👨‍👩‍👧‍👦 **相続機能について**\\n\\n🌸 **使い方:**\\n• 相続人 0x1234... - 相続人のウォレットアドレス設定\\n• 日本では家族への資産移転は合法です\\n\\n⚠️ **注意事項:**\\n• MetaMaskの秘密鍵管理が重要\\n• 家族との事前相談をお勧めします\\n\\n**伝統の継承をお手伝いします** ⛩️'
      };
      break;

    default:
      replyMessage = {
        type: 'text',
        text: '🌸 すみません、よく分かりませんでした。\\n\\n「ヘルプ」と送信すると使い方が分かります。\\n\\nまたは、¥1000貯めたい のように金額を教えてください。'
      };
  }

  try {
    const result = await client.replyMessage(event.replyToken, replyMessage);
    console.log('✅ Reply sent successfully');
    return result;
  } catch (error) {
    console.error('❌ Error sending reply:', error.message);
    return null;
  }
}

// Webhook endpoint
app.post('/webhook', middleware(config), async (req, res) => {
  try {
    const events = req.body.events;
    console.log('📋 Received events:', events.length);

    const results = await Promise.all(
      events.map(handleMessage)
    );

    res.json({ status: 'success', results: results.length });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'omamori-line-bot',
    timestamp: new Date().toISOString(),
    config: {
      hasToken: !!config.channelAccessToken,
      hasSecret: !!config.channelSecret,
      tokenLength: config.channelAccessToken?.length || 0
    }
  });
});

// QR Code generation for web integration
app.get('/qr', (req, res) => {
  const qrData = `https://line.me/R/ti/p/@${process.env.LINE_BOT_ID || 'omamori-bot'}`;
  res.json({
    success: true,
    qrData,
    message: 'Scan this QR code with LINE app to add OMAMORI Bot'
  });
});

// Create family group endpoint
app.post('/family/create', async (req, res) => {
  try {
    const { userId, familyName, groupId } = req.body;

    if (!userId || !familyName) {
      return res.status(400).json({
        error: 'Missing required fields: userId, familyName'
      });
    }

    // Generate groupId if not provided (for testing, use provided groupId)
    const newGroupId = groupId || `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new family group
    familyGroups.set(newGroupId, {
      creator: userId,
      name: familyName,
      members: [userId],
      savings_goal: 0,
      total_saved: 0,
      created_at: new Date().toISOString()
    });

    userGroups.set(userId, newGroupId);

    console.log('✅ Family group created:', {
      groupId: newGroupId.substring(0, 12) + '...',
      name: familyName,
      creator: userId.substring(0, 8) + '...'
    });

    res.json({
      success: true,
      groupId: newGroupId,
      message: `Family group "${familyName}" created successfully`,
      family: familyGroups.get(newGroupId)
    });
  } catch (error) {
    console.error('❌ Family creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Family transaction notification endpoint
app.post('/family/transaction', async (req, res) => {
  try {
    const { userId, amount, asset, transactionHash } = req.body;

    console.log('📨 Family transaction notification:', {
      userId: userId?.substring(0, 8) + '...',
      amount,
      asset,
      txHash: transactionHash?.substring(0, 10) + '...'
    });

    if (!userId || !amount || !asset) {
      return res.status(400).json({
        error: 'Missing required fields: userId, amount, asset'
      });
    }

    await notifyFamilyTransaction(userId, amount, asset);

    res.json({
      success: true,
      message: 'Family notification sent',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Family transaction notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get family group info
app.get('/family/:groupId', (req, res) => {
  const { groupId } = req.params;

  if (familyGroups.has(groupId)) {
    const family = familyGroups.get(groupId);
    res.json({
      success: true,
      family: {
        ...family,
        groupId
      }
    });
  } else {
    res.status(404).json({
      error: 'Family group not found'
    });
  }
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log('🌸 =====================================');
  console.log('  OMAMORI LINE Bot Server Started!');
  console.log('🌸 =====================================');
  console.log(`📍 Port: ${port}`);
  console.log(`🔗 Webhook: http://localhost:${port}/webhook`);
  console.log(`❤️  Health: http://localhost:${port}/health`);
  console.log(`📱 QR Code: http://localhost:${port}/qr`);
  console.log('');
  console.log('💡 For testing:');
  console.log('1. Set up webhook in LINE Developers Console');
  console.log('2. Use ngrok to expose localhost:3002');
  console.log('3. Add bot as friend and send messages');
  console.log('🌸 =====================================');
});