import {
  AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild, effect
} from '@angular/core';
import {
  ArcElement, BarController, BarElement, CategoryScale, Chart, ChartConfiguration, ChartType,
  DoughnutController, Filler, Legend, LineController, LineElement, LinearScale, PointElement, Tooltip
} from 'chart.js';
import { ThemeService } from '../../core/services/theme.service';

Chart.register(
  ArcElement, BarController, BarElement, CategoryScale, DoughnutController, Filler, Legend,
  LineController, LineElement, LinearScale, PointElement, Tooltip
);

export const CHART_COLORS = ['#667eea', '#43a047', '#fb8c00', '#e53935', '#8e24aa', '#00acc1', '#fdd835', '#6d4c41'];

/** Small Chart.js wrapper that redraws on input changes and theme switches. */
@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<div class="chart-wrap" [style.height.px]="height"><canvas #canvas [attr.aria-label]="ariaLabel" role="img"></canvas></div>`,
  styles: [`.chart-wrap { position: relative; width: 100%; }`]
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) type!: ChartType;
  @Input({ required: true }) labels: string[] = [];
  @Input({ required: true }) datasets: ChartConfiguration['data']['datasets'] = [];
  @Input() height = 260;
  @Input() ariaLabel = 'Chart';
  @Input() showLegend = false;

  @ViewChild('canvas') private canvas?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  constructor(private theme: ThemeService) {
    effect(() => {
      this.theme.isDarkMode();
      this.render();
    });
  }

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(): void {
    this.render();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    if (!this.canvas) return;
    this.chart?.destroy();

    const dark = this.theme.isDarkMode();
    const text = dark ? '#d0d0d0' : '#555';
    const grid = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const isRadial = this.type === 'doughnut' || this.type === 'pie';

    this.chart = new Chart(this.canvas.nativeElement, {
      type: this.type,
      data: { labels: this.labels, datasets: this.datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: this.showLegend || isRadial, position: 'bottom', labels: { color: text } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: isRadial ? {} : {
          x: { ticks: { color: text }, grid: { color: grid } },
          y: { beginAtZero: true, ticks: { color: text, precision: 0 }, grid: { color: grid } }
        }
      }
    });
  }
}
