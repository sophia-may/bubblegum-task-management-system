import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://bubblegum-task-management-system.onrender.com/auth';

  constructor(private http: HttpClient) {}

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        // Lưu token vào LocalStorage của trình duyệt
        if (typeof window !== 'undefined' && localStorage) {
          localStorage.setItem('token', response.token);
        }
      })
    );
  }

  register(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/register`, credentials).pipe(
      tap(response => {
        if (typeof window !== 'undefined' && localStorage) {
          localStorage.setItem('token', response.token);
        }
      })
    );
  }

  logout() {
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.removeItem('token');
    }
  }

  isLoggedIn(): boolean {
    if (typeof window !== 'undefined' && localStorage) {
      return !!localStorage.getItem('token');
    }
    return false;
  }
}