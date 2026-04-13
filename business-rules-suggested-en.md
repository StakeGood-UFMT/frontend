# Interface Engineering and Navigation Rules (StakeGood Frontend)

**Objective of this document:** The Frontend (e.g., Angular, but applicable to any stack) will be responsible for two critical missions:  
**(1)** Orchestrating communication between the user (via wallet extension), the API (e.g., NestJS), and the Stellar network (Soroban), and  
**(2)** Masking blockchain latency through **Optimistic UI**, ensuring the user doesn't abandon the platform while waiting for network confirmation.

> Consistency Note: In the mapped screens, the asset appears as **XLM**, but the product may operate with other assets (e.g., USDC). The frontend must be **asset-agnostic**: always render `assetSymbol`/`decimals` coming from the backend/market metadata.

## 1. Integration Architecture (How the Front talks to the rest)

The Frontend follows a strict delegation flow. It does not trust itself for financial rules.

### 1.1 Web3 Login Flow (no passwords)
1. User clicks **“Connect Wallet”**.
2. Frontend detects if the wallet (e.g., **Freighter**) is installed.
   - If not installed: the button changes to **“Install Wallet”** and redirects to the store.
3. Frontend requests the **public key**.
4. Frontend requests a **nonce** (challenge) from the API.
5. Frontend opens the wallet popup for the user to **sign the nonce**.
6. Frontend sends the signature to the API.
7. API returns **JWT** + “snapshot” of the profile (KYC, tier, limits, role, terms flags).

**Mandatory UI Rule:** The button must reflect states:
- `Connect Wallet` → `Checking wallet…` → `Approve signature in wallet…` → `Connected` (or error with retry).

### 1.2 XDR Delegation Flow (Transactions)
1. When the user decides to act (stake, claim, vote, link wallet, etc.), the frontend collects only the **intention**:
   - E.g.: `market_id`, `outcome`, `amount`, `votes`.
2. Frontend sends intention to the API.
3. API validates (KYC/limits/market phase/anti-hedge, etc.) and returns an **XDR** (binary payload) for signature.
4. Frontend passes the XDR to the wallet; the user reviews and approves.
5. Frontend enters **pending** state and waits for confirmation via WS/SSE.

**Security Rule:** The frontend **does not assemble** the final transaction.

### 1.3 Real-Time Magic (WebSockets / SSE) + Optimistic UI
Stellar/Soroban may have confirmation in seconds, but with variation. The frontend must:
- Start an event channel (WS/SSE) after login;
- Upon sending tx, apply **Optimistic UI**:
  - Disable critical buttons/inputs;
  - Show toast “Waiting for confirmation…”;
  - Record a “pending” entry in local history.
- Upon receiving confirmation via WS:
  - Update balance, position, claim, and/or votes;
  - Remove pending state and mark as “confirmed”.

**Timeout (Uncertain state):** If WS doesn't confirm within X seconds, never declare “failed” as definitive. Show:  
“Network congested. Your transaction may still be processing. Please check your history.”

### 1.4 Route Guards (Gating) by User State
The frontend must maintain and apply:
- `wallet`: disconnected/connecting/connected + address + balance + network.
- `auth`: logged_in/logged_out + JWT expiration.
- `kyc`: not_started/in_progress/pending/approved/rejected + tier.
- `terms`: accepted_by_version.
- `limits`: monthly_limit, consumed, remaining.
- `role`: user / ngo_partner / admin.

**Rules:**
- No wallet: Allow public screens; stake/claim/vote actions prompt for connection.
- No approved KYC: Block stake (and, if required, vote/claim) and redirect to KYC.
- No terms acceptance: Block actions and redirect to Terms.
- `role=ngo_partner`: Enable institutional portal (Settings/Compliance/Report).

---

## 2. Visual Identity and Componentization (Global Rules for Reconstruction)

> The mapped system presents 3 visual “families”. The frontend must support:
> - **Theme by section** (design tokens) or
> - **Subproducts** within the same app (e.g., “Arena” vs “The Organic Ledger”).

### 2.1 Visual Family A — Modern (Inter + vibrant green)
- Primary: Green (e.g., `#11D48A`)
- Background: `#F6F8F7`
- Negative Accent: Terracotta (e.g., `#CC5A37`)
- White cards with subtle borders, soft shadows, medium radius.

### 2.2 Visual Family B — Editorial / Paper (Newsreader + Plus Jakarta)
- “Paper” Background: `#FCF9F3`
- Primary: Forest Green (e.g., `#133E2F`)
- Secondary: Terracotta (e.g., `#A43D1C`)
- Translucent TopBar with blur (“glass”), editorial shadow, serif typography in headings.

### 2.3 Visual Family C — Dashboard (Public Sans + stone/emerald)
- “Stone” Neutrals + “Emerald” accents
- Fixed SideBar, cards in “bento grid”, pill buttons.

---

## 3. Exhaustive Mapping of Screens and Components (“Reconstruction” Level)

> Each screen below follows a fixed format (Objective → Layout → Components → Rules → States → Modals).  
> This serves to reconstruct the frontend **without depending on language/framework**.

### 3.1 Landing (Desktop) — Public
**Objective:** Present the value proposition and lead the user to **connect wallet** and/or **explore markets**.

**Visual Reference (Example):**  
![](stitch_assets/landing_page.png)

**Visual Identity:** **Family A (Modern)**  
- Background: `#F6F8F7`; Primary: `#11D48A`; Text: `#111815`; Smooth borders.
- Typography: Inter; Icons: Material Symbols Outlined.

**Layout:**
- Fixed TopBar with:
  - Brand on the left
  - Links (Markets, Voting, About)
  - Primary button “Connect Wallet”.
- 2-column Hero:
  - Left column: Large title (with green highlight) + explanation paragraph + secondary CTA “Explore Markets”.
  - Right column: “Connect to …” card with wallet icon and “Connect Freighter” button.
- “Metrics bar” below hero with 3 indicators (cards/columns).
- Minimal Footer.

**Components (Detail):**
- Primary button: Height 40–48px; radius 12–16px; hover with darker green.
- Wallet card: 1px border, soft shadow, 16px radius; large central icon; short “security” text.
- Metric cards: Large number, smaller grey unit; titles in uppercase or semi-bold.

**UI Rules:**
- If wallet not installed: CTA changes to “Install Wallet” and links to store.
- If `wallet.connected`: Show connected state (abbreviated address + balance) and replace CTA with “Go to Arena”.
- Metrics must support loading (skeleton) and real-time updates (if public endpoint exists).

**States:**
- Loading (metrics), error (connection), connected/disconnected.

**Modals/Overlays (Recommended):**
- “Select wallet provider” Modal/Drawer (Freighter, etc.) with “connecting” and “error” states.

---

### 3.2 Landing (Mobile)
**Objective:** Same as desktop landing, with hierarchy optimized for touch.

**Visual Reference (Example):**  
![](stitch_assets/landing_page_mobile.png)

**Layout:**
- Reduced TopBar (no links or with menu).
- Single column Hero (text → wallet card).
- Full-width buttons.

**Rules:** Identical to desktop.

---

### 3.3 Onboarding / KYC (Compliance Portal)
**Objective:** Prevent regulated actions until user completes KYC.

**Visual References (Examples):**  
![](stitch_assets/onboarding_conectar_carteira.png)  
![](stitch_assets/onboarding_kyc.png)  
![](stitch_assets/onboarding_valida_o_kyc.png)  
![](stitch_assets/onboarding_finalizar_perfil.png)  
![](stitch_assets/perfil_primeiro_acesso.png)

**Visual Identity:** “Earthy” variation (still compatible with A/B)  
- Off-white background; Forest green; Terracotta warnings; central card.

**Layout:**
- Central card with:
  - Header with back button + “Account Setup”.
  - Stepper (Connect ✓, Current KYC, Future Ready).
  - Regulatory banner (Law 14.790).
  - KYC container (iframe/SDK) with loading overlay (“Initializing secure verification… / Powered by …”).

**UI Rules:**
- If `kyc.status != approved`: Block stake and vote and redirect to this flow when trying to access blocked screens.
- WS/SSE must be able to unlock automatically (approved → redirect to Arena).
- If `rejected`: Show reason + CTA “Resubmit documents”/“Contact Support”.

**States:**
- Loading iframe, pending review, approved, rejected, network error.

---

### 3.4 Terms & Compliance (Explicit Acceptance)
**Objective:** Collect terms/risk/privacy acceptance before releasing actions.

**Visual References (Examples):**  
![](stitch_assets/termos_e_condi_es_compliance.png)  
![](stitch_assets/onboarding_termos_de_uso.png)

**Visual Identity:** **Family B (Paper/Editorial)**  
- Background `#FCF9F3`; primary `#133E2F`; secondary `#A43D1C`.
- Newsreader headings (serif), Plus Jakarta Sans body.
- Translucent TopBar with blur and editorial shadow.

**Layout:**
- Two columns:
  - “Legal Framework” sidebar with menu (Terms, Privacy, Risk, Update History) and info card/seal.
  - Main content with:
    - Large title, “Last updated” date
    - Numbered sections with highlighted headings
    - Feature cards (Responsible Staking / Social Impact)
    - Final block with checkboxes and buttons (Download PDF / Decline / Accept and Proceed)

**UI Rules:**
- `Accept and Proceed` only enables when mandatory checkboxes are checked.
- Acceptance must be per **version** (persist `terms_version_accepted`).
- `Decline` blocks regulated actions and returns to safe page (Landing/Arena read-only).

**Modals/Overlays (Optional):**
- Confirmation on “Decline”.
- “PDF generated” feedback on download.

---

### 3.5 Market Arena (Desktop)
**Objective:** Browse and select markets.

**Visual Reference (Example):**  
![](stitch_assets/market_arena.png)

**Visual Identity:** **Family A (Modern)**.

**Layout:**
- TopBar with “Search markets…” + avatar.
- Category sidebar (All Markets, Climate, Technology, Public Policy, Social Impact).
- Responsive card grid (2–3 columns).

**MarketCard (Mandatory Content):**
- Category chip
- Volume (e.g., “Vol: 14,500 {ASSET}”)
- Market question (1–2 lines)
- YES/NO line with percentages
- Segmented bar (Green YES / Terracotta NO)

**UI Rules:**
- Search with debounce; empty state when 0 results.
- Clickable cards navigate to Market Detail.
- (Recommended) status badges: Open / Locked / Resolved.

---

### 3.6 Market Arena (Mobile)
**Layout:**
- Categories become horizontal tabs.
- Single column list.
- Reduced search (top input or icon).

**Visual Reference (Example):**  
![](stitch_assets/market_arena_mobile.png)

---

### 3.7 Market Detail (Core) — with Sticky Stake Form
**Objective:** Explain resolution and allow staking.

**Visual References (Examples):**  
![](stitch_assets/market_detail.png)  
![](stitch_assets/market_detail_mobile.png)

**Visual Identity:** **Family A (Modern)**.

**Layout:**
- Sticky minimalist header with:
  - Back button
  - Brand
  - Balance badge + profile icon
- Two columns:
  - Left (Content):
    - Category + “Resolves …”
    - Large question
    - Resolution rules (explanatory text with source/oracle)
    - Current probability card + volume
    - YES/NO bar
    - Chart with 1D/1W/ALL buttons (active state highlighted)
    - “Resolution Source” card + “View Oracle Contract” link
  - Right (Sticky “Stake on Outcome” card):
    - YES/NO toggles in card format
    - Amount input with “Balance: …” and MAX button
    - Calculator: Est. Shares, Potential Return, Fee (e.g., 2% for NGOs)
    - CTA “Confirm Stake”
    - Terms warning

**UI Rules (Validation):**
- Amount mandatory, >0, <=balance, <=monthly limit (if applicable).
- MAX button uses `min(balance, remaining_limit)`.
- CTA disables if:
  - Wallet disconnected
  - KYC pending (when required)
  - Terms not accepted (when required)
  - Market closed/resolved
  - Invalid amount

**Anti-hedge (Two strategies):**
- **Blocking:** If contract rejects hedge, block UI on opposite side + tooltip.
- **Warning:** If allowed, show terracotta banner and open confirmation modal.

**States:**
- Pending tx: Toast “Awaiting confirmation…” + block inputs.
- Failure: Recoverable error, allow retry.
- Uncertain state: Timeout with instruction to check history.

**Modals/Overlays (Recommended):**
- Hedge confirmation (when applicable).
- Final confirmation (review) before opening wallet (optional).

---

### 3.8 Guided Stake Flow (4-step Wizard)
**Objective:** Reduce complexity and guide signature.
1) Select market  
2) Configure stake (YES/NO, amount, fee, return)  
3) Sign in wallet (focused screen)  
4) Success (summary + links to Arena/Profile)

**Visual References (Examples):**  
![](stitch_assets/1_sele_o_de_mercado.png)  
![](stitch_assets/2_configura_o_da_aposta.png)  
![](stitch_assets/3_assinatura_da_carteira.png)  
![](stitch_assets/4_confirma_o_e_sucesso.png)

**Rules:** Same validations as Market Detail; “Next” only enables if step is valid.

---

### 3.9 Futarchy Voting (Quadratic) — Allocate Platform Fees
**Objective:** Allocate voice credits to NGOs with quadratic cost.

**Visual Reference (Example):**  
![](stitch_assets/futarchy_voting.png)

**Visual Identity:** **Family A (Modern)**.

**Layout:**
- Sticky header with back button + “Voice Credits” badge.
- Banner explaining: cost = votes².
- NGO card grid:
  - Image, name, description
  - “Votes” + number
  - Slider 0–10 with green fill
  - “Cost” with green badge and “v²” formula
- Footer: “Allocating X of Y credits” + “Submit Votes” button.

**UI Rules:**
- Do not allow `allocatedCredits > totalCredits` (lock slider or disable submit).
- Votes are final: Confirmation modal upon submit.
- Unavailable NGOs: Grayscale/opacity card + disabled slider.

---

### 3.10 User Profile/Reputation
**Objective:** Show performance and allow claims.

**Visual References (Examples):**  
![](stitch_assets/profile_reputation.png)  
![](stitch_assets/dashboard_profile_mobile.png)  
![](stitch_assets/1_pr_mios_dispon_veis.png)  
![](stitch_assets/2_assinatura_de_resgate.png)  
![](stitch_assets/3_resgate_conclu_do.png)

**Visual Identity:** “Earthy” variation (serif for titles + sans for body).

**Layout:**
- “Reputation Profile” header + subtitle.
- Metrics: Brier Score (gauge), Total Staked, Win Rate, Total Earned.
- Tabs: Positions / History / Claims (count badge).
- Claims list: market, stake, payout, Claim button.

**UI Rules:**
- Claim uses build-claim → signature → pending → confirmed.
- Prevent double claim.

---

### 3.11 Claim History (Editorial View) + “View on-chain” links
**Objective:** Transparent history of claims and impact contribution.

**Visual References (Examples):**  
![](stitch_assets/claim_history_1.png)  
![](stitch_assets/claim_history_2.png)

**Visual Identity:** **Family B (Paper/Editorial)** (blur + editorial table).

**Layout:**
- Metrics: Total Earned + Social Yield Contribution.
- Table with columns: Date, Market Source, Amount Claimed, Impact Contribution, Status, Explorer.

**Rules:**
- Always render `impact_contribution` when it exists.
- “View on-chain” link only appears when there is a `tx_hash`/`explorer_url`.

---

### 3.12 NGO Directory / Project Directory
**Objective:** Discovery and navigation by cause.

**Visual References (Examples):**  
![](stitch_assets/ngo_directory_1.png)  
![](stitch_assets/ngo_directory_2.png)

**Visual Identity:** **Family C (Dashboard stone/emerald)**.

**Layout:**
- TopBar + SideBar.
- “Search NGOs…” search.
- Tabs: All/Trending/Newest.
- Chips by cause + “More Filters”.
- Cards with image, category tag, metrics, and “View Markets” CTA.
- “Propose Market” button.

**Rules:**
- “More Filters” opens drawer/modal (desktop) or bottom sheet (mobile).
- “Propose Market” requires permission (role/reputation/KYC).

---

### 3.13 NGO Profile (Impact Timeline + Transparency)
**Objective:** Proof of trust and accountability.

**Visual Reference (Example):**  
![](stitch_assets/ngo_profile_detail.png)

**Visual Identity:** Variation C with dark emerald hero.

**Layout:**
- Hero with “Verified Impact Partner” seal, logo, large name, description, metrics.
- Vertical Timeline (events with image, date, description, “Transaction Verified” badge when available).
- “Transparency” block with links (audit, treasury, certification) and “Operations Base” with map/location.

**Rules:**
- Links open in new tab.
- “Transaction Verified” requires on-chain reference.

---

### 3.14 Global Impact Feed (Public Ledger) + Export
**Objective:** Public ledger of distributions and transparency.

**Visual References (Examples):**  
![](stitch_assets/global_impact_feed_1.png)  
![](stitch_assets/global_impact_feed_2.png)

**Visual Identity:** C with “glass-card”.

**Layout:**
- Metrics: Total Distributed, Markets Settled.
- Filters: Cause, search, time range, size, sort.
- List/Table with “open_in_new”.
- Export button (with format modal).

**Rules:**
- Export generates file (async recommended) and shows loading.
- “open_in_new” opens (NGO/market/explorer).

---

### 3.15 Notifications Center
**Objective:** Centralize system events.

**Visual Reference (Example):**  
![](stitch_assets/notifications_center.png)

**Visual Identity:** C (portal/dashboard).

**Layout:**
- Unread section (counter + “Mark all as read”).
- Cards with CTAs (View Resolution, Claim Now, Details).
- Past section (grayscale).
- “Impact Summary” + “Unclaimed Rewards” Bento.

**Rules:**
- “Claim Now” deep-links to specific claim.
- “Mark all as read” updates UI instantly and reconciles with API.

---

### 3.16 Account Settings (Institutional/NGO Portal)
**Objective:** Compliance, limits, privacy, wallets, and security.

**Visual Reference (Example):**  
![](stitch_assets/account_settings.png)

**Visual Identity:** C (stone/emerald).

**Layout (Mandatory Cards):**
- Compliance: Monthly Stake Limit (consumed/total) + bar + “Upgrade tier” CTA.
- Profile Privacy: Toggles for Public Visibility / Private Mode.
- Security: Linked wallets (list, delete, add) + “Enable 2FA” button.
- Organization Profile: Status, member since, rank, “Export Compliance Report” button.

**Rules:**
- Private Mode affects leaderboard and public search.
- Removing wallet requires confirmation and “don't remove the last one” rule (recommended).
- Export generates file (loading + download).

---

### 3.17 Leaderboard
**Objective:** Ranking by accuracy and impact.

**Visual Reference (Example):**  
![](stitch_assets/leaderboard_ranking.png)

**Visual Identity:** C (bento + table).

**Layout:**
- Top 3 in cards with tiers.
- Search by address/ENS.
- Period filter (7d/all time).
- Global ranking table.

**Rules:**
- Respect private mode (hide/anonymize).

---

### 3.18 Help Center (FAQ)
**Objective:** Support and product content.

**Visual Reference (Example):**  
![](stitch_assets/central_de_ajuda_faq.png)

**Visual Identity:** B (editorial).

**Layout:**
- “Knowledge Base” hero + search.
- Topic sidebar.
- Accordion FAQ list.
- Final CTA “Contact Support” / “Join Discord”.

---

### 3.19 404 Page
**Objective:** Safe return when route doesn't exist.

**Visual Reference (Example):**  
![](stitch_assets/p_gina_404_fora_da_trilha.png)

**Visual Identity:** B (editorial).

**Layout:**
- Editorial message + illustration.
- “Return to the Arena” CTA + “Network Status” link.
- Simplified footer with links.

---

## 4. Interface Error Management (The Sad Paths)

A Web3 app without error handling causes financial panic in the user. The Angular app must intercept and translate every failure:

* **Error: Signature Rejection.** User closes wallet popup without approving. Frontend must immediately remove "Loading" status from main button and show a subtle notice: "Action cancelled by user. No balance was deducted."
* **Error: RPC Timeout (Network stuck).** User signed, but WebSocket didn't respond in 30 seconds. Frontend cannot say "Failed," as the transaction might have been mined. Notice should be: "Network is congested. Your stake is being processed. Please check your history in a few minutes."
* **Error: Insufficient Balance for Network Fee (XLM Dust).** If API warns the wallet has the market asset but lacks minimum XLM for fees, block UI beforehand: “You need XLM to pay for network fees.”
* **Error: Compliance/KYC/Limit.** If API returns compliance error, frontend:
  - Highlights input field (amount/votes) with error,
  - Displays human-readable message,
  - Offers CTA “Go to KYC” / “Upgrade Tier”.

## 5. Hidden Maintenance Component (Keeper UI)
While NestJS bots should handle this automatically, the Admin Frontend (accessible only by Admin public key) should have a tab called **"TTL Management (State Rent)"**.
* Consume API route listing accounts and markets expiring on-chain in the next 14 days.
* Admin has a **[Bulk Extend TTL]** button. Generates a large XDR where admin wallet pays fee to keep data alive on-network, ensuring Smart Contract data doesn't expire.
