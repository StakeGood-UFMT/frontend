import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class AnchorService {
  private http = inject(HttpClient);

  getKycUrl() {
    return this.http.get<{ url: string }>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.anchor.kycUrl}`,
    );
  }

  getKycStatus() {
    return this.http.get<{ status: string; localKycStatus: string }>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.anchor.kycStatus}`,
    );
  }

  createQuote(payload: {
    fromCurrency: string;
    toCurrency: string;
    amount: string;
  }) {
    return this.http.post<any>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.anchor.quotes}`,
      payload,
    );
  }

  createOnRamp(payload: {
    quoteId: string;
    amount: string;
    fromCurrency: string;
    toCurrency: string;
  }) {
    return this.http.post<any>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.anchor.onramp}`,
      payload,
    );
  }

  createOffRamp(payload: {
    quoteId: string;
    amount: string;
    fromCurrency: string;
    toCurrency: string;
    fiatAccountId: string;
  }) {
    return this.http.post<any>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.anchor.offramp}`,
      payload,
    );
  }

  getOrderStatus(id: string) {
    return this.http.get<any>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.anchor.order(id)}`,
    );
  }

  getUserOrders() {
    return this.http.get<any[]>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.anchor.orders}`,
    );
  }

  getFiatAccounts() {
    return this.http.get<any[]>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.anchor.accounts}`,
    );
  }

  simulatePayment(orderId: string) {
    return this.http.post<any>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.anchor.simulatePayment}`,
      { orderId },
    );
  }
}
