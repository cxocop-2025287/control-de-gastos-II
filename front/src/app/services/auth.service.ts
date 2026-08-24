import { Injectable, signal, computed, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, Subject } from 'rxjs';

export interface LoginResponse {
  message: string;
  token: string;
  expiresIn: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export interface User {
  id: string;
  name: string;
  role: string;
}

const ACTIVITY_EVENTS = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly EXPIRES_KEY = 'auth_expires_in';

  private currentUser = signal<User | null>(this.loadUser());
  readonly user = computed(() => this.currentUser());
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userRole = computed(() => this.currentUser()?.role || null);

  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private boundActivityHandler = this.resetIdleTimer.bind(this);
  private _sessionExpired = new Subject<void>();
  readonly sessionExpired$ = this._sessionExpired.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private ngZone: NgZone
  ) {
    const token = this.getToken();
    if (token && this.isLoggedIn()) {
      this.startIdleTimer();
    }
  }

  login(name: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/auth/login', { name, password })
      .pipe(
        tap((response) => {
          this.setSession(response.token, response.user, response.expiresIn);
        })
      );
  }

  logout(): void {
    this.stopIdleTimer();
    this.removeActivityListeners();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRES_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() < expiry;
    } catch {
      return false;
    }
  }

  getUser(): User | null {
    return this.currentUser();
  }

  getRole(): string | null {
    return this.currentUser()?.role || null;
  }

  private parseExpiresToMs(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 3600000;

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

  private setSession(token: string, user: User, expiresIn: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.EXPIRES_KEY, expiresIn);
    this.currentUser.set(user);
    this.startIdleTimer();
  }

  private getIdleTimeoutMs(): number {
    const expiresIn = localStorage.getItem(this.EXPIRES_KEY);
    return this.parseExpiresToMs(expiresIn || '4h');
  }

  private startIdleTimer(): void {
    this.stopIdleTimer();
    this.removeActivityListeners();
    this.addActivityListeners();
    this.resetIdleTimer();
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      this.handleSessionExpired();
    }, this.getIdleTimeoutMs());
  }

  private stopIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private addActivityListeners(): void {
    this.ngZone.runOutsideAngular(() => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.addEventListener(event, this.boundActivityHandler, { passive: true });
      });
    });
  }

  private removeActivityListeners(): void {
    ACTIVITY_EVENTS.forEach((event) => {
      window.removeEventListener(event, this.boundActivityHandler);
    });
  }

  private handleSessionExpired(): void {
    this.stopIdleTimer();
    this.removeActivityListeners();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRES_KEY);
    this.currentUser.set(null);
    this._sessionExpired.next();
  }

  clearSession(): void {
    this.stopIdleTimer();
    this.removeActivityListeners();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRES_KEY);
    this.currentUser.set(null);
  }

  private loadUser(): User | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userJson = localStorage.getItem(this.USER_KEY);

    if (!token || !userJson) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;

      if (Date.now() >= expiry) {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.EXPIRES_KEY);
        return null;
      }

      return JSON.parse(userJson);
    } catch {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.EXPIRES_KEY);
      return null;
    }
  }
}
