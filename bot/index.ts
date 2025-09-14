import { Client, middleware, MiddlewareConfig, WebhookEvent, FlexMessage, FlexBubble } from '@line/bot-sdk';
import express from 'express';
import dotenv from 'dotenv';
import { createSubdomain, generateFrameMessage } from './ens';
import { generateMilestoneProof, verifyMilestoneProof, getMilestoneThreshold, generatePrivacyMessage, isZKProofRequired } from './zkProof';

dotenv.config();

const config: MiddlewareConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || ''
};

const client = new Client(config);
const app = express();

// ElizaOS-inspired polite responses
const politeResponses = {
  greeting: 'こんにちは！私は貯蓄お守りボットです。目標を設定して、一緒に貯蓄しましょう！✨',
  help: 'コマンド:\n・「¥1000貯めたい」- 貯蓄目標を設定\n・「進捗を教えて」- 進捗確認\n・「お疲れ様」- 応援メッセージ',
  encouragement: 'お疲れ様です！小さな一歩が大きな成果につながります。頑張っていますね！🌸',
  unknown: 'すみません、よく分かりませんでした。「ヘルプ」と送信すると使い方が分かります。'
};

function createDepositFlexMessage(amount: string, goal: string = 'Okinawa'): FlexMessage {
  const flexBubble: FlexBubble = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `¥${amount}を貯蓄しますか？`,
          weight: 'bold',
          size: 'lg',
          color: '#1DB446'
        },
        {
          type: 'text',
          text: `目標: ${goal}旅行`,
          size: 'md',
          color: '#666666',
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
          contents: [
            {
              type: 'button',
              style: 'primary',
              color: '#1DB446',
              action: {
                type: 'uri',
                label: 'USDC で貯蓄 (グローバル)',
                uri: `https://omamori.app/deposit?goal=${goal}&amount=${amount}&asset=USDC`
              }
            },
            {
              type: 'button',
              style: 'secondary',
              margin: 'sm',
              action: {
                type: 'uri',
                label: 'JPYC で貯蓄 (日本)',
                uri: `https://omamori.app/deposit?goal=${goal}&amount=${amount}&asset=JPYC`
              }
            }
          ]
        },
        {
          type: 'text',
          text: '💡 お守りNFTが貰えます！',
          size: 'sm',
          color: '#666666',
          margin: 'lg',
          align: 'center'
        }
      ]
    }
  };

  return {
    type: 'flex',
    altText: `¥${amount}の貯蓄オプション`,
    contents: flexBubble
  };
}

function parseMessage(text: string): { command: string; amount?: string; goal?: string } {
  const lowerText = text.toLowerCase();

  // Pattern for savings goal: "¥1000貯めたい" or "save ¥1000"
  const savingsMatch = text.match(/[¥￥]?(\d+).*貯め|save.*[¥￥]?(\d+)/i);
  if (savingsMatch) {
    const amount = savingsMatch[1] || savingsMatch[2];
    return { command: 'save', amount };
  }

  if (lowerText.includes('こんにちは') || lowerText.includes('hello') || lowerText.includes('hi')) {
    return { command: 'greeting' };
  }

  if (lowerText.includes('ヘルプ') || lowerText.includes('help')) {
    return { command: 'help' };
  }

  if (lowerText.includes('進捗') || lowerText.includes('progress')) {
    return { command: 'progress' };
  }

  if (lowerText.includes('お疲れ') || lowerText.includes('tired')) {
    return { command: 'encouragement' };
  }

  return { command: 'unknown' };
}

async function handleMessage(event: WebhookEvent) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const { command, amount, goal } = parseMessage(event.message.text);
  const userId = event.source.userId || 'anonymous';

  let replyMessage;

  switch (command) {
    case 'save':
      if (amount) {
        const amountNum = parseInt(amount);

        // Check if ZK proof is required for privacy
        if (isZKProofRequired(amountNum)) {
          const zkProof = generateMilestoneProof({
            amount: amountNum,
            timestamp: Date.now(),
            goal: goal || 'Okinawa',
            privateNote: 'User savings milestone'
          });

          const privacyMessage = generatePrivacyMessage(Math.floor(amountNum / 25000));
          replyMessage = [
            { type: 'text', text: privacyMessage },
            createDepositFlexMessage(amount, goal || 'Okinawa')
          ];
        } else {
          replyMessage = createDepositFlexMessage(amount, goal || 'Okinawa');
        }
      } else {
        replyMessage = { type: 'text', text: '金額を教えてください。例: ¥1000貯めたい' };
      }
      break;

    case 'greeting':
      replyMessage = { type: 'text', text: politeResponses.greeting };
      break;

    case 'help':
      replyMessage = { type: 'text', text: politeResponses.help };
      break;

    case 'encouragement':
      replyMessage = { type: 'text', text: politeResponses.encouragement };
      break;

    case 'progress':
      // Generate ENS frame for sharing progress
      try {
        const ensFrame = await createSubdomain(userId, 'progress');
        const frameMessage = generateFrameMessage(ensFrame);

        replyMessage = [
          {
            type: 'text',
            text: '🌸 進捗状況 🌸\n目標: ¥10,000\n現在: ¥2,500 (25%)\nお守りレベル: 芽 → 花\n\n頑張っていますね！'
          },
          {
            type: 'text',
            text: frameMessage
          }
        ];
      } catch (error) {
        replyMessage = {
          type: 'text',
          text: '🌸 進捗状況 🌸\n目標: ¥10,000\n現在: ¥2,500 (25%)\nお守りレベル: 芽 → 花\n\n頑張っていますね！'
        };
      }
      break;

    default:
      replyMessage = { type: 'text', text: politeResponses.unknown };
  }

  return client.replyMessage(event.replyToken, replyMessage);
}

app.post('/webhook', middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleMessage))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'omamori-line-bot' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🌸 OMAMORI LINE Bot listening on port ${port}`);
  console.log(`Webhook URL: http://localhost:${port}/webhook`);
});

export { app };