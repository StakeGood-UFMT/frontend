
# Regras de Engenharia de Interface e Navegação (StakeGood Frontend)

**Objetivo deste documento:** O Angular será responsável por duas missões críticas: **(1)** Orquestrar a comunicação entre o usuário (via extensão de carteira), a API NestJS e a rede Stellar, e **(2)** Mascarar a latência da blockchain através de Interfaces Otimistas (Optimistic UI), garantindo que o usuário não abandone a plataforma enquanto aguarda o fechamento dos blocos da rede.

## 1. Arquitetura de Integração (Como o Front conversa com o resto)

O Frontend obedece a um fluxo de delegação estrita. Ele não confia em si mesmo para regras financeiras.

* **O Fluxo de Login Web3 (Sem Senhas):** 1. O usuário clica em "Conectar". O Angular detecta se a extensão **Freighter** está instalada no navegador.
    2. O Angular pede a chave pública (Public Key) para a extensão.
    3. O Angular envia essa chave para a API NestJS e pede um desafio (Nonce).
    4. O Angular abre um pop-up da carteira pedindo para o usuário assinar digitalmente aquele texto (Nonce). O Angular **nunca** toca na chave privada.
    5. O Angular devolve a assinatura para a API. A API devolve um JWT. O usuário está logado.
* **O Fluxo de Delegação XDR (Transações):** 1. Quando o usuário decide apostar, o Angular coleta a intenção (Mercado X, Opção SIM, 50 USDC).
    2. O Angular manda isso para a API. A API faz todas as checagens legais (limites, KYC) e devolve um pacote binário encriptado chamado **XDR**.
    3. O Angular pega esse XDR e passa para a carteira Freighter. O usuário revisa e clica em "Aprovar".
    4. A transação vai para a rede.
* **A Magia do Tempo Real (WebSockets / SSE):** A blockchain da Stellar leva cerca de 5 segundos para processar algo. O Angular deve abrir uma conexão contínua (WebSocket) com a API NestJS. Quando o usuário assina a aposta, o Angular coloca o botão em estado "Processando..." e fica escutando o WebSocket. Quando o Worker do backend grita "Transação confirmada no bloco 50.000!", o Angular instantaneamente muda o botão para "Sucesso" e atualiza o saldo da tela.

---

## 2. Mapeamento Exaustivo de Telas e Componentes

### Tela 1: Landing Page (Pública)
A vitrine do projeto. Foca em explicar a inovação: "Mercado Preditivo encontra a Filantropia".
* **Componente Hero:** Título de impacto, subtítulo explicando o "Skin in the game social".
* **Botão Primário [Conectar Carteira]:** Fica flutuante no Header. Se o usuário não tiver o Freighter instalado, o botão muda dinamicamente para [Instalar Carteira Freighter] e redireciona para a loja de extensões do Chrome.
* **Seção de Transparência:** Mostra números globais em tempo real (consumidos via GET público da API): "USDC Distribuídos para ONGs", "Mercados Resolvidos", "Apostadores Ativos".

### Tela 2: Onboarding e KYC (Portal de Conformidade)
Se o usuário logar com a carteira, mas a API responder que ele não tem biometria aprovada, o Angular o trava nesta tela. Ele não pode ver o dashboard.
* **Aviso de Regulamentação:** Texto claro informando a exigência da Lei 14.790.
* **Componente Iframe de Biometria:** Integração visual com o provedor (ex: SumSub). Abre a câmera do celular ou webcam.
* **Botão [Aguardando Verificação]:** Fica desabilitado e girando até que o WebSocket do backend avise o Angular que a inteligência artificial do provedor aprovou o rosto contra fraudes. Assim que aprova, redireciona automaticamente para a Arena.

### Tela 3: Arena de Mercados (O Marketplace Preditivo)
Onde o usuário escolhe os eventos.
* **Barra de Filtros (FilterBar):** Botões para categorias (Política, Clima, Esportes) e ordenação (Volume de Liquidez, Data de Encerramento).
* **Card de Mercado (MarketCard):** Cada jogo/evento é um card. 
    * *Layout do Card:* Pergunta clara (ex: "Selic cai em Maio?").
    * *Barra de Probabilidade Visual:* Uma barra horizontal dividida em duas cores. Se o pool tem 70% de dinheiro no SIM e 30% no NÃO, a barra é 70% verde e 30% vermelha.
    * *Botão [Prever Agora]:* Leva para os detalhes.

### Tela 4: Detalhe do Mercado (O Core de Decisão)
A tela mais complexa do sistema. Requer leitura instantânea e clareza financeira.
* **Cabeçalho:** A pergunta, regras exatas de resolução (evitar ambiguidades) e o link para o Oráculo (ex: "Fonte oficial: Site do Banco Central").
* **Gráfico de Evolução (Time-Series Chart):** Um gráfico de linhas mostrando como a probabilidade (o sinal epistêmico) mudou ao longo dos dias.
* **Painel de Aporte (Stake Form):**
    * *Seleção de Lado:* Dois botões gigantes: [SIM - 70%] e [NÃO - 30%].
    * *Regra de Interface (Anti-Hedge):* Se o Angular detectar que o usuário já apostou no "SIM" ontem, o botão "NÃO" fica cinza, bloqueado e com um *tooltip*: "Você já assumiu uma posição neste mercado. Posições duplas não são permitidas".
    * *Input de Valor:* Campo numérico. Abaixo dele, texto dinâmico: "Seu saldo: 500 USDC".
    * *Calculadora de Retorno Dinâmica:* Conforme o usuário digita "100", o Angular calcula e mostra em tempo real: "Retorno estimado em caso de vitória: 142 USDC".
    * *Aviso da Lei 14.790:* Se o valor digitado estourar o limite mensal do usuário, o input fica vermelho e o botão de confirmar desabilita.
* **Botão [Assinar Previsão]:** * *Estado 1:* Clicou. (O Front pede o XDR para a API).
    * *Estado 2:* "Aprove na sua Carteira" (Abre o popup do Freighter).
    * *Estado 3:* "Registrando na Blockchain..." (Optimistic UI ativada, barra de load).
    * *Estado 4:* Sucesso. A tela emite confetes e atualiza o gráfico.

### Tela 5: Dashboard de Filantropia e Votação (Futarchy)
Esta tela só é acessível para os vencedores de um mercado resolvido.
* **Aviso de Celebração:** "Você acertou a previsão! O dinheiro dos perdedores gerou 5.000 USDC para impacto social. Decida o destino."
* **Componente de Voto Quadrático (O Diferencial):** * O usuário tem, por exemplo, "100 Créditos de Voto" (calculados com base no dinheiro que ele apostou).
    * Lista de ONGs (cards). Em cada card, um controle de *Slider* (deslizante).
    * *Regra de Interface (Matemática Visual):* Conforme o usuário arrasta o slider de votos para a "ONG Amazônia", o custo mostrado sobe exponencialmente. Exemplo visual: "Dar 1 voto custa 1 crédito. Dar 5 votos custa 25 créditos. Dar 10 votos custa 100 créditos". Isso educa o usuário sobre o Voto Quadrático sem que ele precise ler manuais.
* **Botão [Confirmar Delegação de Votos]:** Assina o XDR do voto e sela o destino do dinheiro no contrato inteligente.

### Tela 6: Perfil e Reputação On-Chain (O Track Record)
Onde o usuário gerencia seu patrimônio e ego preditivo.
* **Abas de Navegação:** [Posições Abertas], [Histórico Fechado], [Impacto Gerado].
* **Painel de Resgate (Claim Payouts):** * *Regra de Interface:* Devido à limitação da rede Stellar (Pull over Push), o dinheiro ganho não cai magicamente na carteira. O Angular deve listar os mercados que o usuário venceu com o status "Aguardando Saque".
    * *Botão [Resgatar Lucro]:* Constrói o XDR de saque, pede assinatura, e move os USDC do Contrato para a carteira do usuário.
* **Métricas de Ego:** Gráficos mostrando o "Brier Score" do usuário (quão bom ele é de previsão) e o nível de reputação on-chain alcançado (Torcedor, Oráculo, Lenda).

---

## 3. Gestão de Erros de Interface (Os Caminhos Tristes)

Um aplicativo Web3 sem tratamento de erros causa pânico financeiro no usuário. O Angular deve interceptar e traduzir cada falha:

* **Erro: Rejeição de Assinatura.** Se o usuário fecha o popup da carteira sem aprovar. O Angular deve remover imediatamente o status de "Carregando" do botão principal e exibir um aviso sutil: "Ação cancelada pelo usuário. Nenhum saldo foi descontado."
* **Erro: RPC Timeout (A rede travou).** O usuário assinou, mas o WebSocket não respondeu em 30 segundos. O Angular não pode dizer "Falhou", pois a transação pode ter sido minerada. O aviso deve ser: "A rede está congestionada. Sua aposta está sendo processada. Verifique seu histórico em alguns minutos."
* **Erro: Saldo Insuficiente para Taxa de Rede (XLM Dust).** Se a API avisar que a carteira tem USDC, mas não tem o mínimo de XLM (0.5 XLM) para pagar a infraestrutura do Soroban, o Angular deve bloquear o botão de aposta antecipadamente e avisar: "Você precisa de XLM na carteira para pagar a taxa operacional da rede Stellar".

## 4. O Componente de Manutenção Oculto (Keeper UI)
Embora os bots do NestJS devam fazer isso automaticamente, o Frontend de Administração (apenas acessível pela chave pública do Admin) deve ter uma aba chamada **"Gestão de TTL (State Rent)"**.
* O Angular consome uma rota da API listando contas e mercados que vão expirar na blockchain nos próximos 14 dias.
* O Admin terá um botão **[Estender TTL em Lote]**. Isso gerará um XDR gigantesco onde a carteira do administrador paga a taxa para manter os dados vivos na rede, garantindo que o Smart Contract não sofra um colapso de memória.
