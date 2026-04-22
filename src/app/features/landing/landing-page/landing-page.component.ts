import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { MetricsBarComponent } from './metrics-bar/metrics-bar.component';
import { FeaturesGridComponent } from './features-grid/features-grid.component';
import { ConnectWalletCardComponent } from './connect-wallet-card/connect-wallet-card.component';
import { LandingFooterComponent } from './landing-footer/landing-footer.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    HeroSectionComponent,
    MetricsBarComponent,
    FeaturesGridComponent,
    ConnectWalletCardComponent,
    LandingFooterComponent
  ],
  template: `
    <main class="landing-page">
      <app-hero-section></app-hero-section>
      <app-metrics-bar></app-metrics-bar>
      <app-features-grid></app-features-grid>
      <app-connect-wallet-card></app-connect-wallet-card>
      <app-landing-footer></app-landing-footer>
    </main>
  `,
  styles: [`
    .landing-page {
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }
  `]
})
export class LandingPageComponent {}
