# StakeGood Frontend - Issues & PRs Report

## Issues

### #24 - feat(core): integra├º├úo do Stellar Wallets Kit (SWK) no WalletService
- **State:** CLOSED
- **Created at:** 2026-04-22T13:40:29Z
- **Author:** heliocarrara

#### Description

**Contexto**
Atualmente, o sistema utiliza stubs para simular a conex├úo com a blockchain. Precisamos de uma integra├º├úo real e agn├│stica de carteira para permitir que o usu├írio interaja com a rede Stellar/Soroban.

**Objetivo**
Implementar o `@creit-tech/stellar-wallets-kit` para gerenciar a conex├úo multicarteira (Freighter, Albedo, xBull, WalletConnect) e prover m├®todos de assinatura de transa├º├Áes para o `TxService`.

**M├│dulos/Arquivos**
* `src/app/core/services/wallet.service.ts` (L├│gica central)
* `src/app/core/services/tx.service.ts` (Consumo da assinatura)
* `src/app/core/shell/components/top-bar/` (UI de trigger)

**Detalhes T├®cnicos (Lint AI)**
* **Library:** `@creit-tech/stellar-wallets-kit` + `stellar-sdk`.
* **State Management:** `BehaviorSubject` para `publicKey`.
* **Patterns:** Singleton Service para o Kit; Dependency Injection para o `TxService`.
* **Environment:** O kit deve ler o `networkPassphrase` do arquivo de `environment`.

**Plano de Implementa├º├úo**
1.  **Instala├º├úo:** Adicionar as depend├¬ncias e tipagens via npm.
2.  **Configura├º├úo:** Instanciar o Kit no `WalletService` garantindo que o modal use o tema visual do StakeGood.
3.  **Fluxo de Conex├úo:** Implementar `connect()`, capturar a `publicKey` e persistir o ID do provedor no `sessionStorage` para reconex├úo r├ípida.
4.  **Assinatura:** Criar m├®todo `sign(xdr: string)` que retorna o XDR assinado ou lan├ºa erro se a carteira for desconectada.
5.  **UI Update:** Vincular o bot├úo de conex├úo da TopBar ao novo fluxo.

**Crit├®rios de Aceite / Checklist de QA**
- [ ] Modal do Kit abre corretamente ao clicar em "Connect".
- [ ] O endere├ºo da carteira ├® exibido na interface ap├│s o login bem-sucedido.
- [ ] Ao desconectar na extens├úo da carteira, o app detecta (ou trata o erro na pr├│xima transa├º├úo).
- [ ] Transa├º├Áes enviadas via `TxService` solicitam assinatura via popup da carteira selecionada.

---

---

### #21 - FE-0 - Project Setup (Angular + Stellar SDK)
- **State:** CLOSED
- **Created at:** 2026-04-18T19:31:02Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:setup, type:chore, priority:high, sprint:1

#### Description
## Contexto
O frontend precisa da infraestrutura b├ísica para interagir com a Stellar Futurenet.

## Objetivo
Bootstrap do projeto Angular e integra├º├úo com Stellar SDK.

## M├│dulos/Arquivos
- src/app/core/services/stellar.service.ts
- package.json
- 	sconfig.json

## Detalhes T├®cnicos (Lint AI)
- **Dependencies:** @stellar/stellar-sdk, @albedo-link/intent.
- **Paths:** Alias @core, @shared no tsconfig.
- **Padr├úo:** Angular 17+ (Signals/Standalone).

## Plano de implementa├º├úo (passo a passo)
1. Configurar novo app Angular com roteamento e CSS vanilla.
2. Instalar SDK da Stellar.
3. Criar StellarService para abstrair chamadas ao Horizon/Soroban.
4. Configurar environments (testnet/futurenet).

## Crit├®rios de aceite / Checklist de QA
- [ ] 
g serve rodando sem erros.
- [ ] Conex├úo com RPC Stellar validada no bootstrap.


---

### #20 - FE-18 - Propose Market (gating + formul├írio + submit)
- **State:** OPEN
- **Created at:** 2026-04-18T16:22:54Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:core, type:feature, parallel:yes, priority:medium, sprint:3

#### Description
## Contexto
Usu├írios verificados podem sugerir novos mercados para a plataforma.

## Objetivo
Interface para submiss├úo de propostas de mercados.

## M├│dulos/Arquivos
- src/app/features/proposals/pages/propose-market/
- src/app/features/proposals/services/proposal.service.ts

## Detalhes T├®cnicos (Lint AI)
- **Forms:** Reactive Forms.
- **Logic:** Gating por KYC (AuthGuard).
- **Endpoint:** POST /api/v1/proposals.

## Plano de implementa├º├úo (passo a passo)
1. Criar formul├írio com campos vinculados ├á spec de Mercado.
2. Implementar l├│gica de submiss├úo integrada com a API do Backend.
3. Feedback visual de sucesso ou erro (via SnackBar/Toast).

## Crit├®rios de aceite / Checklist de QA
- [ ] Formul├írio valida campos obrigat├│rios.
- [ ] Apenas usu├írios logados e com KYC aprovado acessam a p├ígina.


---

### #19 - FE-17 - Help Center + Terms (versionado) + 404
- **State:** OPEN
- **Created at:** 2026-04-18T16:22:53Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:ux, type:feature, parallel:yes, priority:medium, sprint:3

#### Description
## Contexto
Rotas institucionais e tratamento de erros de navega├º├úo.

## Objetivo
Implementar Help Center, Termos e P├ígina 404.

## M├│dulos/Arquivos
- src/app/features/static/pages/help-center/
- src/app/features/static/pages/terms/
- src/app/features/static/pages/not-found/

## Detalhes T├®cnicos (Lint AI)
- **Rotas:** help, 	erms, ** (curinga).
- **Componentes:** Standalone components.

## Plano de implementa├º├úo (passo a passo)
1. Criar componentes b├ísicos de UI para cada p├ígina.
2. Configurar o roteador global para capturar erros 404.
3. Estilizar conforme o sistema de design ( Family C).

## Crit├®rios de aceite / Checklist de QA
- [ ] Navegar para rota inexistente abre a p├ígina 404.
- [ ] Links institucionais no footer funcionando.


---

### #18 - FE-16 - Leaderboard (Top3 + tabela + filtros + private mode)
- **State:** OPEN
- **Created at:** 2026-04-18T16:22:52Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:ux, type:feature, parallel:yes, priority:medium, sprint:3

#### Description
**Contexto**
- Leaderboard depende de reputa├º├úo e precisa respeitar privacidade.

**Objetivo**
- Implementar tela de ranking com Top 3 e tabela paginada.

**Racional (por que isso existe)**
- **Gamifica├º├úo/retenc╠ºa╠âo:** incentiva participa├º├úo e melhora engajamento.
- **Privacidade:** precisa respeitar Private Mode para n├úo vazar dados.

**Escopo**
- UI + consumo de endpoint.

**P├íginas e Componentes**
- **P├íginas:** `/leaderboard`
- **Componentes/Arquivos:** `LeaderboardPage`, `Top3Cards`, `LeaderboardTable`.

**Padr├úo de Layout e Cores**
- Fam├¡lia C (bento grid).

**Valida├º├Áes**
- Private mode: ocultar/anonimizar user.

**API**
- `GET /api/v1/leaderboard?range=7d|all&q=...`

**Detalhes T├®cnicos (Lint AI)**
- **Path:** `src/app/features/leaderboard/`
- **Privacy:** Se `user.privacy_mode === true`, exibir como "Anonymous User" e ocultar avatar.
- **Visual:** Top 3 em cards destacados no topo (Bento Grid).

**Crit├®rios de Aceite**
- Busca, filtro e pagina├º├úo funcionam; private mode aplicado.

**Checklist**
- [ ] Top3 renderiza
- [ ] Tabela paginada
- [ ] Private mode

**Git (Branch e PR)**
- **Branch:** `feature/FE-16-leaderboard`
- **Commits:** `feat(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** Sim
- **Depende de:** BE leaderboard endpoint

---

### #17 - FE-15 - Admin Panel (Keeper TTL + Distribute Impact)
- **State:** OPEN
- **Created at:** 2026-04-18T16:22:52Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:setup, type:feature, parallel:no, priority:high, sprint:3

#### Description
**Contexto**
- Opera├º├úo do protocolo (TTL + distribui├º├úo) exige UI administrativa segura.

**Objetivo**
- Criar painel admin com a├º├Áes de keeper e distribui├º├úo de impacto.

**Racional (por que isso existe)**
- **Opera├º├úo Soroban:** TTL/state rent exige manuten├º├úo real.
- **Fechamento do ciclo:** distribui├º├úo de impacto precisa ocorrer e ser audit├ível.
- **Seguran├ºa:** UI separada por role reduz risco operacional.

**Escopo**
- UI/admin flows; sem alterar l├│gica do contrato.

**Objetivo detalhado**
- Listar markets eleg├¡veis.
- Selecionar markets e chamar batch bump TTL.
- Executar distribute impact por market com confirma├º├úo.

**P├íginas e Componentes**
- **P├íginas:** `/admin/keeper`, `/admin/markets`
- **Componentes/Arquivos:** `AdminGuard`, `KeeperTTLTable`, `DistributeImpactButton`.

**Padr├úo de Layout e Cores**
- Fam├¡lia C; a├º├Áes perigosas devem ter confirma├º├úo e destaque (warning).

**Valida├º├Áes**
- Somente `role=admin`.
- Confirma├º├úo antes de executar a├º├Áes.

**API**
- `POST /api/v1/admin/keeper/batch-bump-ttl`
- `POST /api/v1/admin/markets/{id}/distribute-impact`

**Crit├®rios de Aceite**
- Admin consegue executar a├º├Áes e ver status por market.

**Checklist**
- [ ] Role guard
- [ ] Status por item
- [ ] Confirma├º├úo em a├º├Áes cr├¡ticas

**Git (Branch e PR)**
- **Branch:** `feature/FE-15-admin-panel`
- **Commits:** `feat(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** N├úo
- **Depende de:** BE admin/keeper endpoints + SC batch_bump_ttl/distribute

---

### #16 - FE-14 - Account Settings (privacy + wallets + 2FA + report)
- **State:** OPEN
- **Created at:** 2026-04-18T16:22:51Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:core, type:feature, parallel:yes, priority:high, sprint:3

#### Description
**Contexto**
- Settings consolida compliance/privacidade/seguran├ºa e afeta leaderboard e exposi├º├úo p├║blica.

**Objetivo**
- Implementar Settings com toggles, linked wallets, 2FA e export de compliance report.

**Racional (por que isso existe)**
- **Conformidade:** limites e relat├│rios para o usu├írio/ONG.
- **Privacidade:** respeitar ÔÇ£Private ModeÔÇØ em features p├║blicas.
- **Seguran├ºa:** 2FA reduz risco de conta comprometida (mesmo em app Web3, h├í dados e prefer├¬ncias off-chain).

**Escopo**
- UI + integra├º├úo com backend; sem implementar backend de 2FA aqui.

**Objetivo detalhado**
- Mostrar limite mensal e consumo.
- Toggles Public Visibility / Private Mode.
- Listar wallets; remover com confirma├º├úo; adicionar nova.
- Fluxo 2FA enable/verify.

**P├íginas e Componentes**
- **P├íginas:** `/settings`
- **Componentes/Arquivos:** `SettingsPage`, `PrivacyToggle`, `LinkedWallets`, `TwoFactorSetup`, `ComplianceReportExport`.

**Padr├úo de Layout e Cores**
- Fam├¡lia C; cards com radius alto; se├º├úo security pode usar fundo escuro.

**Valida├º├Áes**
- Bloquear remo├º├úo da ├║ltima wallet (regra do produto).
- Validar c├│digo 2FA no verify.

**API**
- `GET /api/v1/users/me/settings`
- `PATCH /api/v1/users/me/privacy`
- `POST /api/v1/users/me/2fa/enable`
- `POST /api/v1/users/me/2fa/verify`
- `POST /api/v1/users/me/compliance-report/export`
- Wallet link/remove endpoints (conforme backend).

**Crit├®rios de Aceite**
- Toggling persiste e reflete no estado.
- 2FA habilita e valida.
- Export gera arquivo e baixa.

**Checklist**
- [ ] Privacy toggles
- [ ] Wallets list + confirm delete
- [ ] 2FA enable/verify
- [ ] Export report

**Git (Branch e PR)**
- **Branch:** `feature/FE-14-settings`
- **Commits:** `feat(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** Sim
- **Depende de:** BE settings/2fa/export

---

### #15 - FE-13 - Notifications Center
- **State:** OPEN
- **Created at:** 2026-04-18T16:22:50Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:ux, type:feature, parallel:yes, priority:medium, sprint:3

#### Description
**Contexto**
- Notifica├º├Áes conectam eventos on-chain/worker com a├º├Áes do usu├írio (claim/resolution).

**Objetivo**
- Implementar central de notifica├º├Áes com unread/past e CTAs.

**Racional (por que isso existe)**
- **Reten├º├úo:** traz o usu├írio de volta quando um evento relevante ocorre.
- **Convers├úo:** CTAs direto para claim/resolution reduzem passos.

**Escopo**
- UI + integra├º├úo com endpoints e WS.

**Objetivo detalhado**
- Listar unread/past.
- Marcar como lidas.
- Deep links (claim/market).

**P├íginas e Componentes**
- **P├íginas:** `/notifications`
- **Componentes/Arquivos:** `NotificationsPage`, `NotificationCard`.

**Padr├úo de Layout e Cores**
- Fam├¡lia C (dashboard). Past em grayscale/opacity.

**Valida├º├Áes**
- N/A.

**API**
- `GET /api/v1/notifications`
- `POST /api/v1/notifications/mark-all-read`
- `POST /api/v1/notifications/{id}/read`
- WS: `notification_created`

**Crit├®rios de Aceite**
- Unread/past coerente.
- CTAs navegam corretamente.

**Checklist**
- [ ] Mark all read
- [ ] Read individual
- [ ] Deep links

**Git (Branch e PR)**
- **Branch:** `feature/FE-13-notifications`
- **Commits:** `feat(frontend): ...`, `test(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** Sim
- **Depende de:** BE notifications

---

### #14 - FE-12 - NGO Directory + NGO Profile (timeline + transparency)
- **State:** OPEN
- **Created at:** 2026-04-18T16:22:50Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:core, type:feature, parallel:yes, priority:high, sprint:3

#### Description
**Contexto**
- Diret├│rio e perfil de ONG s├úo centrais para transpar├¬ncia e descoberta.

**Objetivo**
- Implementar directory e detalhe de ONG conforme prints.

**Racional (por que isso existe)**
- **Confian├ºa:** usu├írios precisam ver ÔÇ£quem recebeÔÇØ e como comprova impacto.
- **Descoberta:** facilita navega├º├úo por causa/projeto.

**Escopo**
- UI + integra├º├úo de leitura; sem ÔÇ£Propose MarketÔÇØ aqui (FE-18).

**Objetivo detalhado**
- Directory com filtros (cause, trending/newest).
- Perfil com timeline e links de transpar├¬ncia (audit/treasury/certification).

**P├íginas e Componentes**
- **P├íginas:** `/ngos`, `/ngos/:id`
- **Componentes/Arquivos:** `NgoDirectoryPage`, `NgoCard`, `NgoProfilePage`, `Timeline`.

**Padr├úo de Layout e Cores**
- Fam├¡lia C (dashboard) para directory; hero emerald escuro no profile.

**Valida├º├Áes**
- Tratar ÔÇ£not foundÔÇØ (404) e lista vazia.

**API**
- `GET /api/v1/ngos`
- `GET /api/v1/ngos/{id}`
- `GET /api/v1/ngos/{id}/timeline`

**Crit├®rios de Aceite**
- Navega├º├úo e renderiza├º├úo corretas.
- Links abrem em nova aba.

**Checklist**
- [ ] Filtros directory
- [ ] Timeline com tx_hash
- [ ] Links transpar├¬ncia

**Git (Branch e PR)**
- **Branch:** `feature/FE-12-ngos`
- **Commits:** `feat(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** Sim
- **Depende de:** BE NGOs endpoints

---

### #13 - FE-11 - Global Impact Feed + Export
- **State:** OPEN
- **Created at:** 2026-04-18T16:22:49Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:core, type:feature, parallel:yes, priority:high, sprint:3

#### Description
**Contexto**
- Ledger p├║blico de impacto ├® uma das pe├ºas centrais de transpar├¬ncia do produto.

**Objetivo**
- Implementar tela de ledger com filtros e export.

**Racional (por que isso existe)**
- **Transpar├¬ncia:** prova p├║blica de distribui├º├úo e resultados.
- **Auditoria:** export facilita compliance e investiga├º├úo.

**Escopo**
- UI + integra├º├úo com export job; sem alterar l├│gica do backend.

**Objetivo detalhado**
- Filtros combin├íveis e pagina├º├úo.
- Modal de export e acompanhamento do status do job.

**P├íginas e Componentes**
- **P├íginas:** `/impact/ledger`
- **Componentes/Arquivos:** `ImpactLedgerPage`, `FilterBar`, `ExportModal`, `LedgerTable`.

**Padr├úo de Layout e Cores**
- Fam├¡lia C (Dashboard) com ÔÇ£glass-cardÔÇØ; bot├Áes neutros para export.

**Valida├º├Áes**
- Validar filtros (range/time/size) e impedir combina├º├Áes inv├ílidas (se existir).

**API**
- `GET /api/v1/impact/ledger`
- `POST /api/v1/impact/ledger/export`
- `GET /api/v1/impact/ledger/export/{id}`

**Detalhes T├®cnicos (Lint AI)**
- **Path:** `src/app/features/impact/ledger/`
- **Export Flow:** 
  1. `POST /api/v1/impact/ledger/export` -> returns `job_id`.
  2. Polling `GET /api/v1/impact/ledger/export/{id}` until `status === 'done'`.
  3. `window.open(file_url)`.

**Crit├®rios de Aceite**
- Filtros aplicam e resetam pagina├º├úo.
- Export gera arquivo e permite download.

**Checklist**
- [ ] Filtros
- [ ] Export modal
- [ ] Download final

**Git (Branch e PR)**
- **Branch:** `feature/FE-11-impact-ledger`
- **Commits:** `feat(frontend): ...`, `test(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** Sim
- **Depende de:** BE impact ledger + export jobs

---

### #12 - FE-10 - Voting Quadr├ítico (voice credits sqrt + votos finais)
- **State:** OPEN
- **Created at:** 2026-04-18T16:22:48Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:core, type:feature, parallel:no, priority:high, sprint:2

#### Description
**Contexto**
- Governan├ºa de impacto: cr├®ditos = floor(sqrt(stake_stroops)); custo = votos┬▓.

**Objetivo**
- Implementar tela de voting com valida├º├Áes e fluxo de assinatura.

**Racional (por que isso existe)**
- **Mecanismo de justi├ºa:** voto quadr├ítico reduz domin├óncia de baleias.
- **Fechamento do ciclo:** winners direcionam impacto social de forma transparente.

**Escopo**
- UI de sliders + c├ílculo + build-vote + assinatura.

**Objetivo detalhado**
- Renderizar lista de ONGs.
- Ajustar sliders e custo.
- Impedir exceder cr├®ditos.
- Confirmar submiss├úo ÔÇ£finalÔÇØ.

**P├íginas e Componentes**
- **P├íginas:** `/voting` (ou equivalente)
- **Componentes/Arquivos:** `VotingPage`, `NgoVoteCard`, `VoteSummaryBar`, `VoteService`.

**Padr├úo de Layout e Cores**
- Slider fill em verde prim├írio; cards disabled em grayscale/opacity.

**Valida├º├Áes**
- `allocated_votes^2` n├úo excede credits.
- Bloquear se j├í votou.

**API**
- `GET /api/v1/governance/organizations` (ou `/ngos` conforme backend)
- `POST /api/v1/transactions/build-vote`
- WS tx status

**Detalhes T├®cnicos (Lint AI)**
- **Path:** `src/app/features/voting/`
- **Logic:** 
  - `credits = profile.voice_credits` (ou calculado localmente como `floor(sqrt(stake))`).
  - `current_cost = sum(votes^2)`.
  - Block submit if `current_cost > credits`.
- **States:** `has_voted` (Boolean) -> desabilita sliders.
- **Testes:** `voting.component.spec.ts` quadratic cost calculation.

**Crit├®rios de Aceite**
- Voto submetido e UI travada ap├│s confirma├º├úo.

**Checklist**
- [ ] Total credits correto
- [ ] Travamento por excesso
- [ ] Modal confirma├º├úo

**Git (Branch e PR)**
- **Branch:** `feature/FE-10-voting-quadratic`
- **Commits:** `feat(frontend): ...`, `test(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** N├úo
- **Depende de:** BE build-vote + ONGs + worker

---

### #11 - FE-9 - Claims (lista + claim flow)
- **State:** OPEN
- **Created at:** 2026-04-18T16:22:47Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:core, type:feature, parallel:no, priority:high, sprint:2

#### Description
**Contexto**
- Pull over push: usu├írio deve acionar claim para receber payout.

**Objetivo**
- Tela de claims e fluxo de claim (build-claim ÔåÆ wallet ÔåÆ confirma├º├úo).

**Racional (por que isso existe)**
- **Regra da rede/contrato:** payouts n├úo s├úo enviados automaticamente; usu├írio precisa ÔÇ£puxarÔÇØ.
- **Transpar├¬ncia:** o usu├írio v├¬ claramente o que est├í dispon├¡vel e o que j├í foi sacado.

**Escopo**
- Claims dispon├¡veis e hist├│rico; bot├úo claim por item; estados de pending.

**Objetivo detalhado**
- Listar claims.
- Construir XDR.
- Assinar e acompanhar status via WS.

**P├íginas e Componentes**
- **P├íginas:** `/profile` (tab Claims) e/ou `/claims`
- **Componentes/Arquivos:** `ClaimsList`, `ClaimButton`, `ClaimService`.

**Padr├úo de Layout e Cores**
- Estados: pending neutro; success verde; erro terracota.

**Valida├º├Áes**
- Prevenir double claim.
- Exibir erro amig├ível se n├úo claimable.

**API**
- `GET /api/v1/users/me/claims`
- `POST /api/v1/transactions/build-claim`
- WS tx status

**Detalhes T├®cnicos (Lint AI)**
- **Path:** `src/app/features/profile/claims-tab/`
- **Fluxo:** 
  1. `GET /api/v1/users/me/claims`
  2. `POST /api/v1/transactions/build-claim`
  3. Sign -> `tx_hash` -> WS watch.
- **UI:** Bot├úo "Claim" desabilitado se `claimed=true` ou se `market.state` n├úo permitir.
- **Testes:** `claims.component.spec.ts` integration with `StakeService`.

**Crit├®rios de Aceite**
- Claim funciona e atualiza UI.
- `impact_generated_by_user` aparece no hist├│rico quando existir.

**Checklist**
- [ ] Claim por item
- [ ] Estados pending/confirmed
- [ ] Double click bloqueado

**Git (Branch e PR)**
- **Branch:** `feature/FE-9-claims`
- **Commits:** `feat(frontend): ...`, `test(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** N├úo
- **Depende de:** BE claims + build-claim + worker

---

### #10 - FE-8 - Anti-hedge hard block (UI)
- **State:** CLOSED
- **Created at:** 2026-04-18T16:22:47Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:quality, type:feature, parallel:yes, priority:high, sprint:2

#### Description
**Contexto**
- No V3, hedge lock ├® enforced on-chain (panic), ent├úo UI deve bloquear.

**Objetivo**
- Desabilitar outcome oposto e impedir submit.

**Racional (por que isso existe)**
- **Evitar erro on-chain:** bloqueia uma transa├º├úo que falharia (panic) e melhora a UX.
- **Integridade do produto:** impede ÔÇ£apostar nos dois ladosÔÇØ para capturar governan├ºa.

**Escopo**
- UI-only + leitura de posi├º├úo atual.

**Objetivo detalhado**
- Consultar posi├º├úo do usu├írio.
- Se outcome j├í escolhido, bloquear o outro.

**P├íginas e Componentes**
- **P├íginas:** `/markets/:id`
- **Componentes/Arquivos:** `StakeForm`, `UserPositionSelector`.

**Padr├úo de Layout e Cores**
- Bot├úo disabled com opacidade e tooltip; usar cor de warning/terracota.

**Valida├º├Áes**
- N├úo permitir alterar outcome quando j├í posicionado.

**API**
- `GET /api/v1/users/me/portfolio` ou `GET /api/v1/markets/{id}` incluindo posi├º├úo do usu├írio.

**Crit├®rios de Aceite**
- UI nunca envia build-prediction com outcome oposto.

**Detalhes T├®cnicos (Lint AI)**
- **L├│gica:** No `StakeForm`, desabilitar o bot├úo do `outcome` oposto se `user_position.outcome` n├úo for nulo e for diferente do selecionado.
- **Tooltip:** "Hedging is not allowed. You have a position in the opposite outcome."
- **Data Source:** Usar `UserPosition` vindo do `MarketDetailPage` (carregado via `GET /api/v1/markets/{id}`).

**Checklist**
- [ ] Bloqueio visual
- [ ] Bloqueio funcional

**Git (Branch e PR)**
- **Branch:** `feature/FE-8-anti-hedge-ui`
- **Commits:** `feat(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** Sim
- **Depende de:** BE expor posi├º├úo do usu├írio

---

### #9 - FE-7 - Stake end-to-end (build XDR + wallet + optimistic UI)
- **State:** CLOSED
- **Created at:** 2026-04-18T16:22:46Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:core, type:feature, parallel:no, priority:high, sprint:2

#### Description
**Contexto**
- Stake ├® opera├º├úo cr├¡tica Web3: precisa de UI otimista e reconcilia├º├úo por WS/SSE.

**Objetivo**
- Finalizar stake completo: build XDR ÔåÆ assinatura ÔåÆ pending ÔåÆ confirmado.

**Racional (por que isso existe)**
- **Seguran├ºa do modelo:** o usu├írio s├│ assina um XDR que veio do backend (anti-tampering).
- **UX Web3:** sem optimistic UI, o usu├írio acha que ÔÇ£travouÔÇØ e abandona.
- **Consist├¬ncia:** a confirma├º├úo via WS evita polling pesado e mant├®m UI sincronizada.

**Escopo**
- Fluxo de transa├º├úo de stake + feedback de estados.

**Objetivo detalhado**
- Chamar build-prediction.
- Assinar XDR na wallet.
- Persistir pending localmente.
- Consumir WS de confirma├º├úo e atualizar UI.

**P├íginas e Componentes**
- **P├íginas (rotas):** `/markets/:id`
- **O que colocar na tela:** toast ÔÇ£Awaiting confirmationÔÇªÔÇØ, disabled inputs, feedback de erro/cancel.
- **Componentes/Arquivos:** `StakeService`, `WalletService`, `TxToast`, `PendingTxStore`.

**Padr├úo de Layout e Cores**
- Toast neutro com spinner; sucesso em verde; erro em terracota.

**Valida├º├Áes**
- N├úo permitir double submit.
- Se API retornar `HEDGE_LOCK`, mostrar mensagem e bloquear.

**API**
- `POST /api/v1/transactions/build-prediction`
- WS: `tx_submitted`, `tx_confirmed`, `tx_failed`

**Crit├®rios de Aceite**
- Fluxo completo funciona com wallet real.
- Timeout n├úo declara falha definitiva.

**Detalhes T├®cnicos (Lint AI)**
- **Servi├ºo:** `StakeService.placeStake(marketId, outcome, amount)`.
- **Persistence:** Salvar em `localStorage('stakegood_pending_tx')` o `{ tx_hash, market_id, outcome, amount, type: 'STAKE' }` antes de assinar.
- **WebSocket:** Escutar channel `users:{wallet}` para evento `tx_confirmed`.
- **UX:** Toast "Waiting for confirmation..." com link para o Explorer.
- **Reconcilia├º├úo:** Ao iniciar o app, verificar `localStorage` e consultar backend para limpar pendentes.

**Checklist**
- [ ] Cancelado pelo usu├írio
- [ ] Confirmado via WS
- [ ] Timeout ÔÇ£incertoÔÇØ

**Git (Branch e PR)**
- **Branch:** `feature/FE-7-stake-end-to-end`
- **Commits:** `feat(frontend): ...`, `fix(frontend): ...`, `test(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** N├úo
- **Depende de:** FE-6, BE build-prediction e WS

---

### #8 - FE-6 - Market Detail (chart + resolu├º├úo + stake form)
- **State:** CLOSED
- **Created at:** 2026-04-18T16:22:45Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:core, type:feature, parallel:yes, priority:high, sprint:2

#### Description
**Contexto**
- Tela core do produto: entendimento de resolu├º├úo + probabilidade + simula├º├úo + prepara├º├úo de stake.

**Objetivo**
- Entregar Market Detail com chart e stake form (sem necessariamente fechar stake end-to-end aqui).

**Racional (por que isso existe)**
- **Decis├úo do usu├írio:** ├® aqui que ele entende ÔÇ£o que ├® esse marketÔÇØ e como ser├í resolvido.
- **Redu├º├úo de risco:** regra de resolu├º├úo e fonte reduzem ambiguidade e disputas.
- **Base para stake:** sem essa tela, o stake vira ÔÇ£cegoÔÇØ e aumenta churn.

**Escopo**
- UI completa e integra├º├Áes de leitura.
- N├úo incluir o fluxo de assinatura/tx (isso ├® FE-7).

**Objetivo detalhado**
- Renderizar regra de resolu├º├úo, fonte, link para oracle/contract.
- Chart com range 1D/1W/ALL via history.
- Stake form sticky com fees din├ómicas por market.

**P├íginas e Componentes**
- **P├íginas (rotas):** `/markets/:id`
- **O que colocar na tela:** conte├║do do market + stake form sticky.
- **Componentes/Arquivos:** `MarketDetailPage`, `ProbabilityChart`, `StakeForm`, `MarketService`.

**Padr├úo de Layout e Cores**
- Fam├¡lia A (Modern): prim├íria `#11D48A`; negativo `#CC5A37`; cards brancos, radius 12ÔÇô16px.

**Valida├º├Áes**
- Amount input aceita apenas num├®rico > 0 (valida├º├úo visual).
- Fees exibidas por market: `fee_ngo`, `fee_platform`, `fee_gamification`.

**API**
- `GET /api/v1/markets/{id}`
- `GET /api/v1/markets/{id}/history`

**Crit├®rios de Aceite**
- Dados e chart renderizam com estados de loading/erro.
- Fees por market aparecem no calculador.

**Detalhes T├®cnicos (Lint AI)**
- **Path:** `src/app/features/market/market-detail/`
- **NgRx:** `src/app/core/store/market/` -> `loadMarket(id)`, `loadHistory(id)`.
- **Chart:** Usar `Chart.js` ou `ngx-charts` com toggle para `1D`, `1W`, `ALL` (filtros passados via query param para o history endpoint).
- **Fees:** Exibir explicitamente `market.fee_ngo`, `market.fee_platform` e `market.fee_gamification` como porcentagens no form.
- **Testes:** `market-detail.component.spec.ts` chart range toggle test.

**Checklist**
- [ ] History range
- [ ] Fees por market
- [ ] Empty/error states

**Git (Branch e PR)**
- **Branch:** `feature/FE-6-market-detail`
- **Commits:** `feat(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** Sim
- **Depende de:** FE-5 (navega├º├úo) e backend markets endpoints

---

### #7 - FE-5A - Padroniza├º├úo de endpoints (baseURL + versionamento)
- **State:** CLOSED
- **Created at:** 2026-04-18T16:22:45Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:setup, type:chore, parallel:yes, priority:high, sprint:1

#### Description
**Contexto**
**Labels**
- `area:frontend`
- `sprint:1`
- `phase:setup`
- `type:chore`
- `priority:high`
- `parallel:yes`

O spec do front menciona `/api/auth/*` e o backend usa `/api/v1/*`. Se isso ficar inconsistente, o time perde tempo com erros de integra├º├úo e o refresh/interceptors ficam quebradi├ºos. A padroniza├º├úo impede ÔÇ£endpoints hardcodedÔÇØ espalhados e reduz margem para erro.

**Objetivo**
Garantir um contrato ├║nico e centralizado de endpoints (baseURL + versionamento), para que o app seja configur├ível por ambiente e todos os requests passem pelo mesmo pipeline (auth/refresh/error handling).

**Racional (por que isso existe)**
- **Menos bugs de integra├º├úo:** elimina varia├º├Áes por p├ígina.
- **Observabilidade:** facilita logging e correla├º├úo de erros.
- **Velocidade:** trocar dev/staging/prod sem editar c├│digo.

**Escopo**
- Refactor de services; sem mudan├ºas de UI.

**Objetivo detalhado**
- Centralizar baseURL/version em config.
- Proibir endpoint hardcoded em componentes.

**P├íginas e Componentes**
- **P├íginas:** todas (impacto transversal).
- **Componentes/Arquivos:** `ApiConfig`, services, interceptors.

**Padr├úo de Layout e Cores**
- N/A.

**Valida├º├Áes**
- N/A.

**Detalhes T├®cnicos (Lint AI)**
- **Refactor:** Centralizar URL em `environment.ts`.
- **Versionamento:** For├ºar `/api/v1/` como prefixo em todos os services.
- **Interceptors:** Garantir que `AuthInterceptor` e `AuthRefreshInterceptor` est├úo em `AppModule` providers.

**API**
- Todas as chamadas HTTP existentes (/api/v1).

**Crit├®rios de Aceite**
- Trocar env n├úo exige altera├º├úo em c├│digo de p├ígina.
- Interceptor aplica Authorization consistentemente.

**Checklist**
- [ ] Centraliza├º├úo de baseURL
- [ ] Interceptor aplicado
- [ ] Smoke test rotas

**Git (Branch e PR)**
- **Branch:** `feature/FE-5A-endpoints-standard`
- **Commits:** `chore(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** Sim
- **Depende de:** FE-2

---

### #6 - FE-5 - Arena Markets (listagem + filtros + busca)
- **State:** CLOSED
- **Created at:** 2026-04-18T16:22:44Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:core, type:feature, parallel:yes, priority:high, sprint:1

#### Description
**Contexto**
**Labels**
- `area:frontend`
- `sprint:1`
- `phase:core`
- `type:feature`
- `priority:high`
- `parallel:yes`

A Arena ├® a principal tela de descoberta: ela precisa ser r├ípida, leg├¡vel e com estados (loading/empty/error) muito bem definidos, porque ├® onde o usu├írio decide entrar em um market.

**Objetivo**
Implementar listagem de markets com filtros e busca que permitam encontrar um market com m├¡nimo atrito e navegar para o detalhe.

**Racional (por que isso existe)**
- **Performance percebida:** loading/empty/error bem feitos reduzem abandono.
- **Navega├º├úo:** base para alimentar a convers├úo em stake.

**Escopo**
- Leitura apenas (sem stake).

**Objetivo detalhado**
- Carregar markets via API.
- Implementar categorias e busca com debounce.
- Cards com barra SIM/N├âO.

**P├íginas e Componentes**
- **P├íginas (rotas):** `/markets` (ou `/arena`)
- **Componentes/Arquivos:** `MarketArenaPage`, `MarketCard`, `MarketFilters`, `MarketService`.

**Padr├úo de Layout e Cores**
- Fam├¡lia A (Modern): SIM em verde `#11D48A`, N├âO em terracota `#CC5A37`.

**Valida├º├Áes**
- N/A (busca/filtros s├úo client-side ou query params).

**Detalhes T├®cnicos (Lint AI)**
- **Path:** `src/app/features/market/market-list/`
- **Busca:** Reactive Forms -> `valueChanges` com `debounceTime(300)`.
- **Visual:** Cards com barra horizontal de probabilidade SIM/N├âO.
- **Derived Status:** Se `market.status === 'OPEN'` mas `now >= lock_ts`, exibir label "LOCKED" (red).

**API**
- `GET /api/v1/markets`

**Crit├®rios de Aceite**
- Busca e filtros funcionam.
- Loading/empty/error aparecem.

**Checklist**
- [ ] Debounce busca
- [ ] Empty state
- [ ] Cards clic├íveis (navega para detalhe)

**Git (Branch e PR)**
- **Branch:** `feature/FE-5-market-arena`
- **Commits:** `feat(frontend): ...`, `test(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** Sim
- **Depende de:** FE-1

---

### #5 - FE-4 - Landing (desktop + mobile)
- **State:** CLOSED
- **Created at:** 2026-04-18T16:22:43Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:ux, type:feature, parallel:yes, priority:medium, sprint:1

#### Description
**Contexto**
**Labels**
- `area:frontend`
- `sprint:1`
- `phase:ux`
- `type:feature`
- `priority:medium`
- `parallel:yes`

Landing ├® a primeira impress├úo do produto. Ela precisa comunicar ÔÇ£mercado preditivo + filantropiaÔÇØ e conduzir o usu├írio at├® **conectar wallet**, que ├® o pr├®-requisito de qualquer a├º├úo relevante.

**Objetivo**
Implementar a Landing (desktop e mobile) conforme o design, com CTA de conex├úo integrado e estados claros (desconectado/conectando/conectado/erro).

**Racional (por que isso existe)**
- **Convers├úo:** melhora a taxa de usu├írios que chegam ├á Arena.
- **Confian├ºa:** reduz fric├º├úo e ansiedade no primeiro contato com Web3.

**Escopo**
- UI/UX apenas; m├®tricas podem ser mockadas inicialmente.

**Objetivo detalhado**
- Hero + CTAs + se├º├úo de m├®tricas.
- Responsividade mobile.

**P├íginas e Componentes**
- **P├íginas (rotas):** `/landing`
- **O que colocar na tela:** hero, CTA connect, m├®tricas, footer.
- **Componentes/Arquivos:** `LandingPage`, `MetricsBar`, `ConnectWalletCard`.

**Padr├úo de Layout e Cores**
- Fam├¡lia A (Modern): prim├íria `#11D48A`, fundo `#F6F8F7`.

**Valida├º├Áes**
- N/A (UI).

**Detalhes T├®cnicos (Lint AI)**
- **Path:** `src/app/features/landing/landing-page/`
- **Componentes:** `HeroSection`, `FeaturesGrid`, `MetricsBar`.
- **UX:** Bot├úo "Connect" herda estados do `AuthService`.
- **Assets:** Usar `stitch_assets/` (imagens/├¡cones).

**API**
- (Opcional) `GET /api/v1/public/metrics`

**Crit├®rios de Aceite**
- Layout responsivo fiel ao design.
- CTA conecta wallet e reflete estado.

**Checklist**
- [ ] Hero + CTAs
- [ ] Responsivo
- [ ] Estado conectado/desconectado

**Git (Branch e PR)**
- **Branch:** `feature/FE-4-landing`
- **Commits:** `feat(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** Sim
- **Depende de:** FE-2

---

### #4 - FE-3 - UserState (NgRx) + Guards (Auth/KYC/Terms/Role)
- **State:** CLOSED
- **Created at:** 2026-04-18T16:22:42Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:setup, type:feature, parallel:yes, priority:high, sprint:1

#### Description
**Contexto**
**Labels**
- `area:frontend`
- `sprint:1`
- `phase:setup`
- `type:feature`
- `priority:high`
- `parallel:yes`

O frontend precisa aplicar **gating consistente** (auth/kyc/terms/role) para impedir caminhos ilegais e reduzir risco regulat├│rio. Como as a├º├Áes Web3 podem ficar ÔÇ£pendentesÔÇØ, o estado tamb├®m precisa sobreviver a refresh para n├úo quebrar a experi├¬ncia do usu├írio.

**Objetivo**
Implementar um `UserState` central (NgRx) + guards de rota que garantam que **qualquer rota e a├º├úo** respeite o estado do usu├írio (JWT, KYC, termos e role).

**Racional (por que isso existe)**
- **Seguran├ºa/Conformidade:** evita que usu├írios sem KYC/termos acessem fluxos proibidos.
- **Consist├¬ncia:** reduz ifs repetidos por componente/p├ígina.
- **Resili├¬ncia:** melhora comportamento ap├│s reload, expirac╠ºa╠âo de token e refresh.

**Escopo**
- Implementar state + guards.
- N├úo incluir telas novas al├®m do necess├írio para redirecionamento.

**Objetivo detalhado**
- Persistir state (tokens, profile snapshot, flags).
- Implementar AuthGuard, KycGuard, TermsGuard e RoleGuard.

**P├íginas e Componentes**
- **P├íginas (rotas):** todas as rotas privadas afetadas.
- **Componentes/Arquivos:** store (reducers/effects/selectors), guards, servi├ºos de sess├úo.

**Padr├úo de Layout e Cores**
- Sem mudan├ºas visuais al├®m de mensagens/CTAs de bloqueio quando aplic├ível.

**Valida├º├Áes**
- Token ausente/expirado ÔåÆ logout + redirect.
- KYC != approved ÔåÆ redirect KYC.
- Sem termos aceitos ÔåÆ redirect Terms.

**Detalhes T├®cnicos (Lint AI)**
- **NgRx:** `src/app/core/store/auth/` (LoginSuccess, Logout, UpdateProfile).
- **Guards:**
  - `auth.guard.ts`: `isLoggedIn()`?
  - `kyc.guard.ts`: `profile.kyc_status === 'verified'`?
  - `terms.guard.ts`: `profile.terms_accepted === true`?
- **Redirecionamentos:** `/landing` para deslogados, `/onboarding/kyc` para pendentes.

**API**
- N/A (usa profile snapshot do login).

**Crit├®rios de Aceite**
- Rotas protegidas bloqueadas corretamente.
- Sem loops de redirecionamento.

**Checklist**
- [ ] AuthGuard ok
- [ ] KycGuard ok
- [ ] TermsGuard ok
- [ ] RoleGuard ok

**Git (Branch e PR)**
- **Branch:** `feature/FE-3-state-guards`
- **Commits:** `feat(frontend): ...`, `test(frontend): ...`
- **PR:** `develop`
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** Sim
- **Depende de:** FE-2

---

### #3 - FE-2 - Login Web3 (nonce + assinatura + authenticate + refresh)
- **State:** CLOSED
- **Created at:** 2026-04-18T16:22:42Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:setup, type:feature, parallel:yes, priority:high, sprint:1

#### Description
**Contexto**
O StakeGood n├úo usa senha: a identidade do usu├írio ├® a **carteira Stellar**. Para provar posse da chave privada sem exp├┤-la, o backend emite um **nonce** e o frontend solicita que o usu├írio assine na wallet. O frontend precisa tamb├®m manter sess├úo est├ível (JWT + refresh) para evitar quedas no meio de fluxos cr├¡ticos (stake/claim/vote).

**Objetivo**
Implementar autentica├º├úo Web3 ponta-a-ponta (nonce ÔåÆ assinatura ÔåÆ authenticate) com persist├¬ncia segura e **refresh autom├ítico**, garantindo que o usu├írio n├úo seja deslogado durante uma transa├º├úo.

**Racional (por que isso existe)**
- **Seguran├ºa:** o frontend nunca toca na private key; s├│ orquestra assinatura.
- **UX:** refresh evita re-login frequente e reduz abandono em flows Web3.
- **Base para guards:** KYC/terms/role dependem do ÔÇ£profile snapshotÔÇØ p├│s-login.

**Escopo**
- Implementar AuthService + interceptor + storage.
- N├úo implementar stake/claim/vote ainda.

**Objetivo detalhado**
- Consumir endpoint de nonce (GET).
- Assinar nonce na wallet.
- Enviar assinatura para authenticate (POST).
- Persistir tokens e profile snapshot.
- Refresh autom├ítico quando expirar em <5min.

**P├íginas e Componentes**
- **P├íginas (rotas):**
  - Landing e/ou modal de connect (onde fica o bot├úo).
- **O que colocar na tela:**
  - Bot├úo Connect com estados (checking/approve/connected/erro).
- **Componentes/Arquivos:**
  - AuthService, WalletService, AuthRefreshInterceptor, AuthStorage.

**Padr├úo de Layout e Cores**
- Bot├úo prim├írio: #11D48A, texto #111815.
- Erro: texto em tom vermelho/terracota (ex.: #CC5A37) com fundo claro.

**Valida├º├Áes**
- public_key em formato Stellar v├ílido.
- Mensagens usando user_message do backend quando existir.

**Detalhes T├®cnicos (Lint AI)**
- **Servi├ºos:** AuthService, WalletService (Freighter/Albedo).
- **Fluxo:** 
  1. GET /api/v1/auth/nonce?wallet=...
  2. wallet.sign(nonce)
  3. POST /api/v1/auth/verify -> { access_token, refresh_token, profile }
- **Storage:** localStorage.setItem('stakegood_auth', ...)
- **Refresh:** Interceptor monitorando expira├º├úo < 5min chamando POST /api/v1/auth/refresh.

**API**
- GET /api/v1/auth/nonce
- POST /api/v1/auth/verify
- POST /api/v1/auth/refresh

**Crit├®rios de Aceite**
- Login completo funciona (nonceÔåÆassinaturaÔåÆJWT).
- Refresh funciona sem interven├º├úo do usu├írio.
- Logout remove storage.

**Checklist**
- [ ] Fluxo login ok
- [ ] Refresh ok
- [ ] Tratamento de erro ok

**Git (Branch e PR)**
- **Branch:** eature/FE-2-web3-login-refresh
- **Commits:** eat(frontend): ..., ix(frontend): ..., 	est(frontend): ...
- **PR:** para develop
- **Revisor:** 1+

**Depend├¬ncias**
- **Pode fazer em paralelo?** Sim
- **Depende de:** backend auth endpoints"

---

### #1 - FE-1 - App Shell + Arquitetura em camadas (UI/Services/Web3)
- **State:** CLOSED
- **Created at:** 2026-04-18T16:21:33Z
- **Author:** heliocarrara
- **Labels:** area:frontend, phase:setup, type:feature, parallel:yes, priority:high, sprint:1

#### Description
**Contexto**
O StakeGood tem fluxos Web3 (assinatura em wallet + confirma├º├úo de rede) e m├║ltiplas ├íreas do produto (Arena, Profile, Voting, Settings). Sem um **App Shell** consistente (layout, roteamento e separa├º├úo de camadas), o c├│digo tende a ÔÇ£vazarÔÇØ regras de neg├│cio para componentes e fica dif├¡cil garantir governan├ºa de estado (e.g., optimistic UI, guards, session refresh).

**Objetivo**
Estabelecer a funda├º├úo t├®cnica do frontend para que as pr├│ximas features sejam implementadas de forma previs├¡vel, com responsabilidades separadas e baixo acoplamento.

**Racional (por que isso existe)**
- **Manutenibilidade:** reduz duplica├º├úo e decis├Áes ad-hoc por p├ígina.
- **Seguran├ºa/consist├¬ncia:** evita l├│gica de wallet e auth espalhada em componentes.
- **Velocidade:** novas telas passam a reutilizar layout/servi├ºos/estados.

**Escopo**
- Implementar layout e infraestrutura de navega├º├úo.
- N├úo incluir features de stake/claim/vote neste item.

**Objetivo detalhado**
- Criar esqueleto de rotas e layout.
- Definir estrutura de pastas e contratos de servi├ºos (Auth/Market/Wallet/Tx).

**P├íginas e Componentes**
- **P├íginas (rotas):**
  - Rotas p├║blicas m├¡nimas (ex.: `/landing`) e placeholder para rotas privadas.
- **O que colocar na tela:**
  - TopBar/SideBar/BottomBar com estados base.
- **Componentes/Arquivos:**
  - `AppShell`, `TopBar`, `SideBar`, `BottomBar`, `LayoutService` (ou equivalentes).

**Padr├úo de Layout e Cores**
- Seguir design tokens do projeto:
  - Prim├íria (Modern): `#11D48A`
  - Fundo: `#F6F8F7`
  - Texto: `#111815`
  - Radius: 12ÔÇô16px; sombra leve em cards.

**Valida├º├Áes**
- N/A (infra).

**Detalhes T├®cnicos (Lint AI)**
- **Paths Sugeridos:**
  - `src/app/core/shell/app-shell/`
  - `src/app/core/shell/top-bar/`
  - `src/app/core/services/`
- **Rotas Angular:**
  - `/landing` (Public)
  - `/arena` (Protected)
  - `/profile` (Protected)
- **Cores (Design System):** Prim├íria `#11D48A`, Fundo `#F6F8F7`, Texto `#111815`.
- **Testes:** `app.component.spec.ts` smoke test.

**API**
- N/A (infra).

**Crit├®rios de Aceite**
- App navega entre rotas p├║blicas.
- Layout responsivo funcional.
- Sem l├│gica web3 dentro de componentes (somente services).

**Checklist**
- [ ] Estrutura base do app
- [ ] Layout responsivo
- [ ] Build/lint ok

**Git (Branch e PR)**
- **Branch:** `feature/FE-1-app-shell`
- **Commits:** Conventional Commits (`feat(frontend): ...`, `chore(frontend): ...`)
- **Fluxo de PR:** abrir MR/PR para `develop` (Gitflow)
- **Revisor:** pelo menos 1 pessoa

**Depend├¬ncias**
- **Pode fazer em paralelo?** Sim
- **Depende de:** nenhuma

---

## Pull Requests

### PR #35 - fix: Stake API Integration and Arena UI Refinement
- **State:** MERGED
- **Created at:** 2026-04-23T20:33:59Z
- **Merged at:** 2026-04-23T20:34:07Z
- **Author:** heliocarrara
- **URL:** https://github.com/StakeGood-UFMT/frontend/pull/35

#### Description
## Technical Changes
- **Stake API Integration**: Fixed payload mapping (snake_case) and serialized amount to string to match backend DTO.
- **KYC/Security**: Improved error handling to provide specific feedback for 403 Forbidden (KYC required) and 400 Bad Request (Market locked).
- **Market Models**: Synchronized MarketStatus and MarketCategory with backend values (case-sensitive mapping).
- **Arena UI**: 
  - Added horizontal navigation buttons for category filters.
  - Disabled stake button for resolved/locked markets with visual status feedback.
  - Updated icons and badge styles for all categories.
- **Testing**: Fixed IDE errors in market-detail.component.spec.ts by including jasmine types.

## Motivation
Resolve the 403/400 errors during staking and ensure the Arena experience is consistent with the backend data structure.

## Tests Performed
- Validated build-prediction payload via browser console and backend logs.
- Verified KYC promotion via manual DB update.
- Tested filter navigation and category icons on multiple viewport sizes.

---

### PR #34 - fix(FE-6): fix market probability chart display
- **State:** MERGED
- **Created at:** 2026-04-23T19:20:06Z
- **Merged at:** 2026-04-23T19:20:13Z
- **Author:** heliocarrara
- **URL:** https://github.com/StakeGood-UFMT/frontend/pull/34

#### Description
### Description
This PR fixes the issue where the market probability history chart was appearing empty or blank on the Market Details page.

### Changes Made
- **Host Styles**: Added \:host { display: block; height: 100%; }\ to \ProbabilityChartComponent\ to ensure the container has a valid height for Chart.js rendering.
- **Data Mapping**: Fixed a mismatch where the chart line was being rendered out of bounds due to an incorrect percentage multiplier (now synchronized with backend fraction changes).
- **Update Logic**: Enhanced \
gOnChanges\ to trigger chart updates when the time range is switched, ensuring the UI reflects the correct labels and data points immediately.
- **Backend Sync**: (Coordinated change) Updated the backend to support the \ange\ parameter (\1D\, \1W\, \ALL\) sent by the frontend.

### Testing
- Verified that the chart now renders correctly with a green line.
- Verified that switching ranges (1D/1W/ALL) updates the chart labels and data.

---

### PR #33 - feat(frontend): FE-7 - Stake end-to-end (build XDR + wallet + optimistic UI)
- **State:** MERGED
- **Created at:** 2026-04-23T15:23:27Z
- **Merged at:** 2026-04-23T15:23:34Z
- **Author:** heliocarrara
- **URL:** https://github.com/StakeGood-UFMT/frontend/pull/33

#### Description
## Stake End-to-End Flow (FE-7)

This PR implements the complete stake flow, from transaction building to real-time confirmation.

### Changes:
- **StakeService**: Orchestrates the build-sign-submit flow.
- **Notification System**:
  - **NotificationService**: Global state for toasts.
  - **TxToastComponent**: Premium UI with spinners, success/error states, and explorer links.
  - **NotificationContainerComponent**: Fixed container for multiple toasts.
- **Real-time Integration**:
  - **RealtimeService**: WebSocket listener for \	x_submitted\, \	x_confirmed\, and \	x_failed\.
- **Persistence & Reconciliation**:
  - **PendingTxStore**: Saves transactions to \localStorage\ before signing.
  - **AppInit Reconciliation**: Checks pending transactions on startup and syncs with backend status.
- **UI Updates**:
  - Integrated \StakeService\ into \StakeFormComponent\.
  - Added loading states and form validations (auth/amount).

### Visuals:
- Neutral toast with spinner during build/sign.
- Green toast on success.
- Terracotta toast on error/cancel.

Closes #9

---

### PR #32 - feat: Real Backend API Integration and Model Adaptation
- **State:** MERGED
- **Created at:** 2026-04-23T13:58:51Z
- **Merged at:** 2026-04-23T13:58:59Z
- **Author:** heliocarrara
- **URL:** https://github.com/StakeGood-UFMT/frontend/pull/32

#### Description
### Description
This PR integrates the frontend with the real backend API running on \localhost:3000\. It updates the data structures and models to match the official backend documentation and resolves discrepancies in the authentication and market modules.

### Key Changes
- **Authentication**:
    - Updated \AuthResponse\ to match backend fields (\jwt\, \user\).
    - Fixed \AuthService\ login flow to include the missing \
once\ in the \/verify\ request body.
    - Added data mapping in \AuthService\ to maintain compatibility with existing \AuthProfile\ usage.
- **Markets**:
    - Renamed \	otal_volume\ to \	otal_liquidity\, \lock_ts\ to \lock_at\, and \esolve_ts\ to \settle_at\ in the \Market\ model.
    - Updated \MarketListResponse\ to handle the backend's new \pagination\ object.
    - Updated \MarketHistoryResponse\ to handle the \snapshots\ wrapper.
- **UI & Components**:
    - Updated \MarketCardComponent\ and \StakeFormComponent\ to reflect new field names and handle optional price fields safely.
    - Fixed \ProbabilityChartComponent\ to use \yes_probability\.
- **Infrastructure & Mocks**:
    - Updated \environment.development.ts\ to connect to the real API and disable mocks by default.
    - Refactored \mock-auth.interceptor.ts\ and \mock-market.interceptor.ts\ to remain consistent with the new real API structures.

---

### PR #31 - chore(frontend): standardizing endpoints with baseURL and versioning (FE-5A)
- **State:** MERGED
- **Created at:** 2026-04-22T21:12:14Z
- **Merged at:** 2026-04-22T21:12:22Z
- **Author:** heliocarrara
- **URL:** https://github.com/StakeGood-UFMT/frontend/pull/31

#### Description
Centralizes API endpoints using API_CONFIG and versioning from environment.ts. Implements concurrent refresh handling and strict interceptor matching.

---

### PR #30 - FE-6: Market Detail (Chart + Resolution + Stake Form)
- **State:** MERGED
- **Created at:** 2026-04-22T18:51:05Z
- **Merged at:** 2026-04-22T18:51:21Z
- **Author:** heliocarrara
- **URL:** https://github.com/StakeGood-UFMT/frontend/pull/30

#### Description
### Descri├º├úo
Implementa├º├úo completa da tela de detalhes do mercado (FE-6), incluindo gr├ífico de probabilidade hist├│rico, formul├írio de stake din├ómico e regras de resolu├º├úo.

### Mudan├ºas Realizadas
- **NgRx Store**: Criada store de mercado para gerenciamento de estado (a├º├Áes, reducers, efeitos e seletores).
- **Componentes**:
  - MarketDetailComponent: Layout responsivo otimizado para desktop e mobile.
  - ProbabilityChartComponent: Integra├º├úo com Chart.js para visualiza├º├úo de tend├¬ncias.
  - StakeFormComponent: Formul├írio compacto com c├ílculo din├ómico de taxas e valida├º├Áes.
- **Servi├ºos**: Atualiza├º├úo do MarketService para suportar detalhes e hist├│rico.
- **Mocks**: Expans├úo do interceptor de mock para simular dados realistas de mercado e hist├│rico.
- **Layout**: Ajustes finos de UX para eliminar scroll desnecess├írio em desktop e corrigir ordem de elementos em mobile.

### Crit├®rios de Aceite
- [x] Dados e gr├ífico renderizam corretamente.
- [x] Taxas por mercado aparecem no calculador.
- [x] Estados de loading/erro implementados.
- [x] Teste unit├írio de toggle de range aprovado.

Fixes #8

---

### PR #29 - feat(frontend): Arena Markets (listing + filters + search)
- **State:** MERGED
- **Created at:** 2026-04-22T18:12:12Z
- **Merged at:** 2026-04-22T18:17:51Z
- **Author:** heliocarrara
- **URL:** https://github.com/StakeGood-UFMT/frontend/pull/29

#### Description
Implements FE-5: Arena Markets discovery page with search, category filtering, and responsive cards.

---

### PR #28 - feat(frontend): FE-4 - Landing page (desktop + mobile)
- **State:** MERGED
- **Created at:** 2026-04-22T17:58:42Z
- **Merged at:** 2026-04-22T17:59:27Z
- **Author:** heliocarrara
- **URL:** https://github.com/StakeGood-UFMT/frontend/pull/28

#### Description
## FE-4 - Landing (desktop + mobile)

Closes #5

### What's included
- **HeroSection** - headline, subheadline, animated blob background, card mockup, CTA with 4 wallet states (disconnected / connecting / connected / error)
- **MetricsBar** - dark branded metrics strip (Distributed, Stakers, Active Arenas, Partner NGOs, Satisfaction)
- **FeaturesGrid** - 5 feature cards + 4-step flow diagram
- **ConnectWalletCard** - full-screen CTA with social proof testimonials, all wallet states handled
- **LandingFooter** - dark footer with Product / Community / Legal columns and Stellar attribution
- **Wallet modal theme** - custom StakeGood brand theme injected into StellarWalletsKit (dark bg, green primary, Inter font)
- **AppShell patch** - landing route strips the default 1.5rem shell padding so dark sections go full-width
- All UI copy in English

### Checklist
- [x] Hero + CTAs
- [x] Responsive (960px + 600px breakpoints)
- [x] Connected / disconnected / connecting / error states

### Branch
feature/FE-4-landing -> main


---

### PR #27 - feat(frontend): FE-3 - UserState (NgRx) + Guards (Auth/KYC/Terms/Role)
- **State:** MERGED
- **Created at:** 2026-04-22T17:03:50Z
- **Merged at:** 2026-04-22T17:31:21Z
- **Author:** heliocarrara
- **URL:** https://github.com/StakeGood-UFMT/frontend/pull/27

#### Description
Closes #4. Implements NgRx UserState and Auth/KYC/Terms/Role guards as specified in the issue.

---

### PR #26 - feat(frontend): FE-2 - Login Web3 (nonce + assinatura + authenticate + refresh)
- **State:** MERGED
- **Created at:** 2026-04-22T15:58:44Z
- **Merged at:** 2026-04-22T16:18:06Z
- **Author:** heliocarrara
- **URL:** https://github.com/StakeGood-UFMT/frontend/pull/26

#### Description
## Descri├º├úo
Este PR implementa o fluxo completo de autentica├º├úo Web3 (Issue #3), integrando o login via carteira Stellar com gest├úo de sess├úo segura (JWT) e refresh autom├ítico de tokens. Al├®m disso, unifica este fluxo com a arquitetura de App Shell estabelecida anteriormente, garantindo uma experi├¬ncia responsiva e premium em todos os dispositivos.

## Altera├º├Áes Realizadas

### 1. Autentica├º├úo Web3 (Core)
- **Fluxo de Login**: Implementado o handshake nonce -> signMessage -> verify utilizando a Stellar Wallets Kit (v2).
- **Session Management**: Criado o AuthService para gerenciar o estado global de autentica├º├úo e o AuthStorageService para persist├¬ncia segura no localStorage.
- **Interceptors**:
    - AuthInterceptor: Inje├º├úo autom├ítica de tokens JWT em todas as requisi├º├Áes.
    - **Refresh Autom├ítico**: O interceptor monitora a expira├º├úo do token e dispara uma renova├º├úo silenciosa antes que o token expire, garantindo que fluxos cr├¡ticos n├úo sejam interrompidos.
- **Mock System**: Implementado o MockAuthInterceptor (ativado via flag de ambiente) para simular o backend e facilitar o desenvolvimento offline.

### 2. Integra├º├úo com App Shell
- **Sincroniza├º├úo**: O trabalho da FE-2 foi unificado com a FE-1, restaurando a Sidebar e a navega├º├úo em camadas.
- **WalletConnect Component**: Criado um componente dedicado e reutiliz├ível para conex├úo de carteira com estados de carregamento, erro e exibi├º├úo de perfil.

### 3. UI/UX e Responsividade
- **Layout Desktop**: Carteira integrada ao rodap├® da Sidebar com design de Profile Card premium.
- **Layout Mobile (Hamburger Drawer)**:
    - Navega├º├úo centralizada em um menu lateral (Drawer) deslizante.
    - Otimiza├º├úo de espa├ºo: Remo├º├úo da Bottom Bar em favor de um cabe├ºalho mais limpo com ├¡cone de menu.
- **Global Reset**: Implementa├º├úo de reset CSS para eliminar scrolls indesejados e garantir consist├¬ncia visual.
- **Aesthetics**: Uso de gradientes, sombras suaves, micro-anima├º├Áes (spinners) e tipografia Inter.

### 4. Configura├º├Áes de Ambiente
- Suporte nativo para **TESTNET** e **FUTURENET**.
- Flag useMock adicionada aos arquivos de environment.ts para alternar facilmente entre modo simulado e API real.

## Valida├º├Áes
- [x] Login completo funciona (nonce -> assinatura -> JWT).
- [x] Refresh de token autom├ítico validado no console.
- [x] Navega├º├úo funcional no Desktop (Sidebar) e Mobile (Drawer).
- [x] Logout limpa sess├Áes locais e desconecta a carteira.
- [x] Build de produ├º├úo passando sem erros.

## Documenta├º├úo
- Criado arquivo how-to-run.md detalhando como configurar o ambiente e alternar entre os modos Mock/API.

---

### PR #25 - feat(core): integra├º├úo do Stellar Wallets Kit (SWK) no WalletService
- **State:** MERGED
- **Created at:** 2026-04-22T14:21:05Z
- **Merged at:** 2026-04-22T14:28:17Z
- **Author:** heliocarrara
- **URL:** https://github.com/StakeGood-UFMT/frontend/pull/25

#### Description
## Descri├º├úo
Este PR implementa a integra├º├úo real com a rede Stellar/Soroban atrav├®s do **Stellar Wallets Kit (SWK) v2** no `WalletService`. Substitu├¡mos os stubs iniciais por uma l├│gica agn├│stica de carteira que suporta os principais provedores da rede.

## Mudan├ºas Principais
- **Core Service**: 
  - Refatora├º├úo completa do `WalletService` utilizando a API est├ítica do SWK v2.
  - Gerenciamento de estado reativo com `BehaviorSubject` para a chave p├║blica.
  - Suporte nativo a **Freighter, Albedo, xBull e WalletConnect**.
  - L├│gica de persist├¬ncia e reconex├úo autom├ítica via `sessionStorage`.
- **Compatibilidade**:
  - Adicionados polyfills de `Buffer` e `global` no `main.ts` para garantir o funcionamento do `stellar-sdk` em ambiente browser (Vite/Angular).
- **Interface (UI)**:
  - `TopBarComponent` atualizado com est├®tica premium (glassmorphism, gradientes).
  - Adicionado indicador visual de status da conex├úo (status dot).
  - Implementado bot├úo de desconex├úo funcional que limpa totalmente o estado do kit e do navegador.
- **Transa├º├Áes**:
  - `TxService` agora utiliza o m├®todo `sign()` do `WalletService` para solicitar assinaturas reais dos usu├írios.

## Crit├®rios de Aceite / Checklist
- [x] Modal do Kit abre corretamente ao clicar em "Connect".
- [x] O endere├ºo da carteira ├® exibido de forma abreviada na interface ap├│s o login.
- [x] A desconex├úo ├® limpa e permite selecionar uma carteira diferente na pr├│xima tentativa.
- [x] O sistema injeta polyfills necess├írios para evitar erros de runtime com o SDK da Stellar.
- [x] O `TxService` est├í pronto para consumir o fluxo de assinatura.

Fixes #24


---

### PR #23 - feat(frontend): FE-1 - App Shell + Arquitetura em camadas
- **State:** MERGED
- **Created at:** 2026-04-22T13:28:20Z
- **Merged at:** 2026-04-22T13:29:25Z
- **Author:** heliocarrara
- **URL:** https://github.com/StakeGood-UFMT/frontend/pull/23

#### Description
# Descri├º├úo
Este PR implementa a funda├º├úo t├®cnica do frontend do StakeGood (Issue #1), estabelecendo o App Shell, a arquitetura em camadas e o sistema de design base.

## Altera├º├Áes Realizadas
### 1. App Shell e Layout Responsivo
- **AppShellComponent**: Container principal que orquestra a exibi├º├úo da TopBar, SideBar e MainContent.
- **TopBar**: Cabe├ºalho fixo com branding e bot├úo de "Connect Wallet" (integrado ao `WalletService`).
- **SideBar**: Navega├º├úo lateral para desktop com estados ativos e hover.
- **BottomBar**: Navega├º├úo inferior otimizada para dispositivos m├│veis.
- **Responsividade**: Layout adapt├ível que alterna entre SideBar (desktop) e BottomBar (mobile), com bloqueio de viewport para evitar scrolls indesejados.

### 2. Arquitetura em Camadas (UI/Services/Web3)
- **Camada de Servi├ºos**: Criados stubs e contratos iniciais em `core/services/` para:
  - `AuthService`: Gest├úo de estado de autentica├º├úo.
  - `WalletService`: Integra├º├úo com carteiras Web3 (Stellar/Soroban).
  - `MarketService`: Abstra├º├úo de dados de mercados.
  - `TxService`: Manipula├º├úo de transa├º├Áes e XDRs.
- **Separa├º├úo de Preocupa├º├Áes**: Componentes UI agora consomem dados apenas via servi├ºos, sem l├│gica Web3 direta.

### 3. Design System & Tokens
- **Design Tokens**: Implementa├º├úo de vari├íveis CSS (`--primary-color`, `--bg-color`, etc.) no `styles.css`.
- **Global Reset**: Limpeza de margens/paddings padr├úo e configura├º├úo de `box-sizing: border-box`.
- **Est├®tica Premium**: Aplica├º├úo de cores `#11D48A` (prim├íria), `#F6F8F7` (fundo) e `#111815` (texto), com border-radius de 12-16px e sombras leves.

### 4. Roteamento e Navega├º├úo
- Configura├º├úo de rotas base:
  - `/landing` (P├║blica)
  - `/arena` (Protegida - Placeholder)
  - `/profile` (Protegida - Placeholder)
- Uso de `loadComponent` para Lazy Loading de rotas.

## Valida├º├Áes
- [x] Navega├º├úo funcional entre rotas.
- [x] Aus├¬ncia de scroll vertical em p├íginas com pouco conte├║do.
- [x] Ajuste de espa├ºamento no menu vertical conforme feedback do usu├írio.
- [x] Smoke test (`app.spec.ts`) passando via Vitest.

---
**Branch**: `feature/FE-1-app-shell`  
**Issue Relacionada**: #1


---

### PR #22 - feat: project setup (Angular + Stellar SDK) #21
- **State:** MERGED
- **Created at:** 2026-04-22T12:50:18Z
- **Merged at:** 2026-04-22T12:50:35Z
- **Author:** heliocarrara
- **URL:** https://github.com/StakeGood-UFMT/frontend/pull/22

#### Description
## Proposta
Configura├º├úo inicial do frontend para intera├º├úo com a rede Stellar.

## Mudan├ºas Realizadas
- **Bootstrap Angular**: Inicializado projeto com Angular 17/21 (Standalone, Signals, Roteamento e CSS Vanilla).
- **Integra├º├úo Stellar**: Instala├º├úo e configura├º├úo do @stellar/stellar-sdk e @albedo-link/intent.
- **Arquitetura**:
  - Configura├º├úo de aliases @core e @shared no 	sconfig.json.
  - Cria├º├úo de diret├│rios estruturados (services, models, guards, components, etc).
- **Core Service**: 
  - StellarService criado para abstrair chamadas ├á Horizon.
  - Uso de **Signals** para rastreamento de estado da conex├úo.
- **Ambientes**: Configura├º├úo de environment para Futurenet (padr├úo) e Testnet.
- **Corre├º├Áes/Polimento**:
  - Remo├º├úo de warnings de CommonJS no build (^GllowedCommonJsDependencies).
  - Ajuste de budgets para comportar o SDK.
  - UI b├ísica de status criada no AppComponent.

## Valida├º├úo
- [x] Build efetuado com sucesso (
pm run build).
- [x] 
g serve executado sem erros.
- [x] Importa├º├Áes do Stellar SDK corrigidas para padr├Áes de vers├úo recente (Horizon.Server).

Fixes #21

---

