import { Injectable, signal, effect, inject } from '@angular/core';

export interface PendingTx {
  txHash?: string;
  marketId: string;
  outcome: string;
  amount: number;
  type: 'STAKE';
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class PendingTxStore {
  private readonly STORAGE_KEY = 'stakegood_pending_tx';
  private pendingTxs = signal<PendingTx[]>([]);
  public readonly pendingTxs$ = this.pendingTxs.asReadonly();

  constructor() {
    this.loadFromStorage();
    
    // Auto-sync to localStorage
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.pendingTxs()));
    });
  }

  addPending(tx: Omit<PendingTx, 'status' | 'timestamp'>) {
    this.pendingTxs.update(prev => [
      ...prev,
      { ...tx, status: 'pending', timestamp: Date.now() }
    ]);
  }

  updateStatus(txHash: string, status: PendingTx['status']) {
    this.pendingTxs.update(prev =>
      prev.map(tx => tx.txHash === txHash ? { ...tx, status } : tx)
    );
  }

  removeTx(txHash: string) {
    this.pendingTxs.update(prev => prev.filter(tx => tx.txHash !== txHash));
  }

  clearAll() {
    this.pendingTxs.set([]);
  }

  private loadFromStorage() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.pendingTxs.set(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse pending txs from storage', e);
        this.pendingTxs.set([]);
      }
    }
  }
}
