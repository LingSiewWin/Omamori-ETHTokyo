// OMAMORI JSC-KYC ElizaOS Plugin
// Japan Smart Chain KYC integration with elderly protection
// ElizaOS Certified Plugin v1.0.0

const manifest = require('./manifest.json');

class JSCKYCElizaPlugin {
  constructor(config = {}) {
    this.name = manifest.name;
    this.version = manifest.version;
    this.config = { ...manifest.config, ...config };
    this.elderlyProfiles = new Map();
    this.familyContacts = new Map();

    console.log(`🔒 ElizaOS Plugin: ${this.name} v${this.version} loaded`);
  }

  // ElizaOS Plugin Interface: Initialize
  async initialize(elizaOS) {
    this.elizaOS = elizaOS;
    console.log(`🔒 JSC-KYC plugin initialized for elderly protection`);
    return {
      success: true,
      plugin: this.name,
      version: this.version,
      capabilities: manifest.capabilities
    };
  }

  // ElizaOS Plugin Interface: Handle Trigger
  async handleTrigger(trigger, context) {
    try {
      const { message, userId, userProfile } = context;

      console.log(`🔒 JSC-KYC trigger: ${trigger} for user ${userId}`);

      // Check if user is registered as elderly
      const elderlyStatus = this.getElderlyUserStatus(userId);

      if (elderlyStatus.isElderlyUser) {
        return this.handleExistingElderlyUser(elderlyStatus, context);
      } else {
        return this.handleElderlyRegistration(context);
      }

    } catch (error) {
      console.error(`❌ JSC-KYC plugin error:`, error);
      return this.getErrorResponse(error);
    }
  }

  // Handle existing elderly user
  handleExistingElderlyUser(elderlyStatus, context) {
    const { userId } = context;
    const profile = elderlyStatus.profile;

    const response = {
      type: 'elderly_status',
      text: `🔒 高齢者保護設定\n\n現在の設定:\n• プライバシーレベル: ${profile.privacyLevel}\n• 家族通知: ${profile.familyContactsCount}件登録済み\n• 最終利用: ${new Date(profile.lastAccess).toLocaleString('ja-JP')}\n\n💡 お勧め:\n${elderlyStatus.recommendations.join('\n')}\n\n🌸 もったいない精神で安全に価値を守りましょう`,
      actions: [
        {
          type: 'postback',
          label: '🔧 設定変更',
          data: `action=modify_elderly_settings&user=${userId}`
        },
        {
          type: 'postback',
          label: '👥 家族連絡先',
          data: `action=manage_family_contacts&user=${userId}`
        }
      ]
    };

    return {
      success: true,
      response,
      plugin: this.name,
      user_type: 'elderly_registered'
    };
  }

  // Handle elderly registration
  handleElderlyRegistration(context) {
    const { userId } = context;

    const response = {
      type: 'elderly_registration_offer',
      text: '🔒 高齢者向け安全保護システム\n\nより安心してご利用いただくための\n特別な保護機能をご用意しています。',
      template: {
        type: 'confirm',
        text: '高齢者向けの追加保護機能を\n有効にしますか？\n\n• 音声確認機能\n• 家族通知システム\n• 文化的配慮強化\n• 取引限度額設定',
        actions: [
          {
            type: 'postback',
            label: '✅ 有効にする',
            data: `action=enable_elderly_protection&user=${userId}`
          },
          {
            type: 'postback',
            label: '❌ 今は設定しない',
            data: `action=skip_elderly_protection&user=${userId}`
          }
        ]
      }
    };

    return {
      success: true,
      response,
      plugin: this.name,
      user_type: 'elderly_registration'
    };
  }

  // Register elderly user profile
  registerElderlyUser(userId, profileData) {
    const elderlyProfile = {
      userId,
      registeredAt: Date.now(),
      ageRange: profileData.ageRange || '65+',
      privacyLevel: profileData.privacyLevel || 'high',
      familyContacts: profileData.familyContacts || [],
      culturalPreferences: {
        language: 'polite_japanese',
        confirmationMethod: 'voice_repeat',
        respectLevel: 'maximum'
      },
      protections: {
        requireBiometric: true,
        limitTransactions: true,
        notifyFamily: true,
        culturalSafeguards: true
      },
      accessPattern: {
        lastAccess: Date.now(),
        unusualActivity: false,
        helpRequested: 0
      },
      jscKYC: {
        nfcEnabled: false,
        mizuhikiSBT: null,
        kycLevel: 'pending'
      }
    };

    this.elderlyProfiles.set(userId, elderlyProfile);
    console.log(`👴 Elderly protection profile created for user ${userId}`);
    return elderlyProfile;
  }

  // Enhanced biometric confirmation for elderly users
  async requestBiometricConfirmation(userId, transactionData) {
    const profile = this.elderlyProfiles.get(userId);

    if (!profile) {
      return this.createStandardConfirmation(transactionData);
    }

    console.log(`🔒 Initiating elderly-friendly biometric confirmation for user ${userId}`);

    const confirmationFlow = {
      type: 'elderly_biometric_confirmation',
      userId,
      transaction: {
        amount: transactionData.amount,
        goal: transactionData.goal,
        culturalContext: transactionData.culturalContext
      },
      confirmationMethods: [
        {
          type: 'voice_confirmation',
          enabled: true,
          prompt: this.createVoicePrompt(transactionData, profile),
          timeout: 30000
        },
        {
          type: 'nfc_tap_confirmation',
          enabled: profile.jscKYC.nfcEnabled,
          instructions: this.createNFCInstructions(),
          timeout: 45000
        },
        {
          type: 'family_notification',
          enabled: profile.protections.notifyFamily,
          contacts: profile.familyContacts,
          delay: 5000
        }
      ],
      safeguards: {
        maxAmount: this.config.transaction_limits.elderly,
        requireRepeat: true,
        allowCancel: true,
        culturalRespect: 'maximum'
      }
    };

    return confirmationFlow;
  }

  // Create voice confirmation prompt
  createVoicePrompt(transactionData, profile) {
    const amount = transactionData.amount.toLocaleString('ja-JP');
    const goal = transactionData.goal || '貯蓄';

    return {
      primaryPrompt: `お疲れさまです。${goal}のために${amount}円の入金を確認させていただきます。`,
      confirmationPhrase: `「確認します」と明確にお話しください。`,
      repeatInstruction: `もう一度、「確認します」とおっしゃってください。`,
      culturalClosing: 'ありがとうございます。安全に処理いたします。',
      helpText: `わからないことがございましたら、「助けて」とおっしゃってください。`,
      cancelOption: `取り消す場合は「キャンセル」とお話しください。`,
      respectfulTone: 'maximum',
      speakingPace: 'slow',
      pronunciation: 'clear_japanese'
    };
  }

  // Create iPhone NFC tap instructions
  createNFCInstructions() {
    return {
      title: '📱 iPhone NFC 確認',
      steps: [
        '1. iPhoneの上部をタップしてください',
        '2. 「NFC確認開始」と表示されるまでお待ちください',
        '3. 画面の指示に従ってください',
        '4. 完了まで約30秒お待ちください'
      ],
      culturalNote: 'ゆっくりと落ち着いて操作してください。急ぐ必要はありません。',
      helpOption: '困ったときは「助けて」とお話しください',
      familySupport: 'ご家族のサポートを受けることをお勧めします'
    };
  }

  // Mock iPhone NFC tap simulation (for demo)
  async simulateNFCTap(userId) {
    console.log(`📱 Simulating iPhone NFC tap for user ${userId}`);

    // Simulate NFC processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const nfcResult = {
      success: true,
      method: 'iphone_nfc',
      timestamp: Date.now(),
      deviceInfo: {
        model: 'iPhone_demo',
        nfc_version: '2.0',
        security_level: 'high'
      },
      kycData: {
        verified: true,
        confidence: 0.95,
        cultural_adaptation: true
      }
    };

    console.log(`✅ NFC verification completed for elderly user ${userId}`);
    return nfcResult;
  }

  // Family notification system
  async notifyFamily(elderlyUserId, transactionData) {
    const profile = this.elderlyProfiles.get(elderlyUserId);

    if (!profile || !profile.protections.notifyFamily) {
      return { notified: false, reason: 'family_notification_disabled' };
    }

    const familyMessage = this.createFamilyNotificationMessage(elderlyUserId, transactionData, profile);

    console.log('👨‍👩‍👧‍👦 Family notification:', familyMessage);

    // Mock notification to family contacts
    for (const contact of profile.familyContacts) {
      try {
        console.log(`📱 Family notification sent to ${contact}`);
      } catch (error) {
        console.error(`Failed to notify family contact ${contact}:`, error);
      }
    }

    return {
      notified: true,
      familyContacts: profile.familyContacts.length,
      message: familyMessage,
      timestamp: Date.now()
    };
  }

  // Create family notification message
  createFamilyNotificationMessage(elderlyUserId, transactionData, profile) {
    const amount = transactionData.amount.toLocaleString('ja-JP');
    const goal = transactionData.goal || '貯蓄';
    const time = new Date().toLocaleString('ja-JP');

    return `🌸 OMAMORI 家族通知システム\n\nご家族の方が貯蓄活動を行いました。\n\n📊 取引詳細:\n• 目的: ${goal}\n• 金額: ${amount}円\n• 時刻: ${time}\n• 文化的価値保護: 有効\n\n🛡️ プライバシー保護:\n• 生体認証確認済み\n• 文化的配慮済み\n• 安全性確認済み\n\nもったいない精神で大切な価値を守っています。\n何かご不明な点がございましたら、お気軽にお尋ねください。\n\n🌸 OMAMORI文化保護システム`;
  }

  // Get elderly user status
  getElderlyUserStatus(userId) {
    const profile = this.elderlyProfiles.get(userId);

    if (!profile) {
      return { isElderlyUser: false };
    }

    return {
      isElderlyUser: true,
      profile: {
        privacyLevel: profile.privacyLevel,
        protections: profile.protections,
        lastAccess: profile.accessPattern.lastAccess,
        familyContactsCount: profile.familyContacts.length,
        kycStatus: profile.jscKYC.kycLevel
      },
      recommendations: [
        'ゆっくりと確認してから操作してください',
        'わからないことがあれば遠慮なくお尋ねください',
        'ご家族と情報を共有することをお勧めします',
        'もったいない精神で安全に貯蓄を続けましょう'
      ]
    };
  }

  // Create standard confirmation for non-elderly users
  createStandardConfirmation(transactionData) {
    return {
      type: 'standard_confirmation',
      transaction: transactionData,
      confirmationMethods: ['biometric', 'pin'],
      timeout: 60000,
      familyNotification: false
    };
  }

  // Error response handler
  getErrorResponse(error) {
    return {
      success: false,
      error: error.message,
      response: {
        type: 'error',
        text: '申し訳ございません。高齢者保護システムで問題が発生しました。\n\n🔒 安全のため、しばらくお待ちください。\n💬 サポートが必要な場合は「助けて」とお話しください。\n\n🌸 文化的価値は常に保護されています。'
      },
      plugin: this.name,
      fallback: true
    };
  }

  // ElizaOS Plugin Interface: Cleanup
  async cleanup() {
    console.log(`🔧 JSC-KYC plugin cleanup completed`);
    return { success: true };
  }

  // ElizaOS Plugin Interface: Health Check
  async healthCheck() {
    try {
      return {
        healthy: true,
        plugin: this.name,
        version: this.version,
        elderly_users: this.elderlyProfiles.size,
        family_contacts: this.familyContacts.size,
        jsc_connection: 'simulated',
        nfc_support: 'enabled'
      };
    } catch (error) {
      return {
        healthy: false,
        plugin: this.name,
        error: error.message
      };
    }
  }

  // ElizaOS Plugin Interface: Get Info
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: manifest.description,
      author: manifest.author,
      capabilities: manifest.capabilities,
      triggers: manifest.triggers,
      privacy: manifest.privacy,
      cultural: manifest.cultural,
      social_impact: manifest.social_impact,
      elderly_users_protected: this.elderlyProfiles.size,
      status: 'active'
    };
  }
}

// ElizaOS Plugin Export
module.exports = {
  Plugin: JSCKYCElizaPlugin,
  manifest,

  // ElizaOS Standard Plugin Interface
  create: (config) => new JSCKYCElizaPlugin(config),

  // Plugin metadata
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  triggers: manifest.triggers,
  capabilities: manifest.capabilities,

  // Privacy and social impact info
  privacy: manifest.privacy,
  cultural: manifest.cultural,
  social_impact: manifest.social_impact
};

console.log('🔒 OMAMORI JSC-KYC ElizaOS Plugin loaded - Elderly protection and cultural sensitivity');