import React from 'react';
import { request, gql } from 'graphql-request';

// The Graph endpoint for JSC testnet
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  'https://api.thegraph.com/subgraphs/name/omamori/jsc-testnet';

// GraphQL queries
export const GET_USER_STATS = gql`
  query GetUserStats($address: String!) {
    user(id: $address) {
      id
      lineUserId
      displayName
      kycVerified
      totalDeposits
      depositCount
      currentMilestone
      hasOmamori
      zkProof
      familyGroup {
        id
        name
        totalSavings
        savingsGoal
        memberCount
      }
      deposits(orderBy: blockTimestamp, orderDirection: desc, first: 10) {
        id
        amount
        asset
        goal
        blockTimestamp
        transactionHash
      }
      assetBalances {
        asset
        balance
        depositCount
      }
      goals {
        goalName
        targetAmount
        currentAmount
        currency
        isCompleted
      }
      ownedInheritance {
        heir {
          id
        }
        isActive
        totalAmount
      }
    }
  }
`;

export const GET_FAMILY_GROUP = gql`
  query GetFamilyGroup($groupId: String!) {
    familyGroup(id: $groupId) {
      id
      name
      creator {
        id
        displayName
      }
      members {
        id
        displayName
        totalDeposits
        currentMilestone
      }
      totalSavings
      savingsGoal
      memberCount
      deposits(orderBy: blockTimestamp, orderDirection: desc, first: 20) {
        id
        user {
          id
          displayName
        }
        amount
        asset
        goal
        blockTimestamp
        transactionHash
      }
    }
  }
`;

export const GET_RECENT_DEPOSITS = gql`
  query GetRecentDeposits($first: Int = 10, $skip: Int = 0) {
    deposits(
      orderBy: blockTimestamp,
      orderDirection: desc,
      first: $first,
      skip: $skip
    ) {
      id
      user {
        id
        displayName
        currentMilestone
      }
      amount
      asset
      goal
      blockTimestamp
      transactionHash
      triggeredUpgrade
      familyGroup {
        id
        name
      }
    }
  }
`;

export const GET_INHERITANCE_INFO = gql`
  query GetInheritanceInfo($ownerAddress: String!) {
    inheritance(id: $ownerAddress) {
      id
      owner {
        id
        displayName
      }
      heir {
        id
        displayName
      }
      isActive
      activatedAt
      totalAmount
      designatedAt
      claims {
        id
        amount
        blockTimestamp
        transactionHash
      }
    }
  }
`;

export const GET_DAILY_STATS = gql`
  query GetDailyStats($days: Int = 30) {
    dailyStats(
      orderBy: date,
      orderDirection: desc,
      first: $days
    ) {
      id
      date
      totalUsers
      totalDeposits
      totalDepositCount
      newUsers
      activeUsers
      jpycDeposits
      usdcDeposits
      familyGroups
      familyDeposits
      newInheritances
      totalUpgrades
      usersAtMilestone0
      usersAtMilestone1
      usersAtMilestone2
      usersAtMilestone3
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($searchTerm: String!, $first: Int = 10) {
    users(
      where: {
        or: [
          { id_contains_nocase: $searchTerm }
          { displayName_contains_nocase: $searchTerm }
          { lineUserId_contains_nocase: $searchTerm }
        ]
      }
      first: $first
    ) {
      id
      displayName
      lineUserId
      totalDeposits
      currentMilestone
      kycVerified
      familyGroup {
        id
        name
      }
    }
  }
`;

export const GET_TOP_SAVERS = gql`
  query GetTopSavers($first: Int = 10) {
    users(
      orderBy: totalDeposits,
      orderDirection: desc,
      first: $first,
      where: { totalDeposits_gt: "0" }
    ) {
      id
      displayName
      totalDeposits
      currentMilestone
      depositCount
      hasOmamori
      familyGroup {
        id
        name
      }
    }
  }
`;

// GraphQL client service
export class GraphQLService {
  private endpoint: string;

  constructor(endpoint: string = SUBGRAPH_URL) {
    this.endpoint = endpoint;
  }

  async getUserStats(address: string) {
    try {
      const data = await request(this.endpoint, GET_USER_STATS, { address: address.toLowerCase() });
      return data.user;
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      return null;
    }
  }

  async getFamilyGroup(groupId: string) {
    try {
      const data = await request(this.endpoint, GET_FAMILY_GROUP, { groupId });
      return data.familyGroup;
    } catch (error) {
      console.error('Failed to fetch family group:', error);
      return null;
    }
  }

  async getRecentDeposits(limit: number = 10, skip: number = 0) {
    try {
      const data = await request(this.endpoint, GET_RECENT_DEPOSITS, {
        first: limit,
        skip
      });
      return data.deposits;
    } catch (error) {
      console.error('Failed to fetch recent deposits:', error);
      return [];
    }
  }

  async getInheritanceInfo(ownerAddress: string) {
    try {
      const data = await request(this.endpoint, GET_INHERITANCE_INFO, {
        ownerAddress: ownerAddress.toLowerCase()
      });
      return data.inheritance;
    } catch (error) {
      console.error('Failed to fetch inheritance info:', error);
      return null;
    }
  }

  async getDailyStats(days: number = 30) {
    try {
      const data = await request(this.endpoint, GET_DAILY_STATS, { days });
      return data.dailyStats;
    } catch (error) {
      console.error('Failed to fetch daily stats:', error);
      return [];
    }
  }

  async searchUsers(searchTerm: string, limit: number = 10) {
    try {
      const data = await request(this.endpoint, SEARCH_USERS, {
        searchTerm,
        first: limit
      });
      return data.users;
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  async getTopSavers(limit: number = 10) {
    try {
      const data = await request(this.endpoint, GET_TOP_SAVERS, { first: limit });
      return data.users;
    } catch (error) {
      console.error('Failed to fetch top savers:', error);
      return [];
    }
  }

  // Real-time subscription helpers (for WebSocket connections)
  async subscribeToUserDeposits(userAddress: string, callback: (deposit: any) => void) {
    // Implementation would use WebSocket subscriptions
    // For now, polling fallback
    const pollInterval = setInterval(async () => {
      const userStats = await this.getUserStats(userAddress);
      if (userStats?.deposits?.length > 0) {
        callback(userStats.deposits[0]);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }

  async subscribeToFamilyDeposits(familyGroupId: string, callback: (deposit: any) => void) {
    const pollInterval = setInterval(async () => {
      const familyGroup = await this.getFamilyGroup(familyGroupId);
      if (familyGroup?.deposits?.length > 0) {
        callback(familyGroup.deposits[0]);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }
}

// Global instance
export const graphQLService = new GraphQLService();

// React hooks for easier integration
export function useUserStats(address: string | undefined) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const userStats = await graphQLService.getUserStats(address);
        setData(userStats);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address]);

  return { data, loading, error };
}

// Types for TypeScript
export interface UserStats {
  id: string;
  lineUserId?: string;
  displayName?: string;
  kycVerified: boolean;
  totalDeposits: string;
  depositCount: number;
  currentMilestone: number;
  hasOmamori: boolean;
  zkProof?: string;
  familyGroup?: {
    id: string;
    name: string;
    totalSavings: string;
    savingsGoal: string;
    memberCount: number;
  };
  deposits: Array<{
    id: string;
    amount: string;
    asset: string;
    goal: string;
    blockTimestamp: string;
    transactionHash: string;
  }>;
  assetBalances: Array<{
    asset: string;
    balance: string;
    depositCount: number;
  }>;
  goals: Array<{
    goalName: string;
    targetAmount: string;
    currentAmount: string;
    currency: string;
    isCompleted: boolean;
  }>;
}