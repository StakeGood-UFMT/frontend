import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VotingPage } from './voting.component';
import { VoteService } from './services/vote.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NotificationService } from '../../core/services/notification.service';
import { WalletService } from '../../core/services/wallet.service';
import { of } from 'rxjs';

describe('VotingPage', () => {
  let component: VotingPage;
  let fixture: ComponentFixture<VotingPage>;
  let voteService: VoteService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VotingPage, HttpClientTestingModule],
      providers: [
        VoteService,
        { provide: NotificationService, useValue: { show: () => 'id', update: () => {} } },
        { provide: WalletService, useValue: { publicKey: () => 'address' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VotingPage);
    component = fixture.componentInstance;
    voteService = TestBed.inject(VoteService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Quadratic Cost Calculation', () => {
    it('should calculate quadratic cost correctly for a single NGO', () => {
      // cost = votes^2
      expect(voteService.calculateCost(0)).toBe(0);
      expect(voteService.calculateCost(1)).toBe(1);
      expect(voteService.calculateCost(2)).toBe(4);
      expect(voteService.calculateCost(3)).toBe(9);
      expect(voteService.calculateCost(10)).toBe(100);
    });

    it('should calculate total quadratic cost for multiple NGOs', () => {
      const allocations = [
        { organization_id: '1', votes: 2, cost: 4 }, // 2^2 = 4
        { organization_id: '2', votes: 3, cost: 9 }, // 3^2 = 9
        { organization_id: '3', votes: 5, cost: 25 } // 5^2 = 25
      ];
      // total = 4 + 9 + 25 = 38
      expect(voteService.calculateTotalCost(allocations)).toBe(38);
    });

    it('should update allocation and total cost when votes change', () => {
      component.voiceCredits.set(100);
      component.updateAllocation('ngo-1', 5); // 25 credits
      expect(component.totalCost()).toBe(25);

      component.updateAllocation('ngo-2', 5); // another 25 credits
      expect(component.totalCost()).toBe(50);

      component.updateAllocation('ngo-1', 10); // 100 credits total
      expect(component.totalCost()).toBe(125); // 100 + 25
    });
  });

  describe('Validations', () => {
    it('should identify when total cost exceeds credits', () => {
      component.voiceCredits.set(50);
      component.updateAllocation('ngo-1', 8); // 8^2 = 64
      expect(component.totalCost()).toBeGreaterThan(component.voiceCredits());
    });
  });
});
