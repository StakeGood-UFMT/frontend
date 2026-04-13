# Regras de Engenharia de Interface e Navegação (StakeGood Frontend)

**Objetivo deste documento:** o Frontend (ex.: Angular, mas aplicável a qualquer stack) será responsável por duas missões críticas:  
**(1)** Orquestrar a comunicação entre o usuário (via extensão de carteira), a API (ex.: NestJS) e a rede Stellar (Soroban), e  
**(2)** Mascarar a latência da blockchain através de **Interfaces Otimistas (Optimistic UI)**, garantindo que o usuário não abandone a plataforma enquanto aguarda confirmação de rede.

> Nota de consistência: nas telas mapeadas o ativo aparece como **XLM**, mas o produto pode operar com outros ativos (ex.: USDC). O frontend deve ser **asset-agnostic**: sempre renderizar `assetSymbol`/`decimals` vindos do backend/metadata do market.

## 1. Arquitetura de Integração (Como o Front conversa com o resto)

O Frontend obedece a um fluxo de delegação estrita. Ele não confia em si mesmo para regras financeiras.

### 1.1 O Fluxo de Login Web3 (sem senhas)
1. O usuário clica em **“Connect Wallet”**.
2. O frontend detecta se a carteira (ex.: **Freighter**) está instalada.
   - Se não estiver: o botão vira **“Instalar Carteira”** e redireciona para a loja.
3. O frontend solicita a **chave pública** (public key).
4. O frontend pede à API um **nonce** (desafio).
5. O frontend abre o popup da carteira para o usuário **assinar o nonce**.
6. O frontend envia assinatura para a API.
7. A API retorna **JWT** + “snapshot” do perfil (KYC, tier, limites, role, flags de termos).

**Regra de UI obrigatória:** o botão deve refletir estados:
- `Connect Wallet` → `Checking wallet…` → `Approve signature in wallet…` → `Connected` (ou erro com retry).

### 1.2 O Fluxo de Delegação XDR (Transações)
1. Quando o usuário decide agir (apostar, sacar, votar, vincular wallet etc.), o frontend coleta apenas a **intenção**:
   - Ex.: `market_id`, `outcome`, `amount`, `votes`.
2. O frontend envia intenção para a API.
3. A API valida (KYC/limites/fase do market/anti-hedge etc.) e devolve um **XDR** (payload binário) para assinatura.
4. O frontend passa o XDR para a carteira; o usuário revisa e aprova.
5. O frontend passa para o estado **pending** e aguarda confirmação por WS/SSE.

**Regra de segurança:** o frontend **não monta** a transação final.

### 1.3 A Magia do Tempo Real (WebSockets / SSE) + UI Otimista
A Stellar/Soroban pode ter confirmação em segundos, mas com variação. O frontend deve:
- iniciar um canal de eventos (WS/SSE) após login;
- ao enviar tx, aplicar **Optimistic UI**:
  - desabilitar botões/inputs críticos;
  - exibir toast “Aguardando confirmação…”;
  - registrar uma entrada “pendente” no histórico local.
- ao receber confirmação via WS:
  - atualizar saldo, posição, claim e/ou votos;
  - remover estado pendente e marcar “confirmado”.

**Timeout (estado incerto):** se WS não confirmar em X segundos, nunca declarar “falhou” como definitivo. Mostrar:  
“Rede congestionada. Sua transação pode ainda estar sendo processada. Verifique seu histórico.”

### 1.4 Guardas de rota (Gating) por estado do usuário
O frontend deve manter e aplicar:
- `wallet`: disconnected/connecting/connected + address + balance + network.
- `auth`: logged_in/logged_out + expiração JWT.
- `kyc`: not_started/in_progress/pending/approved/rejected + tier.
- `terms`: accepted_by_version.
- `limits`: monthly_limit, consumed, remaining.
- `role`: user / ngo_partner / admin.

**Regras:**
- Sem wallet: permitir telas públicas; ações de stake/claim/vote pedem conexão.
- Sem KYC aprovado: bloquear stake (e, se exigido, vote/claim) e redirecionar para KYC.
- Sem aceite de termos: bloquear ações e redirecionar para Terms.
- `role=ngo_partner`: habilitar portal institucional (Settings/Compliance/Report).

---

## 2. Identidade Visual e Componentização (regras globais para reconstrução)

> O sistema mapeado apresenta 3 “famílias” visuais. O frontend deve suportar:
> - **Tema por seção** (design tokens) ou
> - **Subprodutos** dentro do mesmo app (ex.: “Arena” vs “The Organic Ledger”).

### 2.1 Família Visual A — Modern (Inter + verde vibrante)
- Primária: verde (ex.: `#11D48A`)
- Fundo: `#F6F8F7`
- Acento negativo: terracota (ex.: `#CC5A37`)
- Cards brancos com borda sutil, sombras suaves, radius médio.

### 2.2 Família Visual B — Editorial / Paper (Newsreader + Plus Jakarta)
- Fundo “papel”: `#FCF9F3`
- Primária: verde floresta (ex.: `#133E2F`)
- Secundária: terracota (ex.: `#A43D1C`)
- TopBar translúcida com blur (“glass”), sombra editorial, tipografia serif nos títulos.

### 2.3 Família Visual C — Dashboard (Public Sans + stone/emerald)
- Neutros “stone” + acentos “emerald”
- SideBar fixa, cards em “bento grid”, botões pílula.

---

## 3. Mapeamento Exaustivo de Telas e Componentes (nível “reconstrução”)

> Abaixo, cada tela segue um formato fixo (Objetivo → Layout → Componentes → Regras → Estados → Modais).  
> Isso serve para reconstruir o frontend **sem depender de linguagem/framework**.

### 3.1 Landing (Desktop) — público
**Objetivo:** apresentar proposta de valor e levar o usuário a **conectar wallet** e/ou **explorar mercados**.

**Referência visual (exemplo):**  
![](stitch_assets/landing_page.png)

**Identidade visual:** **Família A (Modern)**  
- Fundo: `#F6F8F7`; primário: `#11D48A`; texto: `#111815`; bordas suaves.
- Tipografia: Inter; ícones Material Symbols Outlined.

**Layout:**
- TopBar fixa com:
  - marca à esquerda
  - links (Markets, Voting, About)
  - botão primário “Connect Wallet”.
- Hero em 2 colunas:
  - Coluna esquerda: título grande (com destaque em verde) + parágrafo de explicação + CTA secundária “Explore Markets”.
  - Coluna direita: card de “Connect to …” com ícone de wallet e botão “Connect Freighter”.
- “Metrics bar” abaixo do hero com 3 indicadores (cards/colunas).
- Footer minimal.

**Componentes (detalhe):**
- Botão primário: altura 40–48px; radius 12–16px; hover com verde mais escuro.
- Card de wallet: borda 1px, sombra suave, radius 16px; ícone grande central; texto curto de “segurança”.
- Cards de métrica: número grande, unidade menor e cinza; títulos em uppercase ou semi-bold.

**Regras de UI:**
- Se wallet não instalada: CTA muda para “Instalar Wallet” e linka para a store.
- Se `wallet.connected`: mostrar estado conectado (address abreviada + saldo) e substituir CTA por “Go to Arena”.
- Métricas devem suportar loading (skeleton) e atualização em tempo real (se existir endpoint público).

**Estados:**
- Loading (métricas), erro (conexão), conectado/desconectado.

**Modais/overlays (recomendado):**
- Modal/Drawer “Selecionar provedor de wallet” (Freighter, etc.) com estados “conectando” e “erro”.

---

### 3.2 Landing (Mobile)
**Objetivo:** mesmo da landing desktop, com hierarquia otimizada para toque.

**Referência visual (exemplo):**  
![](stitch_assets/landing_page_mobile.png)

**Layout:**
- TopBar reduzida (sem links ou com menu).
- Hero em coluna (texto → card de wallet).
- Botões full width.

**Regras:** idênticas à desktop.

---

### 3.3 Onboarding / KYC (Portal de Conformidade)
**Objetivo:** impedir ações reguladas até o usuário completar KYC.

**Referências visuais (exemplos):**  
![](stitch_assets/onboarding_conectar_carteira.png)  
![](stitch_assets/onboarding_kyc.png)  
![](stitch_assets/onboarding_valida_o_kyc.png)  
![](stitch_assets/onboarding_finalizar_perfil.png)  
![](stitch_assets/perfil_primeiro_acesso.png)

**Identidade visual:** variação “earthy” (ainda compatível com A/B)  
- Fundo off-white; verde floresta; avisos em terracota; card central.

**Layout:**
- Card central com:
  - Header com botão voltar + “Account Setup”.
  - Stepper (Connect ✓, KYC atual, Ready futuro).
  - Banner regulatório (Lei 14.790).
  - Container de KYC (iframe/SDK) com overlay de loading (“Initializing secure verification… / Powered by …”).

**Regras de UI:**
- Se `kyc.status != approved`: bloquear stake e voto e redirecionar para este fluxo quando tentar acessar telas bloqueadas.
- WS/SSE deve poder destravar automaticamente (approved → redirect para Arena).
- Se `rejected`: mostrar motivo + CTA “Reenviar documentos”/“Contact Support”.

**Estados:**
- loading iframe, pending review, approved, rejected, network error.

---

### 3.4 Termos & Compliance (Aceite explícito)
**Objetivo:** coletar aceite de termos/risco/privacidade antes de liberar ações.

**Referências visuais (exemplos):**  
![](stitch_assets/termos_e_condi_es_compliance.png)  
![](stitch_assets/onboarding_termos_de_uso.png)

**Identidade visual:** **Família B (Paper/Editorial)**  
- Fundo `#FCF9F3`; primário `#133E2F`; secundário `#A43D1C`.
- Títulos Newsreader (serif), corpo Plus Jakarta Sans.
- TopBar translúcida com blur e sombra editorial.

**Layout:**
- Duas colunas:
  - Sidebar “Legal Framework” com menu (Terms, Privacy, Risk, Update History) e card informativo/selo.
  - Conteúdo principal com:
    - título grande, data “Last updated”
    - seções numeradas com headings destacados
    - cards de destaque (Responsible Staking / Social Impact)
    - bloco final com checkboxes e botões (Download PDF / Decline / Accept and Proceed)

**Regras de UI:**
- `Accept and Proceed` só habilita quando checkboxes obrigatórios estiverem marcados.
- Aceite deve ser por **versão** (persistir `terms_version_accepted`).
- `Decline` bloqueia ações reguladas e retorna para página segura (Landing/Arena read-only).

**Modais/overlays (opcional):**
- Confirmação ao “Decline”.
- Feedback “PDF gerado” ao baixar.

---

### 3.5 Arena de Mercados (Desktop)
**Objetivo:** navegar e selecionar mercados.

**Referência visual (exemplo):**  
![](stitch_assets/market_arena.png)

**Identidade visual:** **Família A (Modern)**.

**Layout:**
- TopBar com search “Search markets…” + avatar.
- Sidebar de categorias (All Markets, Climate, Technology, Public Policy, Social Impact).
- Grid responsivo de cards (2–3 colunas).

**MarketCard (conteúdo obrigatório):**
- chip de categoria
- volume (ex.: “Vol: 14,500 {ASSET}”)
- pergunta do mercado (1–2 linhas)
- linha SIM/NÃO com percentuais
- barra segmentada (verde SIM / terracota NÃO)

**Regras de UI:**
- Busca com debounce; empty state quando 0 resultados.
- Cards clicáveis navegam para Detalhe do Mercado.
- (Recomendado) status badges: Open / Locked / Resolved.

---

### 3.6 Arena de Mercados (Mobile)
**Layout:**
- Categorias viram tabs horizontais.
- Lista de 1 coluna.
- Search reduzida (top input ou ícone).

**Referência visual (exemplo):**  
![](stitch_assets/market_arena_mobile.png)

---

### 3.7 Detalhe do Mercado (Core) — com Stake Form sticky
**Objetivo:** explicar resolução e permitir stake.

**Referências visuais (exemplos):**  
![](stitch_assets/market_detail.png)  
![](stitch_assets/market_detail_mobile.png)

**Identidade visual:** **Família A (Modern)**.

**Layout:**
- Header minimalista sticky com:
  - botão voltar
  - marca
  - badge de saldo + ícone de perfil
- Duas colunas:
  - Esquerda (conteúdo):
    - categoria + “Resolves …”
    - pergunta grande
    - regras de resolução (texto explicativo com fonte/oráculo)
    - card de probabilidade atual + volume
    - barra SIM/NÃO
    - chart com botões 1D/1W/ALL (estado ativo destacado)
    - card “Resolution Source” + link “View Oracle Contract”
  - Direita (card sticky “Stake on Outcome”):
    - toggles SIM/NÃO em formato de cards
    - amount input com “Balance: …” e botão MAX
    - calculadora: Est. Shares, Potential Return, Fee (p.ex. 2% para ONGs)
    - CTA “Confirm Stake”
    - aviso de termos

**Regras de UI (validação):**
- Amount obrigatório, >0, <=saldo, <=limite mensal (se aplicável).
- Botão MAX usa `min(saldo, limite_restante)`.
- CTA desabilita se:
  - wallet desconectada
  - KYC pendente (quando exigido)
  - termos não aceitos (quando exigido)
  - market fechado/resolvido
  - amount inválido

**Anti-hedge (duas estratégias):**
- **Bloqueio:** se o contrato rejeita hedge, bloquear UI do lado oposto + tooltip.
- **Warning:** se permitido, mostrar banner terracota e abrir modal de confirmação.

**Estados:**
- pending tx: toast “Awaiting confirmation…” + bloquear inputs.
- failure: erro recuperável, permitir retry.
- estado incerto: timeout com instrução para checar histórico.

**Modais/overlays (recomendado):**
- Confirmação de hedge (quando aplicável).
- Confirmação final (review) antes de abrir wallet (opcional).

---

### 3.8 Fluxo guiado de Stake (Wizard 4 passos)
**Objetivo:** reduzir complexidade e guiar assinatura.
1) Selecionar mercado  
2) Configurar stake (SIM/NÃO, amount, fee, retorno)  
3) Assinar na wallet (tela focada)  
4) Sucesso (resumo + links para Arena/Perfil)

**Referências visuais (exemplos):**  
![](stitch_assets/1_sele_o_de_mercado.png)  
![](stitch_assets/2_configura_o_da_aposta.png)  
![](stitch_assets/3_assinatura_da_carteira.png)  
![](stitch_assets/4_confirma_o_e_sucesso.png)

**Regras:** mesmas validações do Detalhe do Mercado; “Próximo” só habilita se etapa válida.

---

### 3.9 Futarchy Voting (Quadratic) — Allocate Platform Fees
**Objetivo:** alocar créditos de voz para ONGs com custo quadrático.

**Referência visual (exemplo):**  
![](stitch_assets/futarchy_voting.png)

**Identidade visual:** **Família A (Modern)**.

**Layout:**
- Header sticky com botão voltar + badge “Voice Credits”.
- Banner explicando: custo = votos².
- Grid de cards de ONGs:
  - imagem, nome, descrição
  - “Votes” + número
  - slider 0–10 com fill verde
  - “Cost” com badge verde e fórmula “v²”
- Rodapé: “Allocating X of Y credits” + botão “Submit Votes”.

**Regras de UI:**
- Não permitir `allocatedCredits > totalCredits` (travar slider ou desabilitar submit).
- Votos são finais: modal de confirmação no submit.
- ONGs indisponíveis: card grayscale/opacity + slider disabled.

---

### 3.10 Perfil/Reputação do Usuário
**Objetivo:** mostrar performance e permitir claims.

**Referências visuais (exemplos):**  
![](stitch_assets/profile_reputation.png)  
![](stitch_assets/dashboard_profile_mobile.png)  
![](stitch_assets/1_pr_mios_dispon_veis.png)  
![](stitch_assets/2_assinatura_de_resgate.png)  
![](stitch_assets/3_resgate_conclu_do.png)

**Identidade visual:** variação “earthy” (serif para títulos + sans para corpo).

**Layout:**
- Header “Reputation Profile” + subtítulo.
- Métricas: Brier Score (gauge), Total Staked, Win Rate, Total Earned.
- Tabs: Positions / History / Claims (badge de contagem).
- Claims list: market, stake, payout, botão Claim.

**Regras de UI:**
- Claim usa build-claim → assinatura → pending → confirmado.
- Prevenir double claim.

---

### 3.11 Claim History (visão editorial) + links “View on-chain”
**Objetivo:** histórico transparente de claims e contribuição de impacto.

**Referências visuais (exemplos):**  
![](stitch_assets/claim_history_1.png)  
![](stitch_assets/claim_history_2.png)

**Identidade visual:** **Família B (Paper/Editorial)** (blur + tabela editorial).

**Layout:**
- Métricas: Total Earned + Social Yield Contribution.
- Tabela com colunas: Date, Market Source, Amount Claimed, Impact Contribution, Status, Explorer.

**Regras:**
- Sempre renderizar `impact_contribution` quando existir.
- Link “View on-chain” só aparece quando houver `tx_hash`/`explorer_url`.

---

### 3.12 Diretório de ONGs / Projetos (Project Directory)
**Objetivo:** descoberta e navegação por causa.

**Referências visuais (exemplos):**  
![](stitch_assets/ngo_directory_1.png)  
![](stitch_assets/ngo_directory_2.png)

**Identidade visual:** **Família C (Dashboard stone/emerald)**.

**Layout:**
- TopBar + SideBar.
- Busca “Search NGOs…”.
- Tabs All/Trending/Newest.
- Chips por causa + “More Filters”.
- Cards com imagem, tag de categoria, métricas e CTA “View Markets”.
- Botão “Propose Market”.

**Regras:**
- “More Filters” abre drawer/modal (desktop) ou bottom sheet (mobile).
- “Propose Market” exige permissão (role/reputação/KYC).

---

### 3.13 Perfil da ONG (Impact Timeline + Transparency)
**Objetivo:** comprovação de confiança e prestação de contas.

**Referência visual (exemplo):**  
![](stitch_assets/ngo_profile_detail.png)

**Identidade visual:** variação C com hero emerald escuro.

**Layout:**
- Hero com selo “Verified Impact Partner”, logo, nome grande, descrição, métricas.
- Timeline vertical (eventos com imagem, data, descrição, badge “Transaction Verified” quando houver).
- Bloco “Transparency” com links (audit, treasury, certification) e “Operations Base” com mapa/local.

**Regras:**
- Links abrem em nova aba.
- “Transaction Verified” exige referência on-chain.

---

### 3.14 Global Impact Feed (Ledger público) + Export
**Objetivo:** ledger público de distribuições e transparência.

**Referências visuais (exemplos):**  
![](stitch_assets/global_impact_feed_1.png)  
![](stitch_assets/global_impact_feed_2.png)

**Identidade visual:** C com “glass-card”.

**Layout:**
- Métricas: Total Distributed, Markets Settled.
- Filtros: causa, busca, time range, size, sort.
- Lista/tabela com “open_in_new”.
- Botão Export (com modal de formato).

**Regras:**
- Export gera arquivo (assíncrono recomendado) e exibe loading.
- “open_in_new” abre (ONG/market/explorer).

---

### 3.15 Notifications Center
**Objetivo:** centralizar eventos do sistema.

**Referência visual (exemplo):**  
![](stitch_assets/notifications_center.png)

**Identidade visual:** C (portal/dashboard).

**Layout:**
- Seção Unread (contador + “Mark all as read”).
- Cards com CTAs (View Resolution, Claim Now, Details).
- Seção Past (grayscale).
- Bento “Impact Summary” + “Unclaimed Rewards”.

**Regras:**
- “Claim Now” deep-linka para claim específico.
- “Mark all as read” atualiza UI instantaneamente e reconcilia com API.

---

### 3.16 Account Settings (Portal institucional/ONG)
**Objetivo:** compliance, limites, privacidade, wallets e segurança.

**Referência visual (exemplo):**  
![](stitch_assets/account_settings.png)

**Identidade visual:** C (stone/emerald).

**Layout (cards obrigatórios):**
- Compliance: Monthly Stake Limit (consumido/total) + barra + CTA “Upgrade tier”.
- Profile Privacy: toggles Public Visibility / Private Mode.
- Security: linked wallets (list, delete, add) + botão Enable 2FA.
- Organization Profile: status, member since, rank, botão Export Compliance Report.

**Regras:**
- Private Mode afeta leaderboard e busca pública.
- Remover wallet exige confirmação e regra “não remover a última” (recomendado).
- Export gera arquivo (loading + download).

---

### 3.17 Leaderboard
**Objetivo:** ranking por acurácia e impacto.

**Referência visual (exemplo):**  
![](stitch_assets/leaderboard_ranking.png)

**Identidade visual:** C (bento + tabela).

**Layout:**
- Top 3 em cards com tiers.
- Busca por address/ENS.
- Filtro de período (7d/all time).
- Tabela de ranking global.

**Regras:**
- Respeitar private mode (ocultar/anonimizar).

---

### 3.18 Help Center (FAQ)
**Objetivo:** suporte e conteúdo de produto.

**Referência visual (exemplo):**  
![](stitch_assets/central_de_ajuda_faq.png)

**Identidade visual:** B (editorial).

**Layout:**
- Hero “Knowledge Base” + busca.
- Sidebar de tópicos.
- Lista de FAQs em accordions.
- CTA final “Contact Support” / “Join Discord”.

---

### 3.19 Página 404
**Objetivo:** retorno seguro quando rota não existe.

**Referência visual (exemplo):**  
![](stitch_assets/p_gina_404_fora_da_trilha.png)

**Identidade visual:** B (editorial).

**Layout:**
- Mensagem editorial + ilustração.
- CTA “Return to the Arena” + link “Network Status”.
- Footer simplificado com links.

---

## 4. Gestão de Erros de Interface (Os Caminhos Tristes)

Um aplicativo Web3 sem tratamento de erros causa pânico financeiro no usuário. O Angular deve interceptar e traduzir cada falha:

* **Erro: Rejeição de Assinatura.** Se o usuário fecha o popup da carteira sem aprovar. O Angular deve remover imediatamente o status de "Carregando" do botão principal e exibir um aviso sutil: "Ação cancelada pelo usuário. Nenhum saldo foi descontado."
* **Erro: RPC Timeout (A rede travou).** O usuário assinou, mas o WebSocket não respondeu em 30 segundos. O Angular não pode dizer "Falhou", pois a transação pode ter sido minerada. O aviso deve ser: "A rede está congestionada. Sua aposta está sendo processada. Verifique seu histórico em alguns minutos."
* **Erro: Saldo Insuficiente para Taxa de Rede (XLM Dust).** Se a API avisar que a carteira tem o ativo do mercado, mas não tem o mínimo de XLM para taxa, o frontend bloqueia antes e orienta: “Você precisa de XLM para pagar a taxa da rede.”
* **Erro: Compliance/KYC/Limite.** Se a API retornar erro de conformidade, o frontend:
  - marca o campo (amount/votes) com erro,
  - exibe mensagem humana,
  - oferece CTA “Ir para KYC” / “Upgrade de Tier”.

## 5. O Componente de Manutenção Oculto (Keeper UI)
Embora os bots do NestJS devam fazer isso automaticamente, o Frontend de Administração (apenas acessível pela chave pública do Admin) deve ter uma aba chamada **"Gestão de TTL (State Rent)"**.
* O Angular consome uma rota da API listando contas e mercados que vão expirar na blockchain nos próximos 14 dias.
* O Admin terá um botão **[Estender TTL em Lote]**. Isso gerará um XDR gigantesco onde a carteira do administrador paga a taxa para manter os dados vivos na rede, garantindo que o Smart Contract não sofra um colapso de memória.
