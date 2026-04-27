import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaderboardTableComponent } from './leaderboard-table.component';
import { By } from '@angular/platform-browser';

describe('LeaderboardTableComponent', () => {
  let fixture: ComponentFixture<LeaderboardTableComponent>;
  let component: LeaderboardTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LeaderboardTableComponent] }).compileComponents();
    fixture = TestBed.createComponent(LeaderboardTableComponent);
    component = fixture.componentInstance;
  });

  it('should render rows from data', () => {
    component.data = [
      { rank: 1, id: 'u1', username: 'Alice', reputation: 100 },
      { rank: 2, id: 'u2', username: 'Bob', reputation: 90 }
    ];
    component.total = 2;
    component.page = 1;
    component.limit = 10;
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    // last row might be empty row if no data logic; ensure at least data rows present
    expect(rows.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain('Alice');
    expect(fixture.nativeElement.textContent).toContain('Bob');
  });

  it('should emit pageChange when next is clicked', () => {
    component.data = Array.from({ length: 20 }, (_, i) => ({ rank: i + 1, id: `u${i}`, username: `User${i}`, reputation: 10 }));
    component.total = 20;
    component.page = 1;
    component.limit = 10;
    spyOn(component.pageChange, 'emit');
    fixture.detectChanges();
    const btn = fixture.debugElement.queryAll(By.css('.pagination button'))[1];
    btn.nativeElement.click();
    expect(component.pageChange.emit).toHaveBeenCalled();
  });
});
