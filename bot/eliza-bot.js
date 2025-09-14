const { Client, middleware } = require('@line/bot-sdk');
const express = require('express');
const anthropic = require('@anthropic-ai/sdk');
const cron = require('node-cron');
const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new Client(config);
const app = express();

// Anthropic client for cultural AI
const claude = new anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// In-memory user profiles (use IPFS/database in production)
const userProfiles = new Map();

// Blockchain provider for real-time balance queries
const provider = new ethers.JsonRpcProvider('https://rpc.cardona.zkevm-rpc.com');
const VAULT_ADDRESS = "0x4c7271d91121f5ee40a5a303930db3140df68bbf";
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

// Cultural AI target parsing with ElizaOS-style prompts
async function parseTargetWithAI(text, userId) {
  const culturalPrompt = `
You are a polite Japanese savings assistant (お守りボット). Parse this savings message with cultural sensitivity:

Message: "${text}"

Extract:
1. Amount (¥ or numbers)
2. Goal (travel destination, purchase, event)
3. Timeline (date, days, or months)
4. Urgency (casual vs serious tone)

Respond in JSON format:
{
  "amount": number,
  "goal": "string",
  "timeline": {"type": "date|days", "value": "string"},
  "dailyTarget": number,
  "culturalTone": "polite|casual|serious"
}

Be respectful of Japanese values: mottainai (no waste), saving patience, seasonal goals.
`;

  try {
    const response = await claude.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      messages: [{ role: "user", content: culturalPrompt }]
    });

    return JSON.parse(response.content[0].text);
  } catch (error) {
    console.log('AI parsing failed, using fallback');
    return fallbackParse(text);
  }
}

// Fallback parsing for when AI is unavailable
function fallbackParse(text) {
  const amountMatch = text.match(/[¥￥]?(\d+)/);
  const amount = amountMatch ? parseInt(amountMatch[1]) : 10000;

  let goal = 'savings';
  if (text.includes('沖縄') || text.includes('Okinawa')) goal = 'Okinawa trip';
  if (text.includes('東京') || text.includes('Tokyo')) goal = 'Tokyo trip';
  if (text.includes('旅行')) goal = 'travel';

  let timeline = { type: 'days', value: '30' };
  const dayMatch = text.match(/(\d+)日/);
  if (dayMatch) timeline = { type: 'days', value: dayMatch[1] };

  return {
    amount,
    goal,
    timeline,
    dailyTarget: Math.ceil(amount / parseInt(timeline.value)),
    culturalTone: 'polite'
  };
}

// Calculate countdown and daily targets
function calculateTarget(targetData) {
  const { amount, timeline } = targetData;
  let days;

  if (timeline.type === 'date') {
    const targetDate = new Date(timeline.value);
    const now = new Date();
    days = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
  } else {
    days = parseInt(timeline.value);
  }

  return {
    ...targetData,
    daysRemaining: days,
    dailyTarget: Math.ceil(amount / days),
    targetDate: timeline.type === 'date' ? timeline.value : addDays(new Date(), days).toISOString().split('T')[0]
  };
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Store user target (mock IPFS for composability)
function storeUserTarget(userId, targetData) {
  if (!userProfiles.has(userId)) {
    userProfiles.set(userId, { targets: [] });
  }

  const profile = userProfiles.get(userId);
  profile.targets.push({
    id: Date.now(),
    ...targetData,
    createdAt: new Date().toISOString()
  });

  userProfiles.set(userId, profile);
  console.log(`Stored target for user ${userId}:`, targetData);
}

// Create target setting Flex Message with countdown
function createTargetFlexMessage(targetData) {
  const { amount, goal, daysRemaining, dailyTarget } = targetData;

  return {
    type: 'flex',
    altText: `${goal}目標設定: ¥${amount}`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🎯 目標設定完了',
            weight: 'bold',
            size: 'xl',
            color: '#1976d2',
            align: 'center'
          }
        ],
        paddingAll: '20px',
        backgroundColor: '#f0f8ff'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: goal,
            weight: 'bold',
            size: 'lg',
            color: '#333333'
          },
          {
            type: 'text',
            text: `目標金額: ¥${amount.toLocaleString()}`,
            size: 'md',
            color: '#666666',
            margin: 'md'
          },
          {
            type: 'text',
            text: `残り日数: ${daysRemaining}日`,
            size: 'md',
            color: '#ff6b35',
            weight: 'bold',
            margin: 'sm'
          },
          {
            type: 'text',
            text: `1日平均: ¥${dailyTarget.toLocaleString()}`,
            size: 'md',
            color: '#4caf50',
            margin: 'sm'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: 'もったいない精神で無駄遣いを減らし、\n着実に目標達成しましょう！',
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'lg'
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
            color: '#1976d2',
            action: {
              type: 'uri',
              label: `今すぐ¥${dailyTarget}貯蓄する`,
              uri: `http://localhost:8000/onboarding.html?goal=${encodeURIComponent(goal)}&amount=${dailyTarget}&target=${amount}`
            }
          },
          {
            type: 'button',
            style: 'secondary',
            margin: 'sm',
            action: {
              type: 'postback',
              label: '目標を調整',
              data: `action=adjust&targetId=${Date.now()}`
            }
          }
        ]
      }
    }
  };
}

// Enhanced message handling with target setting
async function handleMessage(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const userMessage = event.message.text;
  console.log(`📱 User ${userId}: ${userMessage}`);

  // Check for target setting pattern
  const targetPattern = /set target|目標|貯め|target.*¥|¥.*target/i;
  if (targetPattern.test(userMessage)) {
    try {
      // Parse with cultural AI
      const targetData = await parseTargetWithAI(userMessage, userId);
      const calculatedTarget = calculateTarget(targetData);

      // Store in user profile
      storeUserTarget(userId, calculatedTarget);

      // Create response
      const flexMessage = createTargetFlexMessage(calculatedTarget);

      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: `${calculatedTarget.goal}の目標が設定されました！\n毎日コツコツと貯蓄を続けましょう 🌸`
        },
        flexMessage
      ]);

    } catch (error) {
      console.error('Target setting failed:', error);
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '申し訳ございません。目標設定中にエラーが発生しました。もう一度お試しください。'
      });
    }
  }

  // Enhanced progress/enquiry commands
  if (userMessage.includes('progress') || userMessage.includes('進捗') || userMessage.includes('確認') ||
      userMessage.includes('check') || userMessage.includes('status')) {
    const profile = userProfiles.get(userId);
    if (profile && profile.targets.length > 0) {
      const latestTarget = profile.targets[profile.targets.length - 1];

      // Get real-time balance
      const walletAddress = profile.walletAddress || '0x992fEec8ECfaA9f3b1c5086202E171a399dD79Af';
      const balanceData = await getUserBalance(walletAddress);

      // Calculate current progress
      const now = new Date();
      const targetDate = new Date(latestTarget.targetDate);
      const daysLeft = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
      const progress = (balanceData.totalJPY / latestTarget.amount * 100).toFixed(1);

      const progressFlexMessage = createProgressFlexMessage(latestTarget, balanceData, daysLeft, progress);

      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: `📊 ${latestTarget.goal}の進捗をお知らせします！`
        },
        progressFlexMessage
      ]);
    } else {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'まだ目標が設定されていません。\n「Set target ¥10000 Okinawa 30日」のように送信して目標を設定しましょう！'
      });
    }
  }

  // NFT viewing command
  if (userMessage.includes('nft') || userMessage.includes('omamori') || userMessage.includes('お守り') ||
      userMessage.includes('view nft') || userMessage.includes('show nft')) {
    const profile = userProfiles.get(userId);
    if (profile && profile.targets.length > 0) {
      const nftFlexMessage = createNFTViewFlexMessage(profile);

      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: '🌸 あなたのお守りNFTコレクション'
        },
        nftFlexMessage
      ]);
    } else {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'まだお守りNFTがありません。\n目標を設定して初回入金すると、お守りが作成されます！'
      });
    }
  }

  // Default greeting and help responses (from original bot)
  const lowerText = userMessage.toLowerCase();
  let replyMessage;

  if (lowerText.includes('こんにちは') || lowerText.includes('hello')) {
    replyMessage = {
      type: 'text',
      text: 'こんにちは！🌸 私は文化的AI貯蓄コーチです。\n\n目標設定例:\n「Set target ¥50000 Okinawa 60日」\n「¥10000貯めたい東京旅行」\n\n一緒に目標達成しましょう！'
    };
  } else if (lowerText.includes('help') || lowerText.includes('ヘルプ')) {
    replyMessage = {
      type: 'text',
      text: '📋 コマンド一覧:\n\n・目標設定: 「Set target ¥[金額] [目標] [日数]」\n・進捗確認: 「progress」\n・例: 「Set target ¥30000 Okinawa trip 45日」\n\nもったいない精神で賢く貯蓄しましょう！'
    };
  } else {
    replyMessage = {
      type: 'text',
      text: 'よく分からないメッセージです。\n\n目標設定は:\n「Set target ¥10000 Okinawa 30日」\n\n進捗確認は:\n「progress」\n\nと送信してください 🌸'
    };
  }

  return client.replyMessage(event.replyToken, replyMessage);
}

// Postback handling for button interactions
async function handlePostback(event) {
  const data = event.postback.data;
  const userId = event.source.userId;
  console.log('Postback received:', data);

  if (data.includes('action=custom_amount')) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'カスタム金額で入金するには金額を送信してください。\n例: \"¥2000入金\" または \"deposit ¥1500\"'
    });
  }

  if (data.includes('action=skip_today')) {
    const profile = userProfiles.get(userId);
    if (profile) {
      profile.lastSkipped = new Date().toISOString();
      userProfiles.set(userId, profile);
    }

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '今日はお疲れさまでした🌸\n明日また頑張りましょう！\nもったいない精神を忘れずに。'
    });
  }

  if (data.includes('action=adjust')) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '目標調整機能は開発中です。\n新しい目標を設定するには:\n「Set target ¥[金額] [目標] [日数]」\nと送信してください。'
    });
  }

  // Handle NFT viewing from postback
  if (data.includes('action=view_nft')) {
    const profile = userProfiles.get(userId);
    if (profile && profile.targets.length > 0) {
      const nftFlexMessage = createNFTViewFlexMessage(profile);
      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: '🌸 あなたのお守りNFTコレクション'
        },
        nftFlexMessage
      ]);
    } else {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'まだお守りNFTがありません。\n目標を設定して初回入金すると、お守りが作成されます！'
      });
    }
  }

  // Handle deposit amount from notification buttons
  const depositMatch = data.match(/action=deposit&amount=(\d+)/);
  if (depositMatch) {
    const amount = depositMatch[1];
    const profile = userProfiles.get(userId);
    const goal = profile?.targets?.[profile.targets.length - 1]?.goal || 'Savings';

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `¥${parseInt(amount).toLocaleString()}の入金を開始します。\n以下のリンクから手続きを完了してください。`,
      quickReply: {
        items: [
          {
            type: 'action',
            action: {
              type: 'uri',
              label: '💰 入金ページを開く',
              uri: `http://localhost:8000/deposit.html?goal=${encodeURIComponent(goal)}&amount=${amount}&daily=true`
            }
          }
        ]
      }
    });
  }
}

// Enhanced webhook with postback support
app.post('/webhook', middleware(config), (req, res) => {
  Promise.all(req.body.events.map(event => {
    if (event.type === 'message') {
      return handleMessage(event);
    } else if (event.type === 'postback') {
      return handlePostback(event);
    }
    return Promise.resolve(null);
  }))
  .then((result) => res.json(result))
  .catch((err) => {
    console.error('Webhook error:', err);
    res.status(500).end();
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'omamori-eliza-bot',
    hasToken: !!config.channelAccessToken,
    hasAI: !!process.env.ANTHROPIC_API_KEY,
    userCount: userProfiles.size
  });
});

app.get('/users/:userId/targets', (req, res) => {
  const profile = userProfiles.get(req.params.userId);
  res.json(profile ? profile.targets : []);
});

// Real-time balance query
async function getUserBalance(walletAddress) {
  try {
    // Query ETH balance
    const ethBalance = await provider.getBalance(walletAddress);

    // Query USDC balance (simplified - would need ERC20 ABI in production)
    // Mock balance for demo
    return {
      eth: ethers.formatEther(ethBalance),
      usdc: Math.random() * 100, // Mock USDC balance
      totalJPY: Math.random() * 15000 // Mock JPY equivalent
    };
  } catch (error) {
    console.error('Balance query failed:', error);
    return { eth: '0', usdc: 0, totalJPY: 0 };
  }
}

// Progress enquiry Flex Message with detailed stats
function createProgressFlexMessage(targetData, balanceData, daysLeft, progress) {
  const { goal, amount, dailyTarget } = targetData;
  const remainingAmount = amount - balanceData.totalJPY;
  const dailyNeeded = daysLeft > 0 ? Math.ceil(remainingAmount / daysLeft) : 0;

  return {
    type: 'flex',
    altText: `進捗: ${progress}% - ${goal}`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📊 Progress Report',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff',
            align: 'center'
          },
          {
            type: 'text',
            text: goal,
            size: 'md',
            color: '#ffffff',
            align: 'center',
            margin: 'sm'
          }
        ],
        paddingAll: '20px',
        backgroundColor: '#1976d2',
        cornerRadius: '10px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${progress}% 達成`,
            weight: 'bold',
            size: 'xxl',
            color: progress >= 100 ? '#4caf50' : progress >= 50 ? '#ff9800' : '#f44336',
            align: 'center'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '目標金額',
                size: 'sm',
                color: '#666666',
                flex: 2
              },
              {
                type: 'text',
                text: `¥${amount.toLocaleString()}`,
                weight: 'bold',
                size: 'sm',
                align: 'end',
                flex: 3
              }
            ],
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '貯蓄済み',
                size: 'sm',
                color: '#666666',
                flex: 2
              },
              {
                type: 'text',
                text: `¥${balanceData.totalJPY.toLocaleString()}`,
                weight: 'bold',
                size: 'sm',
                color: '#4caf50',
                align: 'end',
                flex: 3
              }
            ],
            margin: 'sm'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '残り必要額',
                size: 'sm',
                color: '#666666',
                flex: 2
              },
              {
                type: 'text',
                text: `¥${Math.max(0, remainingAmount).toLocaleString()}`,
                weight: 'bold',
                size: 'sm',
                color: '#ff9800',
                align: 'end',
                flex: 3
              }
            ],
            margin: 'sm'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '残り日数',
                size: 'sm',
                color: '#666666',
                flex: 2
              },
              {
                type: 'text',
                text: `${Math.max(0, daysLeft)}日`,
                weight: 'bold',
                size: 'sm',
                color: daysLeft <= 7 ? '#f44336' : '#333333',
                align: 'end',
                flex: 3
              }
            ],
            margin: 'sm'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '今後の日割り',
                size: 'sm',
                color: '#666666',
                flex: 2
              },
              {
                type: 'text',
                text: `¥${dailyNeeded.toLocaleString()}/日`,
                weight: 'bold',
                size: 'sm',
                color: dailyNeeded > dailyTarget * 1.5 ? '#f44336' : '#1976d2',
                align: 'end',
                flex: 3
              }
            ],
            margin: 'sm'
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
            color: '#4caf50',
            action: {
              type: 'uri',
              label: progress >= 100 ? '🎉 目標達成！' : `¥${dailyNeeded}入金する`,
              uri: `http://localhost:8000/deposit.html?goal=${encodeURIComponent(goal)}&amount=${dailyNeeded}&progress=${progress}`
            }
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'button',
                style: 'secondary',
                action: {
                  type: 'postback',
                  label: '目標調整',
                  data: 'action=adjust'
                },
                flex: 1
              },
              {
                type: 'button',
                style: 'secondary',
                action: {
                  type: 'postback',
                  label: 'NFT確認',
                  data: 'action=view_nft'
                },
                flex: 1,
                margin: 'sm'
              }
            ],
            spacing: 'sm',
            margin: 'sm'
          }
        ]
      }
    }
  };
}

// NFT Collection Flex Message
function createNFTViewFlexMessage(profile) {
  const mockNFTs = profile.targets.map((target, index) => {
    const level = target.amount >= 10000 ? 'bloom' : target.amount >= 5000 ? 'flower' :
                  target.amount >= 1000 ? 'sprout' : 'seed';
    const emoji = level === 'bloom' ? '🌸' : level === 'flower' ? '🌺' :
                  level === 'sprout' ? '🌱' : '🌰';

    return {
      id: 1000 + index,
      goal: target.goal,
      level: level,
      emoji: emoji,
      rarity: target.amount >= 50000 ? 'legendary' : target.amount >= 20000 ? 'rare' : 'common'
    };
  });

  const contents = mockNFTs.map((nft, index) => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'text',
        text: nft.emoji,
        size: '3xl',
        flex: 1,
        align: 'center'
      },
      {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `お守り #${nft.id}`,
            weight: 'bold',
            size: 'sm',
            color: '#333333'
          },
          {
            type: 'text',
            text: nft.goal,
            size: 'sm',
            color: '#666666'
          },
          {
            type: 'text',
            text: `Level: ${nft.level}`,
            size: 'xs',
            color: nft.rarity === 'legendary' ? '#9c27b0' : nft.rarity === 'rare' ? '#ff9800' : '#4caf50'
          }
        ],
        flex: 3
      },
      {
        type: 'button',
        action: {
          type: 'uri',
          label: '詳細',
          uri: `http://localhost:8000/nft.html?id=${nft.id}`
        },
        height: 'sm',
        style: 'secondary',
        flex: 1
      }
    ],
    margin: index > 0 ? 'lg' : 'none',
    paddingAll: '8px'
  }));

  return {
    type: 'flex',
    altText: 'お守りNFTコレクション',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🌸 お守りコレクション',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff'
          },
          {
            type: 'text',
            text: `${mockNFTs.length}個のお守りを獲得`,
            size: 'sm',
            color: '#ffffff'
          }
        ],
        paddingAll: '20px',
        backgroundColor: '#ff6b35'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: contents.slice(0, 3), // Show max 3 NFTs
        paddingAll: '16px'
      },
      footer: mockNFTs.length > 3 ? {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'uri',
              label: `他${mockNFTs.length - 3}個を表示`,
              uri: `http://localhost:8000/collection.html`
            }
          }
        ]
      } : undefined
    }
  };
}

// Daily notification Flex Message with real-time data
function createDailyNotificationFlexMessage(targetData, balanceData, daysLeft) {
  const { goal, amount, dailyTarget } = targetData;
  const progress = (balanceData.totalJPY / amount * 100).toFixed(1);

  return {
    type: 'flex',
    altText: `おはよう！${goal}まであと${daysLeft}日`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'おはよう！🌅',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff',
            align: 'center'
          },
          {
            type: 'text',
            text: `${goal}まで D-${daysLeft}`,
            size: 'md',
            color: '#ffffff',
            align: 'center',
            margin: 'sm'
          }
        ],
        paddingAll: '20px',
        backgroundColor: '#ff6b35',
        cornerRadius: '10px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '進捗',
                size: 'sm',
                color: '#666666',
                flex: 1
              },
              {
                type: 'text',
                text: `${progress}%`,
                weight: 'bold',
                size: 'sm',
                color: progress > 50 ? '#4caf50' : '#ff9800',
                align: 'end'
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '貯蓄済み',
                size: 'sm',
                color: '#666666',
                flex: 1
              },
              {
                type: 'text',
                text: `¥${balanceData.totalJPY.toLocaleString()}`,
                weight: 'bold',
                size: 'sm',
                color: '#333333',
                align: 'end'
              }
            ],
            margin: 'sm'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '今日の目標',
                size: 'sm',
                color: '#666666',
                flex: 1
              },
              {
                type: 'text',
                text: `¥${dailyTarget.toLocaleString()}`,
                weight: 'bold',
                size: 'sm',
                color: '#1976d2',
                align: 'end'
              }
            ],
            margin: 'sm'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: '今日もコツコツと貯蓄しましょう！\nもったいない精神で無駄遣いを避けて 🌸',
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'lg'
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
            color: '#4caf50',
            action: {
              type: 'uri',
              label: `¥${dailyTarget}入金する`,
              uri: `http://localhost:8000/onboarding.html?goal=${encodeURIComponent(goal)}&amount=${dailyTarget}&daily=true`
            }
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'button',
                style: 'secondary',
                action: {
                  type: 'postback',
                  label: 'カスタム金額',
                  data: 'action=custom_amount'
                },
                flex: 1
              },
              {
                type: 'button',
                style: 'secondary',
                action: {
                  type: 'postback',
                  label: '今日はスキップ',
                  data: 'action=skip_today'
                },
                flex: 1,
                margin: 'sm'
              }
            ],
            spacing: 'sm',
            margin: 'sm'
          }
        ]
      }
    }
  };
}

// Daily notification function
async function sendDailyNotifications() {
  console.log('🔔 Sending daily notifications...');

  for (const [userId, profile] of userProfiles.entries()) {
    if (!profile.targets || profile.targets.length === 0) continue;

    try {
      const activeTarget = profile.targets[profile.targets.length - 1];
      const now = new Date();
      const targetDate = new Date(activeTarget.targetDate);
      const daysLeft = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) continue; // Target expired

      // Get real-time balance (mock for demo)
      const walletAddress = profile.walletAddress || '0x992fEec8ECfaA9f3b1c5086202E171a399dD79Af';
      const balanceData = await getUserBalance(walletAddress);

      // Create notification
      const notificationMessage = createDailyNotificationFlexMessage(
        activeTarget,
        balanceData,
        daysLeft
      );

      // Send push message
      await client.pushMessage(userId, notificationMessage);
      console.log(`✅ Notification sent to user ${userId}`);

    } catch (error) {
      console.error(`Failed to send notification to ${userId}:`, error);
    }
  }
}

// Schedule daily notifications at 9 AM JST
cron.schedule('0 9 * * *', () => {
  sendDailyNotifications();
}, {
  scheduled: true,
  timezone: "Asia/Tokyo"
});

// Test notification endpoint (for immediate testing)
app.post('/test-notification/:userId', async (req, res) => {
  const { userId } = req.params;
  const profile = userProfiles.get(userId);

  if (!profile || !profile.targets.length) {
    return res.json({ error: 'No active targets for user' });
  }

  try {
    const activeTarget = profile.targets[profile.targets.length - 1];
    const balanceData = await getUserBalance('0x992fEec8ECfaA9f3b1c5086202E171a399dD79Af');
    const daysLeft = 15; // Mock days left

    const notificationMessage = createDailyNotificationFlexMessage(
      activeTarget,
      balanceData,
      daysLeft
    );

    await client.pushMessage(userId, notificationMessage);
    res.json({ success: true, message: 'Test notification sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`🌸 OMAMORI ElizaOS Bot listening on port ${port}`);
  console.log(`🤖 Cultural AI: ${process.env.ANTHROPIC_API_KEY ? 'Enabled' : 'Fallback mode'}`);
  console.log(`🔔 Daily notifications: 9:00 AM JST`);
  console.log(`📱 Webhook: http://localhost:${port}/webhook`);
  console.log(`🧪 Test notification: POST /test-notification/{userId}`);
});

module.exports = { app };