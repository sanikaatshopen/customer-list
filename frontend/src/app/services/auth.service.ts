// ============================================
//  Auth Service
// ============================================
//  Handles login, signup, and token management.
//  Stores the JWT token in localStorage.
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API_URL = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  // ── Signup ─────────────────────────────
  signup(fullname: string, username: string, dob: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/signup`, { fullname, username, dob, password }).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('username', res.username);
        localStorage.setItem('fullname', res.fullname);
      })
    );
  }

  // ── Login ──────────────────────────────
  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, { username, password }).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('username', res.username);
        localStorage.setItem('fullname', res.fullname);
      })
    );
  }

  // ── Logout ─────────────────────────────
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('fullname');
    this.router.navigate(['/login']);
  }

  // ── Helpers ────────────────────────────
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  getFullname(): string | null {
    return localStorage.getItem('fullname');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
