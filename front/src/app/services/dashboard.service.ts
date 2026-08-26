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
  ingresos: number;
  gastos: number;
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
      saldoTotal: 12450.00,
      ingreso: 8500.00,
      gasto: 4200.00,
      ahorroMensual: 4300.00,
    };
  }

  getRecentMovements(): Movement[] {
    return [
      { id: 1, fecha: '2026-08-24', descripcion: 'Salario mensual', categoria: 'Salario', tipo: 'ingreso', monto: 3500.00 },
      { id: 2, fecha: '2026-08-23', descripcion: 'Supermercado', categoria: 'Alimentacion', tipo: 'gasto', monto: 185.50 },
      { id: 3, fecha: '2026-08-22', descripcion: 'Freelance proyecto web', categoria: 'Trabajo extra', tipo: 'ingreso', monto: 800.00 },
      { id: 4, fecha: '2026-08-21', descripcion: 'Pago de luz', categoria: 'Servicios', tipo: 'gasto', monto: 75.30 },
      { id: 5, fecha: '2026-08-20', descripcion: 'Restaurante', categoria: 'Alimentacion', tipo: 'gasto', monto: 42.00 },
      { id: 6, fecha: '2026-08-19', descripcion: 'Venta de articulo', categoria: 'Venta', tipo: 'ingreso', monto: 150.00 },
      { id: 7, fecha: '2026-08-18', descripcion: 'Gasolina', categoria: 'Transporte', tipo: 'gasto', monto: 60.00 },
      { id: 8, fecha: '2026-08-17', descripcion: 'Suscripcion streaming', categoria: 'Entretenimiento', tipo: 'gasto', monto: 15.99 },
      { id: 9, fecha: '2026-08-16', descripcion: 'Transferencia recibida', categoria: 'Transferencia', tipo: 'ingreso', monto: 250.00 },
      { id: 10, fecha: '2026-08-15', descripcion: 'Farmacia', categoria: 'Salud', tipo: 'gasto', monto: 38.75 },
      { id: 11, fecha: '2026-08-14', descripcion: 'Cafe y pasteleria', categoria: 'Alimentacion', tipo: 'gasto', monto: 28.50 },
    ];
  }

  getChartData(): ChartPoint[] {
    return [
      { mes: 'Mar', ingresos: 6200, gastos: 4100 },
      { mes: 'Abr', ingresos: 7100, gastos: 3800 },
      { mes: 'May', ingresos: 6800, gastos: 4500 },
      { mes: 'Jun', ingresos: 7500, gastos: 3900 },
      { mes: 'Jul', ingresos: 8000, gastos: 4300 },
      { mes: 'Ago', ingresos: 8500, gastos: 4200 },
    ];
  }

  getDebtProgress(): DebtProgress {
    return {
      porcentaje: 67,
      pagado: 2010,
      total: 3000,
      restante: 990,
      pagoMensual: 300,
      deudas: [
        { nombre: 'Prestamo personal', total: 1500, pagado: 1200 },
        { nombre: 'Tarjeta de credito', total: 1000, pagado: 560 },
        { nombre: 'Prestamo familiar', total: 500, pagado: 250 },
      ],
    };
  }
}
