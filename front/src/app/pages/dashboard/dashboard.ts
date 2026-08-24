import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';

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

  tableRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  tableCols = [1, 2, 3, 4, 5, 6];

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();

    this.sessionSub = this.authService.sessionExpired$.subscribe(() => {
      this.showSessionExpired = true;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
  }

  onLogout(): void {
    this.authService.logout();
  }

  onAcceptSessionExpired(): void {
    this.showSessionExpired = false;
    this.authService.logout();
  }
}
