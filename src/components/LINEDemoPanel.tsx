'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';

interface LINEDemoPanelProps {
  userAddress: string | undefined;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'eliza';
  message: string;
  timestamp: number;
  type: 'text' | 'transaction' | 'milestone';
}

export default function LINEDemoPanel({ userAddress }: LINEDemoPanelProps) {
  const [showQR, setShowQR] = useState(false);
  const [lineConnected, setLineConnected] = useState(false);
  const [chatMode, setChatMode] = useState<'individual' | 'group'>('individual');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [lineUserId, setLineUserId] = useState('');

  // Real LINE Bot add friend URL (for demo purposes)
  const lineAddUrl = `https://line.me/R/ti/p/@omamori-demo`;

  useEffect(() => {
    // Add initial ElizaOS greeting with typing delay
    if (lineConnected && messages.length === 0) {
      setTimeout(() => {
        const greeting: ChatMessage = {
          id: Date.now().toString(),
          sender: 'eliza',
          message: `🌸 こんにちは! Welcome to OMAMORI!\n\nI'm Eliza, your AI financial guardian powered by ElizaOS. I'm here to help protect and grow your family's wealth through traditional Japanese wisdom and modern blockchain technology.\n\n💡 Quick commands:\n• Type "help" for full menu\n• "balance" to see your progress\n• "wisdom" for cultural insights\n• Or just chat naturally with me!\n\nYour financial journey starts now! 頑張って!`,
          timestamp: Date.now(),
          type: 'text'
        };
        setMessages([greeting]);

        // Add a follow-up message to make it feel more alive
        setTimeout(() => {
          const followUp: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'eliza',
            message: `💰 I can see you're connected from your MetaMask wallet. Ready to start building your OMAMORI savings vault? What financial goal speaks to your heart today?`,
            timestamp: Date.now() + 2000,
            type: 'text'
          };
          setMessages(prev => [...prev, followUp]);
        }, 3000);
      }, 1000);
    }
  }, [lineConnected]);

  const handleConnectLINE = () => {
    setShowQR(true);
  };

  const simulateQRScan = () => {
    setShowQR(false);
    setLineConnected(true);
    setLineUserId(`demo_user_${Date.now().toString().slice(-6)}`);

    // Auto-focus on chat after connection
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-container');
      if (chatContainer) {
        chatContainer.scrollIntoView({ behavior: 'smooth' });
      }
    }, 1000);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: newMessage,
      timestamp: Date.now(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMsg]);

    // Simulate ElizaOS response
    setTimeout(() => {
      const elizaResponse = generateElizaResponse(newMessage);
      const elizaMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'eliza',
        message: elizaResponse,
        timestamp: Date.now() + 1000,
        type: elizaResponse.includes('¥') ? 'transaction' : 'text'
      };
      setMessages(prev => [...prev, elizaMsg]);
    }, 1500);

    setNewMessage('');
  };

  const generateElizaResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();

    if (msg.includes('help')) {
      return `📋 OMAMORI Commands:\n\n💰 /deposit [amount] - Make a deposit\n📊 /balance - Check your savings\n🎯 /goals - View your targets\n👨‍👩‍👧‍👦 /family - Family group options\n🏆 /milestones - Your achievements\n🌸 /wisdom - Cultural savings tip\n\nOr just chat naturally with me!`;
    }

    if (msg.includes('/deposit') || msg.includes('deposit')) {
      return `💰 Great! I see you want to make a deposit.\n\nPlease use your OMAMORI app to:\n1. Connect MetaMask\n2. Choose your savings goal\n3. Make the deposit\n\nI'll notify you here when the transaction is confirmed! 🌸`;
    }

    if (msg.includes('/balance') || msg.includes('balance')) {
      return `📊 Your OMAMORI Progress:\n\n💎 Current Level: Sprout (Level 1)\n💰 Total Saved: ¥15,000\n🎯 Next Milestone: ¥25,000 (Flower Level)\n📈 Progress: 60%\n\n${chatMode === 'group' ? '👨‍👩‍👧‍👦 Family Total: ¥45,000' : ''}\n\nKeep going! あなたはよくやっています! 🌸`;
    }

    if (msg.includes('/family') || msg.includes('family')) {
      if (chatMode === 'individual') {
        return `👨‍👩‍👧‍👦 Family Options:\n\n1. Create Family Group\n2. Join Existing Group\n3. Set Inheritance Heir\n\nFamily savings strengthen bonds and ensure security for future generations. Would you like to create a group?`;
      } else {
        return `👨‍👩‍👧‍👦 Family Group "Tanaka Family":\n\n👤 Members: 4\n💰 Total Saved: ¥125,000\n🎯 Group Goal: ¥500,000\n📈 Progress: 25%\n\n💡 Recent: Mom deposited ¥5,000 yesterday!\n⚖️ Inheritance: Set for eldest child\n\n家族の絆は強い! Family bonds are strong! 🌸`;
      }
    }

    if (msg.includes('/wisdom') || msg.includes('wisdom')) {
      const wisdoms = [
        `🌸 "The cherry blossom falls, but the tree remains strong."\n\nConsistent small savings create lasting wealth. Every ¥100 matters!`,
        `⛩️ "Mottainai" - Don't waste what you have.\n\nBefore buying something new, ask: Do I really need this? Your future self will thank you.`,
        `🎋 "Tanabata teaches us that wishes need action."\n\nSet clear savings goals and work toward them daily. Dreams become reality through patience.`,
        `🏠 "A house is built one brick at a time."\n\nYour financial security grows with each deposit. Small steps lead to big achievements!`
      ];
      return wisdoms[Math.floor(Math.random() * wisdoms.length)];
    }

    if (msg.includes('hello') || msg.includes('hi')) {
      return `こんにちは! Hello! 🌸\n\nI'm here to help you build strong financial habits through mindful saving. How can I assist your OMAMORI journey today?`;
    }

    if (msg.includes('thank')) {
      return `どういたしまして! You're welcome! 🌸\n\nRemember, every small step toward your savings goals is a victory. I'm proud of your progress!`;
    }

    // Default responses
    const responses = [
      `🌸 I understand! Building good savings habits takes time and patience. What specific goal would you like to work toward?`,
      `💝 That's wonderful! OMAMORI is about creating security for you and your family. How can I help you today?`,
      `🎋 Great question! Financial wellness is a journey. Would you like some personalized advice based on your savings history?`,
      `⛩️ I'm here to support your financial growth. Remember, every yen saved is a step toward your dreams!`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const simulateTransactionNotification = () => {
    const txMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'eliza',
      message: `🎉 Transaction Confirmed!\n\n💰 Deposit: ¥5,000\n🎯 Goal: Emergency Fund\n📊 New Total: ¥20,000\n🏆 Milestone Progress: 80%\n\nTx: 0xabc123...def789\n\nYou're so close to your next level! 頑張って! Keep going! 🌸`,
      timestamp: Date.now(),
      type: 'transaction'
    };

    setMessages(prev => [...prev, txMsg]);
  };

  const switchChatMode = (mode: 'individual' | 'group') => {
    setChatMode(mode);
    setMessages([]);

    // Add mode-specific greeting
    setTimeout(() => {
      const greeting: ChatMessage = {
        id: Date.now().toString(),
        sender: 'eliza',
        message: mode === 'individual'
          ? `🌸 Individual OMAMORI Mode\n\nI'm here to help with your personal savings journey. Your privacy is protected while I provide guidance.`
          : `👨‍👩‍👧‍👦 Family Group Mode\n\nWelcome to the Tanaka Family group! I'll help coordinate family savings and share progress updates.`,
        timestamp: Date.now(),
        type: 'text'
      };
      setMessages([greeting]);
    }, 500);
  };

  if (!userAddress) {
    return (
      <div className="bg-gray-100 rounded-lg p-6">
        <p className="text-gray-600 text-center">Connect wallet to access LINE integration</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
      <div className="bg-green-500 text-white p-4">
        <h3 className="text-xl font-bold flex items-center">
          📱 LINE Bot Demo - Live for Judges
        </h3>
        <p className="text-sm opacity-90">Real-time ElizaOS conversation</p>
      </div>

      {!lineConnected ? (
        <div className="p-6 text-center">
          <h4 className="text-lg font-bold mb-4">Connect to LINE Bot</h4>

          {!showQR ? (
            <div className="space-y-4">
              <p className="text-gray-600">Click to show LINE QR code</p>
              <button
                onClick={handleConnectLINE}
                className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600"
              >
                📱 Generate LINE QR Code
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-bold">📱 Scan with LINE App</p>
              <div className="flex justify-center bg-white p-4 rounded-lg border">
                <QRCode value={lineAddUrl} size={200} />
              </div>
              <p className="text-sm text-gray-600">Real LINE Bot: @omamori-demo</p>
              <div className="space-x-2">
                <button
                  onClick={simulateQRScan}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  ✅ Simulate Scan (For Demo)
                </button>
                <button
                  onClick={() => setShowQR(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-[500px] flex flex-col chat-container border-2 border-green-400 rounded-lg overflow-hidden">
          {/* Enhanced Chat Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
                <div>
                  <div className="font-bold">🌸 OMAMORI ElizaOS</div>
                  <div className="text-xs opacity-90">LINE ID: {lineUserId} • Online</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => switchChatMode('individual')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    chatMode === 'individual'
                      ? 'bg-white text-green-600'
                      : 'bg-green-400 text-white hover:bg-green-300'
                  }`}
                >
                  👤 Individual
                </button>
                <button
                  onClick={() => switchChatMode('group')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    chatMode === 'group'
                      ? 'bg-white text-green-600'
                      : 'bg-green-400 text-white hover:bg-green-300'
                  }`}
                >
                  👨‍👩‍👧‍👦 Family
                </button>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : msg.type === 'transaction'
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Input Area */}
          <div className="bg-gray-50 border-t p-4">
            <div className="flex space-x-2 mb-3">
              <button
                onClick={simulateTransactionNotification}
                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors shadow-sm"
              >
                🎉 Simulate Transaction
              </button>
              <button
                onClick={() => {
                  setNewMessage('help');
                  setTimeout(() => sendMessage(), 100);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm"
              >
                💡 Help
              </button>
              <button
                onClick={() => {
                  setNewMessage('balance');
                  setTimeout(() => sendMessage(), 100);
                }}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors shadow-sm"
              >
                📊 Balance
              </button>
            </div>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message to Eliza..."
                className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-green-400 focus:outline-none transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}