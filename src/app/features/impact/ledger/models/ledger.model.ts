export interface ImpactLedgerEntry {
  id: string;
  timestamp: string;
  ngo_name: string;
  project_name: string;
  amount: number;
  currency: string;
  impact_metric: string;
  impact_value: number;
  tx_hash?: string;
  status: 'confirmed' | 'pending';
}

export interface LedgerFilters {
  date_from?: string;
  date_to?: string;
  ngo_id?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

export interface ExportJobStatus {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  file_url?: string;
  error?: string;
}

export interface LedgerResponse {
  data: ImpactLedgerEntry[];
  total: number;
  page: number;
  limit: number;
}
