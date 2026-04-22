import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Feature {
  icon: string;
  title: string;
  description: string;
  tag?: string;
}

@Component({
  selector: 'app-features-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="features" id="features">
      <div class="features-inner">
        <!-- Section header -->
        <div class="section-header">
          <span class="section-tag">Como Funciona</span>
          <h2 class="section-title">Mercado Preditivo com <span class="accent">Propósito</span></h2>
          <p class="section-desc">
            Uma plataforma onde cada aposta financia causas reais. Quanto mais precisa sua previsão, maior o impacto.
          </p>
        </div>

        <!-- Grid -->
        <div class="features-grid">
          <div *ngFor="let f of features; let i = index" 
               class="feature-card" 
               [class.featured]="i === 0"
               [style.animation-delay]="(i * 0.1) + 's'">
            <div class="feature-icon">{{ f.icon }}</div>
            <div class="feature-content">
              <h3 class="feature-title">{{ f.title }}</h3>
              <p class="feature-desc">{{ f.description }}</p>
            </div>
            <span *ngIf="f.tag" class="feature-tag">{{ f.tag }}</span>
          </div>
        </div>

        <!-- Flow steps -->
        <div class="flow-steps">
          <div *ngFor="let step of steps; let i = index; let last = last" class="step-wrapper">
            <div class="step">
              <div class="step-num">{{ i + 1 }}</div>
              <div class="step-info">
                <span class="step-title">{{ step.title }}</span>
                <span class="step-desc">{{ step.desc }}</span>
              </div>
            </div>
            <div *ngIf="!last" class="step-arrow">→</div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    .features {
      font-family: 'Inter', sans-serif;
      background: #F6F8F7;
      padding: 96px 80px;
    }

    .features-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 64px;
    }

    /* Section header */
    .section-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .section-tag {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #0a8a57;
      background: rgba(17, 212, 138, 0.1);
      padding: 6px 16px;
      border-radius: 999px;
    }

    .section-title {
      font-size: clamp(1.8rem, 3vw, 2.6rem);
      font-weight: 900;
      color: #111815;
      margin: 0;
      letter-spacing: -0.03em;
      line-height: 1.15;
    }

    .accent { color: #11D48A; }

    .section-desc {
      font-size: 1rem;
      color: #6B7280;
      max-width: 540px;
      line-height: 1.7;
      margin: 0;
    }

    /* Feature Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .feature-card {
      background: #FFFFFF;
      border-radius: 20px;
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      border: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      animation: fadeSlideUp 0.5s ease both;
    }

    .feature-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #11D48A, #0BB574);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.08);
    }

    .feature-card:hover::before { opacity: 1; }

    .feature-card.featured {
      grid-column: span 2;
      background: linear-gradient(135deg, #111815 0%, #1a2e26 100%);
      border-color: rgba(17, 212, 138, 0.15);
    }
    .feature-card.featured .feature-title { color: #FFFFFF; }
    .feature-card.featured .feature-desc { color: rgba(255,255,255,0.6); }

    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .feature-icon {
      font-size: 2rem;
      line-height: 1;
    }

    .feature-content { flex: 1; }

    .feature-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #111815;
      margin: 0 0 8px;
    }

    .feature-desc {
      font-size: 0.9rem;
      color: #6B7280;
      line-height: 1.6;
      margin: 0;
    }

    .feature-tag {
      font-size: 0.7rem;
      font-weight: 700;
      color: #11D48A;
      background: rgba(17, 212, 138, 0.12);
      padding: 4px 10px;
      border-radius: 999px;
      align-self: flex-start;
    }

    /* Flow steps */
    .flow-steps {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .step-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #FFFFFF;
      border-radius: 16px;
      padding: 16px 20px;
      border: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      min-width: 180px;
      transition: all 0.2s;
    }
    .step:hover { border-color: rgba(17,212,138,0.3); transform: translateY(-2px); }

    .step-num {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #11D48A, #0BB574);
      color: #111815;
      font-weight: 800;
      font-size: 0.9rem;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .step-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .step-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #111815;
    }

    .step-desc {
      font-size: 0.75rem;
      color: #9CA3AF;
      font-weight: 500;
    }

    .step-arrow {
      font-size: 1.2rem;
      color: #D1D5DB;
      font-weight: 600;
    }

    /* Responsive */
    @media (max-width: 960px) {
      .features { padding: 64px 40px; }
      .features-grid { grid-template-columns: repeat(2, 1fr); }
      .feature-card.featured { grid-column: span 2; }
    }

    @media (max-width: 600px) {
      .features { padding: 48px 20px; }
      .features-grid { grid-template-columns: 1fr; }
      .feature-card.featured { grid-column: span 1; }
      .flow-steps { flex-direction: column; align-items: stretch; }
      .step-arrow { transform: rotate(90deg); align-self: center; }
      .step { min-width: auto; }
    }
  `]
})
export class FeaturesGridComponent {
  features: Feature[] = [
    {
      icon: '🎯',
      title: 'Preveja com propósito',
      description: 'Participe de mercados preditivos onde cada aposta tem impacto real. Sua carteira Stellar é tudo que você precisa — sem burocracia, sem intermediários.',
      tag: 'Destaque'
    },
    {
      icon: '🔗',
      title: 'Blockchain Transparente',
      description: 'Todas as apostas e resultados ficam registrados na Stellar. Auditável por qualquer pessoa a qualquer momento.'
    },
    {
      icon: '🤝',
      title: 'ONGs verificadas',
      description: 'Trabalhamos somente com organizações verificadas. Seu dinheiro vai direto ao destino certo.'
    },
    {
      icon: '⚡',
      title: 'Transações Instantâneas',
      description: 'Stellar finaliza transações em ~5 segundos com taxas mínimas. Nada de esperar dias pelo seu saldo.'
    },
    {
      icon: '📊',
      title: 'Oracle de Impacto',
      description: 'Dados de impacto verificados e publicados on-chain. Previsões corretamente baseadas em resultados reais.'
    }
  ];

  steps = [
    { title: 'Conecte a Carteira', desc: 'Freighter, xBull, Albedo...' },
    { title: 'Escolha uma Arena', desc: 'Tópico + ONG beneficiada' },
    { title: 'Faça sua Previsão', desc: 'Aposte XLM no resultado' },
    { title: 'Impacto Real', desc: 'Prêmio + doação confirmados' },
  ];
}
