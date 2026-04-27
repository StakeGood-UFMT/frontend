import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="page-container">
      <h1>Help Center</h1>
      <p>Central de ajuda e documentação.</p>
    </main>
  `,
  styles: [`
    .page-container { padding: 32px; }
    h1 { margin-bottom: 12px; }
  `]
})
export class HelpCenterComponent { }
