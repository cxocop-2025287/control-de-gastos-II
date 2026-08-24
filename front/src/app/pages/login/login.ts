import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  name = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.name.trim() || !this.password.trim()) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.login(this.name.trim(), this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/app']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;

        if (error.error?.errorCode === 'INVALID_CREDENTIALS') {
          this.errorMessage = 'El usuario o la contraseña son incorrectos.';
        } else if (error.error?.errorCode === 'ACCOUNT_DISABLED') {
          this.errorMessage = 'Esta cuenta no está habilitada para iniciar sesión.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
        } else {
          this.errorMessage = 'Ocurrió un error inesperado. Intenta nuevamente.';
        }

        this.cdr.detectChanges();
      },
    });
  }
}
