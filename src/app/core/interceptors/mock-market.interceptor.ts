import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { Market, MarketListResponse } from '../models/market.model';

const MOCK_MARKETS: Market[] = [
  {
    id: 'mkt-001',
    title: 'Will Bitcoin exceed $150K by July 2026?',
    description: 'Resolves YES if BTC/USD spot price closes above $150,000 on any day before July 1st, 2026.',
    category: 'Tech',
    status: 'active',
    image_url: '',
    yes_price: 0.62,
    no_price: 0.38,
    total_liquidity: '284500',
    lock_at: '2026-06-30T23:59:59Z',
    created_at: '2026-01-15T10:00:00Z',
    resolution_rule: 'Bitcoin price will be determined by the Binance BTC/USDT daily close price.',
    resolution_source: 'Binance API',
    oracle_url: 'https://api.binance.com',
    fee_ngo: 1.5,
    fee_platform: 2.0,
    fee_gamification: 0.5
  },
  {
    id: 'mkt-002',
    title: 'Will the next FIFA World Cup be hosted in South America?',
    description: 'Resolves YES if FIFA officially confirms a South American country as the 2030 host.',
    category: 'Sports',
    status: 'active',
    image_url: '',
    yes_price: 0.45,
    no_price: 0.55,
    total_liquidity: '156200',
    lock_at: '2026-12-31T23:59:59Z',
    created_at: '2026-02-01T08:30:00Z',
    resolution_rule: 'Based on official FIFA press release or website announcement.',
    resolution_source: 'FIFA.com',
    fee_ngo: 1.0,
    fee_platform: 2.5,
    fee_gamification: 0.5
  },
  ...[
    { id: 'mkt-003', title: 'Will Ethereum transition to full danksharding in 2026?', category: 'Tech' as const, yes_price: 0.28, no_price: 0.72, total_liquidity: '98300', lock_at: '2026-12-31T23:59:59Z', created_at: '2026-01-20T14:00:00Z', description: 'Resolves YES if Ethereum mainnet implements full danksharding before December 31, 2026.' },
    { id: 'mkt-004', title: 'Will the US Federal Reserve cut rates before June 2026?', category: 'Finance' as const, yes_price: 0.71, no_price: 0.29, total_liquidity: '412000', lock_at: '2026-05-31T23:59:59Z', created_at: '2026-01-10T09:00:00Z', description: 'Resolves YES if the Federal Reserve announces a rate cut at any FOMC meeting before June 1, 2026.' },
    { id: 'mkt-005', title: 'Will a new manned Moon landing happen before 2027?', category: 'Science' as const, yes_price: 0.35, no_price: 0.65, total_liquidity: '67800', lock_at: '2026-12-31T23:59:59Z', created_at: '2026-03-01T11:00:00Z', description: 'Resolves YES if any nation successfully lands astronauts on the Moon before January 1, 2027.' },
  ].map(m => ({
    ...m,
    status: 'active' as const,
    image_url: '',
    resolution_rule: 'Standard resolution rules apply.',
    resolution_source: 'Official sources',
    fee_ngo: 1.0,
    fee_platform: 2.0,
    fee_gamification: 1.0
  })),
  {
    id: 'mkt-006',
    title: 'Will the 2026 Oscars Best Picture go to a streaming film?',
    description: 'Resolves YES if the Best Picture winner at the 2026 Academy Awards was released primarily on a streaming platform.',
    category: 'Entertainment',
    status: 'resolved',
    image_url: '',
    yes_price: 0.52,
    no_price: 0.48,
    total_liquidity: '89100',
    lock_at: '2026-03-01T00:00:00Z',
    settle_at: '2026-03-10T02:00:00Z',
    created_at: '2025-12-01T10:00:00Z',
    outcome: 'YES',
    resolution_rule: 'Based on Academy Awards results.',
    resolution_source: 'Oscars.org',
    fee_ngo: 1.0,
    fee_platform: 2.0,
    fee_gamification: 1.0
  },
  {
    id: 'mkt-007',
    title: 'Will Brazil win the 2026 Copa América?',
    description: 'Resolves YES if Brazil is crowned champion of the 2026 Copa América tournament.',
    category: 'Sports',
    status: 'active',
    image_url: '',
    yes_price: 0.39,
    no_price: 0.61,
    total_liquidity: '203500',
    lock_at: '2026-07-15T23:59:59Z',
    created_at: '2026-02-15T12:00:00Z',
    resolution_rule: 'Based on tournament outcome.',
    resolution_source: 'CONMEBOL',
    fee_ngo: 1.0,
    fee_platform: 2.0,
    fee_gamification: 1.0
  },
  {
    id: 'mkt-008',
    title: 'Will Solana TVL surpass $30B in Q2 2026?',
    description: 'Resolves YES if Solana total value locked reaches above $30 billion at any point during Q2 2026.',
    category: 'Tech',
    status: 'active',
    image_url: '',
    yes_price: 0.55,
    no_price: 0.45,
    total_liquidity: '134700',
    lock_at: '2026-06-30T23:59:59Z',
    created_at: '2026-03-10T15:00:00Z',
    resolution_rule: 'Based on DefiLlama Solana TVL.',
    resolution_source: 'DefiLlama',
    fee_ngo: 1.0,
    fee_platform: 2.0,
    fee_gamification: 1.0
  },
  {
    id: 'mkt-009',
    title: 'Will the next US presidential election see a third-party candidate get 5%+?',
    description: 'Resolves YES if any third-party candidate receives 5% or more of the popular vote in the 2028 US presidential election.',
    category: 'Politics',
    status: 'active',
    image_url: '',
    yes_price: 0.22,
    no_price: 0.78,
    total_liquidity: '56200',
    lock_at: '2028-11-01T00:00:00Z',
    created_at: '2026-04-01T09:00:00Z',
    resolution_rule: 'Based on FEC official results.',
    resolution_source: 'FEC.gov',
    fee_ngo: 1.0,
    fee_platform: 2.0,
    fee_gamification: 1.0
  },
  {
    id: 'mkt-010',
    title: 'Will SpaceX Starship complete an orbital flight before May 2026?',
    description: 'Resolves YES if SpaceX Starship successfully completes a full orbital flight before May 1, 2026.',
    category: 'Science',
    status: 'locked',
    image_url: '',
    yes_price: 0.81,
    no_price: 0.19,
    total_liquidity: '321000',
    lock_at: '2026-04-15T00:00:00Z',
    created_at: '2025-11-01T08:00:00Z',
    resolution_rule: 'Based on SpaceX or NASA confirmation.',
    resolution_source: 'SpaceX.com',
    fee_ngo: 1.0,
    fee_platform: 2.0,
    fee_gamification: 1.0
  },
  {
    id: 'mkt-011',
    title: 'Will the EU pass comprehensive AI regulation before July 2026?',
    description: 'Resolves YES if the European Parliament and Council formally adopt comprehensive AI regulation legislation.',
    category: 'Politics',
    status: 'active',
    image_url: '',
    yes_price: 0.67,
    no_price: 0.33,
    total_liquidity: '78900',
    lock_at: '2026-06-30T23:59:59Z',
    created_at: '2026-02-20T10:00:00Z',
    resolution_rule: 'Based on Official Journal of the EU.',
    resolution_source: 'europa.eu',
    fee_ngo: 1.0,
    fee_platform: 2.0,
    fee_gamification: 1.0
  },
  {
    id: 'mkt-012',
    title: 'Will the global average temperature in 2026 set a new record?',
    description: 'Resolves YES if 2026 is confirmed as the hottest year on record by NASA or NOAA.',
    category: 'Science',
    status: 'active',
    image_url: '',
    yes_price: 0.74,
    no_price: 0.26,
    total_liquidity: '45600',
    lock_at: '2027-01-31T23:59:59Z',
    created_at: '2026-01-05T08:00:00Z',
    resolution_rule: 'Based on annual climate reports.',
    resolution_source: 'NASA/NOAA',
    fee_ngo: 1.0,
    fee_platform: 2.0,
    fee_gamification: 1.0
  }
];

export const mockMarketInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  if (!req.url.startsWith(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.markets.base}`)) {
    return next(req);
  }

  console.log(`[MockMarketInterceptor] Intercepting ${req.method} ${req.url}`);

  // GET /api/v1/markets/:id/history
  if (req.method === 'GET' && req.url.includes('/history')) {
    const history = Array.from({ length: 20 }).map((_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 3600000).toISOString(),
      yes_price: 0.4 + Math.random() * 0.2,
      no_price: 0.4 + Math.random() * 0.2,
    }));

    return of(new HttpResponse({
      status: 200,
      body: {
        market_id: 'mkt-001',
        title: 'Mock Market History',
        snapshots: history
      }
    })).pipe(delay(400));
  }

  // GET /api/v1/markets/:id
  const marketIdMatch = req.url.match(/\/markets\/([^\/?]+)$/);
  if (req.method === 'GET' && marketIdMatch) {
    const id = marketIdMatch[1];
    const market = MOCK_MARKETS.find(m => m.id === id);

    if (market) {
      return of(new HttpResponse({
        status: 200,
        body: market
      })).pipe(delay(400));
    } else {
      return of(new HttpResponse({
        status: 404,
        body: { message: 'Market not found' }
      })).pipe(delay(400));
    }
  }

  // GET /api/v1/markets
  if (req.method === 'GET' && req.url === `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.markets.base}`) {
    const response: MarketListResponse = {
      markets: MOCK_MARKETS,
      pagination: {
        total: MOCK_MARKETS.length,
        limit: 20,
        offset: 0,
        has_next: false
      }
    };

    return of(new HttpResponse({
      status: 200,
      body: response
    })).pipe(delay(600));
  }

  return next(req);
};
