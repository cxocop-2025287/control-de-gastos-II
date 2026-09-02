import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
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
  loading = true;
  private sessionSub?: Subscription;

  activeNav = 'Home';
  navItems = ['Home', 'Gastos', 'Ingresos', 'Deudas', 'Resumen'];

  summary: DashboardSummary = { saldoTotal: 0, ingreso: 0, gasto: 0, ahorroMensual: 0 };
  movements: Movement[] = [];
  chartData: ChartPoint[] = [];
  debtProgress: DebtProgress = {
    porcentaje: 0,
    pagado: 0,
    total: 0,
    restante: 0,
    pagoMensual: 0,
    deudas: [],
  };

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

  async ngOnInit(): Promise<void> {
    this.user = this.authService.getUser();
    
    await this.authService.reloadConfig();
    
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
    this.loading = true;
    const now = new Date();
    this.currentMonth = now.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' });

    console.log(`📅 Dashboard - Mes actual: ${this.currentMonth}`);

    this.dashboardService.loadDashboardData()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.summary = data.summary;
          this.movements = data.movements.slice(0, 10);
          this.chartData = data.chartData;
          this.debtProgress = this.dashboardService.getDebtProgress();

          this.debtOffset = 314.16 - (314.16 * this.debtProgress.porcentaje) / 100;
          this.displayedPorcentaje = this.debtProgress.porcentaje;

          this.buildChart();
          this.animateCounters();
        },
        error: (err) => {
          console.error('Error cargando dashboard:', err);
          this.summary = { saldoTotal: 0, ingreso: 0, gasto: 0, ahorroMensual: 0 };
          this.chartData = [];
          this.buildChart();
          this.animateCounters();
        }
      });
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

  onNavClick(item: string): void {
    if (item === 'Ingresos') {
      this.router.navigate(['/ingresos']);
      return;
    }
    this.activeNav = item;
  }

  onLogout(): void {
    this.authService.logout();
  }

  onAcceptSessionExpired(): void {
    this.showSessionExpired = false;
    this.authService.confirmSessionExpired();
  }

  formatCurrency(value: number): string {
    const num = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
    return 'Q' + num.toFixed(2);
  }

  formatCurrencyShort(value: number): string {
    const num = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
    if (num >= 1000) {
      return 'Q' + (num / 1000).toFixed(1) + 'k';
    }
    return 'Q' + num.toFixed(0);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Fecha no disponible';
    try {
      // Parsear como fecha local para evitar desfase UTC
      const parts = String(dateStr).split('T')[0].split('-');
      let d: Date;
      if (parts.length >= 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        d = new Date(dateStr);
      }
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('es-GT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  getMovementIcon(type: string): string {
    return type === 'ingreso' ? '+' : '-';
  }

  private buildChart(): void {
    const data = this.chartData || [];

    const width = 500;
    const height = 200;
    const paddingY = 16;

    let maxVal = 0;
    if (data.length > 0) {
      maxVal = Math.max(...data.map(d => d.valor || 0));
    }
    if (maxVal === 0) {
      maxVal = 10000;
    }
    maxVal = Math.ceil(maxVal / 5000) * 5000;

    this.chartMaxValue = maxVal;
    this.chartPath = '';
    this.chartArea = '';
    this.chartDots = [];
    this.chartLabels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    this.chartYLabels = [];

    for (let i = 5; i >= 0; i--) {
      const v = (maxVal / 5) * i;
      this.chartYLabels.push(v === 0 ? 'Q0' : 'Q' + (v / 1000).toFixed(1) + 'k');
    }

    const bottom = height;
    const toY = (val: number) => {
      const usableHeight = height - paddingY * 2;
      return height - paddingY - (val / maxVal) * usableHeight;
    };

    // 4 columnas uniformes de ancho width/4 = 125px
    // Centros en 62.5, 187.5, 312.5, 437.5
    const colWidth = width / 4;
    const dotPoints: { x: number; y: number }[] = [];

    for (let i = 0; i < 4; i++) {
      const val = data[i]?.valor || 0;
      dotPoints.push({
        x: colWidth * i + colWidth / 2,
        y: toY(val),
      });
    }

    // Puntos para trazar la curva suave cubriendo todo el ancho de 0 a width (500)
    const curvePoints: { x: number; y: number }[] = [
      { x: 0, y: dotPoints[0].y },
      ...dotPoints,
      { x: width, y: dotPoints[3].y },
    ];

    let path = `M${curvePoints[0].x},${curvePoints[0].y}`;
    for (let i = 1; i < curvePoints.length; i++) {
      const prev = curvePoints[i - 1];
      const cur = curvePoints[i];
      const cpX = (prev.x + cur.x) / 2;
      path += ` C${cpX},${prev.y} ${cpX},${cur.y} ${cur.x},${cur.y}`;
    }

    this.chartPath = path;
    this.chartArea = `${path} L${width},${bottom} L0,${bottom} Z`;
    this.chartDots = dotPoints;
  }
}