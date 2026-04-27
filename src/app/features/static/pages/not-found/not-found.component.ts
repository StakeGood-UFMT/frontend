import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="not-found">
      <h1>404 — Página não encontrada</h1>
      <p>A página que você procura não existe ou foi removida.</p>
      <a routerLink="/landing" class="btn">Voltar para a home</a>
    </main>
  `,
  styles: [`
    .not-found { padding: 48px; text-align: center; }
    .btn { display: inline-block; margin-top: 18px; padding: 8px 14px; background: #11D48A; color: #05120a; border-radius: 8px; text-decoration: none; }
  `]
})
export class NotFoundComponent { }
