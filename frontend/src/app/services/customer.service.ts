// ============================================
//  Customer Service
// ============================================
//  Handles all API calls for customers.
//  Attaches the JWT token in the Authorization header.
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

// Customer interface — matches the backend model
export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private API_URL = 'http://localhost:3000/customers';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Build headers with JWT token
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`,
    });
  }

  // ── Get all customers ──────────────────
  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.API_URL, {
      headers: this.getHeaders(),
    });
  }

  // ── Add a new customer ─────────────────
  addCustomer(data: { name: string; email: string; phone: string }): Observable<Customer> {
    return this.http.post<Customer>(this.API_URL, data, {
      headers: this.getHeaders(),
    });
  }

  // ── Update a customer ──────────────────
  updateCustomer(id: string, data: { name: string; email: string; phone: string }): Observable<Customer> {
    return this.http.put<Customer>(`${this.API_URL}/${id}`, data, {
      headers: this.getHeaders(),
    });
  }

  // ── Delete a customer ──────────────────
  deleteCustomer(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}
