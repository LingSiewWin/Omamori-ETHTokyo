import { Client, middleware, MiddlewareConfig, WebhookEvent, FlexMessage, FlexBubble } from '@line/bot-sdk';
import express from 'express';
import dotenv from 'dotenv';
import { createSubdomain, generateFrameMessage } from './ens';
import { generateMilestoneProof, verifyMilestoneProof, getMilestoneThreshold, generatePrivacyMessage, isZKProofRequired } from './zkProof';
import { createOmamoriEliza } from './eliza';
import { mockTEE } from './tee';

dotenv.config({ path: '.env.local' });

const config: MiddlewareConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!
};

const client = new Client(config);
const app = express();

// Initialize ElizaOS with Japanese savings expertise
const eliza = createOmamoriEliza();

console.log('🤖 ElizaOS initialized:', eliza.getModelStatus());

// Enhanced polite responses with ElizaOS integration
const politeResponses = {
  greeting: 'こんにちは！私は貯蓄お守りボットです。目標を設定して、一緒に貯蓄しましょう！✨',
  help: 'コマンド:\n・「¥1000貯めたい」- 貯蓄目標を設定\n・「進捗を教えて」- 進捗確認\n・「お疲れ様」- 応援メッセージ\n・「アドバイス」- AI貯蓄アドバイス',
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
                uri: `http://localhost:8000?goal=${goal}&amount=${amount}&asset=USDC`
              }
            },
            {
              type: 'button',
              style: 'secondary',
              margin: 'sm',
              action: {
                type: 'uri',
                label: 'JPYC で貯蓄 (日本)',
                uri: `http://localhost:8000?goal=${goal}&amount=${amount}&asset=JPYC`
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
        const goalName = goal || 'Okinawa';

        try {
          // Generate AI advice using ElizaOS + TEE
          const teeInput = `Provide savings advice for ¥${amount} for ${goalName}`;
          const teeAdvice = await mockTEE(teeInput, 'savings_analysis');
          const elizaResponse = eliza.provideSavingsAdvice(amountNum, goalName);

          // Combine TEE-verified advice with ElizaOS response
          const combinedAdvice = `${elizaResponse.text}\n\n${teeAdvice}`;

          // Check if ZK proof is required for privacy
          if (isZKProofRequired(amountNum)) {
            const zkProof = generateMilestoneProof({
              amount: amountNum,
              timestamp: Date.now(),
              goal: goalName,
              privateNote: 'User savings milestone'
            });

            const privacyMessage = generatePrivacyMessage(Math.floor(amountNum / 25000));
            replyMessage = [
              { type: 'text', text: combinedAdvice },
              { type: 'text', text: privacyMessage },
              createDepositFlexMessage(amount, goalName)
            ];
          } else {
            replyMessage = [
              { type: 'text', text: combinedAdvice },
              createDepositFlexMessage(amount, goalName)
            ];
          }
        } catch (error) {
          console.error('ElizaOS/TEE error:', error);
          // Fallback to simple response
          replyMessage = createDepositFlexMessage(amount, goalName);
        }
      } else {
        const helpResponse = eliza.respond('金額を教えてください');
        replyMessage = { type: 'text', text: helpResponse.text };
      }
      break;

    case 'greeting':
      const greetingResponse = eliza.respond('こんにちは');
      replyMessage = { type: 'text', text: greetingResponse.text };
      break;

    case 'help':
      replyMessage = { type: 'text', text: politeResponses.help };
      break;

    case 'encouragement':
      const encouragementResponse = eliza.respond('お疲れ様', { tone: 'supportive' });
      replyMessage = { type: 'text', text: encouragementResponse.text };
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
      // Use ElizaOS for general conversation
      try {
        const elizaResponse = eliza.respond(event.message.text, { tone: 'polite' });
        replyMessage = { type: 'text', text: elizaResponse.text };
      } catch (error) {
        console.error('ElizaOS general response error:', error);
        replyMessage = { type: 'text', text: politeResponses.unknown };
      }
  }

  return client.replyMessage(event.replyToken, replyMessage as any);
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