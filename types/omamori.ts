export interface UserGoal {
  amount: number;
  currency: 'JPYC' | 'USDC';
  deadline: Date;
  title: string;
}

export interface Plugin {
  name: string;
  execute: (input: any) => Promise<any>;
}

export interface PluginConfig {
  name: string;
  config: any;
}

export interface UserProfile {
  targets?: Array<{
    goal: string;
    amount: number;
    targetDate: string;
    dailyTarget: number;
  }>;
  elderlyProtection?: boolean;
  culturalWisdomOptIn?: boolean;
}

export interface AutonomousBehavior {
  trigger: any;
  cronJob: any;
  lastExecution: number | null;
  executionCount: number;
}

export interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
}

export interface MessageParseResult {
  command: 'save' | 'greeting' | 'help' | 'unknown';
  amount?: string;
}

export interface SeasonalContext {
  season: string;
  emoji: string;
  cultural_wisdom: string;
}