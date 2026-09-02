export interface Income {
  id: number;
  user_id: number;
  fecha: string;
  descripcion: string;
  categoria: 'Salario' | 'Trabajo extra' | 'Bono' | 'Venta' | 'Otro';
  monto: number;
  created_at: string;
  updated_at: string;
}

export interface IncomeCreate {
  fecha: string;
  descripcion: string;
  categoria: string;
  monto: number;
}

export interface IncomeSummary {
  total: number;
  count: number;
  average: number;
}

export const INCOME_CATEGORIES = ['Salario', 'Trabajo extra', 'Bono', 'Venta', 'Otro'] as const;
export type IncomeCategory = typeof INCOME_CATEGORIES[number];