// ============================================
//  Customers Page Component
// ============================================
//  Shows a form to add customers on the left
//  and the list of customers on the right.
//  Includes edit modal and delete functionality.
// ============================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../../services/customer.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.html',
  styleUrl: './customers.css',
})
export class CustomersComponent implements OnInit {
  // ── Customer list ──────────────────────
  customers: Customer[] = [];
  loading = true;

  // ── Add form fields ────────────────────
  newName = '';
  newEmail = '';
  newPhone = '';
  newEmailError = '';
  newPhoneError = '';
  addLoading = false;
  addError = '';
  addSuccess = '';

  // ── Edit modal fields ──────────────────
  editCustomer: Customer | null = null;
  editName = '';
  editEmail = '';
  editPhone = '';
  editEmailError = '';
  editPhoneError = '';
  editLoading = false;
  editError = '';

  // ── Delete ─────────────────────────────
  deleteTarget: Customer | null = null;

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  // ── Load all customers ─────────────────
  loadCustomers(): void {
    this.loading = true;
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  // ── Add a new customer ─────────────────
  onAdd(): void {
    this.addError = '';
    this.addSuccess = '';

    if (!this.newName.trim()) {
      this.addError = 'Customer name is required.';
      return;
    }

    this.validatePhone('new');
    this.validateEmail('new');

    if (this.newPhoneError || this.newEmailError) {
      return;
    }

    this.addLoading = true;

    this.customerService
      .addCustomer({
        name: this.newName.trim(),
        email: this.newEmail.trim(),
        phone: this.newPhone.trim(),
      })
      .subscribe({
        next: (customer) => {
          this.customers.unshift(customer); // Add to top of list
          this.newName = '';
          this.newEmail = '';
          this.newPhone = '';
          this.newEmailError = '';
          this.newPhoneError = '';
          this.addLoading = false;
          this.addSuccess = `"${customer.name}" added successfully!`;
          setTimeout(() => (this.addSuccess = ''), 3000);
        },
        error: (err) => {
          this.addLoading = false;
          this.addError =
            err.error?.message || 'Failed to add customer.';
        },
      });
  }

  // ── Open edit modal ────────────────────
  openEdit(customer: Customer): void {
    this.editCustomer = customer;
    this.editName = customer.name;
    this.editEmail = customer.email;
    this.editPhone = customer.phone;
    this.editEmailError = '';
    this.editPhoneError = '';
    this.editError = '';
  }

  // ── Save edit ──────────────────────────
  onSaveEdit(): void {
    if (!this.editCustomer) return;

    this.editError = '';

    if (!this.editName.trim()) {
      this.editError = 'Customer name is required.';
      return;
    }

    this.validatePhone('edit');
    this.validateEmail('edit');

    if (this.editPhoneError || this.editEmailError) {
      return;
    }

    this.editLoading = true;

    this.customerService
      .updateCustomer(this.editCustomer._id, {
        name: this.editName.trim(),
        email: this.editEmail.trim(),
        phone: this.editPhone.trim(),
      })
      .subscribe({
        next: (updated) => {
          // Update in the list
          const index = this.customers.findIndex(
            (c) => c._id === updated._id
          );
          if (index !== -1) {
            this.customers[index] = updated;
          }
          this.editCustomer = null;
          this.editEmailError = '';
          this.editPhoneError = '';
          this.editLoading = false;
        },
        error: (err) => {
          this.editLoading = false;
          this.editError =
            err.error?.message || 'Failed to update customer.';
        },
      });
  }

  // ── Close edit modal ───────────────────
  closeEdit(): void {
    this.editCustomer = null;
    this.editEmailError = '';
    this.editPhoneError = '';
  }

  // ── Open delete confirmation ───────────
  openDelete(customer: Customer): void {
    this.deleteTarget = customer;
  }

  // ── Confirm delete ─────────────────────
  confirmDelete(): void {
    if (!this.deleteTarget) return;

    this.customerService.deleteCustomer(this.deleteTarget._id).subscribe({
      next: () => {
        this.customers = this.customers.filter(
          (c) => c._id !== this.deleteTarget!._id
        );
        this.deleteTarget = null;
      },
      error: () => {
        this.deleteTarget = null;
      },
    });
  }

  // ── Cancel delete ──────────────────────
  cancelDelete(): void {
    this.deleteTarget = null;
  }

  // ── Filter non-numeric characters ──────
  validatePhoneInput(event: Event, mode: 'new' | 'edit'): void {
    const input = event.target as HTMLInputElement;
    const cleanValue = input.value.replace(/[^0-9]/g, '');
    if (mode === 'new') {
      this.newPhone = cleanValue;
      if (this.newPhoneError) {
        this.validatePhone('new');
      }
    } else {
      this.editPhone = cleanValue;
      if (this.editPhoneError) {
        this.validatePhone('edit');
      }
    }
  }

  // ── Validate Email format ───────────────
  validateEmail(mode: 'new' | 'edit'): void {
    const emailVal = mode === 'new' ? this.newEmail.trim() : this.editEmail.trim();
    let error = '';
    if (emailVal && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailVal)) {
      error = 'Please enter a valid email address.';
    }
    if (mode === 'new') {
      this.newEmailError = error;
    } else {
      this.editEmailError = error;
    }
  }

  // ── Validate Phone format ───────────────
  validatePhone(mode: 'new' | 'edit'): void {
    const phoneVal = mode === 'new' ? this.newPhone.trim() : this.editPhone.trim();
    let error = '';
    if (phoneVal && !/^\d{10}$/.test(phoneVal)) {
      error = 'Phone number must be exactly 10 digits.';
    }
    if (mode === 'new') {
      this.newPhoneError = error;
    } else {
      this.editPhoneError = error;
    }
  }
}
