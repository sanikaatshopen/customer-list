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
import { environment } from '../../environments/environment';

// Contact entity interface for emails and phones
export interface ContactEntity {
  type: string;
  value: string;
}

// Customer interface — matches the backend model
export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  emails: ContactEntity[];
  phones: ContactEntity[];
  bdate?: string;
  isFavorite?: boolean;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private API_URL = `${environment.apiUrl}/customers`;

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
  addCustomer(data: { name: string; emails: ContactEntity[]; phones: ContactEntity[]; isFavorite?: boolean; bdate?: string; photoUrl?: string }): Observable<Customer> {
    return this.http.post<Customer>(this.API_URL, data, {
      headers: this.getHeaders(),
    });
  }

  // ── Update a customer ──────────────────
  updateCustomer(id: string, data: { name: string; emails: ContactEntity[]; phones: ContactEntity[]; isFavorite?: boolean; bdate?: string; photoUrl?: string }): Observable<Customer> {
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

  // ── Delete multiple customers ──────────
  deleteCustomers(ids: string[]): Observable<any> {
    return this.http.post(`${this.API_URL}/bulk-delete`, { ids }, {
      headers: this.getHeaders(),
    });
  }

  // ── Bulk import customers ──────────────
  importCustomers(customers: any[]): Observable<any> {
    return this.http.post(`${this.API_URL}/bulk`, { customers }, {
      headers: this.getHeaders(),
    });
  }
}
