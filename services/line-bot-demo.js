const express = require('express');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Starting OMAMORI LINE Bot Test Server...');

const app = express();
app.use(express.json());

// Mock conversation responses
const responses = {
  greeting: {
    ja: '🌸 こんにちは！私はお守りボットです。\\n\\n日本の伝統的な価値観を大切にしながら、あなたの貯蓄をお手伝いします。\\n\\n「ヘルプ」と送信すると使い方がわかります。',
    en: '🌸 Hello! I am OMAMORI Bot.\\n\\nI help with savings while preserving traditional Japanese values.\\n\\nSend "help" to learn how to use me.'
  },
  help: {
    ja: '📋 **OMAMORI Bot Commands**\\n\\n🌸 **基本コマンド:**\\n• こんにちは - 挨拶\\n• ヘルプ - このメッセージ\\n• ¥1000貯めたい - 貯蓄目標設定\\n\\n💰 **貯蓄コマンド:**\\n• JPYC - 日本円ステーブルコイン\\n• USDC - グローバル対応\\n\\n⛩️ **文化的価値:**\\n• もったいない - 無駄を防ぐ\\n• おもてなし - 思いやりの心\\n• 協働 - みんなで協力\\n• 伝統 - 文化を守る'
  },
  wisdom: [
    '「もったいない」の心で、今日も無駄のない一日を。小さな節約が大きな財産になります。 🌸',
    '「おもてなし」の精神で、家族の将来も大切に。みんなの幸せのための貯蓄です。 ⛩️',
    '「協働」の力で、一緒に目標を達成しましょう。お守りがあなたを守ります。 🎌',
    '「伝統」を大切にしながら、現代の技術で賢く貯蓄。先祖の知恵を活かして。 🏯'
  ],
  savings: {
    template: '💰 **貯蓄オプション: ¥{amount}**\\n\\n🇯🇵 **JPYC (日本円)**\\n• 日本国内で安心\\n• 規制対応済み\\n• 文化的価値重視\\n\\n🌐 **USDC (グローバル)**\\n• 世界共通\\n• 流動性高い\\n• 技術先進性\\n\\n🔗 フロントエンド: http://localhost:3001?amount={amount}\\n⛩️ お守りNFTが進化します！'
  }
};

function parseMessage(text) {
  const lower = text.toLowerCase().trim();

  // Savings patterns
  const savingsMatch = text.match(/[¥￥]?(\\d+).*貯め|save.*[¥￥]?(\\d+)|¥(\\d+)/i);
  if (savingsMatch) {
    const amount = savingsMatch[1] || savingsMatch[2] || savingsMatch[3];
    return { type: 'savings', amount: parseInt(amount) };
  }

  // Greetings
  if (lower.includes('こんにちは') || lower.includes('hello') || lower.includes('hi') || lower.includes('おはよう')) {
    return { type: 'greeting' };
  }

  // Help
  if (lower.includes('ヘルプ') || lower.includes('help') || lower === '？' || lower === '?') {
    return { type: 'help' };
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

// Demo conversation endpoint (no LINE signature required)
app.post('/demo-chat', (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  const parsed = parseMessage(message);
  let response;

  console.log('📨 Demo message:', { text: message, parsed });

  switch (parsed.type) {
    case 'greeting':
      response = responses.greeting.ja;
      break;

    case 'help':
      response = responses.help.ja;
      break;

    case 'savings':
      if (parsed.amount) {
        response = responses.savings.template
          .replace(/{amount}/g, parsed.amount);
      } else {
        response = '💰 金額を教えてください\\n\\n例: ¥1000貯めたい';
      }
      break;

    case 'wisdom':
      response = responses.wisdom[Math.floor(Math.random() * responses.wisdom.length)];
      break;

    case 'cultural':
      response = parsed.value === 'mottainai'
        ? '🌸 **もったいない精神**\\n\\n無駄をなくし、物を大切にすることで、真の豊かさを手に入れましょう。伝統的な日本の価値観です。'
        : '🌸 **おもてなしの心**\\n\\n相手を思いやる気持ちを大切に、みんなで協力して目標を達成しましょう。';
      break;

    default:
      response = '🌸 すみません、よく分かりませんでした。\\n\\n「ヘルプ」と送信すると使い方が分かります。\\n\\nまたは、¥1000貯めたい のように金額を教えてください。';
  }

  res.json({
    success: true,
    input: message,
    parsed: parsed,
    response: response,
    timestamp: new Date().toISOString()
  });
});

// Batch conversation test
app.post('/demo-conversation', (req, res) => {
  const testMessages = [
    'こんにちは',
    'ヘルプ',
    '¥5000貯めたい',
    'もったいない',
    '知恵'
  ];

  const conversation = testMessages.map(msg => {
    const parsed = parseMessage(msg);
    let response;

    switch (parsed.type) {
      case 'greeting':
        response = responses.greeting.ja;
        break;
      case 'help':
        response = responses.help.ja;
        break;
      case 'savings':
        response = responses.savings.template.replace(/{amount}/g, parsed.amount);
        break;
      case 'cultural':
        response = '🌸 **もったいない精神** - 無駄をなくし、物を大切に。';
        break;
      case 'wisdom':
        response = responses.wisdom[0];
        break;
      default:
        response = 'Unknown message';
    }

    return { input: msg, response };
  });

  res.json({
    success: true,
    conversation,
    totalMessages: conversation.length
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'omamori-line-bot-demo',
    timestamp: new Date().toISOString(),
    endpoints: {
      chat: 'POST /demo-chat',
      conversation: 'POST /demo-conversation'
    }
  });
});

const port = 3003;
app.listen(port, () => {
  console.log('🧪 =====================================');
  console.log('  OMAMORI LINE Bot Demo Server');
  console.log('🧪 =====================================');
  console.log(`📍 Port: ${port}`);
  console.log(`❤️  Health: http://localhost:${port}/health`);
  console.log(`💬 Chat Demo: POST http://localhost:${port}/demo-chat`);
  console.log(`🗣️  Conversation: POST http://localhost:${port}/demo-conversation`);
  console.log('');
  console.log('💡 Test Commands:');
  console.log('curl -X POST http://localhost:3003/demo-chat -H "Content-Type: application/json" -d \'{"message":"こんにちは"}\'');
  console.log('curl -X POST http://localhost:3003/demo-conversation');
  console.log('🧪 =====================================');
});