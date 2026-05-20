export interface ActivityItem {
  id: string;
  type: 'kyc' | 'gateway' | 'stake';
  title: string;
  description: string;
  status: string;
  date: string;
  metadata?: {
    marketId?: string;
    marketTitle?: string;
    amount?: number;
    outcome?: 'YES' | 'NO';
    txHash?: string;
    payoutAmount?: number;
    status?: string;
  };
}
