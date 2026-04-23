import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges, inject, PLATFORM_ID } from '@angular/core';
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
        <div class="range-selector">
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

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['history'] && this.chart) {
      this.updateChart();
    }
  }

  onRangeChange(range: string) {
    this.rangeChange.emit(range);
  }

  private createChart() {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.history.map(p => new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
        datasets: [
          {
            label: 'Yes %',
            data: this.history.map(p => p.yes_probability * 100),
            borderColor: '#11D48A',
            backgroundColor: 'rgba(17, 212, 138, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const val = context.parsed.y;
                return val !== null ? `Yes: ${val.toFixed(1)}%` : '';
              }
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
            min: 0,
            max: 100,
            ticks: {
              callback: (value) => `${value}%`
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart() {
    if (!this.chart) return;
    this.chart.data.labels = this.history.map(p => {
      const date = new Date(p.timestamp);
      return this.selectedRange === '1D' 
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    });
    this.chart.data.datasets[0].data = this.history.map(p => p.yes_probability * 100);
    this.chart.update();
  }
}
