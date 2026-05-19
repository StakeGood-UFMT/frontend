import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-wrong-network-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="walletService.wrongNetworkModalOpen()" (click)="closeModal()">
      <div class="modal-content glass-card" (click)="$event.stopPropagation()">
        <header>
          <div class="header-left">
            <div class="warning-icon-wrapper">
              <span class="warning-icon">⚠️</span>
            </div>
            <h2>Rede Incorreta Detectada</h2>
          </div>
          <button class="close-btn" (click)="closeModal()" title="Fechar">&times;</button>
        </header>

        <div class="modal-body">
          <div class="network-badge-container">
            <div class="network-badge current">
              <span class="badge-label">Rede Conectada</span>
              <span class="badge-value public">{{ walletService.connectedNetworkName() || 'Mainnet' }}</span>
            </div>
            <div class="arrow-icon">➡️</div>
            <div class="network-badge expected">
              <span class="badge-label">Rede Exigida</span>
              <span class="badge-value testnet">{{ walletService.expectedNetworkName() || 'Testnet' }}</span>
            </div>
          </div>

          <p class="description">
            Você conectou sua carteira na <strong>{{ walletService.connectedNetworkName() || 'Mainnet' }}</strong>. 
            O StakeGood atualmente opera exclusivamente na <strong>{{ walletService.expectedNetworkName() || 'Testnet' }}</strong> 
            para garantir a segurança das operações e validações de impacto social.
          </p>

          <div class="instructions-box">
            <h3>💡 Como alterar a rede no Freighter:</h3>
            <ol>
              <li>Abra a extensão da sua carteira (ex: Freighter).</li>
              <li>Clique no ícone de engrenagem (Configurações) ou seletor de rede no topo.</li>
              <li>Selecione a rede <strong>Testnet</strong> (ou ative as redes de teste nas configurações).</li>
              <li>Volte ao StakeGood e clique em <strong>Connect Wallet</strong> novamente.</li>
            </ol>
          </div>

          <div class="actions">
            <button class="btn-primary" (click)="closeModal()">
              Entendi / Mudar Rede
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(17, 24, 21, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-content {
      width: 100%;
      max-width: 540px;
      padding: 36px;
      margin: 20px;
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .glass-card {
      background: linear-gradient(145deg, #111815 0%, #162820 100%);
      border: 1px solid rgba(255, 90, 90, 0.3);
      border-radius: 28px;
      box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 90, 90, 0.15);
      color: #f1f5f2;
      font-family: 'Inter', sans-serif;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      h2 {
        font-size: 1.6rem;
        font-weight: 800;
        color: #ffffff;
        margin: 0;
        letter-spacing: -0.02em;
      }
    }

    .warning-icon-wrapper {
      width: 48px;
      height: 48px;
      background: rgba(255, 90, 90, 0.15);
      border: 1px solid rgba(255, 90, 90, 0.3);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulseWarning 2s infinite ease-in-out;

      .warning-icon {
        font-size: 1.6rem;
      }
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #9ca3af;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #ffffff;
        transform: scale(1.05);
      }
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .network-badge-container {
      display: flex;
      align-items: center;
      justify-content: space-around;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 20px;
    }

    .network-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;

      .badge-label {
        font-size: 0.75rem;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
      }

      .badge-value {
        font-size: 1.1rem;
        font-weight: 800;
        padding: 6px 16px;
        border-radius: 999px;

        &.public {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        &.testnet {
          background: rgba(17, 212, 138, 0.2);
          color: #11d48a;
          border: 1px solid rgba(17, 212, 138, 0.4);
        }
      }
    }

    .arrow-icon {
      font-size: 1.5rem;
      opacity: 0.7;
    }

    .description {
      color: #d1d5db;
      line-height: 1.6;
      font-size: 1.05rem;
      margin: 0;

      strong {
        color: #ffffff;
      }
    }

    .instructions-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 24px;

      h3 {
        font-size: 1rem;
        font-weight: 700;
        color: #11d48a;
        margin: 0 0 16px;
      }

      ol {
        margin: 0;
        padding-left: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        color: #9ca3af;
        font-size: 0.95rem;
        line-height: 1.5;

        li strong {
          color: #ffffff;
        }
      }
    }

    .actions {
      display: flex;
      margin-top: 8px;

      .btn-primary {
        width: 100%;
        padding: 18px;
        background: linear-gradient(135deg, #11D48A 0%, #0BB574 100%);
        color: #111815;
        font-weight: 800;
        font-size: 1.05rem;
        border: none;
        border-radius: 18px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 8px 24px rgba(17, 212, 138, 0.3);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(17, 212, 138, 0.45);
          filter: brightness(1.05);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes pulseWarning {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255, 90, 90, 0.4); }
      50% { box-shadow: 0 0 0 15px rgba(255, 90, 90, 0); }
    }

    @media (max-width: 600px) {
      .modal-content {
        padding: 28px 20px;
      }

      .network-badge-container {
        flex-direction: column;
        gap: 16px;
      }

      .arrow-icon {
        transform: rotate(90deg);
      }
    }
  `]
})
export class WrongNetworkModalComponent {
  public walletService = inject(WalletService);

  closeModal() {
    this.walletService.wrongNetworkModalOpen.set(false);
  }
}
