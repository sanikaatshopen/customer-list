import { Component, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit {
  // Toggle between login and signup
  isSignup = false;

  // Form fields
  fullname = '';
  username = '';
  dobYear = '';
  dobMonth = '';
  dobDay = '';
  password = '';
  confirmPassword = '';

  // Password visibility
  showPassword = false;
  showConfirmPassword = false;

  // DOB dropdown arrays
  years: number[] = [];
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  days: number[] = [];

  // Field validation errors
  fullnameError = '';
  usernameError = '';
  passwordError = '';
  confirmPasswordError = '';

  // UI state
  errorMessage = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {
    // If already logged in, go to customers page
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/customers']);
    }
  }

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1990; y--) {
      this.years.push(y);
    }
    this.updateDays();
  }

  // ── Dynamic DOB Day Options Builder ────
  updateDays(): void {
    if (!this.dobMonth || !this.dobYear) {
      // Default to 31 days if year or month is not yet chosen
      this.days = Array.from({ length: 31 }, (_, i) => i + 1);
      return;
    }

    const year = parseInt(this.dobYear, 10);
    const monthIndex = this.months.indexOf(this.dobMonth);
    // Number of days in the month/year combination
    const numDays = new Date(year, monthIndex + 1, 0).getDate();
    this.days = Array.from({ length: numDays }, (_, i) => i + 1);

    // Reset selected day if it exceeds the new maximum day count
    if (this.dobDay && parseInt(this.dobDay, 10) > numDays) {
      this.dobDay = '';
    }
  }

  // ── Toggle Mode ────────────────────────
  toggleMode(): void {
    this.isSignup = !this.isSignup;
    this.errorMessage = '';
    // Reset fields and errors
    this.fullname = '';
    this.username = '';
    this.dobYear = '';
    this.dobMonth = '';
    this.dobDay = '';
    this.password = '';
    this.confirmPassword = '';
    this.fullnameError = '';
    this.usernameError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
  }

  // ── Username Input Handler ─────────────
  onUsernameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Allow only lowercase letters and numbers
    this.username = input.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (this.usernameError) {
      this.validateUsername();
    }
  }

  // ── Field Validators ───────────────────
  validateFullname(): void {
    if (!this.fullname.trim()) {
      this.fullnameError = 'Fullname is required.';
    } else if (this.fullname.trim().length < 3) {
      this.fullnameError = 'Fullname must be at least 3 characters.';
    } else {
      this.fullnameError = '';
    }
  }

  validateUsername(): void {
    if (!this.username) {
      this.usernameError = 'Username is required.';
    } else if (this.username.length < 3) {
      this.usernameError = 'Username must be at least 3 characters.';
    } else {
      this.usernameError = '';
    }
  }

  validatePassword(): void {
    if (!this.password) {
      this.passwordError = 'Password is required.';
    } else if (this.password.length < 8) {
      this.passwordError = 'Password must be at least 8 characters.';
    } else if (!/[a-zA-Z]/.test(this.password) || !/[0-9]/.test(this.password)) {
      this.passwordError = 'Password must contain at least 1 letter and 1 number.';
    } else {
      this.passwordError = '';
    }

    if (this.confirmPassword) {
      this.validateConfirmPassword();
    }
  }

  validateConfirmPassword(): void {
    if (!this.confirmPassword) {
      this.confirmPasswordError = 'Confirm password is required.';
    } else if (this.confirmPassword !== this.password) {
      this.confirmPasswordError = 'Passwords do not match.';
    } else {
      this.confirmPasswordError = '';
    }
  }

  // ── Submit Button Enabled Check ────────
  isFormValid(): boolean {
    if (!this.isSignup) {
      return !!this.username && !!this.password;
    }
    return (
      !!this.fullname.trim() &&
      this.fullname.trim().length >= 3 &&
      !!this.username &&
      this.username.length >= 3 &&
      /^[a-z0-9]+$/.test(this.username) &&
      !!this.dobYear &&
      !!this.dobMonth &&
      !!this.dobDay &&
      this.password.length >= 8 &&
      /[a-zA-Z]/.test(this.password) &&
      /[0-9]/.test(this.password) &&
      this.confirmPassword === this.password
    );
  }

  // ── Submit Form ────────────────────────
  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.errorMessage = '';

    const cleanUsername = this.username.trim().toLowerCase();

    this.loading = true;

    // Build DOB string in YYYY-MM-DD format
    const monthNum = this.months.indexOf(this.dobMonth) + 1;
    const formattedMonth = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
    const dayNum = parseInt(this.dobDay, 10);
    const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const dobString = `${this.dobYear}-${formattedMonth}-${formattedDay}`;

    const action = this.isSignup
      ? this.auth.signup(this.fullname.trim(), cleanUsername, dobString, this.password)
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
