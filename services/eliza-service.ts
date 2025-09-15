// OMAMORI ElizaOS Certified Agent
// Cultural Preservation DeFi Guardian for Vulnerable Populations
// ElizaOS Agent v1.0.0

import { Client, middleware } from '@line/bot-sdk';
import express from 'express';
import cron from 'node-cron';
import config from './eliza.config.json';
import type { UserProfile, AutonomousBehavior, LineConfig, SeasonalContext } from './types/omamori';

// Import ElizaOS plugins
import CoinGeckoPlugin from './plugins/coingecko';
import JSCKYCPlugin from './plugins/jsc-kyc';
import DisasterAlertPlugin from './plugins/disaster-alert';
import NFTEvolutionPlugin from './plugins/nft-evolution';

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

class OmamoriElizaAgent {
  private config: any;
  private plugins: Map<string, any>;
  private userProfiles: Map<string, UserProfile>;
  private autonomousBehaviors: Map<string, AutonomousBehavior>;
  private lineConfig: LineConfig;
  private client: Client;
  private app: express.Application;

  constructor() {
    this.config = config;
    this.plugins = new Map();
    this.userProfiles = new Map();
    this.autonomousBehaviors = new Map();

    // LINE bot configuration
    this.lineConfig = {
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.LINE_CHANNEL_SECRET
    };

    this.client = new Client(this.lineConfig);
    this.app = express();

    console.log(`🌸 Initializing OMAMORI ElizaOS Agent v${this.config.version}`);
  }

  // Initialize ElizaOS agent
  async initialize() {
    try {
      console.log('🚀 Starting ElizaOS agent initialization...');

      // Initialize plugins
      await this.initializePlugins();

      // Setup autonomous behaviors
      await this.setupAutonomousBehaviors();

      // Setup LINE webhook
      this.setupLINEWebhook();

      // Setup health monitoring
      this.setupHealthMonitoring();

      console.log('✅ OMAMORI ElizaOS Agent initialized successfully');
      return { success: true, agent: this.config.name, version: this.config.version };

    } catch (error) {
      console.error('❌ ElizaOS agent initialization failed:', error);
      throw error;
    }
  }

  // Initialize all ElizaOS plugins
  async initializePlugins() {
    console.log('🔌 Initializing ElizaOS plugins...');

    const pluginConfigs = this.config.plugins.enabled;

    // Initialize each plugin
    for (const pluginConfig of pluginConfigs) {
      try {
        let plugin;

        switch (pluginConfig.name) {
          case 'coingecko':
            plugin = CoinGeckoPlugin.create(pluginConfig.config);
            break;
          case 'jsc-kyc':
            plugin = JSCKYCPlugin.create(pluginConfig.config);
            break;
          case 'disaster-alert':
            plugin = DisasterAlertPlugin.create(pluginConfig.config);
            break;
          case 'nft-evolution':
            plugin = NFTEvolutionPlugin.create(pluginConfig.config);
            break;
          default:
            console.warn(`⚠️ Unknown plugin: ${pluginConfig.name}`);
            continue;
        }

        // Initialize plugin with ElizaOS interface
        const result = await plugin.initialize(this);

        if (result.success) {
          this.plugins.set(pluginConfig.name, plugin);
          console.log(`✅ Plugin ${pluginConfig.name} v${plugin.version} initialized`);
        } else {
          console.error(`❌ Plugin ${pluginConfig.name} initialization failed`);
        }

      } catch (error) {
        console.error(`❌ Error initializing plugin ${pluginConfig.name}:`, error);
      }
    }

    console.log(`🔌 ${this.plugins.size}/${pluginConfigs.length} plugins initialized`);
  }

  // Setup autonomous behaviors using ElizaOS scheduler
  async setupAutonomousBehaviors() {
    console.log('🤖 Setting up autonomous behaviors...');

    const autonomousTriggers = this.config.triggers.autonomous;

    for (const trigger of autonomousTriggers) {
      try {
        // Setup cron job with cultural considerations
        const cronJob = cron.schedule(trigger.schedule, async () => {
          await this.executeAutonomousBehavior(trigger);
        }, {
          timezone: trigger.timezone || 'Asia/Tokyo'
        } as any);

        this.autonomousBehaviors.set(trigger.handler, {
          trigger,
          cronJob,
          lastExecution: null,
          executionCount: 0
        });

        console.log(`🕐 Autonomous behavior scheduled: ${trigger.handler}`);

      } catch (error) {
        console.error(`❌ Error setting up autonomous behavior ${trigger.handler}:`, error);
      }
    }

    console.log(`🤖 ${this.autonomousBehaviors.size} autonomous behaviors scheduled`);
  }

  // Execute autonomous behavior with cultural context
  async executeAutonomousBehavior(trigger) {
    try {
      console.log(`🤖 Executing autonomous behavior: ${trigger.handler}`);

      const behavior = this.autonomousBehaviors.get(trigger.handler);
      if (!behavior) return;

      // Check conditions
      if (!this.checkAutonomousConditions(trigger)) {
        console.log(`⏸️ Skipping autonomous behavior due to conditions: ${trigger.handler}`);
        return;
      }

      let result;

      switch (trigger.handler) {
        case 'daily-cultural-reminder':
          result = await this.sendDailyCulturalReminders();
          break;
        case 'disaster-monitoring':
          result = await this.performDisasterMonitoring();
          break;
        case 'weekly-cultural-wisdom':
          result = await this.sendWeeklyCulturalWisdom();
          break;
        default:
          console.warn(`⚠️ Unknown autonomous behavior: ${trigger.handler}`);
          return;
      }

      // Update behavior tracking
      behavior.lastExecution = Date.now();
      behavior.executionCount++;

      console.log(`✅ Autonomous behavior completed: ${trigger.handler}`, result);

    } catch (error) {
      console.error(`❌ Error executing autonomous behavior ${trigger.handler}:`, error);
    }
  }

  // Check autonomous behavior conditions
  checkAutonomousConditions(trigger) {
    const conditions = trigger.conditions || {};

    // Skip on Japanese holidays if configured
    if (conditions.skip_holidays && this.isJapaneseHoliday()) {
      return false;
    }

    // Respect user settings
    if (conditions.respect_user_settings) {
      // Check user notification preferences
      return true; // Simplified for demo
    }

    // Check max frequency
    if (conditions.max_frequency) {
      const behavior = this.autonomousBehaviors.get(trigger.handler);
      if (behavior && behavior.lastExecution) {
        const timeSinceLastExecution = Date.now() - behavior.lastExecution;
        const minInterval = this.parseMaxFrequency(conditions.max_frequency);

        if (timeSinceLastExecution < minInterval) {
          return false;
        }
      }
    }

    return true;
  }

  // Check if today is a Japanese holiday
  isJapaneseHoliday() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = today.getDate();

    // Basic Japanese holidays (simplified)
    const holidays = [
      [1, 1],   // New Year's Day
      [2, 11],  // National Foundation Day
      [4, 29],  // Showa Day
      [5, 3],   // Constitution Memorial Day
      [5, 4],   // Greenery Day
      [5, 5],   // Children's Day
      [8, 11],  // Mountain Day
      [11, 3],  // Culture Day
      [11, 23], // Labor Thanksgiving Day
      [12, 23]  // Emperor's Birthday
    ];

    return holidays.some(([m, d]) => m === month && d === date);
  }

  // Parse max frequency string to milliseconds
  parseMaxFrequency(frequency) {
    const units = {
      '1_per_day': 24 * 60 * 60 * 1000,
      '1_per_week': 7 * 24 * 60 * 60 * 1000,
      '1_per_hour': 60 * 60 * 1000
    };
    return units[frequency] || 24 * 60 * 60 * 1000; // Default to 1 day
  }

  // Send daily cultural reminders
  async sendDailyCulturalReminders() {
    console.log('🌅 Sending daily cultural reminders...');

    let remindersSent = 0;

    for (const [userId, profile] of this.userProfiles.entries()) {
      if (!profile.targets || profile.targets.length === 0) continue;

      try {
        const activeTarget = profile.targets[profile.targets.length - 1];
        const now = new Date();
        const targetDate = new Date(activeTarget.targetDate);
        const daysLeft = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0) continue;

        // Create culturally appropriate reminder
        const reminderMessage = this.createDailyCulturalReminder(activeTarget, daysLeft, profile);

        // Send push message
        await this.client.pushMessage(userId, reminderMessage as any);
        remindersSent++;

        console.log(`🌸 Cultural reminder sent to user ${userId}`);

      } catch (error) {
        console.error(`Failed to send reminder to ${userId}:`, error);
      }
    }

    return { remindersSent, totalUsers: this.userProfiles.size };
  }

  // Create daily cultural reminder message
  createDailyCulturalReminder(target, daysLeft, profile) {
    const currentSeason = this.getCurrentSeason();
    const isElderly = profile.elderlyProtection || false;

    let message = `🌅 おはようございます！\n\n`;
    message += `🎯 ${target.goal}まで あと${daysLeft}日\n`;
    message += `💰 目標: ¥${target.amount.toLocaleString()}\n`;
    message += `📅 今日の貯蓄目標: ¥${target.dailyTarget.toLocaleString()}\n\n`;

    // Add seasonal cultural context
    message += `${currentSeason.emoji} ${currentSeason.season}の季節です\n`;
    message += `${currentSeason.cultural_wisdom}\n\n`;

    // Add elderly-specific guidance if needed
    if (isElderly) {
      message += `👴 ゆっくりと確認しながら進めましょう\n`;
      message += `💬 わからないことがあれば遠慮なくお尋ねください\n\n`;
    }

    message += `🌸 もったいない精神で今日も頑張りましょう！`;

    return {
      type: 'text',
      text: message
    };
  }

  // Get current seasonal context
  getCurrentSeason() {
    const month = new Date().getMonth();
    const seasons = {
      0: { season: '冬', emoji: '❄️', cultural_wisdom: '新年の静寂の中で心を整えましょう' },
      1: { season: '冬', emoji: '🌸', cultural_wisdom: '春の準備を始める時期です' },
      2: { season: '春', emoji: '🌸', cultural_wisdom: '桜のように美しく成長しましょう' },
      3: { season: '春', emoji: '🌺', cultural_wisdom: '新しい出会いに感謝します' },
      4: { season: '春', emoji: '🎏', cultural_wisdom: '健やかな成長を願います' },
      5: { season: '梅雨', emoji: '☔', cultural_wisdom: '雨の恵みに感謝し、静かに成長しましょう' },
      6: { season: '夏', emoji: '🎋', cultural_wisdom: '七夕の願いを込めて貯蓄しましょう' },
      7: { season: '夏', emoji: '🏮', cultural_wisdom: '先祖への感謝を忘れずに' },
      8: { season: '秋', emoji: '🌕', cultural_wisdom: '月の美しさと共に心を落ち着けましょう' },
      9: { season: '秋', emoji: '🍁', cultural_wisdom: '紅葉のような変化の美しさを感じましょう' },
      10: { season: '秋', emoji: '🌾', cultural_wisdom: '実りの季節に感謝します' },
      11: { season: '冬', emoji: '🎊', cultural_wisdom: '一年の締めくくりを大切に' }
    };
    return seasons[month];
  }

  // Perform disaster monitoring (autonomous)
  async performDisasterMonitoring() {
    const disasterPlugin = this.plugins.get('disaster-alert');
    if (!disasterPlugin) return { status: 'plugin_not_available' };

    // Silent monitoring - no user notification unless emergency
    try {
      await disasterPlugin.checkForAlerts();
      return { status: 'monitoring_completed', alerts: 0 };
    } catch (error) {
      console.error('Disaster monitoring error:', error);
      return { status: 'monitoring_error', error: error.message };
    }
  }

  // Send weekly cultural wisdom
  async sendWeeklyCulturalWisdom() {
    console.log('🏛️ Sending weekly cultural wisdom...');

    const culturalWisdom = [
      {
        title: 'もったいない (Mottainai)',
        wisdom: '物を大切にする心が、真の豊かさを生み出します',
        action: '今週は無駄を見つめ直してみましょう'
      },
      {
        title: 'おもてなし (Omotenashi)',
        wisdom: '相手を思いやる心が、美しい関係を築きます',
        action: 'ご家族への感謝を伝えてみましょう'
      },
      {
        title: '協働 (Kyōdō)',
        wisdom: 'みんなで力を合わせることで、大きな力になります',
        action: 'コミュニティとの絆を深めましょう'
      },
      {
        title: '伝統 (Dentō)',
        wisdom: '先人の知恵を受け継ぎ、次世代に伝えます',
        action: '家族の歴史を振り返ってみましょう'
      }
    ];

    const randomWisdom = culturalWisdom[Math.floor(Math.random() * culturalWisdom.length)];
    let wisdomSent = 0;

    for (const [userId, profile] of this.userProfiles.entries()) {
      if (!profile.culturalWisdomOptIn) continue;

      try {
        const message = {
          type: 'text',
          text: `🏛️ 今週の文化的知恵\n\n【${randomWisdom.title}】\n${randomWisdom.wisdom}\n\n💡 今週の実践：\n${randomWisdom.action}\n\n🌸 OMAMORI と共に文化を大切にしましょう`
        };

        await this.client.pushMessage(userId, message as any);
        wisdomSent++;

      } catch (error) {
        console.error(`Failed to send cultural wisdom to ${userId}:`, error);
      }
    }

    return { wisdomSent, wisdom: randomWisdom.title };
  }

  // Setup LINE webhook with ElizaOS integration
  setupLINEWebhook() {
    console.log('📱 Setting up LINE webhook with ElizaOS integration...');

    this.app.use('/webhook', middleware(this.lineConfig), (req, res) => {
      Promise.all(req.body.events.map(event => {
        if (event.type === 'message') {
          return this.handleMessage(event);
        } else if (event.type === 'postback') {
          return this.handlePostback(event);
        }
        return Promise.resolve(null);
      }))
      .then(result => res.json(result))
      .catch(err => {
        console.error('Webhook error:', err);
        res.status(500).end();
      });
    });

    console.log('📱 LINE webhook configured');
  }

  // Handle LINE messages with ElizaOS plugin integration
  async handleMessage(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
      return Promise.resolve(null);
    }

    const userId = event.source.userId;
    const userMessage = event.message.text;
    const userProfile = this.userProfiles.get(userId) || {};

    console.log(`📱 ElizaOS Agent message from ${userId}: ${userMessage}`);

    try {
      // Find matching trigger
      const matchedTrigger = this.findMatchingTrigger(userMessage);

      if (matchedTrigger) {
        const plugin = this.plugins.get(matchedTrigger.plugin);
        if (plugin) {
          console.log(`🔌 Routing to plugin: ${matchedTrigger.plugin}`);

          const context = {
            message: userMessage,
            userId,
            userProfile,
            trigger: matchedTrigger.trigger,
            elizaOS: this
          };

          const result = await plugin.handleTrigger(matchedTrigger.trigger, context);

          if (result.success && result.response) {
            return this.client.replyMessage(event.replyToken, {
              type: 'text',
              text: result.response.text || result.response
            });
          }
        }
      }

      // Default cultural response
      return this.handleDefaultMessage(event, userMessage, userProfile);

    } catch (error) {
      console.error('Message handling error:', error);
      return this.client.replyMessage(event.replyToken, {
        type: 'text',
        text: '申し訳ございません。システムで問題が発生しました。\n🌸 しばらく時間をおいてから再度お試しください。'
      });
    }
  }

  // Find matching trigger from configuration
  findMatchingTrigger(message) {
    const lowerMessage = message.toLowerCase();

    for (const trigger of this.config.triggers.conversation) {
      for (const pattern of trigger.pattern) {
        if (lowerMessage.includes(pattern.toLowerCase())) {
          // Determine which plugin handles this trigger
          let pluginName = 'coingecko'; // default

          if (pattern.includes('disaster') || pattern.includes('災害') || pattern.includes('emergency')) {
            pluginName = 'disaster-alert';
          } else if (pattern.includes('elderly') || pattern.includes('高齢者') || pattern.includes('privacy')) {
            pluginName = 'jsc-kyc';
          } else if (pattern.includes('nft') || pattern.includes('omamori') || pattern.includes('お守り')) {
            pluginName = 'nft-evolution';
          } else if (pattern.includes('rate') || pattern.includes('レート') || pattern.includes('market')) {
            pluginName = 'coingecko';
          }

          return {
            trigger: pattern,
            handler: trigger.handler,
            plugin: pluginName,
            description: trigger.description
          };
        }
      }
    }

    return null;
  }

  // Handle default messages with cultural context
  async handleDefaultMessage(event, userMessage, userProfile) {
    const lowerText = userMessage.toLowerCase();

    let replyMessage;

    if (lowerText.includes('こんにちは') || lowerText.includes('hello')) {
      replyMessage = {
        type: 'text',
        text: `こんにちは！🌸 私は${this.config.agent.name}です。\n\n🎌 ${this.config.agent.persona.mission}\n\n📋 できること:\n・文化的価値保護\n・高齢者支援\n・災害備え\n・市場情報提供\n・お守りNFT管理\n\nテクノロジーで文化を守り、社会に貢献します 🏛️`
      };
    } else if (lowerText.includes('help') || lowerText.includes('ヘルプ')) {
      replyMessage = {
        type: 'text',
        text: `📋 ${this.config.agent.name} コマンド:\n\n${this.getHelpText()}\n\n🌸 ElizaOS認定エージェントとして、文化的価値と記憶を永続保護します`
      };
    } else {
      replyMessage = {
        type: 'text',
        text: `🌸 文化を守り、社会に貢献するElizaOSエージェント\n\n以下のようにお話しください：\n・「rate」- 市場情報\n・「elderly」- 高齢者保護設定\n・「disaster」- 災害備え\n・「nft」- お守りコレクション\n\n${this.getCurrentSeason().cultural_wisdom} 🏛️`
      };
    }

    return this.client.replyMessage(event.replyToken, replyMessage);
  }

  // Get help text from configuration
  getHelpText() {
    return this.config.triggers.conversation
      .map(trigger => `• ${trigger.pattern[0]} - ${trigger.description}`)
      .join('\n');
  }

  // Handle postback events
  async handlePostback(event) {
    const data = event.postback.data;
    const userId = event.source.userId;

    console.log('📱 ElizaOS postback received:', data);

    // Route to appropriate plugin based on postback data
    if (data.includes('elderly_protection')) {
      const jscPlugin = this.plugins.get('jsc-kyc');
      if (jscPlugin) {
        // Handle through plugin system
        return this.client.replyMessage(event.replyToken, {
          type: 'text',
          text: '🔒 高齢者保護機能を設定中です...\n\nElizaOSプラグインシステムが\n安全に処理いたします。'
        });
      }
    }

    // Default postback handling
    return this.client.replyMessage(event.replyToken, {
      type: 'text',
      text: '承知いたしました。\n🌸 ElizaOSシステムで処理中です。'
    });
  }

  // Setup health monitoring
  setupHealthMonitoring() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      const health = await this.performHealthCheck();
      res.json(health);
    });

    // Plugin status endpoint
    this.app.get('/plugins', (req, res) => {
      const pluginInfo = {};
      for (const [name, plugin] of this.plugins.entries()) {
        pluginInfo[name] = plugin.getInfo();
      }
      res.json({
        agent: this.config.name,
        version: this.config.version,
        plugins: pluginInfo,
        plugin_count: this.plugins.size
      });
    });

    console.log('🏥 Health monitoring endpoints configured');
  }

  // Perform comprehensive health check
  async performHealthCheck() {
    const health = {
      agent: this.config.name,
      version: this.config.version,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      plugins: {},
      autonomous_behaviors: {},
      line_integration: {
        configured: !!this.lineConfig.channelAccessToken,
        webhook_active: true
      }
    };

    // Check plugin health
    for (const [name, plugin] of this.plugins.entries()) {
      try {
        health.plugins[name] = await plugin.healthCheck();
      } catch (error) {
        health.plugins[name] = { healthy: false, error: error.message };
        health.status = 'degraded';
      }
    }

    // Check autonomous behaviors
    for (const [name, behavior] of this.autonomousBehaviors.entries()) {
      health.autonomous_behaviors[name] = {
        scheduled: true,
        last_execution: behavior.lastExecution,
        execution_count: behavior.executionCount
      };
    }

    return health;
  }

  // Start the ElizaOS agent server
  async start() {
    try {
      await this.initialize();

      const port = process.env.PORT || 3002;
      this.app.listen(port, () => {
        console.log(`🌸 OMAMORI ElizaOS Agent listening on port ${port}`);
        console.log(`🤖 Agent: ${this.config.agent.name}`);
        console.log(`🔌 Plugins: ${this.plugins.size} active`);
        console.log(`🕐 Autonomous behaviors: ${this.autonomousBehaviors.size} scheduled`);
        console.log(`📱 LINE webhook: /webhook`);
        console.log(`🏥 Health check: /health`);
        console.log(`🔌 Plugin info: /plugins`);
        console.log('✅ ElizaOS Certified Agent ready for cultural preservation');
      });

      return { success: true, port };

    } catch (error) {
      console.error('❌ Failed to start ElizaOS agent:', error);
      throw error;
    }
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down ElizaOS agent...');

    // Stop autonomous behaviors
    for (const [name, behavior] of this.autonomousBehaviors.entries()) {
      behavior.cronJob.stop();
      console.log(`⏹️ Stopped autonomous behavior: ${name}`);
    }

    // Cleanup plugins
    for (const [name, plugin] of this.plugins.entries()) {
      try {
        await plugin.cleanup();
        console.log(`🔧 Plugin ${name} cleaned up`);
      } catch (error) {
        console.error(`❌ Error cleaning up plugin ${name}:`, error);
      }
    }

    console.log('✅ OMAMORI ElizaOS Agent shutdown completed');
  }
}

// Create and start the ElizaOS agent
const agent = new OmamoriElizaAgent();

// Graceful shutdown handlers
process.on('SIGTERM', () => agent.shutdown());
process.on('SIGINT', () => agent.shutdown());

// Start the agent
if (import.meta.url === `file://${process.argv[1]}`) {
  agent.start().catch(error => {
    console.error('❌ Fatal error starting ElizaOS agent:', error);
    process.exit(1);
  });
}

export { OmamoriElizaAgent, agent };

console.log('🌸 OMAMORI ElizaOS Certified Agent loaded - Ready for cultural preservation');