import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  credentials = { username: '', password: '', confirmPassword: '' };
  errorMessage = '';
  isRegisterMode = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = '';
    this.credentials = { username: '', password: '', confirmPassword: '' };
    this.showPassword = false;
    this.showConfirmPassword = false;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    if (this.isRegisterMode) {
      if (this.credentials.password !== this.credentials.confirmPassword) {
        this.errorMessage = 'Password confirmation does not match.';
        return;
      }
      if (!this.credentials.username || !this.credentials.password) {
         this.errorMessage = 'Please fill in all required fields.';
         return;
      }

      this.authService.register({ username: this.credentials.username, password: this.credentials.password }).subscribe({
        next: () => {
          localStorage.setItem('username', this.credentials.username);
          this.router.navigate(['/tasks']); 
        },
        error: (err) => {
          if (err.status === 409) {
            this.errorMessage = 'Username already exists.';
          } else {
            this.errorMessage = 'Something went wrong. Please try again later.';
          }
        }
      });
    } else {
      this.authService.login({ username: this.credentials.username, password: this.credentials.password }).subscribe({
        next: () => {
          localStorage.setItem('username', this.credentials.username);
          this.router.navigate(['/tasks']); 
        },
        error: (err) => {
          this.errorMessage = 'Invalid username or password.';
        }
      });
    }
  }
}