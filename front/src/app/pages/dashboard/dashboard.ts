import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import {
  DashboardService,
  DashboardSummary,
  Movement,
  ChartPoint,
  DebtProgress,
} from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  showSessionExpired = false;
  private sessionSub?: Subscription;

  activeNav = 'Home';
  navItems = ['Home', 'Gastos', 'Ingresos', 'Deudas', 'Resumen'];

  summary: DashboardSummary = { saldoTotal: 0, ingreso: 0, gasto: 0, ahorroMensual: 0 };
  movements: Movement[] = [];
  chartData: ChartPoint[] = [];
  debtProgress: DebtProgress = { porcentaje: 0, pagado: 0, total: 0, restante: 0, pagoMensual: 0, deudas: [] };

  chartPath = '';
  chartArea = '';
  chartDots: { x: number; y: number }[] = [];
  chartLabels: string[] = [];
  chartMaxValue = 0;
  chartYLabels: string[] = [];
  currentMonth = '';

  debtOffset = 314.16;
  displayedPorcentaje = 0;
  displayedSummary: DashboardSummary = { saldoTotal: 0, ingreso: 0, gasto: 0, ahorroMensual: 0 };

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.sessionSub = this.authService.sessionExpired$.subscribe(() => {
      this.showSessionExpired = true;
      this.cdr.detectChanges();
    });

    this.loadData();
    this.animateCounters();
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
  }

  private animateCounters(): void {
    const duration = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      this.displayedSummary = {
        saldoTotal: this.summary.saldoTotal * eased,
        ingreso: this.summary.ingreso * eased,
        gasto: this.summary.gasto * eased,
        ahorroMensual: this.summary.ahorroMensual * eased,
      };
      this.cdr.detectChanges();
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private loadData(): void {
    const now = new Date();
    this.currentMonth = now.toLocaleDateString('es-GT', { month: 'short' });

    this.summary = this.dashboardService.getSummary();
    this.movements = this.dashboardService.getRecentMovements();
    this.chartData = this.dashboardService.getChartData();
    this.debtProgress = this.dashboardService.getDebtProgress();
    this.debtOffset = 314.16 - (314.16 * this.debtProgress.porcentaje) / 100;
    this.displayedPorcentaje = this.debtProgress.porcentaje;

    if (!this.chartData.length && this.summary.ingreso > 0) {
      this.chartData = [{ mes: this.currentMonth, valor: this.summary.ingreso }];
      this.cdr.detectChanges();
    }
    this.buildChart();
  }

  onNavClick(item: string): void {
    this.activeNav = item;
  }

  onLogout(): void {
    this.authService.logout();
  }

  onAcceptSessionExpired(): void {
    this.showSessionExpired = false;
    this.authService.logout();
  }

  formatCurrency(value: number): string {
    return 'Q' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatCurrencyShort(value: number): string {
    if (value >= 1000) {
      return 'Q' + (value / 1000).toFixed(1) + 'k';
    }
    return 'Q' + value.toFixed(0);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getMovementIcon(type: string): string {
    return type === 'ingreso' ? '+' : '-';
  }

  private buildChart(): void {
    const data = this.chartData;

    const width = 500;
    const height = 200;
    const padding = 10;

    const maxVal = 20000;

    this.chartMaxValue = maxVal;
    this.chartPath = '';
    this.chartArea = '';
    this.chartDots = [];
    this.chartLabels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    this.chartYLabels = [];
    for (let i = 5; i >= 0; i--) {
      const v = (maxVal / 5) * i;
      this.chartYLabels.push(v === 0 ? 'Q0' : 'Q' + v / 1000 + 'k');
    }

    if (!data.length) {
      return;
    }

    const bottom = height;
    const toY = (val: number) => height - (val / maxVal) * height;

    const n = data.length + 1;
    const stepX = (width - padding * 2) / n;

    const points: { x: number; y: number }[] = [];
    points.push({ x: padding, y: toY(0) });
    for (let i = 0; i < data.length; i++) {
      points.push({ x: padding + (i + 1) * stepX, y: toY(data[i].valor) });
    }

    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const cpOffset = stepX * 0.4;
      path += ` C${prev.x + cpOffset},${prev.y} ${cur.x - cpOffset},${cur.y} ${cur.x},${cur.y}`;
    }

    this.chartPath = path;
    this.chartArea = path + ` L${points[points.length - 1].x},${bottom} L${points[0].x},${bottom} Z`;
    this.chartDots = points.slice(1);
  }
}
