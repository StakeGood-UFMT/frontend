import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketDetailComponent } from './market-detail.component';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import * as MarketActions from '../../../core/store/market/market.actions';
import { ProbabilityChartComponent } from '../components/probability-chart/probability-chart.component';
import { StakeFormComponent } from '../components/stake-form/stake-form.component';

describe('MarketDetailComponent', () => {
  let component: MarketDetailComponent;
  let fixture: ComponentFixture<MarketDetailComponent>;
  let store: MockStore;
  let dispatchSpy: jasmine.Spy;

  const initialState = {
    market: {
      selectedMarket: {
        id: 'mkt-1',
        title: 'Test Market',
        description: 'Test Description',
        category: 'CRYPTO',
        status: 'OPEN',
        yes_price: 0.5,
        no_price: 0.5,
        total_volume: 1000,
        lock_ts: '2026-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        resolution_rule: 'Test Rule',
        resolution_source: 'Test Source',
        fee_ngo: 1,
        fee_platform: 1,
        fee_gamification: 1
      },
      history: [],
      loadingMarket: false,
      loadingHistory: false,
      marketError: null,
      historyError: null
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketDetailComponent, ProbabilityChartComponent, StakeFormComponent],
      providers: [
        provideMockStore({ initialState }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'mkt-1'
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MarketDetailComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    dispatchSpy = spyOn(store, 'dispatch');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch loadHistory action when range changes', () => {
    const newRange = '1W';
    component.onRangeChange(newRange);
    
    expect(component.selectedRange).toBe(newRange);
    expect(dispatchSpy).toHaveBeenCalledWith(
      MarketActions.loadHistory({ id: 'mkt-1', range: newRange })
    );
  });
});
