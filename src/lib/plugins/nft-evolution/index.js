// OMAMORI NFT Evolution ElizaOS Plugin
// Cultural Omamori NFT evolution with milestone tracking and family sharing
// ElizaOS Certified Plugin v1.0.0

const manifest = require('./manifest.json');

class NFTEvolutionElizaPlugin {
  constructor(config = {}) {
    this.name = manifest.name;
    this.version = manifest.version;
    this.config = { ...manifest.config, ...config };
    this.userCollections = new Map();
    this.familySharing = new Map();
    this.seasonalThemes = new Map();

    console.log(`🎨 ElizaOS Plugin: ${this.name} v${this.version} loaded`);
  }

  // ElizaOS Plugin Interface: Initialize
  async initialize(elizaOS) {
    this.elizaOS = elizaOS;
    console.log(`🎨 NFT Evolution plugin initialized for cultural preservation`);

    // Initialize seasonal themes
    this.initializeSeasonalThemes();

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

      console.log(`🎨 NFT Evolution trigger: ${trigger} for user ${userId}`);

      // Get user's NFT collection
      const collection = await this.getUserCollection(userId, userProfile);

      if (collection.nfts.length > 0) {
        const collectionResponse = this.createCollectionResponse(collection, userProfile);
        return {
          success: true,
          response: collectionResponse,
          plugin: this.name,
          collection_size: collection.nfts.length
        };
      } else {
        const noCollectionResponse = this.createNoCollectionResponse();
        return {
          success: true,
          response: noCollectionResponse,
          plugin: this.name,
          collection_size: 0
        };
      }

    } catch (error) {
      console.error(`❌ NFT Evolution plugin error:`, error);
      return this.getErrorResponse(error);
    }
  }

  // Initialize seasonal themes for cultural adaptation
  initializeSeasonalThemes() {
    const currentMonth = new Date().getMonth();
    const themes = {
      0: { season: '冬', theme: 'お正月', emoji: '🎍', cultural: '新年の始まり' },
      1: { season: '冬', theme: '節分', emoji: '👹', cultural: '邪気払い' },
      2: { season: '春', theme: '桜', emoji: '🌸', cultural: '新しい出会い' },
      3: { season: '春', theme: 'お花見', emoji: '🌺', cultural: '自然との調和' },
      4: { season: '春', theme: '端午の節句', emoji: '🎏', cultural: '健康と成長' },
      5: { season: '夏', theme: '梅雨', emoji: '☔', cultural: '静寂と成長' },
      6: { season: '夏', theme: '七夕', emoji: '🎋', cultural: '願い事' },
      7: { season: '夏', theme: 'お盆', emoji: '🏮', cultural: '先祖への感謝' },
      8: { season: '秋', theme: '月見', emoji: '🌕', cultural: '自然の美しさ' },
      9: { season: '秋', theme: '紅葉', emoji: '🍁', cultural: '変化の美学' },
      10: { season: '秋', theme: '収穫', emoji: '🌾', cultural: '実りの感謝' },
      11: { season: '冬', theme: '年末', emoji: '🎊', cultural: '一年の振り返り' }
    };

    this.currentSeason = themes[currentMonth];
    console.log(`🗓️ Current seasonal theme: ${this.currentSeason.theme} ${this.currentSeason.emoji}`);
  }

  // Get user's NFT collection
  async getUserCollection(userId, userProfile) {
    let collection = this.userCollections.get(userId);

    if (!collection) {
      // Create new collection based on user targets
      collection = await this.createUserCollection(userId, userProfile);
      this.userCollections.set(userId, collection);
    }

    // Update collection based on current progress
    return this.updateCollection(collection, userProfile);
  }

  // Create initial user collection
  async createUserCollection(userId, userProfile) {
    const targets = userProfile?.targets || [];

    const nfts = targets.map((target, index) => {
      const stage = this.determineStage(target.amount || 0);
      const stageInfo = manifest.nft_system.stages[stage];

      return {
        id: 1000 + index,
        userId,
        goal: target.goal || 'Cultural Preservation',
        stage: stage,
        emoji: stageInfo.emoji,
        description: stageInfo.description,
        cultural_significance: stageInfo.cultural_significance,
        amount_saved: target.amount || 0,
        created_at: target.createdAt || Date.now(),
        seasonal_theme: this.currentSeason.theme,
        family_shareable: true,
        metadata: {
          cultural_context: target.culturalContext || 'tradition',
          milestone_achieved: Date.now(),
          seasonal_adaptation: this.currentSeason
        }
      };
    });

    return {
      userId,
      nfts,
      total_value: targets.reduce((sum, t) => sum + (t.amount || 0), 0),
      cultural_score: this.calculateCulturalScore(nfts),
      family_sharing_enabled: false,
      created_at: Date.now()
    };
  }

  // Update collection based on current progress
  updateCollection(collection, userProfile) {
    const targets = userProfile?.targets || [];

    // Update existing NFTs
    collection.nfts = collection.nfts.map((nft, index) => {
      const target = targets[index];
      if (target) {
        const newStage = this.determineStage(target.amount || 0);
        const stageInfo = manifest.nft_system.stages[newStage];

        // Check if NFT evolved
        if (newStage !== nft.stage) {
          console.log(`🌸 NFT evolved: ${nft.goal} from ${nft.stage} to ${newStage}`);

          return {
            ...nft,
            stage: newStage,
            emoji: stageInfo.emoji,
            description: stageInfo.description,
            cultural_significance: stageInfo.cultural_significance,
            amount_saved: target.amount || 0,
            evolution_date: Date.now(),
            seasonal_theme: this.currentSeason.theme
          };
        }

        // Update amount without evolution
        return {
          ...nft,
          amount_saved: target.amount || 0,
          last_updated: Date.now()
        };
      }
      return nft;
    });

    // Add new NFTs for new targets
    if (targets.length > collection.nfts.length) {
      const newTargets = targets.slice(collection.nfts.length);
      const newNFTs = newTargets.map((target, index) => {
        const stage = this.determineStage(target.amount || 0);
        const stageInfo = manifest.nft_system.stages[stage];

        return {
          id: 1000 + collection.nfts.length + index,
          userId: collection.userId,
          goal: target.goal || 'Cultural Preservation',
          stage: stage,
          emoji: stageInfo.emoji,
          description: stageInfo.description,
          cultural_significance: stageInfo.cultural_significance,
          amount_saved: target.amount || 0,
          created_at: Date.now(),
          seasonal_theme: this.currentSeason.theme,
          family_shareable: true,
          metadata: {
            cultural_context: target.culturalContext || 'tradition',
            milestone_achieved: Date.now(),
            seasonal_adaptation: this.currentSeason
          }
        };
      });

      collection.nfts = [...collection.nfts, ...newNFTs];
    }

    // Update collection metadata
    collection.total_value = collection.nfts.reduce((sum, nft) => sum + nft.amount_saved, 0);
    collection.cultural_score = this.calculateCulturalScore(collection.nfts);
    collection.last_updated = Date.now();

    return collection;
  }

  // Determine NFT stage based on amount
  determineStage(amount) {
    if (amount >= 100000) return 'bloom';
    if (amount >= 50000) return 'flower';
    if (amount >= 10000) return 'sprout';
    if (amount > 0) return 'seed';
    return 'seed';
  }

  // Calculate cultural preservation score
  calculateCulturalScore(nfts) {
    let score = 0;
    const stageScores = { seed: 10, sprout: 25, flower: 50, bloom: 100, wisdom: 200 };

    nfts.forEach(nft => {
      score += stageScores[nft.stage] || 0;

      // Bonus for seasonal themes
      if (nft.seasonal_theme === this.currentSeason.theme) {
        score += 10;
      }

      // Bonus for cultural contexts
      if (nft.metadata?.cultural_context === 'tradition') {
        score += 15;
      }
    });

    return score;
  }

  // Create collection response message
  createCollectionResponse(collection, userProfile) {
    const { nfts, cultural_score, total_value } = collection;

    // Get the highest stage NFT for display
    const featuredNFT = nfts.reduce((highest, current) => {
      const stageOrder = ['seed', 'sprout', 'flower', 'bloom', 'wisdom'];
      return stageOrder.indexOf(current.stage) > stageOrder.indexOf(highest.stage) ? current : highest;
    }, nfts[0]);

    const response = {
      type: 'nft_collection',
      text: '🌸 あなたのお守りNFTコレクション',
      collection_summary: {
        total_nfts: nfts.length,
        highest_stage: featuredNFT.stage,
        cultural_score: cultural_score,
        total_value: `¥${total_value.toLocaleString()}`
      },
      featured_nft: {
        emoji: featuredNFT.emoji,
        goal: featuredNFT.goal,
        stage: featuredNFT.stage,
        cultural_significance: featuredNFT.cultural_significance,
        amount: `¥${featuredNFT.amount_saved.toLocaleString()}`
      },
      seasonal_message: `🗓️ ${this.currentSeason.season}の季節：${this.currentSeason.theme} ${this.currentSeason.emoji}`,
      cultural_message: `🏛️ 文化保護スコア: ${cultural_score}点\n${this.currentSeason.cultural}`,
      details: this.createCollectionDetails(nfts),
      actions: [
        {
          type: 'postback',
          label: '👥 家族共有設定',
          data: `action=setup_family_sharing&user=${collection.userId}`
        },
        {
          type: 'uri',
          label: '🎨 詳細コレクション',
          uri: `http://localhost:8000/collection.html?user=${collection.userId}`
        }
      ]
    };

    return response;
  }

  // Create detailed collection information
  createCollectionDetails(nfts) {
    return nfts.slice(0, 3).map(nft => ({
      id: nft.id,
      emoji: nft.emoji,
      goal: nft.goal,
      stage: nft.stage,
      amount: `¥${nft.amount_saved.toLocaleString()}`,
      cultural_significance: nft.cultural_significance,
      seasonal_theme: nft.seasonal_theme
    }));
  }

  // Create response for users with no NFTs
  createNoCollectionResponse() {
    return {
      type: 'no_nft_collection',
      text: 'まだお守りNFTがありません',
      message: '目標を設定して初回入金すると、\n文化的なお守りが作成されます！',
      guidance: {
        step1: '「Set target ¥10000 家族の記念日 30日」と送信',
        step2: '目標に向けて貯蓄を開始',
        step3: '初回入金でお守りNFTが誕生'
      },
      cultural_encouragement: `🌸 ${this.currentSeason.cultural}の季節です。\n新しい文化的価値の保護を始めましょう。`,
      seasonal_theme: this.currentSeason,
      actions: [
        {
          type: 'postback',
          label: '🎯 目標設定を始める',
          data: 'action=start_target_setting'
        },
        {
          type: 'uri',
          label: '📚 お守りについて学ぶ',
          uri: 'http://localhost:8000/omamori-guide.html'
        }
      ]
    };
  }

  // Setup family sharing
  async setupFamilySharing(userId, familyMembers) {
    const collection = this.userCollections.get(userId);
    if (!collection) return false;

    collection.family_sharing_enabled = true;
    collection.family_members = familyMembers;

    // Check if user achieved wisdom stage
    const hasWisdomStage = collection.nfts.some(nft =>
      nft.stage === 'wisdom' || collection.cultural_score >= 500
    );

    if (!hasWisdomStage && familyMembers.length > 0) {
      // Evolve one NFT to wisdom stage for family sharing
      const topNFT = collection.nfts.reduce((highest, current) =>
        current.cultural_score > (highest.cultural_score || 0) ? current : highest
      );

      topNFT.stage = 'wisdom';
      topNFT.emoji = '🏛️';
      topNFT.description = 'Generational wisdom keeper';
      topNFT.cultural_significance = '世代継承';
      topNFT.family_shared_at = Date.now();

      console.log(`🏛️ NFT evolved to wisdom stage for family sharing: ${topNFT.goal}`);
    }

    this.familySharing.set(userId, {
      enabled: true,
      members: familyMembers,
      shared_nfts: collection.nfts.filter(nft => nft.family_shareable),
      created_at: Date.now()
    });

    return true;
  }

  // Get family sharing status
  getFamilySharingStatus(userId) {
    const sharing = this.familySharing.get(userId);
    const collection = this.userCollections.get(userId);

    return {
      enabled: sharing?.enabled || false,
      members: sharing?.members || [],
      shared_nfts: sharing?.shared_nfts?.length || 0,
      cultural_score: collection?.cultural_score || 0,
      wisdom_keeper: collection?.nfts?.some(nft => nft.stage === 'wisdom') || false
    };
  }

  // Error response handler
  getErrorResponse(error) {
    return {
      success: false,
      error: error.message,
      response: {
        type: 'error',
        text: '申し訳ございません。お守りNFTシステムで問題が発生しました。\n\n🎨 文化的価値は常に保護されています。\n🌸 しばらく時間をおいてから再度お試しください。'
      },
      plugin: this.name,
      fallback: true
    };
  }

  // ElizaOS Plugin Interface: Cleanup
  async cleanup() {
    console.log(`🔧 NFT Evolution plugin cleanup completed`);
    return { success: true };
  }

  // ElizaOS Plugin Interface: Health Check
  async healthCheck() {
    try {
      return {
        healthy: true,
        plugin: this.name,
        version: this.version,
        user_collections: this.userCollections.size,
        family_sharing_active: this.familySharing.size,
        current_season: this.currentSeason.theme,
        nft_contract: this.config.nft_contract
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
      nft_system: manifest.nft_system,
      cultural: manifest.cultural,
      social_impact: manifest.social_impact,
      current_season: this.currentSeason,
      active_collections: this.userCollections.size,
      status: 'active'
    };
  }
}

// ElizaOS Plugin Export
module.exports = {
  Plugin: NFTEvolutionElizaPlugin,
  manifest,

  // ElizaOS Standard Plugin Interface
  create: (config) => new NFTEvolutionElizaPlugin(config),

  // Plugin metadata
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  triggers: manifest.triggers,
  capabilities: manifest.capabilities,

  // NFT system info
  nft_system: manifest.nft_system,
  cultural: manifest.cultural,
  social_impact: manifest.social_impact
};

console.log('🎨 OMAMORI NFT Evolution ElizaOS Plugin loaded - Cultural preservation through generational NFTs');