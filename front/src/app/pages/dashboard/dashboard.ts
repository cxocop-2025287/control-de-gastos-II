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
  chartIngresoPath = '';
  chartIngresoArea = '';
  chartGastoPath = '';
  chartGastoArea = '';
  chartDots: { x: number; y: number; color: string }[] = [];
  chartLabels: string[] = [];
  chartMaxValue = 0;
  chartYLabels: string[] = [];

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
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
  }

  private loadData(): void {
    this.summary = this.dashboardService.getSummary();
    this.movements = this.dashboardService.getRecentMovements();
    this.chartData = this.dashboardService.getChartData();
    this.debtProgress = this.dashboardService.getDebtProgress();
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
    if (!data.length) return;

    const width = 500;
    const height = 200;
    const padding = 10;

    let maxVal = 0;
    for (const d of data) {
      if (d.ingresos > maxVal) maxVal = d.ingresos;
      if (d.gastos > maxVal) maxVal = d.gastos;
    }
    maxVal = Math.ceil(maxVal / 1000) * 1000;
    this.chartMaxValue = maxVal;
    this.chartYLabels = [];
    for (let i = 4; i >= 0; i--) {
      this.chartYLabels.push(this.formatCurrencyShort((maxVal / 4) * i));
    }

    const stepX = (width - padding * 2) / (data.length - 1);

    const toY = (val: number) => height - padding - (val / maxVal) * (height - padding * 2);

    let ingresoPath = '';
    let gastoPath = '';
    const dots: { x: number; y: number; color: string }[] = [];
    this.chartLabels = [];

    for (let i = 0; i < data.length; i++) {
      const x = padding + i * stepX;
      const yI = toY(data[i].ingresos);
      const yG = toY(data[i].gastos);

      if (i === 0) {
        ingresoPath += `M${x},${yI}`;
        gastoPath += `M${x},${yG}`;
      } else {
        const prevX = padding + (i - 1) * stepX;
        const cpOffset = stepX * 0.4;
        ingresoPath += ` C${prevX + cpOffset},${toY(data[i - 1].ingresos)} ${x - cpOffset},${yI} ${x},${yI}`;
        gastoPath += ` C${prevX + cpOffset},${toY(data[i - 1].gastos)} ${x - cpOffset},${yG} ${x},${yG}`;
      }

      dots.push({ x, y: yI, color: '#91BF06' });
      dots.push({ x, y: yG, color: '#e8a090' });
      this.chartLabels.push(data[i].mes);
    }

    this.chartIngresoPath = ingresoPath;
    this.chartGastoPath = gastoPath;

    const bottom = height - padding;
    this.chartIngresoArea = ingresoPath + ` L${padding + (data.length - 1) * stepX},${bottom} L${padding},${bottom} Z`;
    this.chartGastoArea = gastoPath + ` L${padding + (data.length - 1) * stepX},${bottom} L${padding},${bottom} Z`;

    this.chartDots = dots;
  }
}
