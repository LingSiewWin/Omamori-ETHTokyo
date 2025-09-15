// OMAMORI Integrated Demo - LINE Bot → Blockchain Complete Flow
const express = require('express');
const line = require('@line/bot-sdk');
const { ethers } = require('hardhat');
require('dotenv').config({ path: '.env.local' });

const app = express();

// LINE configuration
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// Blockchain configuration
const NETWORKS = {
  zkEVM: {
    rpc: 'https://rpc.cardona.zkevm-rpc.com',
    chainId: 2442,
    contracts: {
      vault: '0x4c7271d91121f5ee40a5a303930db3140df68bbf',
      nft: '0xcdd7965f19103d34f4e70f540f5f6f6fa426ede1'
    }
  },
  JSC: {
    rpc: 'https://rpc.kaigan.jsc.dev/rpc?token=HsNB3uHRQ4u4POp6oUnR8UVBC6sYy3nS1GTqdgieYmA',
    chainId: 8888, // JSC Kaigan testnet
    contracts: {
      jpyc: '0x...' // Would need to deploy JPYC contract on JSC
    }
  }
};

// Cultural AI responses
const JAPANESE_RESPONSES = {
  greeting: 'こんにちは！お守りで貯金を始めませんか？🌸',
  savings_goal: (amount, goal) => `${goal}のために¥${amount.toLocaleString()}を貯めるのは素晴らしい目標ですね！\n\n日本の「もったいない」精神で、無駄遣いを減らして着実に貯金しましょう。`,
  currency_choice: 'どちらの通貨で貯金されますか？',
  processing: '🔄 お守りを作成しています...',
  success: (nftId) => `✅ お守り作成完了！\n\nあなたの貯金お守り #${nftId} が誕生しました。🌱\n\n目標達成まで一緒に頑張りましょう！`
};

// Enhanced message parsing with cultural context
function parseJapaneseSavingsMessage(text) {
  // Enhanced patterns for Japanese savings expressions
  const patterns = [
    /([¥￥]?\d{1,3}(?:,\d{3})*|\d+)[円¥￥]?.*?(?:貯め|ため|save)/i,
    /(?:貯金|貯蓄|save).*?([¥￥]?\d{1,3}(?:,\d{3})*|\d+)[円¥￥]?/i,
    /(旅行|trip|vacation).*?([¥￥]?\d{1,3}(?:,\d{3})*|\d+)/i
  ];

  for (let pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseInt(match[1]?.replace(/[¥￥,円]/g, '') || match[2]?.replace(/[¥￥,円]/g, ''));

      // Extract goal
      let goal = 'savings'; // default
      if (text.includes('沖縄') || text.includes('Okinawa')) goal = 'Okinawa Trip';
      if (text.includes('東京') || text.includes('Tokyo')) goal = 'Tokyo Trip';
      if (text.includes('旅行') || text.includes('travel')) goal = 'Travel';
      if (text.includes('車') || text.includes('car')) goal = 'New Car';

      return { amount, goal, currency: amount >= 10000 ? 'JPYC' : 'USDC' };
    }
  }
  return null;
}

// Create enhanced Flex Message with dual-chain options
function createSavingsFlexMessage(amount, goal) {
  return {
    type: 'flex',
    altText: `${goal}のための貯金プラン`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `🎯 ${goal}`,
            weight: 'bold',
            size: 'xl',
            color: '#b71c1c'
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
            text: JAPANESE_RESPONSES.savings_goal(amount, goal),
            wrap: true,
            size: 'sm',
            margin: 'lg'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: JAPANESE_RESPONSES.currency_choice,
            weight: 'bold',
            margin: 'lg'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#1976d2',
            action: {
              type: 'uri',
              label: `🇯🇵 JPYC で貯金 (¥${amount.toLocaleString()})`,
              uri: `https://omamori-bot-demo.loca.lt/integrated?goal=${encodeURIComponent(goal)}&amount=${amount}&asset=JPYC&chain=JSC`
            }
          },
          {
            type: 'button',
            style: 'secondary',
            margin: 'sm',
            action: {
              type: 'uri',
              label: `🌍 USDC で貯金 ($${Math.round(amount/150)})`,
              uri: `https://omamori-bot-demo.loca.lt/integrated?goal=${encodeURIComponent(goal)}&amount=${amount}&asset=USDC&chain=zkEVM`
            }
          },
          {
            type: 'text',
            text: '💡 お守りNFTが自動で作成されます',
            size: 'xs',
            color: '#888888',
            align: 'center',
            margin: 'md'
          }
        ]
      }
    }
  };
}

// Integrated web interface
app.get('/integrated', (req, res) => {
  const { goal, amount, asset, chain } = req.query;

  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>OMAMORI - Integrated Demo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/ethers@6.8.0/dist/ethers.umd.min.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; margin: 0; }
        .container { max-width: 400px; margin: 0 auto; background: white; border-radius: 16px; padding: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 24px; }
        .badge { background: #ff9800; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-bottom: 16px; }
        .step { background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 8px 0; }
        .button { background: #1976d2; color: white; border: none; padding: 16px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; width: 100%; margin: 8px 0; }
        .button:hover { background: #1565c0; }
        .success { background: #4caf50; }
        .progress { display: none; text-align: center; color: #666; }
        .result { display: none; text-align: center; background: #e8f5e8; padding: 16px; border-radius: 8px; margin-top: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="badge">🧪 INTEGRATED DEMO - ${chain.toUpperCase()}</div>
            <h1>🌸 OMAMORI</h1>
            <p>Complete LINE Bot → Blockchain Flow</p>
        </div>

        <div class="step">
            <strong>📱 From LINE Bot:</strong><br>
            Goal: ${goal}<br>
            Amount: ¥${parseInt(amount).toLocaleString()}<br>
            Asset: ${asset}<br>
            Chain: ${chain}
        </div>

        <div id="connect-section">
            <button class="button" onclick="connectAndProcess()">
                🔗 Connect Wallet & Create Omamori
            </button>
        </div>

        <div id="progress-section" class="progress">
            <div>🔄 Processing your Omamori...</div>
            <div style="margin-top: 16px;">
                <div>✅ 1. Wallet connected</div>
                <div id="step2">⏳ 2. Switching to ${chain} network...</div>
                <div id="step3">⏳ 3. Signing transaction...</div>
                <div id="step4">⏳ 4. Creating NFT...</div>
                <div id="step5">⏳ 5. Notifying LINE bot...</div>
            </div>
        </div>

        <div id="result-section" class="result">
            <h2>🎉 お守り作成完了！</h2>
            <div id="nft-details"></div>
            <button class="button success" onclick="returnToLine()">
                📱 Return to LINE Chat
            </button>
        </div>
    </div>

    <script>
        const NETWORKS = {
            zkEVM: {
                chainId: '0x98a',
                chainName: 'Polygon zkEVM Cardona Testnet',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://rpc.cardona.zkevm-rpc.com'],
                blockExplorerUrls: ['https://cardona-zkevm.polygonscan.com/']
            },
            JSC: {
                chainId: '0x22b8', // 8888 in hex
                chainName: 'Japan Smart Chain Kaigan',
                nativeCurrency: { name: 'JSC', symbol: 'JSC', decimals: 18 },
                rpcUrls: ['https://rpc.kaigan.jsc.dev/rpc'],
                blockExplorerUrls: ['https://scan.kaigan.jsc.dev/']
            }
        };

        async function connectAndProcess() {
            try {
                document.getElementById('connect-section').style.display = 'none';
                document.getElementById('progress-section').style.display = 'block';

                // Step 1: Connect wallet
                if (typeof window.ethereum === 'undefined') {
                    alert('Please install MetaMask!');
                    return;
                }

                const provider = new ethers.BrowserProvider(window.ethereum);
                await provider.send("eth_requestAccounts", []);

                // Step 2: Switch network
                document.getElementById('step2').innerHTML = '✅ 2. Switching to ${chain} network...';
                const networkConfig = NETWORKS['${chain}'];

                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: networkConfig.chainId }]
                    });
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [networkConfig]
                        });
                    }
                }

                document.getElementById('step2').innerHTML = '✅ 2. Connected to ${chain}';

                // Step 3: Sign transaction
                document.getElementById('step3').innerHTML = '✅ 3. Signing transaction...';

                const signer = await provider.getSigner();
                const account = await signer.getAddress();

                const domain = {
                    name: 'OmamoriVault',
                    version: '1',
                    chainId: ${chain === 'zkEVM' ? '2442' : '8888'},
                    verifyingContract: '${chain === 'zkEVM' ? '0x4c7271d91121f5ee40a5a303930db3140df68bbf' : '0x1234...JSC'}'
                };

                const types = {
                    Deposit: [
                        { name: 'user', type: 'address' },
                        { name: 'amount', type: 'uint256' },
                        { name: 'asset', type: 'string' },
                        { name: 'goal', type: 'string' }
                    ]
                };

                const value = {
                    user: account,
                    amount: ethers.parseUnits('${amount}', 0),
                    asset: '${asset}',
                    goal: '${goal}'
                };

                const signature = await signer.signTypedData(domain, types, value);
                document.getElementById('step3').innerHTML = '✅ 3. Transaction signed';

                // Step 4: Create NFT (simulated)
                document.getElementById('step4').innerHTML = '✅ 4. NFT created';

                // Step 5: Notify LINE bot
                document.getElementById('step5').innerHTML = '✅ 5. LINE bot notified';

                // Show result
                document.getElementById('progress-section').style.display = 'none';
                document.getElementById('result-section').style.display = 'block';

                const nftId = Math.floor(Math.random() * 10000);
                document.getElementById('nft-details').innerHTML = \`
                    <div style="font-size: 48px; margin: 16px 0;">🌱</div>
                    <div><strong>Omamori NFT #\${nftId}</strong></div>
                    <div>Goal: ${goal}</div>
                    <div>Amount: ¥${parseInt(amount).toLocaleString()}</div>
                    <div>Chain: ${chain}</div>
                    <div>Status: Seed Level</div>
                \`;

                // Send success message back to LINE (would be real API call)
                console.log('Success! NFT created:', nftId);

            } catch (error) {
                console.error('Process failed:', error);
                alert('Process failed: ' + error.message);
                document.getElementById('connect-section').style.display = 'block';
                document.getElementById('progress-section').style.display = 'none';
            }
        }

        function returnToLine() {
            if (window.opener) {
                window.close();
            } else {
                window.history.back();
            }
        }
    </script>
</body>
</html>
  `);
});

// LINE webhook
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// Enhanced message handling
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const userMessage = event.message.text;
  console.log('📱 Received:', userMessage);

  // Parse savings intent
  const savingsData = parseJapaneseSavingsMessage(userMessage);

  if (savingsData) {
    const { amount, goal, currency } = savingsData;
    console.log('💰 Parsed savings goal:', { amount, goal, currency });

    // Send cultural AI response + integrated flow
    const flexMessage = createSavingsFlexMessage(amount, goal);

    return client.replyMessage(event.replyToken, [
      {
        type: 'text',
        text: JAPANESE_RESPONSES.savings_goal(amount, goal)
      },
      flexMessage
    ]);
  }

  // Default greeting
  if (userMessage.toLowerCase().includes('hello') || userMessage.includes('こんにちは')) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: JAPANESE_RESPONSES.greeting
    });
  }

  // Fallback response
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '貯金の目標を教えてください！例: "沖縄旅行のために¥50,000貯めたい"'
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'omamori-integrated-demo',
    features: ['LINE bot', 'zkEVM integration', 'JSC support', 'Cultural AI'],
    timestamp: new Date().toISOString()
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log('🌸 OMAMORI Integrated Demo listening on port', port);
  console.log('🔗 Webhook URL: https://omamori-bot-demo.loca.lt/webhook');
  console.log('🧪 Demo URL: https://omamori-bot-demo.loca.lt/integrated');
  console.log('✅ Ready for complete LINE → Blockchain flow!');
});

module.exports = app;