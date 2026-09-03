import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AppConfig {
  jwtExpiresIn: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config: AppConfig | null = null;

  constructor(private http: HttpClient) {}

  loadConfig(): Observable<AppConfig> {
    return this.http.get<AppConfig>('/api/config');
  }

  setConfig(config: AppConfig): void {
    this.config = config;
  }

  getConfig(): AppConfig | null {
    return this.config;
  }

  getJwtExpiresIn(): string {
    return this.config?.jwtExpiresIn || '4h';
  }

  // Convertir string como "1m", "2h", "1d" a milisegundos
  parseExpiresToMs(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 3600000; // 1 hora por defecto

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 3600000;
    }
  }
}