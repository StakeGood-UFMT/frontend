import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="page-container">
      <h1>Terms of Use</h1>
      <p>Versão atualizada dos termos de uso.</p>
    </main>
  `,
  styles: [`
    .page-container { padding: 32px; }
    h1 { margin-bottom: 12px; }
  `]
})
export class TermsComponent { }
