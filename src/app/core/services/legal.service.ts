import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface TermsVersion {
  version: string;
  updatedAt: string;
  content: string;
  sections: Array<{
    id: string;
    title: string;
    body: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class LegalService {
  private http = inject(HttpClient);
  private readonly base = API_CONFIG.baseUrl;

  readonly terms = signal<TermsVersion | null>(null);
  readonly faqItems = signal<FAQItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async fetchCurrentTerms(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await lastValueFrom(
        this.http.get<TermsVersion>(`${this.base}${API_CONFIG.endpoints.legal.termsCurrent}`)
      );
      this.terms.set(data);
    } catch (e: any) {
      this.error.set('Unable to load Terms of Use. Please try again later.');
      console.error('Error fetching terms:', e);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchFAQ(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await lastValueFrom(
        this.http.get<FAQItem[]>(`${this.base}${API_CONFIG.endpoints.legal.faq}`)
      );
      this.faqItems.set(data);
    } catch (e: any) {
      // If endpoint doesn't exist yet, we can use fallback data or just log
      console.warn('FAQ endpoint failed, using static fallback content');
      this.faqItems.set(this.getFallbackFAQ());
    } finally {
      this.loading.set(false);
    }
  }

  private getFallbackFAQ(): FAQItem[] {
    return [
      {
        id: '1',
        category: 'Getting Started',
        question: 'What is StakeGood?',
        answer: 'StakeGood is a decentralized prediction market platform built on the Stellar network. It allows users to stake on the outcomes of real-world events, where a portion of the platform fees is directed toward social impact projects.'
      },
      {
        id: '2',
        category: 'Getting Started',
        question: 'How do I start predicting?',
        answer: 'To start, connect your Stellar wallet (like Freighter or Albedo), complete the basic KYC verification, and browse the available markets in the Arena.'
      },
      {
        id: '3',
        category: 'Wallets',
        question: 'Which wallets are supported?',
        answer: 'We support several Stellar wallets including Freighter, Albedo, xBull, and WalletConnect compatible wallets.'
      },
      {
        id: '4',
        category: 'Social Impact',
        question: 'How is social impact calculated?',
        answer: 'A small fee (typically 2%) from every stake is collected into a pool. Users then vote using their Voice Credits to decide which NGOs receive these funds.'
      },
      {
        id: '5',
        category: 'Security',
        question: 'Is my data safe?',
        answer: 'We prioritize security by using blockchain technology for transparency and secure KYC providers for identity verification. We never store your private keys.'
      }
    ];
  }
}
