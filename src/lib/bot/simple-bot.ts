import { Client, middleware } from '@line/bot-sdk';
import express from 'express';
import dotenv from 'dotenv';
import type { LineConfig, MessageParseResult } from '../types/omamori';

dotenv.config({ path: '.env.local' });

const config: LineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!
};

console.log('Config loaded:', {
  hasToken: !!config.channelAccessToken,
  hasSecret: !!config.channelSecret
});

const client = new Client(config);
const app = express();

function createDepositFlexMessage(amount, goal = 'Okinawa') {
  return {
    type: 'flex',
    altText: `¥${amount}の貯蓄オプション`,
    contents: {
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
    }
  };
}

function parseMessage(text: string): MessageParseResult {
  const lowerText = text.toLowerCase();

  // Pattern for savings goal: "¥1000貯めたい" or "save ¥1000"
  const savingsMatch = text.match(/[¥￥]?(\\d+).*貯め|save.*[¥￥]?(\\d+)/i);
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

  return { command: 'unknown' };
}

async function handleMessage(event: any) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const { command, amount } = parseMessage(event.message.text);
  let replyMessage;

  switch (command) {
    case 'save':
      if (amount) {
        replyMessage = createDepositFlexMessage(amount);
      } else {
        replyMessage = { type: 'text', text: '金額を教えてください（例: ¥1000貯めたい）' };
      }
      break;

    case 'greeting':
      replyMessage = { type: 'text', text: 'こんにちは！私は貯蓄お守りボットです。目標を設定して、一緒に貯蓄しましょう！✨' };
      break;

    case 'help':
      replyMessage = { type: 'text', text: 'コマンド:\\n・「¥1000貯めたい」- 貯蓄目標を設定\\n・「こんにちは」- 挨拶\\n・「ヘルプ」- このメッセージ' };
      break;

    default:
      replyMessage = { type: 'text', text: 'すみません、よく分かりませんでした。「ヘルプ」と送信すると使い方が分かります。' };
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
  res.json({
    status: 'healthy',
    service: 'omamori-line-bot',
    hasToken: !!config.channelAccessToken,
    hasSecret: !!config.channelSecret
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🌸 OMAMORI LINE Bot listening on port ${port}`);
  console.log(`Webhook URL: http://localhost:${port}/webhook`);
  console.log(`Health check: http://localhost:${port}/health`);
});

export { app };