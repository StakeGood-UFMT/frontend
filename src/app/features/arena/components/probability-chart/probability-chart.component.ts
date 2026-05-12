import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { MarketHistoryPoint } from '../../../../core/models/market.model';

Chart.register(...registerables);

@Component({
  selector: 'app-probability-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <span class="chart-title">Probability History</span>
        <div class="view-selector">
          <button (click)="setView('probability')" [class.active]="view() === 'probability'">Probability</button>
          <button (click)="setView('pools')" [class.active]="view() === 'pools'">Pools</button>
        </div>
        <div class="range-selector">
          <button (click)="onRangeChange('1H')" [class.active]="selectedRange === '1H'">1H</button>
          <button (click)="onRangeChange('1D')" [class.active]="selectedRange === '1D'">1D</button>
          <button (click)="onRangeChange('1W')" [class.active]="selectedRange === '1W'">1W</button>
          <button (click)="onRangeChange('ALL')" [class.active]="selectedRange === 'ALL'">ALL</button>
        </div>
      </div>
      <div class="canvas-wrapper">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 4px 20px -10px rgba(0, 0, 0, 0.1);
      border: 1px solid #F3F4F6;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .chart-title {
      font-weight: 600;
      color: #1F2937;
    }
    .view-selector {
      display: flex;
      gap: 0.5rem;
      background: #F3F4F6;
      padding: 0.25rem;
      border-radius: 8px;
    }
    .view-selector button {
      border: none;
      background: transparent;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      color: #6B7280;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .view-selector button.active {
      background: white;
      color: #111827;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .range-selector {
      display: flex;
      gap: 0.5rem;
      background: #F3F4F6;
      padding: 0.25rem;
      border-radius: 8px;
    }
    .range-selector button {
      border: none;
      background: transparent;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      color: #6B7280;
      transition: all 0.2s;
    }
    .range-selector button.active {
      background: white;
      color: #11D48A;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .canvas-wrapper {
      flex: 1;
      position: relative;
      width: 100%;
    }
  `]
})
export class ProbabilityChartComponent implements AfterViewInit, OnChanges {
  @Input() history: MarketHistoryPoint[] = [];
  @Input() selectedRange: string = '1D';
  @Output() rangeChange = new EventEmitter<string>();
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private platformId = inject(PLATFORM_ID);
  view = signal<'pools' | 'probability'>('probability');
  private pointRadii: number[] = [];

  private parseNumeric(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
      const cleaned = value.trim().replace(/[^\d.,-]/g, '').replace(',', '.');
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private computeYesProbabilityPct(point: MarketHistoryPoint): number {
    const yesPool = this.parseNumeric((point as any)?.yes_pool) ?? 0;
    const noPool = this.parseNumeric((point as any)?.no_pool) ?? 0;
    const total = yesPool + noPool;
    if (Number.isFinite(total) && total > 0) return (yesPool / total) * 100;

    const rawProb = this.parseNumeric((point as any)?.yes_probability);
    if (rawProb === null) return 50;
    if (rawProb >= 0 && rawProb <= 1) return rawProb * 100;
    if (rawProb >= 0 && rawProb <= 100) return rawProb;
    return 50;
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['history'] || changes['selectedRange']) && this.chart) {
      this.updateChart();
    }
  }

  onRangeChange(range: string) {
    this.rangeChange.emit(range);
  }

  setView(view: 'pools' | 'probability') {
    this.view.set(view);
    if (this.chart) this.updateChart();
  }

  private createChart() {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const isPools = this.view() === 'pools';
    this.pointRadii = this.computePointRadii(this.history);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.history.map((p) => this.formatLabel(p.timestamp)),
        datasets: [
          {
            label: 'YES pool (XLM)',
            data: this.history.map((p) => Number(p.yes_pool ?? 0)),
            borderColor: '#11D48A',
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.35,
            pointRadius: this.pointRadii as any,
            pointHoverRadius: 6,
            borderWidth: 2,
            yAxisID: 'y',
            clip: false,
          },
          {
            label: 'NO pool (XLM)',
            data: this.history.map((p) => Number(p.no_pool ?? 0)),
            borderColor: '#CC5A37',
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.35,
            pointRadius: this.pointRadii as any,
            pointHoverRadius: 6,
            borderWidth: 2,
            yAxisID: 'y',
            clip: false,
          },
          {
            label: 'YES probability (%)',
            data: this.history.map((p) => this.computeYesProbabilityPct(p)),
            borderColor: '#111827',
            segment: {
              borderColor: (ctx: any) => (ctx?.p1?.parsed?.y >= 50 ? '#11D48A' : '#CC5A37'),
            } as any,
            pointBorderColor: (ctx: any) => (ctx?.parsed?.y >= 50 ? '#11D48A' : '#CC5A37'),
            pointBackgroundColor: (ctx: any) => (ctx?.parsed?.y >= 50 ? '#11D48A' : '#CC5A37'),
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.35,
            pointRadius: this.pointRadii as any,
            pointHoverRadius: 6,
            borderWidth: 2,
            yAxisID: 'yPct',
            clip: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 30,
            right: 10,
            left: 10,
            bottom: 5
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label ?? '';
                const val = context.parsed.y;
                if (val === null || val === undefined) return '';
                if (label.includes('probability')) return `YES probability: ${val.toFixed(1)}%`;
                return `${label}: ${val.toFixed(2)}`;
              },
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }
          },
          y: {
            display: true,
            beginAtZero: true,
            min: 0,
            grace: '10%',
            ticks: {
              callback: (value) => `${value} XLM`
            }
          },
          yPct: {
            display: true,
            position: 'right',
            min: 0,
            max: 110,
            grid: { drawOnChartArea: false },
            ticks: {
              stepSize: 20,
              callback: function(val) {
                const numericVal = Number(val);
                return numericVal <= 100 ? `${numericVal}%` : '';
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
    this.chart.setDatasetVisibility(0, isPools);
    this.chart.setDatasetVisibility(1, isPools);
    this.chart.setDatasetVisibility(2, !isPools);
    (this.chart.options.scales as any).y.display = isPools;
    (this.chart.options.scales as any).yPct.display = !isPools;
    this.chart.update();
  }

  private updateChart() {
    if (!this.chart) return;
    const isPools = this.view() === 'pools';
    this.pointRadii = this.computePointRadii(this.history);
    this.chart.data.labels = this.history.map((p) => this.formatLabel(p.timestamp));

    const yesPool = this.history.map((p) => this.parseNumeric((p as any)?.yes_pool) ?? 0);
    const noPool = this.history.map((p) => this.parseNumeric((p as any)?.no_pool) ?? 0);
    const yesPct = this.history.map((p) => this.computeYesProbabilityPct(p));

    const ds0 = (this.chart.data.datasets[0].data ?? []) as number[];
    ds0.length = 0;
    ds0.push(...yesPool);
    const ds1 = (this.chart.data.datasets[1].data ?? []) as number[];
    ds1.length = 0;
    ds1.push(...noPool);
    const ds2 = (this.chart.data.datasets[2].data ?? []) as number[];
    ds2.length = 0;
    ds2.push(...yesPct);

    (this.chart.data.datasets[0] as any).pointRadius = this.pointRadii;
    (this.chart.data.datasets[1] as any).pointRadius = this.pointRadii;
    (this.chart.data.datasets[2] as any).pointRadius = this.pointRadii;

    this.chart.setDatasetVisibility(0, isPools);
    this.chart.setDatasetVisibility(1, isPools);
    this.chart.setDatasetVisibility(2, !isPools);
    (this.chart.options.scales as any).y.display = isPools;
    (this.chart.options.scales as any).yPct.display = !isPools;
    (this.chart.options.scales as any).yPct.position = 'right';
    (this.chart.options.scales as any).yPct.max = 110;

    this.chart.update();
  }

  private formatLabel(ts: string) {
    const date = new Date(ts);
    const useTime = this.selectedRange === '1H' || this.selectedRange === '1D';
    return useTime
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  private computePointRadii(history: MarketHistoryPoint[]) {
    if (!history?.length) return [];
    const radii: number[] = [];
    let prevYes = this.parseNumeric((history[0] as any)?.yes_pool) ?? 0;
    let prevNo = this.parseNumeric((history[0] as any)?.no_pool) ?? 0;
    radii.push(0);

    for (let i = 1; i < history.length; i++) {
      const yes = this.parseNumeric((history[i] as any)?.yes_pool) ?? 0;
      const no = this.parseNumeric((history[i] as any)?.no_pool) ?? 0;
      const changed = yes !== prevYes || no !== prevNo;
      radii.push(changed ? 3 : 0);
      prevYes = yes;
      prevNo = no;
    }
    return radii;
  }
}
