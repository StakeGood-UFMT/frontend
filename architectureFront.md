# 🏗️ StakeGood Frontend - Architecture Documentation

**Versão:** 1.0  
**Última Atualização:** 2026-04-18  
**Status:** Active Development  
**Stack Principal:** Angular (aplicável a qualquer framework)  

---

## 📑 Sumário Executivo

O Frontend do StakeGood é responsável por **duas missões críticas**:

1. **Orquestração de Comunicação**: Intermediar interações entre usuário (via extensão de carteira), API (NestJS) e rede Stellar/Soroban
2. **Mascaramento de Latência**: Implementar Optimistic UI para garantir experiência fluida enquanto aguarda confirmação da blockchain

O design segue princípios de **Delegação Estrita** (não confiar em si mesmo para regras financeiras) e **Asset-Agnosticism** (suportar qualquer ativo além de XLM).

---

## 1. Arquitetura de Integração

### 1.1 Fluxo de Camadas

```
┌─────────────────────────────────────────────────────┐
│            User Interface Layer (Angular)           │
│  (Components, Templates, State Management)          │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│      Application Logic Layer (Services)             │
│  (Auth, Market, Stake, Vote, Claim Services)       │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│    Web3 Integration Layer (Wallet + Crypto)        │
│  (Freighter SDK, XDR Generation, Signing)          │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼──┐  ┌────▼──┐  ┌────▼──┐
    │ API   │  │Wallet │  │Stellar│
    │NestJS │  │Browser│  │/Soroban
    └───────┘  └───────┘  └───────┘
```

**Princípio de Delegação:**
- Frontend coleta **intenção** do usuário
- Envia para API para **validação e regras**
- API retorna XDR (payload binário) seguro
- Frontend **nunca monta transação final**

---

## 2. Fluxos de Autenticação e Transação

### 2.1 Login Web3 (Sem Senhas)

```
┌─────────────────────────────────────────────────────┐
│ 1. User clica "Connect Wallet"                      │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 2. Frontend detecta carteira (Freighter instalada?) │
│    - Se NÃO: botão muda para "Instalar"            │
│    - Se SIM: prossegue                              │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 3. Frontend solicita public key da carteira         │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 4. Frontend pede nonce (desafio) à API              │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 5. Frontend abre popup carteira para assinatura     │
│    Estados: "Approve signature in wallet…"          │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 6. Frontend envia assinatura para API               │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 7. API retorna JWT + snapshot do perfil:            │
│    - KYC status e tier                              │
│    - Limites mensais                                │
│    - Role (user/ngo_partner/admin)                  │
│    - Termos aceitos (versionados)                   │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 8. Frontend armazena JWT + atualiza state            │
│    (wallet.connected = true)                        │
└─────────────────────────────────────────────────────┘
```

**Estados do Botão:**
```
Connect Wallet
    ↓
Checking wallet…
    ↓
Approve signature in wallet…
    ↓
Connected ✓ (ou erro com retry)
```

### 2.2 Fluxo de Delegação XDR (Transações)

```
┌─────────────────────────────────────────────────────┐
│ 1. User define intenção: market_id, outcome,        │
│    amount, votes (apenas dados, sem cálculos)       │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 2. Frontend envia intenção para API                 │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 3. API valida:                                      │
│    - KYC aprovado?                                  │
│    - Limites respeitados?                           │
│    - Fase do market (aberto)?                       │
│    - Anti-hedge permitido?                          │
│    - Termos aceitos?                                │
└────────────────┬────────────────────────────────────┘
                 │
                 ├─→ FALHA? Retorna erro descritivo
                 │   Frontend mapeia erro → mensagem/CTA
                 │
┌────────────────▼────────────────────────────────────┐
│ 4. API gera XDR (payload binário seguro)            │
│    com transação completa e assinada internamente   │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 5. Frontend passa XDR para carteira                 │
│    User revisa e aprova na extensão                 │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 6. Frontend aplica Optimistic UI:                   │
│    - Desabilita botões/inputs críticos              │
│    - Toast: "Awaiting confirmation…"                │
│    - Registra entrada pendente no histórico local   │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 7. Frontend aguarda confirmação (WS/SSE)            │
└────────────────┬────────────────────────────────────┘
                 │
         ┌───────┴──────────┐
         │                  │
   ┌─────▼─────┐      ┌─────▼──────┐
   │ Confirmado│      │ Timeout    │
   └───────────┘      └────────────┘
   Saldo/posição      "Network congested.
   atualizado         Check history."
```

**Regra de Segurança Crítica:**
> Frontend **NUNCA** monta a transação final. API é a única responsável por XDR válido.

### 2.3 Tempo Real + Optimistic UI (WebSockets/SSE)

```
┌──────────────────────────────────────────────────┐
│ Após Login: Iniciar canal de eventos (WS/SSE)    │
└────────────────┬─────────────────────────────────┘
                 │
         ┌───────┴──────────┐
         │                  │
   ┌─────▼──────┐      ┌─────▼───────┐
   │ TX Enviada │      │ Escutando   │
   │ (pending)  │      │ Eventos     │
   └─────┬──────┘      └─────────────┘
         │
         ├─→ Toast: "Awaiting confirmation…"
         ├─→ Desabilita inputs críticos
         ├─→ Entrada pendente no histórico
         │
   ┌─────▼─────────────────────────────────────┐
   │ CASO 1: WS confirma em segundos            │
   │ ──────────────────────────────            │
   │ Atualizar saldo                           │
   │ Atualizar posição/claim/votos              │
   │ Remover pendente → "Confirmed ✓"         │
   │ Toast: "Transaction confirmed!"            │
   └─────────────────────────────────────────┘
         │
   ┌─────▼─────────────────────────────────────┐
   │ CASO 2: Timeout (>30s sem confirmação)    │
   │ ──────────────────────────────            │
   │ NUNCA dizer "Falhou"                      │
   │ Toast: "Network congested.                │
   │         Your transaction may still be     │
   │         processing. Check history."       │
   │ Link para histórico de TX                 │
   │ Opção: "Verificar Status"                 │
   └─────────────────────────────────────────┘
```

**Timeouts Nunca são Definitivos:**
- Stella pode confirmar lentamente
- TX pode estar em mempool
- Frontend mantém estado "incerto" até confirmação clara

---

## 3. Guardas de Rota (Gating) por Estado do Usuário

### 3.1 Estado do Usuário (Redux/NgRx/BehaviorSubject)

```typescript
interface UserState {
  // Wallet
  wallet: {
    connected: boolean;
    address: string;
    balance: number;
    network: 'testnet' | 'mainnet';
    status: 'disconnected' | 'connecting' | 'connected';
  };
  
  // Auth
  auth: {
    logged_in: boolean;
    jwt: string;
    jwt_expires_at: number;
    public_key: string;
  };
  
  // Compliance
  kyc: {
    status: 'not_started' | 'in_progress' | 'pending' | 'approved' | 'rejected';
    tier: 'basic' | 'advanced' | 'professional';
    rejection_reason?: string;
  };
  
  // Legal
  terms: {
    accepted_by_version: string;
    accepted_at: Date;
    updated_at: Date;
  };
  
  // Limites
  limits: {
    monthly_limit: number;
    consumed: number;
    remaining: number;
  };
  
  // Autorização
  role: 'user' | 'ngo_partner' | 'admin';
}
```

### 3.2 Regras de Gating

```
┌─────────────────────────────────┐
│ Sem Wallet Conectada            │
├─────────────────────────────────┤
│ ✓ Páginas Públicas              │
│   (Landing, Help Center)        │
│ ✓ Leitura (Markets, Ledger)     │
│ ✗ Stake, Claim, Vote            │
│   CTA: "Connect Wallet"          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Sem KYC Aprovado                │
├─────────────────────────────────┤
│ ✓ Leitura de Markets            │
│ ✗ Stake (bloqueado)             │
│ ✗ Vote (se exigido)             │
│ ✗ Claim (se exigido)            │
│ CTA: "Complete KYC" (redireciona)│
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Sem Aceite de Termos            │
├─────────────────────────────────┤
│ ✗ Todas ações reguladas         │
│ CTA: "Accept Terms" (redireciona)│
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ role = ngo_partner              │
├─────────────────────────────────┤
│ ✓ Portal Institucional          │
│   - Settings Compliance         │
│   - Report Gerador              │
│   - Project Directory           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ role = admin                    │
├─────────────────────────────────┤
│ ✓ Admin Panel                   │
│   - Gestão de TTL (State Rent)  │
│   - Moderação                   │
└─────────────────────────────────┘
```

### 3.3 Implementação de Guard (Angular)

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, 
              private router: Router) {}
  
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      map(isAuth => {
        if (!isAuth) {
          this.router.navigate(['/landing']);
          return false;
        }
        return true;
      })
    );
  }
}

@Injectable()
export class KycGuard implements CanActivate {
  constructor(private userService: UserService,
              private router: Router) {}
  
  canActivate(): Observable<boolean> {
    return this.userService.kyc$.pipe(
      map(kyc => {
        if (kyc.status !== 'approved') {
          this.router.navigate(['/onboarding/kyc']);
          return false;
        }
        return true;
      })
    );
  }
}

@Injectable()
export class TermsGuard implements CanActivate {
  constructor(private userService: UserService,
              private router: Router) {}
  
  canActivate(): Observable<boolean> {
    return this.userService.terms$.pipe(
      map(terms => {
        if (!terms.accepted_by_version) {
          this.router.navigate(['/compliance/terms']);
          return false;
        }
        return true;
      })
    );
  }
}
```

---

## 4. Identidade Visual e Componentização

### 4.1 Sistema de Design (3 Famílias Visuais)

#### **Família A — Modern (Inter + Emerald)**

| Elemento | Valor | Uso |
|----------|-------|-----|
| **Primária** | `#11D48A` (Emerald) | CTAs, highlights, badges |
| **Fundo** | `#F6F8F7` (Off-white) | Canvas principal |
| **Acento Negativo** | `#CC5A37` (Terracota) | Warnings, decline |
| **Tipografia** | Inter | Body, labels |
| **Ícones** | Material Symbols Outlined | UI elements |
| **Border Radius** | 12–16px | Cards, botões |
| **Sombra** | 0 4px 6px rgba(0,0,0,0.07) | Cards, overlays |

**Usado em:** Landing, Arena, Market Detail, Stake Form

#### **Família B — Editorial / Paper (Newsreader + Plus Jakarta)**

| Elemento | Valor | Uso |
|----------|-------|-----|
| **Fundo** | `#FCF9F3` (Papel cru) | Canvas |
| **Primária** | `#133E2F` (Forest Green) | Títulos, accents |
| **Secundária** | `#A43D1C` (Terracota escuro) | Links, destaques |
| **Tipografia** | Newsreader (serif) títulos | Headlines |
| | Plus Jakarta Sans | Body |
| **TopBar** | Translúcida com blur (glass effect) | Header sticky |
| **Sombra** | Editorial (mais profunda) | Cards, layers |

**Usado em:** Terms, Help Center, Claim History, Impact Timeline

#### **Família C — Dashboard (Public Sans + Stone/Emerald)**

| Elemento | Valor | Uso |
|----------|-------|-----|
| **Neutro** | Stone (cinza morno) | Backgrounds |
| **Acento** | Emerald (verde esmeralda) | Interativas |
| **Tipografia** | Public Sans | Mono-weight, neutral |
| **Layout** | SideBar fixa + Bento grid | Organization |
| **Botões** | Pílula (radius 20px) | Compact, rounded |
| **Cards** | Glass effect (semi-transparent) | Layering |

**Usado em:** Project Directory, Leaderboard, Notifications, Settings

### 4.2 Design Tokens (CSS Variables)

```css
/* Cores */
:root {
  --color-primary: #11D48A;
  --color-primary-dark: #0D9B66;
  --color-primary-light: #4CE8B8;
  
  --color-accent-negative: #CC5A37;
  --color-accent-warning: #F59E0B;
  --color-accent-success: #10B981;
  --color-accent-error: #EF4444;
  
  --color-bg-primary: #F6F8F7;
  --color-bg-secondary: #FCF9F3;
  --color-bg-tertiary: #FFFFFF;
  
  --color-text-primary: #111815;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #9CA3AF;
  
  --color-border: #E5E7EB;
  --color-border-subtle: #F3F4F6;
  
  /* Typography */
  --font-family-body: 'Inter', sans-serif;
  --font-family-serif: 'Newsreader', serif;
  --font-family-mono: 'Public Sans', sans-serif;
  
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;
  --font-size-3xl: 2.5rem;
  
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 20px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
  
  /* Backdrop Blur (Glass) */
  --glass-blur: blur(10px);
  --glass-opacity: 0.8;
}
```

---

## 5. Mapeamento de Telas (19 Telas Críticas)

### Mapa Mental das Telas

```
Landing (public)
    ├── Connect Wallet
    └── Explore Markets
        │
        ├─→ Onboarding / KYC
        │   └─→ Terms & Compliance
        │       └─→ Arena (Mercados)
        │           ├── Market Detail
        │           │   └── Stake Form
        │           ├── Market Wizard (4 steps)
        │           └── Futarchy Voting
        │               └── Quadratic Voice Credits
        │
        ├─→ Perfil / Reputação
        │   └── Claim History
        │       └── Global Impact Ledger
        │
        ├─→ Projeto Directory
        │   └── Perfil ONG / Impact Timeline
        │
        ├─→ Notifications Center
        │
        ├─→ Settings
        │   ├── Compliance (limites)
        │   ├── Privacy (toggles)
        │   ├── Security (wallets, 2FA)
        │   └── Organization (admin)
        │
        ├─→ Leaderboard
        │
        ├─→ Help Center / FAQ
        │
        └─→ 404 / Error Pages

[ADMIN ONLY]
└─→ Admin Panel
    └── Gestão de TTL (State Rent Maintenance)
```

### 5.1 Landing (Desktop) — Público

**Objetivo:** Apresentar proposta de valor e direcionar ao Connect Wallet ou exploração de mercados.

**Identidade Visual:** Família A (Modern)

**Componentes:**
- TopBar: logo | links (Markets, Voting, About) | "Connect Wallet"
- Hero: 2 colunas (esquerda: texto + CTA; direita: card de wallet)
- Metrics Bar: 3 cards com números grandes (Total Staked, Markets, Users)
- Footer: links úteis

**Estados:**
- Loading (skeleton para métricas)
- Wallet não instalada (CTA → "Instalar")
- Wallet conectada (CTA → "Go to Arena", mostrar endereço abreviado)

**Modais:**
- Wallet Provider Selector (Freighter, etc.)

---

### 5.2 Landing (Mobile)

**Diferenças:**
- Coluna única (stacked vertical)
- TopBar reduzida (menu hambúrguer)
- Botões full-width
- Sem métricas complexas (simplificar ou ocultar)

---

### 5.3 Onboarding / KYC Portal

**Objetivo:** Conformidade regulatória (Lei 14.790).

**Identidade Visual:** Variação "earthy" (compatível com A/B)

**Componentes:**
- Card central com stepper (Connect ✓ | KYC → | Ready)
- Banner: "Compliance required to stake"
- Container: iframe/SDK seguro com loading overlay
- Status: not_started | in_progress | pending | approved | rejected

**Fluxo:**
1. User conecta wallet (stepper ✓)
2. Abre iframe de KYC (Jumio/similar)
3. Aguarda revisão (pending)
4. Se aprovado: WS/SSE desbloqueia automaticamente
5. Se rejeitado: "Motivo: …" + CTA "Reenviar"

---

### 5.4 Termos & Compliance

**Objetivo:** Aceite legal explícito antes de ações reguladas.

**Identidade Visual:** Família B (Editorial/Paper)

**Layout:**
- Sidebar: menu de seções (Terms, Privacy, Risk, History)
- Conteúdo: seções numeradas com headings destacados
- Cards de destaque: "Responsible Staking", "Social Impact"
- Footer: checkboxes obrigatórios + botões (Download PDF, Decline, Accept)

**Regras:**
- "Accept and Proceed" só habilita quando checkboxes marcados
- Versionado: `terms_version_accepted`
- "Decline" bloqueia ações e retorna ao Landing

---

### 5.5 Arena de Mercados (Desktop + Mobile)

**Objetivo:** Navegação e seleção de mercados.

**Identidade Visual:** Família A (Modern)

**Desktop - Layout:**
- TopBar: search "Search markets…" + avatar
- Sidebar: categorias (All, Climate, Technology, Public Policy, Social Impact)
- Grid: 2–3 colunas de MarketCards

**MarketCard (conteúdo obrigatório):**
```
┌─────────────────────────┐
│ [categoria-chip]        │
│                         │
│ "What will happen to    │
│  climate in 2030?"      │
│                         │
│ YES: 65% | NO: 35%      │
│ [████████░░]            │
│                         │
│ Vol: 14,500 XLM         │
│ [View Details →]        │
└─────────────────────────┘
```

**Status Badges:** Open | Locked | Resolved

**Mobile - Layout:**
- Categorias em tabs horizontais
- Lista de 1 coluna
- Search em input fullwidth

---

### 5.6 Detalhe do Mercado (Core)

**Objetivo:** Explicação completa + stake form sticky.

**Identidade Visual:** Família A

**Layout 2-coluna:**

**Esquerda (conteúdo):**
- Categoria + "Resolves: 2026-12-31"
- Pergunta grande (serif)
- Regras de resolução (explicação técnica + fonte)
- Card: probabilidade + volume
- Barra segmentada SIM/NÃO
- Chart (1D/1W/ALL buttons, estado ativo destacado)
- "Resolution Source" card + link "View Oracle Contract"

**Direita (sticky card):**
```
┌─────────────────────────┐
│ Stake on Outcome        │
├─────────────────────────┤
│                         │
│ ◉ YES  ○ NO             │
│                         │
│ Amount [____________]   │
│ Balance: 1000 XLM [MAX] │
│                         │
│ Est. Shares:    500     │
│ Potential Return: $120  │
│ Fee (2%): $2.40         │
│                         │
│ [Confirm Stake]         │
│                         │
│ ⚠ Terms & KYC required  │
└─────────────────────────┘
```

**Validação (CTA desabilita se):**
- Wallet desconectada
- KYC pendente (quando exigido)
- Termos não aceitos
- Market fechado/resolvido
- Amount inválido

**Anti-Hedge:**
- **Bloqueio:** lado oposto desabilitado + tooltip "Not allowed on this market"
- **Warning:** banner terracota + modal de confirmação

**Estados:**
- Pending TX: toast "Awaiting confirmation…"
- Failure: erro recuperável (retry)
- Incerto: timeout com instrução

**Modais:**
- Confirmação hedge (se aplicável)
- Review final (opcional, antes de wallet)

---

### 5.7 Fluxo Guiado de Stake (Wizard 4 Passos)

**Objetivo:** Reduzir complexidade.

**Passos:**
1. Selecionar mercado (busca/browse)
2. Configurar stake (outcome, amount, visualizar fee + retorno)
3. Assinar na wallet (tela focada, XDR visível)
4. Sucesso (resumo + links para Arena/Perfil)

**"Próximo" habilita apenas se etapa válida.**

---

### 5.8 Futarchy Voting (Quadratic)

**Objetivo:** Alocar créditos de voz para ONGs com custo quadrático.

**Identidade Visual:** Família A

**Layout:**
- Header: "Voice Credits" badge
- Banner: "Cost = votes²"
- Grid: cards de ONGs com slider 0–10
- Footer: "Allocating X of Y credits" + "Submit Votes"

**Regra:** allocatedCredits ≤ totalCredits (travar ou desabilitar)

---

### 5.9 Perfil / Reputação do Usuário

**Objetivo:** Performance + claims.

**Identidade Visual:** Variação "earthy"

**Componentes:**
- Métricas: Brier Score (gauge), Total Staked, Win Rate, Total Earned
- Tabs: Positions | History | Claims (com badge de contagem)
- Claims list: market, stake, payout, botão "Claim"

**Claim Flow:**
- build-claim → assinatura → pending → confirmado
- Prevenir double claim

---

### 5.10 Claim History + Impact Ledger

**Objetivo:** Transparência de claims e contribuição social.

**Identidade Visual:** Família B (Editorial)

**Componentes:**
- Métricas: Total Earned + Social Yield Contribution
- Tabela: Date | Market | Amount | Impact Contribution | Status | Explorer
- "View on-chain" link (quando houver tx_hash)

---

### 5.11 Projeto Directory

**Objetivo:** Descoberta de ONGs por causa.

**Identidade Visual:** Família C (Dashboard)

**Layout:**
- TopBar + SideBar
- Search "Search NGOs…"
- Tabs: All | Trending | Newest
- Chips de causa + "More Filters"
- Cards: imagem, tag, métricas, "View Markets"
- Botão "Propose Market" (exige permissão)

---

### 5.12 Perfil da ONG

**Objetivo:** Comprovação de confiança + transparência.

**Identidade Visual:** Família C com hero emerald escuro

**Componentes:**
- Hero: selo "Verified Impact Partner", logo, nome, métricas
- Timeline vertical: eventos com imagem, data, "Transaction Verified" (se on-chain)
- "Transparency" block: links (audit, treasury, certification)
- "Operations Base": mapa/local

---

### 5.13 Global Impact Feed / Ledger Público

**Objetivo:** Distribuições públicas + exportação.

**Identidade Visual:** Família C (glass-card)

**Componentes:**
- Métricas: Total Distributed, Markets Settled
- Filtros: causa, busca, time range, sort
- Lista/tabela: "open_in_new" links
- Botão Export (modal com formato: CSV, JSON, PDF)

---

### 5.14 Notifications Center

**Objetivo:** Eventos centralizados.

**Identidade Visual:** Família C

**Layout:**
- Unread (contador + "Mark all as read")
- Cards com CTAs: "View Resolution", "Claim Now", "Details"
- Past (grayscale)
- Bento: "Impact Summary" + "Unclaimed Rewards"

**Regra:** "Claim Now" deep-link para claim específico

---

### 5.15 Account Settings

**Objetivo:** Compliance, privacidade, segurança.

**Identidade Visual:** Família C

**Cards obrigatórios:**

```
┌─────────────────────────┐
│ Compliance              │
│ Monthly Stake Limit     │
│ 2,500 / 10,000 XLM     │
│ [████░░░░░░]           │
│ [Upgrade Tier]          │
└─────────────────────────┘

┌─────────────────────────┐
│ Privacy                 │
│ ◉ Public Visibility     │
│ ○ Private Mode          │
└─────────────────────────┘

┌─────────────────────────┐
│ Security                │
│ Linked Wallets:         │
│ • 0xAbc…123 [delete]    │
│ • 0xDef…456 [delete]    │
│ [Add Wallet]            │
│ [Enable 2FA]            │
└─────────────────────────┘

┌─────────────────────────┐
│ Organization (se ONG)   │
│ Status: Active          │
│ Member Since: 2024      │
│ Rank: Verified          │
│ [Export Compliance]     │
└─────────────────────────┘
```

**Regra:** Private Mode oculta no leaderboard/busca

---

### 5.16 Leaderboard

**Objetivo:** Ranking por acurácia + impacto.

**Identidade Visual:** Família C

**Layout:**
- Top 3 em cards (tiers: 🥇 🥈 🥉)
- Busca por address/ENS
- Filtro: 7d | all time
- Tabela de ranking

**Respeitar:** Private Mode (anonimizar/ocultar)

---

### 5.17 Help Center / FAQ

**Objetivo:** Suporte e conteúdo.

**Identidade Visual:** Família B (Editorial)

**Layout:**
- Hero "Knowledge Base" + search
- Sidebar: tópicos
- Accordions: FAQs
- CTA final: "Contact Support" / "Join Discord"

---

### 5.18 Página 404

**Objetivo:** Retorno seguro.

**Identidade Visual:** Família B

**Layout:**
- Mensagem editorial + ilustração
- CTA "Return to the Arena" + "Network Status"
- Footer simplificado

---

### 5.19 Admin Panel — Gestão de TTL (Keeper UI)

**Objetivo:** Manutenção de state rent na blockchain.

**Acesso:** role = admin

**Componentes:**
- Aba "State Rent Management"
- Tabela: contas/mercados expirando em <14 dias
- Botão "[Extend TTL in Batch]" (gera XDR gigantesco)
- Admin assina para manter dados vivos

---

## 6. Gestão de Erros de Interface

### 6.1 Erros Mapeados

#### **Erro: Rejeição de Assinatura**
```
Usuário fecha popup sem aprovar.

Ação Frontend:
- Remove imediatamente status "Carregando" do botão
- Toast: "Ação cancelada pelo usuário. Nenhum saldo foi descontado."
- Permite retry
```

#### **Erro: RPC Timeout (Rede Travada)**
```
User assinou, mas WS não respondeu em 30s.

Ação Frontend:
- NUNCA dizer "Falhou"
- Toast: "Network congested. Your transaction may still be 
          processing. Check history in a few minutes."
- Link para histórico
- Botão "Check Status"
```

#### **Erro: Saldo Insuficiente para Taxa (XLM Dust)**
```
Market asset OK, mas XLM para taxa insuficiente.

Ação Frontend:
- Bloqueia antes de abrir wallet
- Toast: "You need XLM to pay network fees. 
          Add 0.5 XLM to continue."
- Opção: "Learn More" → help center
```

#### **Erro: Compliance/KYC/Limite**
```
API retorna erro de conformidade.

Ação Frontend:
- Campo marcado com erro (amount/votes)
- Mensagem humana e descritiva
- CTA específica:
  - KYC pendente → "Go to KYC"
  - Limite atingido → "Upgrade Tier"
  - Termos não aceitos → "Accept Terms"
```

### 6.2 Padrão de Tratamento de Erros

```typescript
interface ApiError {
  code: string;        // 'INSUFFICIENT_BALANCE' | 'KYC_REQUIRED' | etc
  message: string;     // mensagem técnica
  userMessage: string; // mensagem legível
  action?: {           // CTA recomendada
    label: string;
    route?: string;
    callback?: () => void;
  };
}

// No componente:
this.stakeService.submitStake(data).subscribe({
  next: (result) => {
    // Sucesso
    this.showToast('Transaction confirmed!');
  },
  error: (apiError: ApiError) => {
    // Mapear erro
    this.showErrorToast(apiError.userMessage);
    
    if (apiError.action) {
      // Oferecer CTA
      this.showActionButton(apiError.action);
    }
  }
});
```

---

## 7. Padrões de Código e Arquitetura

### 7.1 Estrutura de Pastas (Angular)

```
src/
├── app/
│   ├── core/                    # Singletons
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── wallet.service.ts
│   │   │   ├── market.service.ts
│   │   │   ├── stake.service.ts
│   │   │   ├── vote.service.ts
│   │   │   ├── claim.service.ts
│   │   │   └── web3.service.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   ├── kyc.guard.ts
│   │   │   └── terms.guard.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   └── error.interceptor.ts
│   │   └── models/
│   │       ├── user.model.ts
│   │       ├── market.model.ts
│   │       ├── stake.model.ts
│   │       └── transaction.model.ts
│   │
│   ├── shared/                  # Componentes reutilizáveis
│   │   ├── components/
│   │   │   ├── buttons/
│   │   │   │   ├── primary-button.component.ts
│   │   │   │   ├── secondary-button.component.ts
│   │   │   │   └── icon-button.component.ts
│   │   │   ├── forms/
│   │   │   │   ├── amount-input.component.ts
│   │   │   │   └── wallet-selector.component.ts
│   │   │   ├── cards/
│   │   │   │   ├── market-card.component.ts
│   │   │   │   ├── metric-card.component.ts
│   │   │   │   └── ngo-card.component.ts
│   │   │   ├── modals/
│   │   │   │   ├── confirmation-modal.component.ts
│   │   │   │   ├── error-modal.component.ts
│   │   │   │   └── wallet-provider-selector.component.ts
│   │   │   └── layouts/
│   │   │       ├── sidebar.component.ts
│   │   │       ├── topbar.component.ts
│   │   │       └── footer.component.ts
│   │   ├── pipes/
│   │   │   ├── currency.pipe.ts
│   │   │   ├── address-truncate.pipe.ts
│   │   │   └── asset-symbol.pipe.ts
│   │   ├── directives/
│   │   │   ├── wallet-connected.directive.ts
│   │   │   ├── kyc-required.directive.ts
│   │   │   └── terms-required.directive.ts
│   │   └── shared.module.ts
│   │
│   ├── features/                 # Páginas e features
│   │   ├── landing/
│   │   │   ├── landing.component.ts
│   │   │   └── landing.module.ts
│   │   ├── onboarding/
│   │   │   ├── kyc/
│   │   │   └── onboarding.module.ts
│   │   ├── arena/
│   │   │   ├── market-list/
│   │   │   ├── market-detail/
│   │   │   ├── stake-form/
│   │   │   └── arena.module.ts
│   │   ├── voting/
│   │   │   ├── quadratic-voting/
│   │   │   └── voting.module.ts
│   │   ├── profile/
│   │   │   ├── user-profile/
│   │   │   ├── claim-history/
│   │   │   └── profile.module.ts
│   │   ├── directory/
│   │   │   ├── ngo-directory/
│   │   │   ├── ngo-detail/
│   │   │   └── directory.module.ts
│   │   ├── settings/
│   │   │   ├── account-settings/
│   │   │   └── settings.module.ts
│   │   ├── admin/
│   │   │   ├── ttl-management/
│   │   │   └── admin.module.ts
│   │   └── error-pages/
│   │       ├── not-found/
│   │       └── error.module.ts
│   │
│   ├── state/                    # NgRx / State Management
│   │   ├── user/
│   │   │   ├── user.actions.ts
│   │   │   ├── user.reducer.ts
│   │   │   ├── user.selectors.ts
│   │   │   └── user.effects.ts
│   │   ├── market/
│   │   ├── transaction/
│   │   └── index.ts
│   │
│   └── app-routing.module.ts
│   └── app.module.ts
│   └── app.component.ts
│
├── assets/
│   ├── icons/                    # Material Symbols ou SVG
│   ├── images/
│   └── logo/
│
├── styles/
│   ├── design-tokens.css         # CSS Variables
│   ├── typography.css
│   ├── animations.css
│   ├── responsive.css
│   └── global.css
│
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

### 7.2 Convenções de Código

```typescript
// Nomenclatura
- Funções/métodos: camelCase
- Classes: PascalCase
- Constantes: UPPER_SNAKE_CASE
- Observables: $terminator (e.g., user$, isLoading$)
- Interfaces: IPrefixed ou Type (e.g., IUser ou UserType)

// Docstrings (Google Style)
/**
 * Obtém o saldo da carteira conectada.
 * 
 * @param walletAddress - Endereço público da carteira
 * @returns Observable<number> - Saldo em stroops (10^-7 XLM)
 * @throws WalletNotConnectedException se wallet não estiver conectada
 * 
 * @example
 * this.walletService.getBalance(userAddress).subscribe(balance => {
 *   console.log(balance);
 * });
 */
getBalance(walletAddress: string): Observable<number> {
  // implementação
}

// Testes: Cobertura mínima 80%
describe('MarketService', () => {
  let service: MarketService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MarketService]
    });
    service = TestBed.inject(MarketService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  it('should fetch market by id', () => {
    const mockMarket = { id: '123', question: 'Will X happen?' };
    service.getMarketById('123').subscribe(market => {
      expect(market).toEqual(mockMarket);
    });
    
    const req = httpMock.expectOne('/api/markets/123');
    expect(req.request.method).toBe('GET');
    req.flush(mockMarket);
  });
});

// Commits: Conventional Commits
feat: add KYC integration with Jumio SDK
fix: prevent double claim submission
docs: update architecture documentation
refactor: simplify state management with NgRx
test: increase coverage to 85%
```

### 7.3 Tratamento de Estado (NgRx)

```typescript
// Actions
export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ jwt: string; profile: UserProfile }>()
);

export const stakeSubmitted = createAction(
  '[Stake] Submitted',
  props<{ marketId: string; outcome: 'YES' | 'NO'; amount: number }>()
);

// Reducer
export const userReducer = createReducer(
  initialState,
  on(loginSuccess, (state, { jwt, profile }) => ({
    ...state,
    auth: { logged_in: true, jwt, expires_at: ... },
    kyc: profile.kyc,
    limits: profile.limits,
  })),
  on(stakeSubmitted, (state) => ({
    ...state,
    transactions: [{...}, ...state.transactions],
    status: 'pending'
  }))
);

// Selector
export const selectUserProfile = createSelector(
  selectUserState,
  (state) => state.profile
);

// Effects
@Injectable()
export class AuthEffects {
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginAction),
      switchMap(({ nonce, signature }) =>
        this.authService.authenticate(nonce, signature).pipe(
          map(({ jwt, profile }) =>
            loginSuccess({ jwt, profile })
          ),
          catchError(error =>
            of(loginFailure({ error: error.message }))
          )
        )
      )
    )
  );
}
```

---

## 8. Fluxo de WebSocket + Confirmação em Tempo Real

### 8.1 Arquitetura de Eventos

```typescript
interface TransactionEvent {
  id: string;                 // TX hash ou ID único
  user_address: string;
  transaction_type: 'stake' | 'claim' | 'vote' | 'link_wallet';
  market_id?: string;
  amount?: number;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
  block_hash?: string;        // Quando confirmado
  block_number?: number;
}

interface WebSocketMessage {
  event: 'transaction_confirmed' | 'balance_updated' | 'kyc_approved' | 'market_resolved';
  data: TransactionEvent | BalanceUpdate | KycApprovedEvent | MarketResolvedEvent;
}

// Serviço Angular
@Injectable()
export class RealtimeService {
  private ws: WebSocket;
  public events$ = new Subject<WebSocketMessage>();
  
  connect(jwt: string, userAddress: string): void {
    this.ws = new WebSocket(`wss://api.stakegood.com/ws?token=${jwt}`);
    
    this.ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.events$.next(message);
    };
    
    this.ws.onerror = () => {
      // Reconectar com backoff exponencial
      this.attemptReconnect();
    };
  }
}

// Uso no componente
this.realtimeService.events$.pipe(
  filter(msg => msg.event === 'transaction_confirmed'),
  tap(msg => {
    this.updateBalanceLocal();
    this.showToast('Transaction confirmed!');
  })
).subscribe();
```

### 8.2 Optimistic UI Pattern

```typescript
interface LocalTransaction {
  id: string;                 // Gerado localmente
  status: 'optimistic' | 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
  data: {
    marketId: string;
    outcome: 'YES' | 'NO';
    amount: number;
  };
  txHash?: string;            // Quando confirmado
}

// Armazenar localmente (localStorage ou IndexedDB)
private pendingTransactions: LocalTransaction[] = [];

submitStake(marketId, outcome, amount) {
  // 1. Otimista: criar entrada local
  const optimisticTx: LocalTransaction = {
    id: crypto.randomUUID(),
    status: 'optimistic',
    createdAt: new Date(),
    data: { marketId, outcome, amount }
  };
  
  this.pendingTransactions.push(optimisticTx);
  this.updateBalanceLocal(amount);     // Deduzir saldo otimisticamente
  this.showToast('Processing…');
  
  // 2. Enviar para API
  this.stakeService.submitStake(...).subscribe({
    next: (xdrResponse) => {
      // 3. Abrir carteira para assinar
      this.walletService.signXdr(xdrResponse.xdr).subscribe({
        next: (signedTx) => {
          optimisticTx.status = 'pending';
          // 4. Aguardar WS
        },
        error: (err) => {
          optimisticTx.status = 'failed';
          this.revertBalance(amount);
          this.showError('Signature rejected');
        }
      });
    },
    error: (err) => {
      optimisticTx.status = 'failed';
      this.revertBalance(amount);
      this.handleApiError(err);
    }
  });
}

// 5. Ao receber confirmação via WS
this.realtimeService.events$.pipe(
  filter(msg => msg.event === 'transaction_confirmed'),
  tap(msg => {
    const tx = this.pendingTransactions.find(t => t.id === msg.data.id);
    if (tx) {
      tx.status = 'confirmed';
      tx.txHash = msg.data.block_hash;
      this.pendingTransactions = this.pendingTransactions.filter(t => t.status !== 'confirmed');
      this.showToast('Confirmed! ✓');
    }
  })
).subscribe();

// Renderizar no histórico
get displayTransactions() {
  return [
    ...this.pendingTransactions,       // Otimistas + pendentes
    ...this.confirmedTransactions       // Confirmadas
  ];
}
```

---

## 9. Segurança

### 9.1 Princípios

1. **Nunca montar transação no frontend** → API gera XDR
2. **JWT com expiração** → Refresh tokens no interceptor
3. **HTTPS obrigatório** → Sem conexões inseguras
4. **Content Security Policy (CSP)** → Prevenir XSS
5. **CORS restrito** → Apenas domínios confiáveis
6. **Validação dupla** → Frontend + Backend

### 9.2 Headers de Segurança

```typescript
// interceptor
export class SecurityInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Garantir HTTPS
    if (req.url.startsWith('http://')) {
      throw new Error('Insecure connection not allowed');
    }
    
    // Adicionar headers
    req = req.clone({
      setHeaders: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
      }
    });
    
    return next.handle(req);
  }
}
```

---

## 10. Performance e Otimizações

### 10.1 Code Splitting

```typescript
// app-routing.module.ts
const routes: Routes = [
  { path: 'landing', component: LandingComponent },
  {
    path: 'arena',
    loadChildren: () => import('./features/arena/arena.module').then(m => m.ArenaModule)
  },
  {
    path: 'voting',
    loadChildren: () => import('./features/voting/voting.module').then(m => m.VotingModule)
  }
];
```

### 10.2 Change Detection (OnPush)

```typescript
@Component({
  selector: 'app-market-card',
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketCardComponent {
  @Input() market: Market;
  
  constructor(private cdr: ChangeDetectorRef) {}
}
```

### 10.3 Virtual Scrolling (Listas Grandes)

```typescript
// market-list.component.ts
<cdk-virtual-scroll-viewport itemSize="100">
  <app-market-card 
    *cdkVirtualFor="let market of markets$ | async"
    [market]="market">
  </app-market-card>
</cdk-virtual-scroll-viewport>
```

---

## 11. Testes

### 11.1 Estratégia de Testes

```
Unit Tests (80%+ cobertura)
  ├── Services (auth, market, stake, vote, claim)
  ├── Guards (auth, kyc, terms)
  ├── Pipes (currency, address)
  └── Directives

Integration Tests
  ├── Fluxo de login completo
  ├── Fluxo de stake completo
  └── Fluxo de claim completo

E2E Tests (Cypress)
  ├── Landing → Connect → KYC → Stake → Claim
  ├── Erro scenarios (saldo insuficiente, etc)
  └── Otimistic UI (pendente → confirmado)

Visual Regression
  └── Screenshots de cada tela
```

### 11.2 Exemplo: Teste de Serviço

```typescript
describe('StakeService', () => {
  let service: StakeService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StakeService]
    });
    service = TestBed.inject(StakeService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  it('should submit stake and return XDR', () => {
    const req = { marketId: '123', outcome: 'YES', amount: 100 };
    const mockResponse = { xdr: 'AAAAAgAA...' };
    
    service.submitStake(req).subscribe(response => {
      expect(response.xdr).toBe(mockResponse.xdr);
    });
    
    const httpReq = httpMock.expectOne('/api/stakes');
    expect(httpReq.request.method).toBe('POST');
    httpReq.flush(mockResponse);
  });
});
```

---

## 12. Monitoramento e Logging

### 12.1 Logging Strategy

```typescript
@Injectable()
export class LoggerService {
  log(message: string, data?: any) {
    console.log(`[${new Date().toISOString()}] ${message}`, data);
    // Enviar para backend (Sentry, LogRocket, etc)
  }
  
  error(message: string, error?: Error) {
    console.error(`[ERROR] ${message}`, error);
    // Enviar para Sentry ou similar
    this.reportError({
      message,
      stack: error?.stack,
      timestamp: new Date()
    });
  }
}

// Uso
this.logger.log('User connected', { address: userAddress });
this.logger.error('Stake submission failed', error);
```

### 12.2 Métricas Importantes

- Tempo de login
- Taxa de sucesso de transações
- Tempo de confirmação (média)
- Taxa de erro de rede
- Bounce rate no landing
- Taxa de abandono do KYC

---

## 13. Roadmap e Próximos Passos

### Fase 1 (MVP)
- [ ] Landing + Connect Wallet
- [ ] KYC integration (Jumio)
- [ ] Arena (browse mercados)
- [ ] Market Detail + Stake Form
- [ ] Optimistic UI + WS
- [ ] Perfil + Claim History

### Fase 2
- [ ] Futarchy Voting (Quadratic)
- [ ] Project Directory + ONG Profiles
- [ ] Global Impact Ledger
- [ ] Leaderboard
- [ ] Notificações

### Fase 3
- [ ] Admin Panel (TTL Management)
- [ ] Advanced Analytics
- [ ] Mobile app (React Native)
- [ ] Internacionalização (i18n)

---

## 14. Glossário

| Termo | Definição |
|-------|-----------|
| **XDR** | eXternal Data Representation; formato binário de transação Stellar |
| **Optimistic UI** | Atualizar UI imediatamente antes de confirmação server |
| **Anti-Hedge** | Proteção contra apostas em resultados opostos |
| **Soroban** | Smart Contract platform na rede Stellar |
| **KYC** | Know Your Customer; verificação de identidade |
| **WS** | WebSocket para eventos em tempo real |
| **SSE** | Server-Sent Events (alternativa a WS) |
| **TTL** | Time To Live; expiração de dados na blockchain |
| **Quadratic Voting** | Sistema onde custo de votos = votos² |
| **Social Yield** | Rendimentos direcionados a ONGs/impacto |
| **Brier Score** | Métrica de acurácia de previsões |
| **Stroops** | Unidade mínima do XLM (10^-7) |

---

## 📝 Changelog

| Versão | Data | Alterações |
|--------|------|-----------|
| 1.0 | 2026-04-18 | Versão inicial completa |

---

**Documento Controlado**  
Mantido por: StakeGood Frontend Team  
Próxima Revisão: 2026-07-18  
Status: Active Development