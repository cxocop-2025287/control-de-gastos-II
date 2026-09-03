import { Injectable } from '@angular/core';
import { IncomeService } from './income.service';
import { Observable, map, forkJoin, catchError, of } from 'rxjs';
import { Income } from '../models/income.model';

export interface DashboardSummary {
  saldoTotal: number;
  ingreso: number;
  gasto: number;
  ahorroMensual: number;
}

export interface Movement {
  id: number;
  fecha: string;
  descripcion: string;
  categoria: string;
  tipo: 'ingreso' | 'gasto';
  monto: number;
}

export interface ChartPoint {
  mes: string;
  valor: number;
}

export interface DebtProgress {
  porcentaje: number;
  pagado: number;
  total: number;
  restante: number;
  pagoMensual: number;
  deudas: { nombre: string; total: number; pagado: number }[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private incomeService: IncomeService) {}

  loadDashboardData(): Observable<{
    summary: DashboardSummary;
    movements: Movement[];
    chartData: ChartPoint[];
  }> {
    const hoy = new Date();
    // Mes actual
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    // Mes anterior (para calcular el ahorro acumulado del mes anterior)
    const primerDiaMesAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const ultimoDiaMesAnt = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    const fechaDesde = this.formatDateForBackend(primerDiaMes);
    const fechaHasta = this.formatDateForBackend(ultimoDiaMes);

    const fechaDesdeAnt = this.formatDateForBackend(primerDiaMesAnt);
    const fechaHastaAnt = this.formatDateForBackend(ultimoDiaMesAnt);

    console.log(`📅 Dashboard - Consultando mes actual (${fechaDesde} a ${fechaHasta}) y mes anterior (${fechaDesdeAnt} a ${fechaHastaAnt})`);

    return forkJoin({
      currentIncomes: this.incomeService.getAll({ fechaDesde, fechaHasta }),
      lastMonthSummary: this.incomeService.getSummary(fechaDesdeAnt, fechaHastaAnt).pipe(
        catchError(() => of({ total: 0, count: 0, average: 0 }))
      ),
    }).pipe(
      map(({ currentIncomes, lastMonthSummary }) => {
        const validIncomes = currentIncomes.map(inc => ({
          ...inc,
          monto: typeof inc.monto === 'number' ? inc.monto : parseFloat(String(inc.monto)) || 0
        }));

        const totalIngresos = validIncomes.reduce((sum, inc) => {
          const monto = typeof inc.monto === 'number' ? inc.monto : parseFloat(String(inc.monto)) || 0;
          return sum + monto;
        }, 0);

        // Ahorro del mes pasado (ingresos del mes pasado menos pérdidas/gastos)
        const ahorroMesAnterior = lastMonthSummary ? Number(lastMonthSummary.total) || 0 : 0;

        const movements: Movement[] = validIncomes.map(inc => ({
          id: inc.id,
          fecha: inc.fecha,
          descripcion: inc.descripcion || 'Sin descripción',
          categoria: inc.categoria || 'Otro',
          tipo: 'ingreso' as const,
          monto: typeof inc.monto === 'number' ? inc.monto : parseFloat(String(inc.monto)) || 0,
        }));

        const weeks = this.groupIncomesByWeek(validIncomes, hoy);

        const summary: DashboardSummary = {
          saldoTotal: totalIngresos,
          ingreso: totalIngresos,
          gasto: 0,
          ahorroMensual: ahorroMesAnterior,
        };

        return { summary, movements, chartData: weeks };
      })
    );
  }

  private formatDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parsea una fecha "YYYY-MM-DD" como fecha LOCAL (no UTC).
   * new Date("2026-09-01") se interpreta como UTC midnight, lo cual en zonas
   * horarias negativas (ej: Guatemala UTC-6) se convierte al día anterior.
   */
  private parseDateLocal(dateStr: string): Date {
    if (!dateStr) return new Date(NaN);
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length < 3) return new Date(dateStr);
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }

  private groupIncomesByWeek(incomes: Income[], today: Date): ChartPoint[] {
    if (!incomes || incomes.length === 0) {
      return [
        { mes: 'Semana 1', valor: 0 },
        { mes: 'Semana 2', valor: 0 },
        { mes: 'Semana 3', valor: 0 },
        { mes: 'Semana 4', valor: 0 },
      ];
    }

    const weekMap = new Map<number, number>();
    const month = today.getMonth();
    const year = today.getFullYear();

    incomes.forEach(inc => {
      try {
        const fecha = this.parseDateLocal(inc.fecha);
        if (isNaN(fecha.getTime())) return;
        
        if (fecha.getMonth() !== month || fecha.getFullYear() !== year) return;
        
        const dia = fecha.getDate();
        const semana = Math.min(Math.ceil(dia / 7), 4);
        const monto = typeof inc.monto === 'number' ? inc.monto : parseFloat(String(inc.monto)) || 0;
        
        weekMap.set(semana, (weekMap.get(semana) || 0) + monto);
      } catch {
        // Ignorar fechas inválidas
      }
    });

    const weekLabels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    return weekLabels.map((label, index) => ({
      mes: label,
      valor: weekMap.get(index + 1) || 0,
    }));
  }

  getSummary(): DashboardSummary {
    return { saldoTotal: 0, ingreso: 0, gasto: 0, ahorroMensual: 0 };
  }

  getRecentMovements(): Movement[] {
    return [];
  }

  getChartData(): ChartPoint[] {
    return [];
  }

  getDebtProgress(): DebtProgress {
    return { 
      porcentaje: 0, 
      pagado: 0, 
      total: 0, 
      restante: 0, 
      pagoMensual: 0, 
      deudas: [] 
    };
  }
}