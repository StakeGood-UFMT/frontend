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
      positions: (id: string) => `/markets/${id}/positions`,
      results: (id: string) => `/markets/${id}/results`,
    },
    transactions: {
      base: '/transactions',
      buildPrediction: '/transactions/build-prediction',
      buildClaim: '/transactions/build-claim',
      submit: '/transactions/submit',
      status: (hash: string) => `/transactions/${hash}/status`,
    },
    users: {
      meActivity: '/users/me/activity',
      meClaims: '/users/me/claims',
      meSettings: '/users/me/settings',
      mePrivacy: '/users/me/privacy',
      me2faEnable: '/users/me/2fa/enable',
      me2faVerify: '/users/me/2fa/verify',
      meKycMockVerify: '/users/me/kyc/mock-verify',
      meComplianceExport: '/users/me/compliance-report/export',
      meWallets: '/users/me/wallets',
      meWalletRemove: (address: string) => `/users/me/wallets/${address}`,
    },
    proposals: {
      base: '/proposals',
    },
    ngoProposals: {
      base: '/ngo-proposals',
      mine: '/ngo-proposals/mine',
      buildApproval: (id: string) => `/ngo-proposals/${id}/build-approval`,
      moderate: (id: string) => `/ngo-proposals/${id}/moderate`,
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
    legal: {
      termsCurrent: '/legal/terms/current',
      faq: '/legal/faq',
    },
    admin: {
      base: '/admin',
      keeperBatchBump: '/admin/keeper/batch-bump-ttl',
      distributeImpact: (id: string) => `/admin/markets/${id}/distribute-impact`,
      resolveMarket: (id: string) => `/admin/markets/${id}/resolve`,
      cancelMarket: (id: string) => `/admin/markets/${id}/cancel`,
      setMarketStatus: (id: string) => `/admin/markets/${id}/status`,
      onChainMarket: (id: string) => `/admin/markets/${id}/onchain`,
    },
    anchor: {
      kycUrl: '/anchor/kyc/url',
      kycStatus: '/anchor/kyc/status',
      quotes: '/anchor/quotes',
      onramp: '/anchor/onramp',
      offramp: '/anchor/offramp',
      orders: '/anchor/orders',
      order: (id: string) => `/anchor/orders/${id}`,
      accounts: '/anchor/accounts',
      simulatePayment: '/anchor/sandbox/simulate-payment',
      sandboxAutoApproveKyc: '/anchor/sandbox/auto-approve-kyc',
    }
  }
};
