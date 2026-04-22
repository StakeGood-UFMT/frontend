# 📋 StakeGood Frontend - Technical Specification Document

**Versão:** 1.0  
**Última Atualização:** 2026-04-18  
**Status:** Development Ready  
**Framework:** Angular 17+ (adaptável a qualquer SPA framework)  

---

## 📑 Sumário Executivo

Este documento especifica em detalhes **cada tela, componente, endpoint, estado, validação e comportamento** do Frontend StakeGood. Serve como **contrato técnico** entre design, desenvolvimento e backend.

**Não é um documento de design visual** — é um **blueprint técnico executável**.

---

## 1. Especificação de Autenticação e Sessão

### 1.1 Fluxo de Login Web3 Detalhado

#### **Endpoint: POST /api/auth/nonce**

```json
Request:
{
  "public_key": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}

Response (200 OK):
{
  "nonce": "abc123def456",
  "expires_in": 300,
  "timestamp": "2026-04-18T10:30:00Z"
}

Response (400 Bad Request):
{
  "code": "INVALID_PUBLIC_KEY",
  "message": "Public key format invalid"
}

Response (429 Too Many Requests):
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many nonce requests. Try again in 60 seconds",
  "retry_after": 60
}
```

#### **Endpoint: POST /api/auth/authenticate**

```json
Request:
{
  "public_key": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "nonce": "abc123def456",
  "signature": "signature_base64_encoded"
}

Response (200 OK):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "refresh_token": "refresh_token_base64",
  "profile": {
    "public_key": "GXXXXXX...",
    "kyc": {
      "status": "not_started|in_progress|pending|approved|rejected",
      "tier": "basic|advanced|professional",
      "tier_expires_at": "2027-04-18T00:00:00Z"
    },
    "terms": {
      "accepted_version": "1.0.0",
      "accepted_at": "2026-04-18T10:30:00Z"
    },
    "limits": {
      "monthly_limit": 10000,
      "consumed": 2500,
      "remaining": 7500,
      "reset_date": "2026-05-18T00:00:00Z"
    },
    "role": "user|ngo_partner|admin",
    "flags": {
      "email_verified": true,
      "phone_verified": false,
      "terms_v1_accepted": true,
      "privacy_accepted": true
    },
    "created_at": "2026-01-15T08:00:00Z",
    "last_login_at": "2026-04-17T15:45:00Z"
  }
}

Response (400 Bad Request):
{
  "code": "INVALID_SIGNATURE",
  "message": "Signature verification failed",
  "user_message": "Your signature couldn't be verified. Please try again."
}

Response (401 Unauthorized):
{
  "code": "NONCE_EXPIRED",
  "message": "Nonce has expired. Request a new one.",
  "user_message": "Your session has expired. Please connect your wallet again."
}

Response (403 Forbidden):
{
  "code": "WALLET_BLOCKED",
  "message": "This wallet address has been blocked due to compliance violation",
  "user_message": "This wallet cannot access StakeGood. Contact support for more information."
}
```

#### **Endpoint: POST /api/auth/refresh**

```json
Request:
{
  "refresh_token": "refresh_token_base64"
}

Response (200 OK):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400
}

Response (401 Unauthorized):
{
  "code": "INVALID_REFRESH_TOKEN",
  "message": "Refresh token is invalid or expired"
}
```

### 1.2 Gerenciamento de JWT (Frontend)

**Storage:** localStorage (com fallback para sessionStorage se necessário)

```typescript
interface StoredAuth {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  expires_at: number;           // timestamp Unix em ms
  refresh_token: string;
  profile: UserProfile;
  stored_at: number;
}

// Armazenar após login sucesso
const auth: StoredAuth = {
  access_token: response.access_token,
  token_type: "Bearer",
  expires_in: response.expires_in,
  expires_at: Date.now() + (response.expires_in * 1000),
  refresh_token: response.refresh_token,
  profile: response.profile,
  stored_at: Date.now()
};

localStorage.setItem('stakegood_auth', JSON.stringify(auth));
```

**Refresh Token Interceptor (Angular):**

```typescript
@Injectable()
export class AuthRefreshInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService,
              private router: Router) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler): 
    Observable<HttpEvent<any>> {
    
    const auth = this.authService.getStoredAuth();
    
    // Se token vai expirar em < 5 minutos, tentar refresh
    if (auth && this.isExpiringsoon(auth.expires_at)) {
      return this.authService.refreshToken(auth.refresh_token).pipe(
        switchMap(newAuth => {
          this.authService.storeAuth(newAuth);
          return this.appendTokenAndContinue(req, newAuth.access_token, next);
        }),
        catchError(error => {
          // Refresh falhou, redirecionar para login
          this.router.navigate(['/landing']);
          return throwError(() => error);
        })
      );
    }
    
    // Token válido, prosseguir
    if (auth) {
      return this.appendTokenAndContinue(req, auth.access_token, next);
    }
    
    return next.handle(req);
  }
  
  private appendTokenAndContinue(req: HttpRequest<any>, 
                                  token: string, 
                                  next: HttpHandler): Observable<HttpEvent<any>> {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next.handle(req);
  }
  
  private isExpiringoon(expiresAt: number): boolean {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return (expiresAt - now) < fiveMinutes;
  }
}
```

**Logout (limpeza):**

```typescript
logout(): void {
  localStorage.removeItem('stakegood_auth');
  localStorage.removeItem('stakegood_pending_transactions');
  this.authSubject$.next(null);
  this.router.navigate(['/landing']);
}
```

---

## 2. Especificação de Gerenciamento de Estado

### 2.1 User State (NgRx)

#### **User Actions**

```typescript
// Auth
export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ auth: StoredAuth }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

export const logout = createAction(
  '[Auth] Logout'
);

export const refreshTokenSuccess = createAction(
  '[Auth] Refresh Token Success',
  props<{ auth: StoredAuth }>()
);

// Wallet
export const walletConnected = createAction(
  '[Wallet] Connected',
  props<{ address: string; balance: number; network: string }>()
);

export const walletDisconnected = createAction(
  '[Wallet] Disconnected'
);

export const balanceUpdated = createAction(
  '[Wallet] Balance Updated',
  props<{ balance: number }>()
);

// KYC
export const kycStatusChanged = createAction(
  '[KYC] Status Changed',
  props<{ status: KycStatus; tier?: string }>()
);

export const kycRejected = createAction(
  '[KYC] Rejected',
  props<{ reason: string }>()
);

// Terms
export const termsAccepted = createAction(
  '[Terms] Accepted',
  props<{ version: string }>()
);

// Transactions
export const transactionSubmitted = createAction(
  '[Transaction] Submitted',
  props<{ transaction: PendingTransaction }>()
);

export const transactionConfirmed = createAction(
  '[Transaction] Confirmed',
  props<{ txHash: string; txId: string }>()
);

export const transactionFailed = createAction(
  '[Transaction] Failed',
  props<{ txId: string; error: string }>()
);
```

#### **User State Interface**

```typescript
interface UserState {
  auth: {
    isLoggedIn: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
  };
  
  profile: {
    publicKey: string | null;
    role: 'user' | 'ngo_partner' | 'admin' | null;
    createdAt: Date | null;
    lastLoginAt: Date | null;
  };
  
  wallet: {
    connected: boolean;
    address: string | null;
    balance: number;
    network: 'testnet' | 'mainnet' | null;
    loadingBalance: boolean;
  };
  
  kyc: {
    status: 'not_started' | 'in_progress' | 'pending' | 'approved' | 'rejected';
    tier: 'basic' | 'advanced' | 'professional';
    tierExpiresAt: Date | null;
    rejectionReason: string | null;
  };
  
  terms: {
    acceptedVersion: string | null;
    acceptedAt: Date | null;
    currentVersion: string;
    accepted: boolean;
  };
  
  limits: {
    monthlyLimit: number;
    consumed: number;
    remaining: number;
    resetDate: Date | null;
  };
  
  transactions: {
    pending: PendingTransaction[];
    history: ConfirmedTransaction[];
    loading: boolean;
  };
  
  ui: {
    loading: boolean;
    error: string | null;
    successMessage: string | null;
  };
}

interface PendingTransaction {
  id: string;                    // UUID local
  type: 'stake' | 'claim' | 'vote' | 'link_wallet';
  status: 'optimistic' | 'pending' | 'failed';
  createdAt: Date;
  data: {
    marketId?: string;
    amount?: number;
    outcome?: 'YES' | 'NO';
    votes?: number;
  };
  error?: string;
}

interface ConfirmedTransaction {
  txHash: string;
  type: string;
  createdAt: Date;
  confirmedAt: Date;
  data: any;
}
```

#### **User Reducer**

```typescript
export const initialUserState: UserState = {
  auth: {
    isLoggedIn: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null
  },
  profile: {
    publicKey: null,
    role: null,
    createdAt: null,
    lastLoginAt: null
  },
  wallet: {
    connected: false,
    address: null,
    balance: 0,
    network: null,
    loadingBalance: false
  },
  kyc: {
    status: 'not_started',
    tier: 'basic',
    tierExpiresAt: null,
    rejectionReason: null
  },
  terms: {
    acceptedVersion: null,
    acceptedAt: null,
    currentVersion: '1.0.0',
    accepted: false
  },
  limits: {
    monthlyLimit: 0,
    consumed: 0,
    remaining: 0,
    resetDate: null
  },
  transactions: {
    pending: [],
    history: [],
    loading: false
  },
  ui: {
    loading: false,
    error: null,
    successMessage: null
  }
};

export const userReducer = createReducer(
  initialUserState,
  
  on(loginSuccess, (state, { auth }) => ({
    ...state,
    auth: {
      isLoggedIn: true,
      accessToken: auth.access_token,
      refreshToken: auth.refresh_token,
      expiresAt: auth.expires_at
    },
    profile: {
      publicKey: auth.profile.public_key,
      role: auth.profile.role,
      createdAt: new Date(auth.profile.created_at),
      lastLoginAt: new Date(auth.profile.last_login_at)
    },
    kyc: auth.profile.kyc,
    terms: auth.profile.terms,
    limits: auth.profile.limits,
    ui: { loading: false, error: null, successMessage: 'Logged in successfully' }
  })),
  
  on(logout, () => initialUserState),
  
  on(walletConnected, (state, { address, balance, network }) => ({
    ...state,
    wallet: {
      ...state.wallet,
      connected: true,
      address,
      balance,
      network: network as 'testnet' | 'mainnet',
      loadingBalance: false
    }
  })),
  
  on(transactionSubmitted, (state, { transaction }) => ({
    ...state,
    transactions: {
      ...state.transactions,
      pending: [transaction, ...state.transactions.pending]
    }
  })),
  
  on(transactionConfirmed, (state, { txHash, txId }) => ({
    ...state,
    transactions: {
      ...state.transactions,
      pending: state.transactions.pending.filter(tx => tx.id !== txId),
      history: [
        {
          txHash,
          type: state.transactions.pending.find(tx => tx.id === txId)?.type || '',
          createdAt: new Date(),
          confirmedAt: new Date(),
          data: {}
        },
        ...state.transactions.history
      ]
    }
  }))
);
```

---

## 3. Especificação de Mercados (Markets)

### 3.1 Endpoint: GET /api/markets

```json
Request (Query Params):
- page: number (default: 1)
- limit: number (default: 20, max: 100)
- sort: 'created_at' | 'volume' | 'resolved_at' (default: 'created_at')
- sort_order: 'asc' | 'desc' (default: 'desc')
- status: 'open' | 'locked' | 'resolved' (opcional)
- category: string (opcional, ex: 'climate')
- search: string (opcional)
- min_volume: number (opcional)

Response (200 OK):
{
  "data": [
    {
      "id": "market-uuid-123",
      "question": "Will global CO2 levels exceed 425 ppm by 2030?",
      "description": "Long-form description...",
      "category": "climate",
      "status": "open",
      "phase": "pre_launch | trading | post_prediction | resolution | resolved",
      "launch_date": "2026-04-18T00:00:00Z",
      "closing_date": "2026-12-31T23:59:59Z",
      "resolution_date": "2027-01-31T00:00:00Z",
      "resolution_criteria": {
        "source": "NOAA",
        "oracle_contract": "CXXXXXXXX...",
        "resolution_method": "binary",
        "data_provider": "noaa.gov"
      },
      "outcomes": [
        {
          "id": "yes-uuid",
          "label": "YES",
          "current_probability": 0.65,
          "shares_outstanding": 100000
        },
        {
          "id": "no-uuid",
          "label": "NO",
          "current_probability": 0.35,
          "shares_outstanding": 50000
        }
      ],
      "volume": {
        "total": 150000,
        "asset": "XLM",
        "last_24h": 50000
      },
      "liquidity_pool": {
        "reserve_yes": 10000,
        "reserve_no": 10000,
        "fee_percentage": 0.02
      },
      "ngo_id": "ngo-uuid-456",
      "ngo_name": "Climate Action Network",
      "ngo_fee_percentage": 0.02,
      "creator_address": "GXXXXXXXX...",
      "tags": ["climate", "2030", "co2"],
      "created_at": "2026-03-01T10:00:00Z",
      "updated_at": "2026-04-18T15:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 95,
    "items_per_page": 20,
    "has_next": true
  }
}

Response (400 Bad Request):
{
  "code": "INVALID_QUERY_PARAMS",
  "message": "Invalid query parameters",
  "errors": {
    "limit": "limit must be <= 100"
  }
}
```

### 3.2 Endpoint: GET /api/markets/:marketId

```json
Response (200 OK):
{
  "id": "market-uuid-123",
  "question": "Will global CO2 levels exceed 425 ppm by 2030?",
  "description": "...",
  "category": "climate",
  "status": "open",
  "phase": "trading",
  "launch_date": "2026-04-18T00:00:00Z",
  "closing_date": "2026-12-31T23:59:59Z",
  "resolution_date": "2027-01-31T00:00:00Z",
  "resolution_criteria": {
    "source": "NOAA",
    "oracle_contract": "CXXXXXXXX...",
    "resolution_method": "binary",
    "data_provider_url": "https://noaa.gov/...",
    "verification_methodology": "NOAA's official CO2 measurement protocol"
  },
  "outcomes": [
    {
      "id": "yes-uuid",
      "label": "YES",
      "current_probability": 0.65,
      "current_price": 0.65,
      "shares_outstanding": 100000,
      "volume_24h": 35000
    },
    {
      "id": "no-uuid",
      "label": "NO",
      "current_probability": 0.35,
      "current_price": 0.35,
      "shares_outstanding": 50000,
      "volume_24h": 15000
    }
  ],
  "volume": {
    "total": 150000,
    "asset": "XLM",
    "last_24h": 50000,
    "last_7d": 200000
  },
  "liquidity_pool": {
    "reserve_yes": 10000,
    "reserve_no": 10000,
    "fee_percentage": 0.02,
    "k": "100000000000"  // x * y = k (AMM constant product)
  },
  "ngo": {
    "id": "ngo-uuid-456",
    "name": "Climate Action Network",
    "logo_url": "https://...",
    "description": "...",
    "verified": true,
    "fee_percentage": 0.02,
    "treasury_address": "GXXXXXXXX..."
  },
  "chart_data": [
    {
      "timestamp": "2026-04-17T00:00:00Z",
      "yes_probability": 0.60,
      "no_probability": 0.40,
      "volume": 5000
    }
  ],
  "comments_count": 127,
  "user_position": null  // ou { outcome: 'YES', shares: 100 } se user logado
}

Response (404 Not Found):
{
  "code": "MARKET_NOT_FOUND",
  "message": "Market with id market-uuid-123 not found"
}
```

### 3.3 Componente: MarketCard (Reutilizável)

**Inputs:**
```typescript
@Input() market: Market;
@Input() showNGO: boolean = true;
@Input() showChart: boolean = false;
@Input() clickable: boolean = true;

@Output() selected = new EventEmitter<Market>();
```

**Template:**
```html
<div class="market-card" 
     [class.clickable]="clickable"
     (click)="onSelect()">
  
  <!-- Category Chip -->
  <div class="category-chip">{{ market.category | uppercase }}</div>
  
  <!-- Question -->
  <h3 class="question">{{ market.question }}</h3>
  
  <!-- Volume -->
  <div class="volume-badge">
    Vol: {{ market.volume.total | currency:'XLM' }}
  </div>
  
  <!-- Outcomes Bar -->
  <div class="outcomes-bar">
    <div class="outcome yes" [style.width.%]="market.outcomes[0].current_probability * 100">
      YES {{ (market.outcomes[0].current_probability * 100) | number:'1.0-0' }}%
    </div>
    <div class="outcome no" [style.width.%]="market.outcomes[1].current_probability * 100">
      NO {{ (market.outcomes[1].current_probability * 100) | number:'1.0-0' }}%
    </div>
  </div>
  
  <!-- NGO (se showNGO) -->
  <div class="ngo-footer" *ngIf="showNGO && market.ngo">
    <img [src]="market.ngo.logo_url" class="ngo-logo" alt="">
    <span>{{ market.ngo.name }}</span>
  </div>
  
  <!-- Status Badge -->
  <div class="status-badge" [class]="market.status">
    {{ market.status | uppercase }}
  </div>
</div>
```

**Styles:**
```scss
.market-card {
  background: white;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all 0.3s ease;
  
  &.clickable {
    cursor: pointer;
    
    &:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
  }
  
  .category-chip {
    display: inline-block;
    background: var(--color-primary);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-pill);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-md);
  }
  
  .question {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    line-height: 1.5;
    margin: 0 0 var(--spacing-md) 0;
    color: var(--color-text-primary);
  }
  
  .volume-badge {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-md);
  }
  
  .outcomes-bar {
    display: flex;
    height: 32px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    margin-bottom: var(--spacing-md);
    background: var(--color-bg-secondary);
    
    .outcome {
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      transition: width 0.3s ease;
      
      &.yes {
        background: var(--color-primary);
      }
      
      &.no {
        background: var(--color-accent-negative);
      }
    }
  }
  
  .ngo-footer {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    
    .ngo-logo {
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }
    
    span {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }
  }
  
  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    
    &.open {
      background: #d1fae5;
      color: #065f46;
    }
    
    &.locked {
      background: #fef3c7;
      color: #92400e;
    }
    
    &.resolved {
      background: #e0e7ff;
      color: #3730a3;
    }
  }
}
```

---

## 4. Especificação de Stake

### 4.1 Endpoint: POST /api/stakes/build

**Objetivo:** Obter XDR assinável sem realmente enviar a transação.

```json
Request:
{
  "market_id": "market-uuid-123",
  "outcome": "YES",
  "amount": 100,
  "user_address": "GXXXXXXXX..."
}

Response (200 OK):
{
  "xdr": "AAAAAgAAAABb...",  // Transação Stellar/Soroban codificada
  "details": {
    "market_id": "market-uuid-123",
    "outcome": "YES",
    "amount": 100,
    "shares_received": 153.84,
    "fee_amount": 2,
    "fee_percentage": 0.02,
    "ngo_fee": 2,
    "net_shares": 151.84,
    "avg_price": 0.6522,
    "slippage": 0.01,
    "gas_estimate": "500000"
  },
  "expires_at": "2026-04-18T10:35:00Z",
  "memo": "stake_v1_market_abc_yes"
}

Response (400 Bad Request):
{
  "code": "INSUFFICIENT_BALANCE",
  "message": "User has insufficient XLM balance for stake",
  "user_message": "You don't have enough XLM for this stake. You need 102 XLM (100 stake + 2 fees).",
  "required_balance": 102,
  "user_balance": 50,
  "action": {
    "label": "Add XLM",
    "route": "/wallet/deposit"
  }
}

Response (400 Bad Request):
{
  "code": "MONTHLY_LIMIT_EXCEEDED",
  "message": "User has exceeded monthly stake limit",
  "user_message": "You've reached your monthly stake limit of 10,000 XLM. You can stake again on May 18.",
  "limit": 10000,
  "consumed": 9950,
  "remaining": 50,
  "action": {
    "label": "Upgrade Tier",
    "route": "/settings/compliance"
  }
}

Response (400 Bad Request):
{
  "code": "MARKET_CLOSED",
  "message": "Market is no longer accepting stakes",
  "user_message": "This market has stopped accepting new stakes.",
  "market_status": "locked"
}

Response (403 Forbidden):
{
  "code": "KYC_REQUIRED",
  "message": "User must complete KYC before staking",
  "user_message": "You must complete identity verification before staking.",
  "action": {
    "label": "Complete KYC",
    "route": "/onboarding/kyc"
  }
}

Response (403 Forbidden):
{
  "code": "ANTI_HEDGE_VIOLATION",
  "message": "Anti-hedge rules prevent this stake",
  "user_message": "You cannot stake on the opposite outcome of your current position on this market.",
  "current_position": { "outcome": "YES", "shares": 100 },
  "attempted_outcome": "NO",
  "action": {
    "label": "Review Position",
    "route": "/arena/market-uuid-123"
  }
}

Response (409 Conflict):
{
  "code": "TERMS_NOT_ACCEPTED",
  "message": "User has not accepted current terms",
  "user_message": "You must accept the latest terms to stake.",
  "action": {
    "label": "Accept Terms",
    "route": "/compliance/terms"
  }
}
```

### 4.2 Endpoint: POST /api/stakes/submit

```json
Request:
{
  "xdr": "AAAAAgAAAABb...",
  "signature": "signature_base64",
  "market_id": "market-uuid-123",
  "outcome": "YES"
}

Response (200 OK):
{
  "tx_hash": "abcdef123456...",
  "status": "pending",
  "message": "Stake submitted successfully. Awaiting blockchain confirmation.",
  "user_message": "Your stake is being processed. You'll receive a confirmation once it's on the blockchain.",
  "estimated_confirmation_time": 15,
  "position_id": "position-uuid-789"
}

Response (400 Bad Request):
{
  "code": "INVALID_XDR",
  "message": "XDR is invalid or expired",
  "user_message": "Your session expired or the transaction is invalid. Please try again."
}

Response (409 Conflict):
{
  "code": "DUPLICATE_SUBMISSION",
  "message": "This transaction appears to have been already submitted",
  "user_message": "This stake may have already been submitted. Check your positions.",
  "existing_tx_hash": "existing_hash_123"
}
```

### 4.3 Component: StakeForm

**Inputs:**
```typescript
@Input() market: Market;
@Input() userBalance: number;
@Input() monthlyRemaining: number;
@Input() userPosition?: UserPosition;  // Para anti-hedge

@Output() stakeSubmitted = new EventEmitter<StakeRequest>();
@Output() error = new EventEmitter<ApiError>();
```

**State:**
```typescript
interface StakeFormState {
  selectedOutcome: 'YES' | 'NO' | null;
  amount: number | null;
  estimatedShares: number | null;
  fee: number;
  feePercentage: number;
  totalCost: number;
  isLoading: boolean;
  error: ApiError | null;
  xdr: string | null;
  transactionPending: boolean;
}
```

**Validações Inline:**

```typescript
get amountError(): string | null {
  if (!this.amount) return null;
  
  if (this.amount <= 0) return 'Amount must be greater than 0';
  if (this.amount > this.userBalance) {
    return `You only have ${this.userBalance} XLM`;
  }
  if (this.totalCost > this.monthlyRemaining) {
    return `Only ${this.monthlyRemaining} XLM remaining this month`;
  }
  if (this.amount < 0.5) return 'Minimum stake is 0.5 XLM';
  
  return null;
}

get canSubmit(): boolean {
  return (
    this.selectedOutcome !== null &&
    this.amount !== null &&
    this.amountError === null &&
    !this.isLoading &&
    this.userKYCApproved &&
    this.termsAccepted &&
    !this.transactionPending
  );
}
```

**Template (pseudo-código):**

```html
<div class="stake-form" [formGroup]="form">
  
  <!-- Outcome Selection -->
  <div class="outcome-selector">
    <button 
      type="button"
      class="outcome-btn yes"
      [class.selected]="selectedOutcome === 'YES'"
      (click)="selectOutcome('YES')"
      [disabled]="transactionPending || marketClosed">
      YES
      <span class="prob">
        {{ market.outcomes[0].current_probability * 100 | number:'1.0-0' }}%
      </span>
    </button>
    
    <button 
      type="button"
      class="outcome-btn no"
      [class.selected]="selectedOutcome === 'NO'"
      (click)="selectOutcome('NO')"
      [disabled]="transactionPending || marketClosed">
      NO
      <span class="prob">
        {{ market.outcomes[1].current_probability * 100 | number:'1.0-0' }}%
      </span>
    </button>
  </div>
  
  <!-- Anti-Hedge Warning -->
  <ng-container *ngIf="antiHedgeWarning">
    <div class="alert alert-warning">
      <p>{{ antiHedgeWarning }}</p>
      <button type="button" (click)="acceptAntiHedgeWarning()">I understand</button>
    </div>
  </ng-container>
  
  <!-- Amount Input -->
  <div class="form-group">
    <label>Amount ({{ market.volume.asset }})</label>
    <div class="input-with-button">
      <input 
        type="number" 
        formControlName="amount"
        placeholder="0.00"
        [class.error]="!!amountError"
        [disabled]="!selectedOutcome">
      <button 
        type="button"
        class="max-btn"
        (click)="setMaxAmount()">
        MAX
      </button>
    </div>
    <div class="balance">Balance: {{ userBalance }} XLM</div>
    <div *ngIf="amountError" class="error-text">{{ amountError }}</div>
  </div>
  
  <!-- Calculator -->
  <div class="calculator">
    <div class="row">
      <span>Est. Shares</span>
      <span class="value">{{ estimatedShares | number:'1.2-2' }}</span>
    </div>
    <div class="row">
      <span>Fee ({{ feePercentage * 100 }}%)</span>
      <span class="value">{{ fee | number:'1.2-2' }} {{ market.volume.asset }}</span>
    </div>
    <div class="row highlight">
      <span>Potential Return</span>
      <span class="value" [class.positive]="potentialReturn > 0">
        +{{ potentialReturn | number:'1.2-2' }} XLM
      </span>
    </div>
  </div>
  
  <!-- CTA -->
  <button 
    type="submit"
    class="btn btn-primary"
    [disabled]="!canSubmit"
    [class.loading]="isLoading"
    (click)="submitStake()">
    <ng-container *ngIf="!isLoading">Confirm Stake</ng-container>
    <ng-container *ngIf="isLoading">
      <spinner></spinner> Awaiting signature…
    </ng-container>
  </button>
  
  <!-- Terms Checkbox -->
  <div class="terms-check">
    <input 
      type="checkbox" 
      id="terms"
      formControlName="acceptedTerms">
    <label for="terms">
      I accept the <a href="/compliance/terms">terms and conditions</a>
    </label>
  </div>
  
  <!-- Pending Transaction Notice -->
  <ng-container *ngIf="transactionPending">
    <div class="alert alert-info">
      <spinner size="sm"></spinner>
      {{ pendingTransactionMessage }}
    </div>
  </ng-container>
  
  <!-- Error Toast -->
  <ng-container *ngIf="error">
    <div class="alert alert-error" [@slideDown]>
      <p>{{ error.userMessage }}</p>
      <ng-container *ngIf="error.action">
        <button 
          type="button"
          class="link"
          (click)="handleErrorAction(error.action)">
          {{ error.action.label }} →
        </button>
      </ng-container>
    </div>
  </ng-container>
</div>
```

---

## 5. Especificação de Claims

### 5.1 Endpoint: GET /api/claims/available

```json
Response (200 OK):
{
  "claims": [
    {
      "id": "claim-uuid-1",
      "position_id": "position-uuid-123",
      "market_id": "market-uuid-456",
      "market_question": "Will global CO2 exceed 425 ppm?",
      "outcome": "YES",
      "shares": 150,
      "original_stake": 100,
      "current_value": 150,
      "payout": 50,
      "market_status": "resolved",
      "market_resolved_outcome": "YES",
      "created_at": "2026-04-15T10:00:00Z",
      "market_resolved_at": "2027-02-01T00:00:00Z",
      "expires_at": "2027-05-01T00:00:00Z"
    }
  ],
  "total_unclaimed": 50,
  "total_available_to_claim": 125.50
}

Response (404 Not Found):
{
  "message": "No claims available"
}
```

### 5.2 Endpoint: POST /api/claims/build

```json
Request:
{
  "claim_ids": ["claim-uuid-1", "claim-uuid-2"],
  "user_address": "GXXXXXXXX..."
}

Response (200 OK):
{
  "xdr": "AAAAAgAAAABb...",
  "claims_data": [
    {
      "claim_id": "claim-uuid-1",
      "payout": 50,
      "asset": "XLM"
    }
  ],
  "total_payout": 100,
  "gas_estimate": "300000",
  "expires_at": "2026-04-18T10:35:00Z"
}
```

### 5.3 Component: ClaimsList

**Template:**

```html
<div class="claims-list">
  
  <!-- Header -->
  <div class="header">
    <h2>Claimable Rewards</h2>
    <div class="total-badge">
      {{ totalAvailable | currency:'XLM' }} available
    </div>
  </div>
  
  <!-- Empty State -->
  <ng-container *ngIf="claims.length === 0">
    <div class="empty-state">
      <icon name="gift-outline"></icon>
      <p>No claimable rewards yet</p>
      <p class="hint">Your rewards will appear here once markets resolve</p>
    </div>
  </ng-container>
  
  <!-- Claims -->
  <div class="claims" *ngIf="claims.length > 0">
    <div class="select-all">
      <input 
        type="checkbox" 
        id="select-all"
        [checked]="allSelected"
        (change)="toggleSelectAll()">
      <label for="select-all">Select all ({{ claims.length }})</label>
    </div>
    
    <div class="claim-item" *ngFor="let claim of claims">
      <div class="checkbox-col">
        <input 
          type="checkbox" 
          [checked]="isSelected(claim.id)"
          (change)="toggleClaim(claim.id)">
      </div>
      
      <div class="content">
        <div class="market-info">
          <h4>{{ claim.market_question }}</h4>
          <span class="outcome" [class]="claim.outcome.toLowerCase()">
            {{ claim.outcome }}
          </span>
        </div>
        
        <div class="details">
          <div class="detail-item">
            <span class="label">Shares</span>
            <span class="value">{{ claim.shares }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Original Stake</span>
            <span class="value">{{ claim.original_stake }} XLM</span>
          </div>
          <div class="detail-item">
            <span class="label">Current Value</span>
            <span class="value">{{ claim.current_value }} XLM</span>
          </div>
        </div>
      </div>
      
      <div class="payout-col">
        <div class="payout">
          <span class="label">Payout</span>
          <span class="amount positive">+{{ claim.payout }} XLM</span>
        </div>
        <div class="status">Resolved {{ claim.market_resolved_at | date:'short' }}</div>
      </div>
    </div>
  </div>
  
  <!-- Action Bar -->
  <div class="action-bar" *ngIf="selectedCount > 0">
    <div class="info">
      <span>{{ selectedCount }} selected</span>
      <span class="total">{{ selectedTotal | currency:'XLM' }}</span>
    </div>
    <button 
      class="btn btn-primary"
      (click)="submitClaim()"
      [disabled]="isLoading">
      <ng-container *ngIf="!isLoading">
        Claim {{ selectedCount }} {{ selectedCount === 1 ? 'reward' : 'rewards' }}
      </ng-container>
      <ng-container *ngIf="isLoading">
        <spinner></spinner> Processing…
      </ng-container>
    </button>
  </div>
</div>
```

---

## 6. Especificação de Voting (Futarchy)

### 6.1 Endpoint: GET /api/voting/quadratic

```json
Response (200 OK):
{
  "cycle": {
    "id": "cycle-2026-q2",
    "starts_at": "2026-04-01T00:00:00Z",
    "ends_at": "2026-06-30T23:59:59Z",
    "total_credits": 1000,
    "user_allocated": 750,
    "user_remaining": 250
  },
  "ngos": [
    {
      "id": "ngo-uuid-1",
      "name": "Climate Action Network",
      "logo_url": "https://...",
      "description": "Fighting climate change through innovation",
      "verified": true,
      "current_votes": 50,
      "cost": 2500,  // 50²
      "status": "active"
    },
    {
      "id": "ngo-uuid-2",
      "name": "Global Education Fund",
      "logo_url": "https://...",
      "description": "Providing education to underserved communities",
      "verified": true,
      "current_votes": 30,
      "cost": 900,   // 30²
      "status": "active"
    }
  ],
  "formula": "cost = votes²",
  "total_cost": 3400,
  "available_credits": 1000
}

Response (403 Forbidden):
{
  "code": "VOTING_CLOSED",
  "message": "Voting cycle is not active",
  "cycle_start": "2026-07-01T00:00:00Z"
}
```

### 6.2 Endpoint: POST /api/voting/allocate

```json
Request:
{
  "allocations": [
    {
      "ngo_id": "ngo-uuid-1",
      "votes": 50
    },
    {
      "ngo_id": "ngo-uuid-2",
      "votes": 30
    }
  ]
}

Response (200 OK):
{
  "message": "Votes submitted successfully",
  "allocations": [
    {
      "ngo_id": "ngo-uuid-1",
      "votes": 50,
      "cost": 2500
    }
  ],
  "total_cost": 3400,
  "credits_used": 3400,
  "credits_remaining": 0,
  "submitted_at": "2026-04-18T10:30:00Z"
}

Response (400 Bad Request):
{
  "code": "EXCEEDS_CREDIT_LIMIT",
  "message": "Total cost exceeds available credits",
  "total_cost": 4000,
  "available_credits": 1000,
  "user_message": "Your vote allocation costs 4,000 credits, but you only have 1,000 available."
}
```

### 6.3 Component: QuadraticVoting

**State:**

```typescript
interface VotingState {
  allocations: Map<string, number>;  // ngo_id → votes
  quadraticCost: Map<string, number>; // ngo_id → cost
  totalCost: number;
  creditsRemaining: number;
  isSubmitting: boolean;
}

get totalCost(): number {
  return Array.from(this.allocations.values()).reduce((sum, votes) => {
    return sum + (votes * votes);
  }, 0);
}

get creditsRemaining(): number {
  return this.totalCredits - this.totalCost;
}

canSubmit(): boolean {
  return this.totalCost > 0 && this.totalCost <= this.totalCredits && !this.isSubmitting;
}
```

**Template:**

```html
<div class="quadratic-voting">
  
  <!-- Header -->
  <div class="header">
    <h2>Allocate Platform Fees</h2>
    <div class="credits-badge">
      {{ totalCredits }} Voice Credits
    </div>
  </div>
  
  <!-- Formula Explanation -->
  <div class="explanation">
    <p><strong>Cost formula:</strong> <code>cost = votes²</code></p>
    <p>Allocate your voice credits to support impactful projects</p>
  </div>
  
  <!-- NGO Cards -->
  <div class="ngo-grid">
    <div class="ngo-card" *ngFor="let ngo of ngos">
      <div class="ngo-header">
        <img [src]="ngo.logo_url" [alt]="ngo.name" class="logo">
        <div>
          <h4>{{ ngo.name }}</h4>
          <p *ngIf="ngo.verified" class="verified">✓ Verified</p>
        </div>
      </div>
      
      <p class="description">{{ ngo.description }}</p>
      
      <div class="voting-section">
        <div class="slider-group">
          <label>
            Votes
            <input 
              type="range" 
              min="0" 
              max="100"
              [value]="allocations.get(ngo.id) || 0"
              (change)="setVotes(ngo.id, $event)"
              [disabled]="!canAllocateMore()">
          </label>
          <span class="vote-number">{{ allocations.get(ngo.id) || 0 }}</span>
        </div>
        
        <div class="cost">
          <span class="label">Cost</span>
          <span class="value" [class.highlight]="quadraticCost.get(ngo.id) > 0">
            {{ quadraticCost.get(ngo.id) || 0 }} credits
            <span class="formula">{{ (allocations.get(ngo.id) || 0) }}²</span>
          </span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Summary -->
  <div class="summary">
    <div class="row">
      <span>Total Allocated</span>
      <span class="value">{{ totalCost }} / {{ totalCredits }}</span>
    </div>
    <div class="progress">
      <div class="bar" [style.width.%]="(totalCost / totalCredits) * 100"></div>
    </div>
  </div>
  
  <!-- CTA -->
  <button 
    class="btn btn-primary"
    [disabled]="!canSubmit()"
    (click)="submitVotes()">
    <ng-container *ngIf="!isSubmitting">
      Submit Votes
    </ng-container>
    <ng-container *ngIf="isSubmitting">
      <spinner></spinner> Submitting…
    </ng-container>
  </button>
</div>
```

---

## 7. Especificação de KYC

### 7.1 Endpoint: POST /api/kyc/init

```json
Request:
{
  "public_key": "GXXXXXXXX..."
}

Response (200 OK):
{
  "session_id": "kyc-session-uuid",
  "client_token": "jwt_token_for_jumio",
  "provider": "jumio",
  "callback_url": "https://stakegood.com/api/kyc/callback"
}
```

### 7.2 Fluxo de KYC (iFrame)

```html
<div class="kyc-portal">
  <div class="stepper">
    <div class="step" [class.complete]="wallet_connected">
      <span class="number">1</span>
      <span class="label">Connect Wallet</span>
    </div>
    <div class="step" [class.active]="!kyc_approved">
      <span class="number">2</span>
      <span class="label">Identity Verification</span>
    </div>
    <div class="step" [class.future]="!kyc_approved">
      <span class="number">3</span>
      <span class="label">Ready to Stake</span>
    </div>
  </div>
  
  <!-- Jumio iFrame -->
  <div class="iframe-container">
    <iframe 
      [src]="kycIframeUrl"
      [attr.id]="'jumio-frame'"
      class="kyc-iframe">
    </iframe>
    
    <div class="loading-overlay" *ngIf="isLoadingKyc">
      <spinner></spinner>
      <p>Initializing secure verification…</p>
      <p class="powered-by">Powered by Jumio</p>
    </div>
  </div>
  
  <!-- Status -->
  <div class="status-banner" [class]="kyc.status">
    <ng-container [ngSwitch]="kyc.status">
      <ng-container *ngSwitchCase="'approved'">
        <icon name="check-circle"></icon>
        <p>Identity verified ✓</p>
        <p class="tier">Tier: {{ kyc.tier }}</p>
      </ng-container>
      
      <ng-container *ngSwitchCase="'pending'">
        <icon name="hourglass"></icon>
        <p>Under review…</p>
        <p class="hint">This usually takes 2-3 hours</p>
      </ng-container>
      
      <ng-container *ngSwitchCase="'rejected'">
        <icon name="x-circle"></icon>
        <p>Verification failed</p>
        <p class="reason">{{ kyc.rejection_reason }}</p>
        <button class="btn btn-secondary" (click)="retryKyc()">
          Try Again
        </button>
      </ng-container>
    </ng-container>
  </div>
</div>
```

---

## 8. Especificação de WebSocket

### 8.1 Conexão

```typescript
// Conectar após login
const wsUrl = `wss://api.stakegood.com/ws?token=${jwt}&user=${publicKey}`;
this.ws = new WebSocket(wsUrl);

this.ws.onopen = () => {
  console.log('WebSocket connected');
};

this.ws.onmessage = (event) => {
  const message: WebSocketMessage = JSON.parse(event.data);
  this.handleMessage(message);
};

this.ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  this.attemptReconnect();
};

this.ws.onclose = () => {
  this.attemptReconnect();
};
```

### 8.2 Mensagens (Server → Client)

**Transação Confirmada:**
```json
{
  "event": "transaction_confirmed",
  "data": {
    "tx_hash": "abcdef123...",
    "tx_id": "position-uuid-123",  // ID local
    "user_address": "GXXXXXXXX...",
    "type": "stake",
    "market_id": "market-uuid-456",
    "status": "confirmed",
    "block_number": 12345,
    "block_hash": "hash_xyz",
    "timestamp": "2026-04-18T10:35:00Z"
  }
}
```

**Saldo Atualizado:**
```json
{
  "event": "balance_updated",
  "data": {
    "user_address": "GXXXXXXXX...",
    "new_balance": 500,
    "asset": "XLM",
    "reason": "stake_confirmed|claim_paid|deposit",
    "timestamp": "2026-04-18T10:35:00Z"
  }
}
```

**KYC Aprovado:**
```json
{
  "event": "kyc_approved",
  "data": {
    "user_address": "GXXXXXXXX...",
    "tier": "advanced",
    "expires_at": "2027-04-18T00:00:00Z",
    "timestamp": "2026-04-18T10:35:00Z"
  }
}
```

**Mercado Resolvido:**
```json
{
  "event": "market_resolved",
  "data": {
    "market_id": "market-uuid-123",
    "resolved_outcome": "YES",
    "resolved_at": "2026-04-18T10:35:00Z",
    "affected_positions": 1250,
    "timestamp": "2026-04-18T10:35:00Z"
  }
}
```

---

## 9. Especificação de Erros

### 9.1 Estrutura de Erro Padrão

```typescript
interface ApiError {
  code: string;                  // Código técnico (INSUFFICIENT_BALANCE, etc)
  message: string;               // Mensagem técnica (em en-US)
  user_message: string;          // Mensagem legível para user
  status_code: number;           // HTTP status
  details?: {                    // Contexto adicional
    [key: string]: any;
  };
  action?: {                     // CTA recomendada
    label: string;               // "Complete KYC", "Upgrade Tier", etc
    route?: string;              // Route Angular
    callback?: string;           // JS callback name
  };
  timestamp: string;             // ISO 8601
  request_id: string;            // Para debugging
}
```

### 9.2 Erros Mapeados por Categoria

#### **Autenticação (401)**

| Code | Message | User Message | Action |
|------|---------|--------------|--------|
| `INVALID_SIGNATURE` | Signature verification failed | Your signature couldn't be verified. Try again | Retry |
| `NONCE_EXPIRED` | Nonce has expired | Session expired. Reconnect wallet | Connect Wallet |
| `WALLET_BLOCKED` | Wallet address blocked | This wallet cannot access StakeGood | Contact Support |
| `JWT_EXPIRED` | JWT token expired | Please log in again | Login |

#### **Compliance (403)**

| Code | Message | User Message | Action |
|------|---------|--------------|--------|
| `KYC_REQUIRED` | User must complete KYC | Complete identity verification to stake | Go to KYC |
| `KYC_REJECTED` | KYC was rejected | Your verification was denied | Resubmit KYC |
| `TERMS_NOT_ACCEPTED` | User hasn't accepted terms | Accept terms to continue | Accept Terms |
| `MONTHLY_LIMIT_EXCEEDED` | Monthly stake limit reached | You've reached your monthly limit | Upgrade Tier |

#### **Saldo (400)**

| Code | Message | User Message | Action |
|------|---------|--------------|--------|
| `INSUFFICIENT_BALANCE` | Balance insufficient | You don't have enough XLM | Add XLM |
| `INSUFFICIENT_XLM_FEE` | Not enough XLM for fees | You need XLM to pay network fees | Add XLM |

#### **Mercado (400)**

| Code | Message | User Message | Action |
|------|---------|--------------|--------|
| `MARKET_NOT_FOUND` | Market not found | This market doesn't exist | Go to Arena |
| `MARKET_CLOSED` | Market not accepting stakes | This market has closed | - |
| `MARKET_RESOLVED` | Market already resolved | You can't stake on a resolved market | - |

#### **Anti-Hedge (403)**

| Code | Message | User Message | Action |
|------|---------|--------------|--------|
| `ANTI_HEDGE_VIOLATION` | Can't stake opposite outcome | Can't hedge on this market | Review Terms |

---

## 10. Validações de Formulário

### 10.1 Amount Input

```typescript
interface AmountValidation {
  minAmount: number = 0.5;
  maxAmount: number = userBalance;
  stepSize: number = 0.01;
  decimals: number = 2;
}

validators: [
  Validators.required,
  Validators.min(0.5),
  Validators.max(userBalance),
  Validators.pattern(/^\d+(\.\d{1,2})?$/),  // Decimal validation
  this.monthlyLimitValidator,
  this.xdtFeeValidator
]

// Custom Validators
monthlyLimitValidator(control: AbstractControl): ValidationErrors | null {
  const amount = control.value;
  if (!amount) return null;
  
  const totalWithFee = amount * (1 + FEE_PERCENTAGE);
  if (totalWithFee > monthlyRemaining) {
    return {
      'monthlyLimitExceeded': {
        required: monthlyRemaining,
        attempted: totalWithFee
      }
    };
  }
  return null;
}

xdtFeeValidator(control: AbstractControl): ValidationErrors | null {
  const amount = control.value;
  if (!amount) return null;
  
  const totalCost = amount * (1 + FEE_PERCENTAGE);
  if (totalCost > userBalance) {
    return {
      'insufficientBalance': {
        required: totalCost,
        available: userBalance
      }
    };
  }
  return null;
}
```

### 10.2 Mensagens de Erro Dinâmicas

```typescript
getAmountErrorMessage(errors: ValidationErrors | null): string {
  if (!errors) return '';
  
  if (errors['required']) return 'Amount is required';
  if (errors['min']) return `Minimum amount is ${errors['min'].min} XLM`;
  if (errors['max']) return `Maximum amount is ${errors['max'].max} XLM`;
  if (errors['pattern']) return 'Invalid decimal amount';
  if (errors['monthlyLimitExceeded']) {
    return `Only ${errors['monthlyLimitExceeded'].required} XLM remaining this month`;
  }
  if (errors['insufficientBalance']) {
    return `You need ${errors['insufficientBalance'].required} XLM total`;
  }
  
  return 'Invalid amount';
}
```

---

## 11. Especificação de Performance

### 11.1 Metas de Performance

```
Landing Page:
  - First Contentful Paint: < 2s
  - Largest Contentful Paint: < 3s
  - Cumulative Layout Shift: < 0.1
  - Time to Interactive: < 4s

Arena (Market List):
  - Initial Load: < 2s
  - Scroll Render: < 60fps (virtual scrolling)

Market Detail:
  - Load: < 2s
  - Chart Update (WS): < 100ms

Form Submission:
  - API Call: < 1s (median)
  - XDR Generation: < 2s
  - TX Confirmation: < 30s (median), timeout after 60s
```

### 11.2 Otimizações

**Code Splitting:**
```typescript
// app-routing.module.ts
const routes: Routes = [
  { path: '', component: LandingComponent },
  {
    path: 'arena',
    loadChildren: () => import('./arena/arena.module').then(m => m.ArenaModule)
  },
  {
    path: 'voting',
    loadChildren: () => import('./voting/voting.module').then(m => m.VotingModule)
  }
];
```

**Lazy Loading Imagens:**
```html
<img 
  [src]="market.image_url"
  loading="lazy"
  alt="">
```

**Virtual Scrolling:**
```html
<cdk-virtual-scroll-viewport itemSize="120">
  <app-market-card 
    *cdkVirtualFor="let market of markets$ | async"
    [market]="market">
  </app-market-card>
</cdk-virtual-scroll-viewport>
```

---

## 12. Especificação de Responsive Design

### 12.1 Breakpoints

```css
Mobile: 320px - 767px
Tablet: 768px - 1023px
Desktop: 1024px+

@media (max-width: 767px) {
  /* Mobile adjustments */
  .market-grid { grid-template-columns: 1fr; }
}

@media (min-width: 768px) and (max-width: 1023px) {
  /* Tablet adjustments */
  .market-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  /* Desktop adjustments */
  .market-grid { grid-template-columns: repeat(3, 1fr); }
}
```

### 12.2 Touch Targets (Mobile)

```
Mínimo: 44x44px
Recomendado: 48x48px
Espaçamento: 8px entre alvos
```

---

## 13. Testes Esperados

### 13.1 Unit Tests

```
✓ Auth Service: 95%+ cobertura
✓ Market Service: 90%+ cobertura
✓ Stake Service: 95%+ cobertura
✓ Claim Service: 90%+ cobertura
✓ Voting Service: 85%+ cobertura
✓ Guards: 100% cobertura
✓ Pipes: 100% cobertura
✓ Directives: 90%+ cobertura
```

### 13.2 E2E Tests (Cypress)

```
Fluxo completo:
  ✓ Landing → Connect Wallet → KYC → Stake → Claim
  
Cenários de erro:
  ✓ Rejeição de assinatura
  ✓ RPC Timeout
  ✓ Saldo insuficiente
  ✓ Limite mensal atingido
  
Optimistic UI:
  ✓ Pendente → Confirmado
  ✓ Pendente → Timeout
```

---

## 14. Deploy e Ambientes

### 14.1 Configuração

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'ws://localhost:3000/ws',
  network: 'testnet',
  kycProvider: 'jumio',
  logLevel: 'debug'
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.stakegood.com/api',
  wsUrl: 'wss://api.stakegood.com/ws',
  network: 'mainnet',
  kycProvider: 'jumio',
  logLevel: 'error'
};
```

### 14.2 Build

```bash
# Development
ng serve --configuration development

# Production
ng build --configuration production

# Analyzar bundle
ng build --stats-json
```

---

## Glossário Técnico

| Termo | Definição |
|-------|-----------|
| **JWT** | JSON Web Token; credencial de autenticação |
| **XDR** | eXternal Data Representation; formato binário Stellar |
| **Stroops** | Unidade mínima XLM (10^-7) |
| **Nonce** | Número único para assinatura; previne replay attacks |
| **Optimistic UI** | Atualizar UI antes de confirmação do servidor |
| **Anti-Hedge** | Proteção contra apostas em resultados opostos |
| **KYC** | Know Your Customer; verificação de identidade |
| **TTL** | Time To Live; expiração de dados |

---

**Documento Controlado**  
Versão: 1.0  
Status: Review Ready  
Próxima Revisão: 2026-07-18