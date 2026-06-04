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
import { CustomerService, Customer, ContactEntity } from '../../services/customer.service';

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
  searchQuery = '';

  get filteredCustomers(): Customer[] {
    if (!this.searchQuery.trim()) {
      return this.customers;
    }
    const query = this.searchQuery.toLowerCase().trim();
    return this.customers.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(query);
      const emailMatch = (c.email || '').toLowerCase().includes(query);
      const phoneMatch = (c.phone || '').includes(query);
      return nameMatch || emailMatch || phoneMatch;
    });
  }

  // ── Modals ─────────────────────────────
  showAddModal = false;

  // ── Add form fields ────────────────────
  newName = '';
  newEmails: ContactEntity[] = [{ type: 'personal', value: '' }];
  newPhones: ContactEntity[] = [{ type: 'mobile', value: '' }];
  newEmailErrors: string[] = [''];
  newPhoneErrors: string[] = [''];
  addLoading = false;
  addError = '';
  addSuccess = '';

  // ── Edit modal fields ──────────────────
  editCustomer: Customer | null = null;
  editName = '';
  editEmails: ContactEntity[] = [];
  editPhones: ContactEntity[] = [];
  editEmailErrors: string[] = [];
  editPhoneErrors: string[] = [];
  editLoading = false;
  editError = '';

  // ── Delete ─────────────────────────────
  deleteTarget: Customer | null = null;
  
  // ── Bulk Delete ────────────────────────
  selectedIds: Set<string> = new Set<string>();
  showBulkDeleteModal = false;

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

  // ── Array Field Methods ─────────────────
  addEmailField(mode: 'new' | 'edit'): void {
    if (mode === 'new') {
      this.newEmails.push({ type: 'personal', value: '' });
      this.newEmailErrors.push('');
    } else {
      this.editEmails.push({ type: 'personal', value: '' });
      this.editEmailErrors.push('');
    }
  }

  removeEmailField(mode: 'new' | 'edit', index: number): void {
    if (mode === 'new') {
      this.newEmails.splice(index, 1);
      this.newEmailErrors.splice(index, 1);
    } else {
      this.editEmails.splice(index, 1);
      this.editEmailErrors.splice(index, 1);
    }
  }

  addPhoneField(mode: 'new' | 'edit'): void {
    if (mode === 'new') {
      this.newPhones.push({ type: 'mobile', value: '' });
      this.newPhoneErrors.push('');
    } else {
      this.editPhones.push({ type: 'mobile', value: '' });
      this.editPhoneErrors.push('');
    }
  }

  removePhoneField(mode: 'new' | 'edit', index: number): void {
    if (mode === 'new') {
      this.newPhones.splice(index, 1);
      this.newPhoneErrors.splice(index, 1);
    } else {
      this.editPhones.splice(index, 1);
      this.editPhoneErrors.splice(index, 1);
    }
  }

  // ── Add a new customer ─────────────────
  onAdd(): void {
    this.addError = '';
    this.addSuccess = '';

    if (!this.newName.trim()) {
      this.addError = 'Customer name is required.';
      return;
    }

    this.validatePhones('new');
    this.validateEmails('new');

    if (this.newPhoneErrors.some(e => e) || this.newEmailErrors.some(e => e)) {
      return;
    }

    this.addLoading = true;

    this.customerService
      .addCustomer({
        name: this.newName.trim(),
        emails: this.newEmails.filter(e => e.value.trim()).map(e => ({ type: e.type, value: e.value.trim() })),
        phones: this.newPhones.filter(p => p.value.trim()).map(p => ({ type: p.type, value: p.value.trim() })),
      })
      .subscribe({
        next: (customer) => {
          this.customers.unshift(customer); // Add to top of list
          this.newName = '';
          this.newEmails = [{ type: 'personal', value: '' }];
          this.newPhones = [{ type: 'mobile', value: '' }];
          this.newEmailErrors = [''];
          this.newPhoneErrors = [''];
          this.addLoading = false;
          this.showAddModal = false; // Close modal on success
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
    this.editEmails = customer.emails?.length ? customer.emails.map(e => ({ type: e.type || 'personal', value: e.value })) : [{ type: 'personal', value: '' }];
    this.editPhones = customer.phones?.length ? customer.phones.map(p => ({ type: p.type || 'mobile', value: p.value })) : [{ type: 'mobile', value: '' }];
    this.editEmailErrors = new Array(this.editEmails.length).fill('');
    this.editPhoneErrors = new Array(this.editPhones.length).fill('');
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

    this.validatePhones('edit');
    this.validateEmails('edit');

    if (this.editPhoneErrors.some(e => e) || this.editEmailErrors.some(e => e)) {
      return;
    }

    this.editLoading = true;

    this.customerService
      .updateCustomer(this.editCustomer._id, {
        name: this.editName.trim(),
        emails: this.editEmails.filter(e => e.value.trim()).map(e => ({ type: e.type, value: e.value.trim() })),
        phones: this.editPhones.filter(p => p.value.trim()).map(p => ({ type: p.type, value: p.value.trim() })),
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
  validatePhoneInput(event: Event, mode: 'new' | 'edit', index: number): void {
    const input = event.target as HTMLInputElement;
    const cleanValue = input.value.replace(/[^0-9]/g, '');
    if (mode === 'new') {
      this.newPhones[index].value = cleanValue;
      if (this.newPhoneErrors[index]) {
        this.validatePhones('new');
      }
    } else {
      this.editPhones[index].value = cleanValue;
      if (this.editPhoneErrors[index]) {
        this.validatePhones('edit');
      }
    }
  }

  // ── Validate Email format ───────────────
  validateEmails(mode: 'new' | 'edit'): void {
    const emails = mode === 'new' ? this.newEmails : this.editEmails;
    const errors = emails.map(emailObj => {
      const trimmed = emailObj.value.trim();
      if (trimmed && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
        return 'Please enter a valid email address.';
      }
      return '';
    });
    
    if (mode === 'new') {
      this.newEmailErrors = errors;
    } else {
      this.editEmailErrors = errors;
    }
  }

  // ── Validate Phone format ───────────────
  validatePhones(mode: 'new' | 'edit'): void {
    const phones = mode === 'new' ? this.newPhones : this.editPhones;
    const errors = phones.map(phoneObj => {
      const trimmed = phoneObj.value.trim();
      if (trimmed && !/^\d{10}$/.test(trimmed)) {
        return 'Phone number must be exactly 10 digits.';
      }
      return '';
    });
    
    if (mode === 'new') {
      this.newPhoneErrors = errors;
    } else {
      this.editPhoneErrors = errors;
    }
  }

  // ── Bulk Selection Methods ───────────────
  toggleSelection(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.customers.forEach((c) => this.selectedIds.add(c._id));
    } else {
      this.selectedIds.clear();
    }
  }

  isAllSelected(): boolean {
    return this.customers.length > 0 && this.selectedIds.size === this.customers.length;
  }

  // ── Bulk Delete Methods ──────────────────
  openBulkDelete(): void {
    if (this.selectedIds.size > 0) {
      this.showBulkDeleteModal = true;
    }
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteModal = false;
  }

  confirmBulkDelete(): void {
    if (this.selectedIds.size === 0) return;
    const ids = Array.from(this.selectedIds);
    this.customerService.deleteCustomers(ids).subscribe({
      next: () => {
        this.customers = this.customers.filter((c) => !this.selectedIds.has(c._id));
        this.selectedIds.clear();
        this.showBulkDeleteModal = false;
      },
      error: () => {
        this.showBulkDeleteModal = false;
      },
    });
  }
}
