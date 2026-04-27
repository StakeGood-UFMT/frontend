import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Top3CardsComponent } from './top3-cards.component';

describe('Top3CardsComponent', () => {
  let fixture: ComponentFixture<Top3CardsComponent>;
  let component: Top3CardsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Top3CardsComponent] }).compileComponents();
    fixture = TestBed.createComponent(Top3CardsComponent);
    component = fixture.componentInstance;
  });

  it('should render usernames when not in private mode', () => {
    component.items = [
      { rank: 1, id: 'u1', username: 'Alice', reputation: 100 },
      { rank: 2, id: 'u2', username: 'Bob', reputation: 90 },
      { rank: 3, id: 'u3', username: 'Carol', reputation: 80 }
    ];
    component.privateMode = false;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Alice');
    expect(el.textContent).toContain('Bob');
    expect(el.textContent).toContain('Carol');
  });

  it('should anonymize usernames when in private mode', () => {
    component.items = [{ id: 'u1', username: 'Alice', reputation: 100 }];
    component.privateMode = true;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Anonymous User');
    expect(el.textContent).not.toContain('Alice');
  });
});
