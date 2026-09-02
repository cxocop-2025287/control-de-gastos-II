import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Income, IncomeCreate, IncomeSummary, INCOME_CATEGORIES } from '../models/income.model';

@Injectable({
  providedIn: 'root',
})
export class IncomeService {
  private readonly API_URL = '/api/incomes';

  constructor(private http: HttpClient) {}

  getAll(filters?: { fechaDesde?: string; fechaHasta?: string; categoria?: string }): Observable<Income[]> {
    let params = new HttpParams();
    if (filters?.fechaDesde) params = params.set('fechaDesde', filters.fechaDesde);
    if (filters?.fechaHasta) params = params.set('fechaHasta', filters.fechaHasta);
    if (filters?.categoria) params = params.set('categoria', filters.categoria);

    return this.http.get<Income[]>(this.API_URL, { params });
  }

  getSummary(fechaDesde: string, fechaHasta: string): Observable<IncomeSummary> {
    const params = new HttpParams()
      .set('fechaDesde', fechaDesde)
      .set('fechaHasta', fechaHasta);

    return this.http.get<IncomeSummary>(`${this.API_URL}/summary`, { params });
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/categories`);
  }

  create(data: IncomeCreate): Observable<Income> {
    return this.http.post<Income>(this.API_URL, data);
  }

  update(id: number, data: Partial<IncomeCreate>): Observable<Income> {
    return this.http.put<Income>(`${this.API_URL}/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`);
  }

  getCategoriesList(): string[] {
    return [...INCOME_CATEGORIES];
  }
}