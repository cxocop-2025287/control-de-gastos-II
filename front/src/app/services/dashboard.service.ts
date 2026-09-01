import { Injectable } from '@angular/core';

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

  getSummary(): DashboardSummary {
    return {
      saldoTotal: 0,
      ingreso: 0,
      gasto: 0,
      ahorroMensual: 0,
    };
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
      deudas: [],
    };
  }
}
