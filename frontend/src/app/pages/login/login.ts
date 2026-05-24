// ============================================
//  Login Page Component
// ============================================
//  Handles both Login and Signup with a toggle.
// ============================================

import { Component } from '@angular/core';
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
  // Toggle between login and signup
  isSignup = false;

  // Form fields
  username = '';
  password = '';

  // UI state
  errorMessage = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {
    // If already logged in, go to customers page
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/customers']);
    }
  }

  // ── Toggle Mode ────────────────────────
  toggleMode(): void {
    this.isSignup = !this.isSignup;
    this.errorMessage = '';
  }

  // ── Submit Form ────────────────────────
  onSubmit(): void {
    this.errorMessage = '';

    const cleanUsername = this.username.trim().toLowerCase();

    // Enforce 8-character limit on signup
    if (this.isSignup && this.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }

    this.loading = true;

    const action = this.isSignup
      ? this.auth.signup(cleanUsername, this.password)
      : this.auth.login(cleanUsername, this.password);

    action.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/customers']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.message || 'Something went wrong. Please try again.';
      },
    });
  }
}
