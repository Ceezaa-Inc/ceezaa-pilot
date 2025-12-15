/**
 * Plaid service for bank account linking and transaction fetching
 */

import { api } from './api';

// Types
export interface LinkTokenResponse {
  link_token: string;
  expiration: string;
}

export interface LinkedAccount {
  id: string;
  user_id: string;
  institution_id: string | null;
  institution_name: string | null;
  plaid_item_id: string;
  last_synced_at: string | null;
  created_at: string;
}

export interface ExchangeTokenResponse {
  account_id: string;
  institution_name: string;
  last_synced: string | null;
}

export interface Transaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name: string | null;
  category: string[] | null;
  pending: boolean;
}

export interface SyncResponse {
  added: Transaction[];
  modified: Transaction[];
  removed: string[];
  has_more: boolean;
}

// API calls
export const plaidService = {
  /**
   * Create a Plaid Link token for the user
   */
  createLinkToken: async (userId: string): Promise<LinkTokenResponse> => {
    return api.post<LinkTokenResponse>('/api/plaid/create-link-token', {
      user_id: userId,
    });
  },

  /**
   * Exchange a public token for an access token and store the linked account
   */
  exchangeToken: async (
    publicToken: string,
    userId: string,
    institutionId?: string,
    institutionName?: string
  ): Promise<ExchangeTokenResponse> => {
    return api.post<ExchangeTokenResponse>('/api/plaid/exchange-token', {
      public_token: publicToken,
      user_id: userId,
      institution_id: institutionId,
      institution_name: institutionName,
    });
  },

  /**
   * Sync transactions for a linked account
   */
  syncTransactions: async (accountId: string): Promise<SyncResponse> => {
    return api.post<SyncResponse>('/api/plaid/sync', {
      account_id: accountId,
    });
  },

  /**
   * Delete a linked account
   */
  deleteAccount: async (accountId: string): Promise<void> => {
    await api.delete(`/api/plaid/accounts/${accountId}`);
  },

  /**
   * Get all linked accounts for a user
   */
  getLinkedAccounts: async (userId: string): Promise<LinkedAccount[]> => {
    return api.get<LinkedAccount[]>(`/api/plaid/accounts?user_id=${userId}`);
  },
};
