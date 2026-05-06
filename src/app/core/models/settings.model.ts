export interface UserSettings {
  publicVisibility: boolean;
  privateMode: boolean;
  twoFactorEnabled: boolean;
  monthlyLimit: number;
  monthlyConsumed: number;
  kycStatus: 'pending' | 'verified' | 'rejected' | 'expired' | string;
  wallets: LinkedWallet[];
}

export interface LinkedWallet {
  id: string;
  address: string;
  label?: string;
  isPrimary: boolean;
  linkedAt: string;
}

export interface PrivacyPayload {
  publicVisibility: boolean;
  privateMode: boolean;
}

export interface TwoFactorEnableResponse {
  qrCodeUrl: string;
  secret: string;
}

export interface TwoFactorVerifyPayload {
  code: string;
}

export interface ComplianceExportResponse {
  url?: string;
  blob?: Blob;
}
