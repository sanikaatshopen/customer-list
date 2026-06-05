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
      const emailsMatch = c.emails?.some(e => e.value.toLowerCase().includes(query)) || false;
      const phonesMatch = c.phones?.some(p => p.value.includes(query)) || false;
      
      return nameMatch || emailMatch || phoneMatch || emailsMatch || phonesMatch;
    });
  }

  get favoriteCustomers(): Customer[] {
    return this.filteredCustomers.filter(c => c.isFavorite);
  }

  get otherCustomers(): Customer[] {
    return this.filteredCustomers.filter(c => !c.isFavorite);
  }

  toggleFavorite(customer: Customer): void {
    const originalStatus = customer.isFavorite;
    customer.isFavorite = !originalStatus; // Optimistic update

    this.customerService
      .updateCustomer(customer._id, {
        name: customer.name,
        emails: customer.emails,
        phones: customer.phones,
        isFavorite: customer.isFavorite,
        bdate: customer.bdate
      })
      .subscribe({
        next: (updated) => {
          customer.isFavorite = updated.isFavorite;
        },
        error: () => {
          customer.isFavorite = originalStatus;
          alert('Failed to update favorite status.');
        }
      });
  }

  // ── Modals ─────────────────────────────
  showAddModal = false;

  // ── Add form fields ────────────────────
  newName = '';
  newBdate = '';
  newEmails: ContactEntity[] = [{ type: 'personal', value: '' }];
  newPhones: ContactEntity[] = [{ type: 'mobile', value: '' }];
  newEmailErrors: string[] = [''];
  newPhoneErrors: string[] = [''];
  newPhotoUrl = '';
  addLoading = false;
  addError = '';
  addSuccess = '';

  // ── Edit modal fields ──────────────────
  editCustomer: Customer | null = null;
  editName = '';
  editBdate = '';
  editEmails: ContactEntity[] = [];
  editPhones: ContactEntity[] = [];
  editEmailErrors: string[] = [];
  editPhoneErrors: string[] = [];
  editPhotoUrl = '';
  editLoading = false;
  editError = '';

  // ── Delete ─────────────────────────────
  deleteTarget: Customer | null = null;
  
  // ── Bulk Delete ────────────────────────
  selectedIds: Set<string> = new Set<string>();
  showBulkDeleteModal = false;

  // ── Import Modal ─────────────────────────
  showImportResultModal = false;
  importResultTitle = '';
  importResultMessage = '';
  importResultIsError = false;
  importResultImported: string[] = [];
  importResultDuplicates: string[] = [];
  importResultInvalids: string[] = [];

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

    const validNewEmails = this.newEmails.filter(e => e.value.trim());
    if (validNewEmails.length === 0) {
      this.addError = 'At least one email address is required.';
      return;
    }

    const validNewPhones = this.newPhones.filter(p => p.value.trim());
    if (validNewPhones.length === 0) {
      this.addError = 'At least one phone number is required.';
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
        bdate: this.newBdate,
        photoUrl: this.newPhotoUrl,
      })
      .subscribe({
        next: (customer) => {
          this.customers.unshift(customer); // Add to top of list
          this.newName = '';
          this.newBdate = '';
          this.newEmails = [{ type: 'personal', value: '' }];
          this.newPhones = [{ type: 'mobile', value: '' }];
          this.newEmailErrors = [''];
          this.newPhoneErrors = [''];
          this.newPhotoUrl = '';
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
    this.editBdate = customer.bdate || '';
    this.editEmails = customer.emails?.length ? customer.emails.map(e => ({ type: e.type || 'personal', value: e.value })) : [{ type: 'personal', value: '' }];
    this.editPhones = customer.phones?.length ? customer.phones.map(p => ({ type: p.type || 'mobile', value: p.value })) : [{ type: 'mobile', value: '' }];
    this.editEmailErrors = new Array(this.editEmails.length).fill('');
    this.editPhoneErrors = new Array(this.editPhones.length).fill('');
    this.editPhotoUrl = customer.photoUrl || '';
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

    const validEditEmails = this.editEmails.filter(e => e.value.trim());
    if (validEditEmails.length === 0) {
      this.editError = 'At least one email address is required.';
      return;
    }

    const validEditPhones = this.editPhones.filter(p => p.value.trim());
    if (validEditPhones.length === 0) {
      this.editError = 'At least one phone number is required.';
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
        bdate: this.editBdate,
        photoUrl: this.editPhotoUrl,
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
    this.editPhotoUrl = '';
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
    
    // Force DOM update so letters disappear immediately
    if (input.value !== cleanValue) {
      input.value = cleanValue;
    }

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

  // ── Photo Selection ─────────────────────
  onPhotoSelected(event: Event, mode: 'new' | 'edit'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Check file size (e.g., limit to 5MB for frontend check)
      if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Please select an image under 5MB.');
        input.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Url = e.target?.result as string;
        if (mode === 'new') {
          this.newPhotoUrl = base64Url;
        } else {
          this.editPhotoUrl = base64Url;
        }
      };
      reader.readAsDataURL(file);
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

  isBirthdayToday(bdate?: string): boolean {
    if (!bdate) return false;
    const today = new Date();
    const [year, month, day] = bdate.split('-');
    if (!month || !day) return false;
    return today.getMonth() + 1 === parseInt(month, 10) && today.getDate() === parseInt(day, 10);
  }

  // ── Bulk Download CSV ────────────────────
  downloadCsv(): void {
    if (this.selectedIds.size === 0) return;

    const selectedCustomers = this.customers.filter(c => this.selectedIds.has(c._id));
    
    const headers = ['Name', 'Emails', 'Phones', 'Favorite'];
    const rows = selectedCustomers.map(c => {
      const emails = c.emails ? c.emails.map(e => e.value).join('; ') : '';
      const phones = c.phones ? c.phones.map(p => p.value).join('; ') : '';
      const isFavorite = c.isFavorite ? 'Yes' : 'No';
      
      return `"${c.name.replace(/"/g, '""')}","${emails.replace(/"/g, '""')}","${phones.replace(/"/g, '""')}","${isFavorite}"`;
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'customers_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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

  // ── CSV Bulk Import ──────────────────────
  onImportFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      if (typeof text !== 'string') return;
      
      const lines = text.split(/\r?\n/).filter((line: string) => line.trim());
      if (lines.length < 2) {
        this.importResultTitle = 'Invalid File';
        this.importResultMessage = 'CSV file is empty or missing headers.';
        this.importResultIsError = true;
        this.importResultImported = [];
        this.importResultDuplicates = [];
        this.importResultInvalids = [];
        this.showImportResultModal = true;
        event.target.value = '';
        return;
      }

      const customersToImport: any[] = [];
      
      // Better CSV split handling quotes
      const parseCsvLine = (line: string): string[] => {
        const row: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(cur.trim());
                cur = '';
            } else {
                cur += char;
            }
        }
        row.push(cur.trim());
        return row;
      };

      const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());
      
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const phoneIdx = headers.findIndex(h => h.includes('phone'));
      const bdateIdx = headers.findIndex(h => h.includes('birthdate') || h.includes('bdate'));
      
      if (nameIdx === -1) {
        this.importResultTitle = 'Invalid Format';
        this.importResultMessage = 'CSV must contain a "Name" column.';
        this.importResultIsError = true;
        this.importResultImported = [];
        this.importResultDuplicates = [];
        this.importResultInvalids = [];
        this.showImportResultModal = true;
        event.target.value = '';
        return;
      }

      for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
        if (!row[nameIdx]) continue;
        
        customersToImport.push({
          name: row[nameIdx],
          email: emailIdx !== -1 ? row[emailIdx] : '',
          phone: phoneIdx !== -1 ? row[phoneIdx] : '',
          bdate: bdateIdx !== -1 ? row[bdateIdx] : ''
        });
      }

      if (customersToImport.length === 0) {
        this.importResultTitle = 'No Contacts';
        this.importResultMessage = 'No valid contacts found to import.';
        this.importResultIsError = true;
        this.importResultImported = [];
        this.importResultDuplicates = [];
        this.importResultInvalids = [];
        this.showImportResultModal = true;
        event.target.value = '';
        return;
      }
      
      this.loading = true;
      this.customerService.importCustomers(customersToImport).subscribe({
        next: (res) => {
          this.importResultTitle = 'Import Completed';
          this.importResultMessage = res.message;
          this.importResultIsError = false;
          this.importResultImported = res.imported || [];
          this.importResultDuplicates = res.skippedDuplicates || [];
          this.importResultInvalids = res.skippedInvalid || [];
          this.showImportResultModal = true;
          this.loadCustomers();
        },
        error: (err) => {
          this.loading = false;
          this.importResultTitle = 'Import Failed';
          this.importResultMessage = err.error?.message || 'Failed to import CSV.';
          this.importResultIsError = true;
          this.importResultImported = err.error?.imported || [];
          this.importResultDuplicates = err.error?.skippedDuplicates || [];
          this.importResultInvalids = err.error?.skippedInvalid || [];
          this.showImportResultModal = true;
        }
      });
      
      // Reset file input
      event.target.value = '';
    };
    
    reader.readAsText(file);
  }
}
