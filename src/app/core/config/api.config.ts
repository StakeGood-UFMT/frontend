import { environment } from '../../../environments/environment';

/**
 * Centralized API configuration.
 * Ensures all services use the same base URL and versioning.
 */
export const API_CONFIG = {
  /**
   * Complete API URL (baseURL + /api/ + version)
   * Example: https://api.stakegood.org/api/v1
   */
  baseUrl: `${environment.apiBaseUrl}/api/${environment.apiVersion}`,

  /**
   * Endpoints relative to the baseUrl
   */
  endpoints: {
    auth: {
      base: '/auth',
      nonce: '/auth/nonce',
      verify: '/auth/verify',
      refresh: '/auth/refresh',
    },
    markets: {
      base: '/markets',
      detail: (id: string) => `/markets/${id}`,
      history: (id: string) => `/markets/${id}/history`,
    },
    transactions: {
      base: '/transactions',
      buildPrediction: '/transactions/build-prediction',
      buildClaim: '/transactions/build-claim',
      submit: '/transactions/submit',
      status: (hash: string) => `/transactions/${hash}/status`,
    },
    users: {
      meClaims: '/users/me/claims',
    },
    proposals: {
      base: '/proposals',
    },
    governance: {
      organizations: '/governance/organizations',
    },
    voting: {
      buildVote: '/transactions/build-vote',
    },
    notifications: {
      base: '/notifications',
      markAllRead: '/notifications/mark-all-read',
      read: (id: string) => `/notifications/${id}/read`,
    },
    ngos: {
      base: '/ngos',
      detail: (id: string) => `/ngos/${id}`,
      timeline: (id: string) => `/ngos/${id}/timeline`,
    },
    admin: {
      base: '/admin',
      keeperBatchBump: '/admin/keeper/batch-bump-ttl',
      distributeImpact: (id: string) => `/admin/markets/${id}/distribute-impact`,
    }
  }
};
