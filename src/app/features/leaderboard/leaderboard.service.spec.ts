import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LeaderboardService } from './leaderboard.service';
import { API_CONFIG } from '../../core/config/api.config';

describe('LeaderboardService', () => {
  let svc: LeaderboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [LeaderboardService] });
    svc = TestBed.inject(LeaderboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should call /leaderboard with params', (done) => {
    svc.getLeaderboard('7d', 'alice', 2, 5).subscribe(resp => {
      expect(resp.items.length).toBe(1);
      done();
    });

    const req = httpMock.expectOne(r => r.url.endsWith('/leaderboard'));
    expect(req.request.params.get('range')).toBe('7d');
    expect(req.request.params.get('q')).toBe('alice');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('5');
    req.flush({ items: [{ id: 'u1', username: 'alice', reputation: 10 }], total: 1 });
  });
});
