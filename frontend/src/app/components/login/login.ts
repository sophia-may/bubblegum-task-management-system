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

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = '';
    this.credentials = { username: '', password: '', confirmPassword: '' };
  }

  onSubmit() {
    if (this.isRegisterMode) {
      if (this.credentials.password !== this.credentials.confirmPassword) {
        this.errorMessage = 'Mật khẩu xác nhận không khớp!';
        return;
      }
      if (!this.credentials.username || !this.credentials.password) {
         this.errorMessage = 'Vui lòng nhập đầy đủ thông tin!';
         return;
      }

      this.authService.register({ username: this.credentials.username, password: this.credentials.password }).subscribe({
        next: () => {
          localStorage.setItem('username', this.credentials.username);
          this.router.navigate(['/tasks']); 
        },
        error: (err) => {
          if (err.status === 409) {
            this.errorMessage = 'Tên đăng nhập đã tồn tại!';
          } else {
            this.errorMessage = 'Có lỗi xảy ra, vui lòng thử lại sau.';
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
          this.errorMessage = 'Sai tài khoản hoặc mật khẩu!';
        }
      });
    }
  }
}