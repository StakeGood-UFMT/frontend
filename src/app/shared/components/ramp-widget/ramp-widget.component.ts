import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as AnchorActions from '../../../core/store/anchor/anchor.actions';
import * as AnchorSelectors from '../../../core/store/anchor/anchor.selectors';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { WalletService } from '../../../core/services/wallet.service';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';

@Component({
  selector: 'app-ramp-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ramp-widget-container">
      <div class="widget-header">
        <h2 class="widget-title">Fiat ↔ Crypto Gateway</h2>
        <p class="widget-subtitle">Powered by Etherfuse Anchor</p>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-container">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'kyc'"
          (click)="setActiveTab('kyc')"
        >
          <span class="tab-icon">🛡️</span> KYC
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'onramp'"
          (click)="setActiveTab('onramp')"
        >
          <span class="tab-icon">📥</span> On-Ramp (Deposit)
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'offramp'"
          (click)="setActiveTab('offramp')"
        >
          <span class="tab-icon">📤</span> Off-Ramp (Withdraw)
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'sandbox'"
          (click)="setActiveTab('sandbox')"
        >
          <span class="tab-icon">🧪</span> Sandbox
        </button>
      </div>

      <!-- Error / Loading Indicators -->
      <div *ngIf="loading$ | async" class="loading-bar">
        <div class="indeterminate-bar"></div>
      </div>
      <div *ngIf="error$ | async as error" class="error-banner">
        <div>⚠️ {{ error }}</div>
        <div *ngIf="error.includes('trustline')" class="trustline-action">
          <button class="action-btn" [disabled]="isAddingTrustline()" (click)="addTrustline()">
            {{ isAddingTrustline() ? 'Adding Trustline...' : '➕ Add Trustline for ' + onRampCrypto }}
          </button>
        </div>
        <div *ngIf="error.includes('Terms and conditions') || error.includes('agreement')" class="agreement-action">
          <p class="error-subtext">Etherfuse requires you to review and accept the legal agreements before creating an order.</p>
          <button class="action-btn" (click)="setActiveTab('kyc'); loadKycUrl()">
            📋 Open Onboarding Portal to Accept Agreements
          </button>
        </div>
      </div>

      <!-- TAB 1: KYC Onboarding -->
      <div *ngIf="activeTab() === 'kyc'" class="tab-content">
        <div class="status-card">
          <div class="status-header">
            <h3>Verification Status</h3>
            <span
              class="status-badge"
              [class.approved]="(kycStatus$ | async) === 'approved'"
              [class.pending]="(kycStatus$ | async) === 'pending'"
            >
              {{ (kycStatus$ | async) || 'Not Started' }}
            </span>
          </div>
          <p class="status-desc">
            To comply with local regulations, please complete identity verification before ramping funds.
          </p>
          <div class="btn-group">
            <button class="primary-btn" (click)="loadKycUrl()">
              Get Onboarding Link
            </button>
            <button class="secondary-btn" (click)="checkKycStatus()">
              Check Status
            </button>
            <button class="secondary-btn" (click)="sandboxAutoApproveKyc()" title="Bypasses manual review in Etherfuse Sandbox">
              ⚡ Auto-Approve (Sandbox)
            </button>
          </div>
        </div>

        <div *ngIf="safeKycUrl$ | async as safeKycUrl" class="iframe-container">
          <h4 class="iframe-title">Anchor Onboarding Portal</h4>
          <iframe [src]="safeKycUrl" class="kyc-iframe"></iframe>
        </div>
      </div>

      <!-- TAB 2: On-Ramp -->
      <div *ngIf="activeTab() === 'onramp'" class="tab-content">
        <div class="form-card">
          <h3>Create Deposit Order</h3>
          <div class="form-group">
            <label>You Send (Fiat)</label>
            <div class="input-with-select">
              <input type="number" [(ngModel)]="onRampAmount" placeholder="1000" />
              <select [(ngModel)]="onRampFiat">
                <option value="MXN">MXN</option>
                <option value="BRL">BRL</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>You Receive (Crypto Asset)</label>
            <div class="input-with-select">
              <input
                type="text"
                disabled
                [value]="
                  (currentQuote$ | async)?.toAmount || 'Calculated after quote'
                "
              />
              <select [(ngModel)]="onRampCrypto">
                <option value="CETES">CETES</option>
                <option value="TESOURO">TESOURO</option>
              </select>
            </div>
          </div>

          <div *ngIf="currentQuote$ | async as quote" class="quote-summary">
            <div class="summary-row">
              <span>Exchange Rate</span>
              <span>1 {{ quote.fromCurrency }} = {{ quote.exchangeRate }} {{ quote.toCurrency }}</span>
            </div>
            <div class="summary-row">
              <span>Estimated Fee</span>
              <span>{{ quote.fee }} {{ quote.fromCurrency }}</span>
            </div>
          </div>

          <div class="btn-group">
            <button class="secondary-btn" (click)="getOnRampQuote()">
              Get Quote
            </button>
            <button
              class="primary-btn"
              [disabled]="!(currentQuote$ | async)"
              (click)="startOnRamp()"
            >
              Confirm & Deposit
            </button>
          </div>
        </div>

        <!-- Payment Instructions -->
        <div *ngIf="currentOrder$ | async as order" class="payment-card">
          <h3>Payment Instructions</h3>
          <p class="payment-desc">
            Please transfer the exact amount using the details below:
          </p>
          <div class="instruction-grid" *ngIf="order.paymentInstructions as pi">
            <div class="instruction-item">
              <label>Amount</label>
              <span>{{ pi.amount }} {{ pi.currency }}</span>
            </div>
            <div class="instruction-item" *ngIf="pi.clabe">
              <label>CLABE (SPEI)</label>
              <span>{{ pi.clabe }}</span>
            </div>
            <div class="instruction-item" *ngIf="pi.pixCode">
              <label>PIX Code</label>
              <span class="pix-code">{{ pi.pixCode }}</span>
            </div>
            <div class="instruction-item" *ngIf="pi.beneficiary">
              <label>Beneficiary</label>
              <span>{{ pi.beneficiary }}</span>
            </div>
          </div>

          <div class="order-status-footer">
            <span class="status-indicator" [class]="order.status"></span>
            <span>Order Status: <strong>{{ order.status }}</strong></span>
            <span class="order-id-display" *ngIf="order.orderId || order.id">ID: {{ order.orderId || order.id }}</span>
          </div>
          <div class="sandbox-quick-action" *ngIf="order.status === 'pending' || order.status === 'processing'">
            <button class="secondary-btn" [disabled]="isSimulating()" (click)="quickSimulate(order.orderId || order.id)">
              {{ isSimulating() ? '⏳ Simulating Bank Transfer...' : '🧪 Simulate Bank Transfer (Sandbox)' }}
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 3: Off-Ramp -->
      <div *ngIf="activeTab() === 'offramp'" class="tab-content">
        <div class="form-card">
          <h3>Create Withdrawal Order</h3>
          <div class="form-group">
            <label>You Send (Crypto Asset)</label>
            <div class="input-with-select">
              <input type="number" [(ngModel)]="offRampAmount" placeholder="100" />
              <select [(ngModel)]="offRampCrypto">
                <option value="CETES">CETES</option>
                <option value="TESOURO">TESOURO</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>You Receive (Fiat)</label>
            <div class="input-with-select">
              <input
                type="text"
                disabled
                [value]="
                  (currentQuote$ | async)?.toAmount || 'Calculated after quote'
                "
              />
              <select [(ngModel)]="offRampFiat">
                <option value="MXN">MXN</option>
                <option value="BRL">BRL</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Destination Bank Account</label>
            <select [(ngModel)]="selectedFiatAccount">
              <option value="">-- Select Saved Account --</option>
              <option
                *ngFor="let acc of fiatAccounts$ | async"
                [value]="acc.id"
              >
                {{ acc.type }}: {{ acc.accountNumber }} ({{ acc.accountHolderName }})
              </option>
            </select>
          </div>

          <div *ngIf="currentQuote$ | async as quote" class="quote-summary">
            <div class="summary-row">
              <span>Exchange Rate</span>
              <span>1 {{ quote.fromCurrency }} = {{ quote.exchangeRate }} {{ quote.toCurrency }}</span>
            </div>
            <div class="summary-row">
              <span>Estimated Fee</span>
              <span>{{ quote.fee }} {{ quote.toCurrency }}</span>
            </div>
          </div>

          <div class="btn-group">
            <button class="secondary-btn" (click)="getOffRampQuote()">
              Get Quote
            </button>
            <button
              class="primary-btn"
              [disabled]="!(currentQuote$ | async)"
              (click)="startOffRamp()"
            >
              Confirm Withdrawal
            </button>
          </div>
        </div>

        <!-- Signing & Order Status -->
        <div *ngIf="currentOrder$ | async as order" class="signing-card">
          <h3>Withdrawal Status</h3>
          <div class="order-status-footer">
            <span class="status-indicator" [class]="order.status"></span>
            <span>Order Status: <strong>{{ order.status }}</strong></span>
          </div>

          <div *ngIf="order.signableTxXdr" class="sign-action-box">
            <p>Your withdrawal transaction is ready to be signed and broadcast.</p>
            <button class="action-btn" (click)="signOffRamp(order.signableTxXdr)">
              Sign & Submit Withdrawal
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 4: Sandbox -->
      <div *ngIf="activeTab() === 'sandbox'" class="tab-content">
        <div class="form-card">
          <h3>Sandbox Simulation Tools</h3>
          <p class="sandbox-desc">
            Use these controls to simulate bank transfers in development environments.
          </p>
          <div class="form-group">
            <label>Order ID</label>
            <input type="text" [(ngModel)]="sandboxOrderId" placeholder="UUID of pending OnRamp order" />
          </div>
          <button class="primary-btn" (click)="simulateFiatReceipt()">
            Simulate Fiat Received
          </button>
        </div>
      </div>

      <!-- Past & Pending Orders Section -->
      <div class="orders-history-section" *ngIf="(userOrders$ | async)?.length">
        <h3 class="section-title">Recent Transactions</h3>
        <div class="orders-list">
          <div class="order-item" *ngFor="let order of userOrders$ | async">
            <div class="order-icon" [class]="order.type === 'ON_RAMP' ? 'deposit' : 'withdraw'">
              {{ order.type === 'ON_RAMP' ? '📥' : '📤' }}
            </div>
            <div class="order-details">
              <span class="order-type">{{ order.type === 'ON_RAMP' ? 'Deposit' : 'Withdrawal' }}</span>
              <span class="order-date">{{ order.createdAt | date:'short' }}</span>
              <span class="order-id" *ngIf="order.orderId">ID: {{ order.orderId }}</span>
            </div>
            <div class="order-amounts">
              <span class="amount-primary">{{ order.fromAmount }} {{ order.fromCurrency }} ➔ {{ order.toAmount }} {{ order.toCurrency }}</span>
              <span class="order-status-pill" [class]="order.status">{{ order.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .ramp-widget-container {
        background: #111815;
        border: 1px solid rgba(17, 212, 138, 0.15);
        border-radius: 24px;
        padding: 28px;
        color: #f1f5f2;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(17, 212, 138, 0.1);
        font-family: 'Inter', sans-serif;
        max-width: 600px;
        margin: 0 auto;
      }

      .widget-header {
        margin-bottom: 24px;
        text-align: center;
      }

      .widget-title {
        font-size: 1.75rem;
        font-weight: 800;
        margin: 0;
        background: linear-gradient(135deg, #11d48a 0%, #0bb574 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .widget-subtitle {
        font-size: 0.9rem;
        color: #9ca3af;
        margin: 4px 0 0;
      }

      .tabs-container {
        display: flex;
        background: #0d1f17;
        padding: 6px;
        border-radius: 16px;
        margin-bottom: 24px;
        gap: 6px;
      }

      .tab-btn {
        flex: 1;
        background: transparent;
        border: none;
        color: #9ca3af;
        padding: 10px 14px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .tab-btn.active {
        background: #11d48a;
        color: #111815;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(17, 212, 138, 0.2);
      }

      .tab-btn:hover:not(.active) {
        color: #f1f5f2;
        background: rgba(255, 255, 255, 0.05);
      }

      .loading-bar {
        width: 100%;
        height: 4px;
        background: rgba(17, 212, 138, 0.1);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 20px;
      }

      .indeterminate-bar {
        width: 40%;
        height: 100%;
        background: #11d48a;
        animation: loading 1.5s infinite ease-in-out;
      }

      @keyframes loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(300%); }
      }

      .error-banner {
        background: #fef2f2;
        color: #cc5a37;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 20px;
        border-left: 4px solid #cc5a37;
      }

      .trustline-action, .agreement-action {
        margin-top: 12px;
      }

      .error-subtext {
        margin: 4px 0 12px;
        color: #b91c1c;
        font-size: 0.8rem;
        font-weight: 500;
      }

      .tab-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .status-card,
      .form-card,
      .payment-card,
      .signing-card {
        background: #162820;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 24px;
      }

      .status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .status-header h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #f1f5f2;
      }

      .status-badge {
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        background: rgba(255, 255, 255, 0.1);
        color: #9ca3af;
      }

      .status-badge.approved {
        background: rgba(17, 212, 138, 0.15);
        color: #11d48a;
      }

      .status-badge.pending {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
      }

      .status-desc,
      .payment-desc,
      .sandbox-desc {
        color: #9ca3af;
        font-size: 0.9rem;
        line-height: 1.5;
        margin: 0 0 20px;
      }

      .btn-group {
        display: flex;
        gap: 12px;
      }

      .primary-btn,
      .secondary-btn,
      .action-btn {
        flex: 1;
        padding: 14px 20px;
        border-radius: 16px;
        font-weight: 700;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.3s ease;
        border: none;
      }

      .primary-btn {
        background: linear-gradient(135deg, #11d48a 0%, #0bb574 100%);
        color: #111815;
        box-shadow: 0 4px 12px rgba(17, 212, 138, 0.2);
      }

      .primary-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(17, 212, 138, 0.3);
      }

      .primary-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .secondary-btn {
        background: rgba(255, 255, 255, 0.08);
        color: #f1f5f2;
      }

      .secondary-btn:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      .action-btn {
        background: #11d48a;
        color: #111815;
        width: 100%;
      }

      .iframe-container {
        border: 1px solid rgba(17, 212, 138, 0.2);
        border-radius: 20px;
        overflow: hidden;
        background: #0d1f17;
      }

      .iframe-title {
        padding: 14px 20px;
        margin: 0;
        background: #162820;
        font-size: 0.95rem;
        color: #f1f5f2;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .kyc-iframe {
        width: 100%;
        height: 600px;
        border: none;
        display: block;
      }

      .form-card h3,
      .payment-card h3,
      .signing-card h3 {
        margin: 0 0 20px;
        font-size: 1.25rem;
        color: #f1f5f2;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        font-size: 0.85rem;
        font-weight: 600;
        color: #9ca3af;
        margin-bottom: 8px;
      }

      .input-with-select {
        display: flex;
        background: #0d1f17;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        overflow: hidden;
      }

      .input-with-select input {
        flex: 1;
        background: transparent;
        border: none;
        padding: 14px 16px;
        color: #f1f5f2;
        font-size: 1rem;
        outline: none;
      }

      .input-with-select select {
        background: #1a2e26;
        color: #11d48a;
        border: none;
        padding: 0 20px;
        font-weight: 700;
        font-size: 0.95rem;
        cursor: pointer;
        outline: none;
      }

      select {
        width: 100%;
        background: #0d1f17;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 14px 16px;
        color: #f1f5f2;
        font-size: 1rem;
        outline: none;
        cursor: pointer;
      }

      .quote-summary {
        background: #0d1f17;
        border-radius: 16px;
        padding: 16px;
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
      }

      .summary-row span:first-child {
        color: #9ca3af;
      }

      .summary-row span:last-child {
        font-weight: 700;
        color: #11d48a;
      }

      .instruction-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        background: #0d1f17;
        padding: 20px;
        border-radius: 16px;
        margin-bottom: 20px;
      }

      .instruction-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .instruction-item label {
        font-size: 0.75rem;
        color: #9ca3af;
        text-transform: uppercase;
      }

      .instruction-item span {
        font-size: 1rem;
        font-weight: 700;
        color: #f1f5f2;
      }

      .pix-code {
        word-break: break-all;
        font-family: monospace;
        background: #111815;
        padding: 8px;
        border-radius: 8px;
        border: 1px solid rgba(17, 212, 138, 0.2);
        color: #11d48a !important;
      }

      .order-status-footer {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
        color: #f1f5f2;
        flex-wrap: wrap;
      }

      .order-id-display {
        margin-left: auto;
        font-family: monospace;
        color: #9ca3af;
        background: #111815;
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.1);
      }

      .sandbox-quick-action {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid rgba(255,255,255,0.1);
      }


      .status-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #9ca3af;
      }

      .status-indicator.pending,
      .status-indicator.processing {
        background: #f59e0b;
        box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
      }

      .status-indicator.completed {
        background: #11d48a;
        box-shadow: 0 0 10px rgba(17, 212, 138, 0.5);
      }

      .sign-action-box {
        margin-top: 20px;
        background: rgba(17, 212, 138, 0.08);
        border: 1px solid rgba(17, 212, 138, 0.2);
        padding: 20px;
        border-radius: 16px;
        text-align: center;
      }

      .sign-action-box p {
        margin: 0 0 16px;
        color: #f1f5f2;
        font-size: 0.95rem;
      }

      .orders-history-section {
        margin-top: 32px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 24px;
      }

      .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #f1f5f2;
        margin: 0 0 16px;
      }

      .orders-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .order-item {
        background: #162820;
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .order-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }

      .order-icon.deposit {
        background: rgba(17, 212, 138, 0.15);
      }

      .order-icon.withdraw {
        background: rgba(245, 158, 11, 0.15);
      }

      .order-details {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      .order-type {
        font-weight: 700;
        font-size: 1rem;
        color: #f1f5f2;
      }

      .order-date {
        font-size: 0.8rem;
        color: #9ca3af;
      }

      .order-id {
        font-size: 0.75rem;
        color: #6b7280;
        font-family: monospace;
      }

      .order-amounts {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
      }

      .amount-primary {
        font-weight: 700;
        font-size: 0.95rem;
        color: #11d48a;
      }

      .order-status-pill {
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        background: rgba(255, 255, 255, 0.1);
        color: #9ca3af;
      }

      .order-status-pill.completed {
        background: rgba(17, 212, 138, 0.15);
        color: #11d48a;
      }

      .order-status-pill.pending,
      .order-status-pill.processing {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
      }
    `,
  ],
})
export class RampWidgetComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);
  private walletService = inject(WalletService);

  activeTab = signal<'kyc' | 'onramp' | 'offramp' | 'sandbox'>('kyc');
  isAddingTrustline = signal<boolean>(false);
  isSimulating = signal<boolean>(false);

  // Observables from Store
  safeKycUrl$ = this.store.select(AnchorSelectors.selectKycUrl).pipe(
    map((url) => (url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null)),
  );
  kycStatus$ = this.store.select(AnchorSelectors.selectKycStatus);
  localKycStatus$ = this.store.select(AnchorSelectors.selectLocalKycStatus);
  currentQuote$ = this.store.select(AnchorSelectors.selectCurrentQuote);
  currentOrder$ = this.store.select(AnchorSelectors.selectCurrentOrder);
  userOrders$ = this.store.select(AnchorSelectors.selectUserOrders);
  fiatAccounts$ = this.store.select(AnchorSelectors.selectFiatAccounts);
  loading$ = this.store.select(AnchorSelectors.selectAnchorLoading);
  error$ = this.store.select(AnchorSelectors.selectAnchorError);

  // Form Models
  onRampAmount = 1000;
  onRampFiat = 'MXN';
  onRampCrypto = 'CETES';

  offRampAmount = 100;
  offRampCrypto = 'CETES';
  offRampFiat = 'MXN';
  selectedFiatAccount = '';

  sandboxOrderId = '';

  private pollingInterval: any;

  ngOnInit() {
    this.store.dispatch(AnchorActions.loadFiatAccounts());
    this.store.dispatch(AnchorActions.loadKycStatus());
    this.store.dispatch(AnchorActions.loadUserOrders());
    this.startPolling();
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  setActiveTab(tab: 'kyc' | 'onramp' | 'offramp' | 'sandbox') {
    this.activeTab.set(tab);
  }

  sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  loadKycUrl() {
    this.store.dispatch(AnchorActions.loadKycUrl({ currency: this.onRampFiat }));
  }

  checkKycStatus() {
    this.store.dispatch(AnchorActions.loadKycStatus());
  }

  sandboxAutoApproveKyc() {
    this.store.dispatch(AnchorActions.sandboxAutoApproveKyc());
  }

  getOnRampQuote() {
    this.store.dispatch(
      AnchorActions.createQuote({
        fromCurrency: this.onRampFiat,
        toCurrency: this.onRampCrypto,
        amount: String(this.onRampAmount),
      }),
    );
  }

  startOnRamp() {
    let quoteId = '';
    this.currentQuote$.subscribe((q) => {
      if (q) quoteId = q.quoteId || q.id;
    }).unsubscribe();

    if (quoteId) {
      this.store.dispatch(
        AnchorActions.createOnRamp({
          quoteId,
          amount: String(this.onRampAmount),
          fromCurrency: this.onRampFiat,
          toCurrency: this.onRampCrypto,
        }),
      );
    }
  }

  getOffRampQuote() {
    this.store.dispatch(
      AnchorActions.createQuote({
        fromCurrency: this.offRampCrypto,
        toCurrency: this.offRampFiat,
        amount: String(this.offRampAmount),
      }),
    );
  }

  startOffRamp() {
    if (!this.selectedFiatAccount) {
      alert('Please select a destination bank account');
      return;
    }

    let quoteId = '';
    this.currentQuote$.subscribe((q) => {
      if (q) quoteId = q.quoteId || q.id;
    }).unsubscribe();

    if (quoteId) {
      this.store.dispatch(
        AnchorActions.createOffRamp({
          quoteId,
          amount: String(this.offRampAmount),
          fromCurrency: this.offRampCrypto,
          toCurrency: this.offRampFiat,
          fiatAccountId: this.selectedFiatAccount,
        }),
      );
    }
  }

  signOffRamp(xdr: string) {
    this.store.dispatch(AnchorActions.signOffRampXdr({ xdr }));
  }

  simulateFiatReceipt() {
    if (!this.sandboxOrderId) {
      alert('Please enter an Order ID');
      return;
    }
    this.store.dispatch(
      AnchorActions.simulatePayment({ orderId: this.sandboxOrderId }),
    );
  }

  private startPolling() {
    this.pollingInterval = setInterval(() => {
      this.currentOrder$.subscribe((order) => {
        if (order && (order.status === 'pending' || order.status === 'processing')) {
          this.store.dispatch(
            AnchorActions.pollOrderStatus({ orderId: order.orderId || order.id }),
          );
        }
      }).unsubscribe();
    }, 5000);
  }

  async addTrustline() {
    try {
      this.isAddingTrustline.set(true);
      const { xdr } = await firstValueFrom(
        this.http.post<{ xdr: string }>(`${API_CONFIG.baseUrl}/anchor/trustline`, {
          assetCode: this.onRampCrypto,
          assetIssuer: 'GC3CW7EDYRTWQ635VDIGY6S4ZUF5L6TQ7AA4MWS7LEQDBLUSZXV7UPS4'
        })
      );
      const { signedTxXdr } = await this.walletService.signTransaction(xdr);
      await firstValueFrom(
        this.http.post(`${API_CONFIG.baseUrl}/transactions/submit`, {
          signedXdr: signedTxXdr
        })
      );
      alert('Trustline added successfully! You can now confirm your deposit order.');
      this.store.dispatch(AnchorActions.createQuoteSuccess({ quote: null }));
    } catch (err: any) {
      console.error('Failed to add trustline:', err);
      alert('Failed to add trustline: ' + (err?.error?.message || err?.message || err));
    } finally {
      this.isAddingTrustline.set(false);
    }
  }

  quickSimulate(orderId: string) {
    if (!orderId) return;
    this.sandboxOrderId = orderId;
    this.isSimulating.set(true);
    this.store.dispatch(AnchorActions.simulatePayment({ orderId }));
    setTimeout(() => {
      this.isSimulating.set(false);
      alert('Sandbox simulation signal sent! Etherfuse is processing the payment.');
    }, 1500);
  }
}
