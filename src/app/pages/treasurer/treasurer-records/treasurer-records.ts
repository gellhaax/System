import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Navbar } from '../treasurer-navbar/treasurer-navbar';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './treasurer-records.html',
  styleUrls: ['./treasurer-records.css']
})
export class Records implements OnInit, OnDestroy {

  private apiUrl = 'http://localhost:3000/api';
  private routerSub!: Subscription;

  searchId = '';
  records: any[] = [];
  filteredRecords: any[] = [];
  showAddForm = false;
  showTransactionForm = false;
  selectedRecord: any = null;
  selectedIndex = -1;

  selectedReceipt: string = '';
  showReceiptModal = false;

  feeMap: any = {
    "Organization fee": 100,
    "Usg Fee": 500,
    "Miscellaneous fee": 1000,
    "Tuition fee": 5000
  };

  newRecord: any = this.getEmptyRecord();
  newTransaction: any = this.getEmptyTransaction();

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadRecords();
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadRecords();
    });
  }

  ngOnDestroy() {
    if (this.routerSub) this.routerSub.unsubscribe();
  }

  loadRecords() {
    this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
      next: (data) => {
        this.records = this.sortRecords([...data]);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading records:', err)
    });
  }

  sortRecords(data: any[]) {
    return data.sort((a, b) => {
      const idA = a.studentId ? a.studentId.toString() : '';
      const idB = b.studentId ? b.studentId.toString() : '';
      return idA.localeCompare(idB, undefined, { numeric: true });
    });
  }

  getEmptyRecord() {
    return { studentId: '', studentIdSuffix: '', firstName: '', middleName: '', lastName: '', course: '', year: '', fee: '', amount: 0, method: '', balance: 0, status: '', date: '', receipt: '' };
  }

  getEmptyTransaction() {
    return { fee: '', amount: 0, method: '', balance: 0, status: '', date: '', receipt: '' };
  }

  getAlreadyPaid(studentId: string, feeName: string): number {
    const student = this.records.find(r => r.studentId === studentId);
    if (!student || !student.transactions) return 0;
    let paid = 0;
    student.transactions.forEach((t: any) => {
      if (t.fee === feeName) {
        paid += Number(t.amount || 0);
      }
    });
    return paid;
  }

  getRemainingForFee(studentId: string, feeName: string): number {
    const feeTotal = this.feeMap[feeName] || 0;
    const alreadyPaid = this.getAlreadyPaid(studentId, feeName);
    return Math.max(0, feeTotal - alreadyPaid);
  }

  onTransactionFeeChange() {
    const student = this.filteredRecords[0];
    if (!student || !this.newTransaction.fee) return;

    const remaining = this.getRemainingForFee(student.studentId, this.newTransaction.fee);
    this.newTransaction.amount = 0;
    this.newTransaction.balance = remaining;
    this.newTransaction.status = remaining === 0 ? 'Paid' : 'Partial';
    this.cdr.detectChanges();
  }

  onTransactionAmountChange() {
    const student = this.filteredRecords[0];
    if (!student || !this.newTransaction.fee) return;

    const remaining = this.getRemainingForFee(student.studentId, this.newTransaction.fee);
    let paid = Number(this.newTransaction.amount || 0);

    if (paid < 0) paid = 0;
    if (paid > remaining) paid = remaining;

    this.newTransaction.amount = paid;
    this.newTransaction.balance = remaining - paid;
    this.newTransaction.status = this.newTransaction.balance === 0 ? 'Paid' : 'Partial';
    this.cdr.detectChanges();
  }

  computeBalance(record: any) {
    const feeTotal = this.feeMap[record.fee] || 0;
    let paid = Number(record.amount || 0);
    if (paid < 0) paid = 0;
    if (paid > feeTotal) paid = feeTotal;
    record.amount = paid;
    record.balance = feeTotal - paid;
    record.status = record.balance === 0 ? 'Paid' : 'Partial';
    this.cdr.detectChanges();
  }

  onFileSelected(event: any, target: any) {
    const file = event.target.files[0];
    if (!file) return;
    target.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      target.receiptPreview = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  viewReceipt(receipt: string) {
    if (receipt && !receipt.startsWith('http') && !receipt.startsWith('data:')) {
      this.selectedReceipt = `http://localhost:3000${receipt}`;
    } else {
      this.selectedReceipt = receipt;
    }
    this.showReceiptModal = true;
    this.cdr.detectChanges();
  }

  closeReceiptModal() {
    this.showReceiptModal = false;
    this.selectedReceipt = '';
    this.cdr.detectChanges();
  }

  searchStudent() {
    const key = this.searchId.trim();
    if (!key) { this.filteredRecords = []; this.cdr.detectChanges(); return; }
    this.filteredRecords = this.records.filter(r => r.studentId.includes(key));
    this.cdr.detectChanges();
  }

  selectStudent(student: any) {
    this.searchId = student.studentId;
    this.filteredRecords = [student];
    this.cdr.detectChanges();
  }

  addTransaction() {
    const student = this.filteredRecords[0];
    if (!student) return;
    if (!this.newTransaction.fee) { alert("Fee is required!"); return; }
    if (!this.newTransaction.amount) { alert("Amount is required!"); return; }
    if (!this.newTransaction.method) { alert("Payment Method is required!"); return; }
    if (!this.newTransaction.date) { alert("Date is required!"); return; }

    const remainingBalance = this.getRemainingForFee(student.studentId, this.newTransaction.fee);
    if (Number(this.newTransaction.amount) > remainingBalance) {
      alert(`Payment amount exceeds remaining balance. Maximum allowed: ${remainingBalance}`);
      this.newTransaction.amount = remainingBalance;
      this.onTransactionAmountChange();
      return;
    }

    this.onTransactionAmountChange();

    const formData = new FormData();
    formData.append('studentId', student.studentId);
    formData.append('fee', this.newTransaction.fee);
    formData.append('amount', this.newTransaction.amount.toString());
    formData.append('method', this.newTransaction.method);
    formData.append('balance', this.newTransaction.balance.toString());
    formData.append('status', this.newTransaction.status);
    formData.append('date', this.newTransaction.date);

    if (this.newTransaction.selectedFile) {
      formData.append('receipt', this.newTransaction.selectedFile, this.newTransaction.selectedFile.name);
    }

    this.http.post<any>(`${this.apiUrl}/transactions`, formData).subscribe({
      next: (response) => {
        alert("Transaction added successfully!");
        this.closeTransactionForm();
        this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
          next: (data) => {
            this.records = this.sortRecords([...data]);
            this.searchStudent();
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => alert(err.error?.error || "Failed to add transaction!")
    });
  }

  // ✅ FIXED: addRecord now correctly saves the first transaction using the user‑entered studentId
  addRecord() {
    if (!this.newRecord.studentIdSuffix?.trim() || this.newRecord.studentIdSuffix.length !== 3) { 
      alert("Please enter exactly 3 digits for the Student ID!"); 
      return; 
    }
    this.newRecord.studentId = '2024300' + this.newRecord.studentIdSuffix;

    if (!this.newRecord.firstName?.trim()) { alert("First Name is required!"); return; }
    if (!this.newRecord.lastName?.trim()) { alert("Last Name is required!"); return; }
    if (!this.newRecord.course) { alert("Course is required!"); return; }
    if (!this.newRecord.year) { alert("Year is required!"); return; }
    if (!this.newRecord.fee) { alert("Fee is required!"); return; }
    if (!this.newRecord.amount) { alert("Amount is required!"); return; }
    if (!this.newRecord.method) { alert("Payment Method is required!"); return; }
    if (!this.newRecord.date) { alert("Date is required!"); return; }

    // Duplicate Validation Checks
    const isDuplicateId = this.records.some(r => r.studentId === this.newRecord.studentId);
    if (isDuplicateId) {
      alert(`Error: Student ID ${this.newRecord.studentId} already exists!`);
      return;
    }

    const isDuplicateName = this.records.some(r => 
      r.firstName?.trim().toLowerCase() === this.newRecord.firstName.trim().toLowerCase() &&
      r.lastName?.trim().toLowerCase() === this.newRecord.lastName.trim().toLowerCase() &&
      (r.middleName || '').trim().toLowerCase() === (this.newRecord.middleName || '').trim().toLowerCase()
    );
    if (isDuplicateName) {
      alert("Error: A student with this exact first, middle, and last name already exists!");
      return;
    }

    this.computeBalance(this.newRecord);

    // Step 1: Build student form data (no transaction)
    const studentFormData = new FormData();
    studentFormData.append('studentId', this.newRecord.studentId);
    studentFormData.append('firstName', this.newRecord.firstName);
    studentFormData.append('middleName', this.newRecord.middleName);
    studentFormData.append('lastName', this.newRecord.lastName);
    studentFormData.append('course', this.newRecord.course);
    studentFormData.append('year', this.newRecord.year);

    // Step 2: Create the student
    this.http.post<any>(`${this.apiUrl}/students`, studentFormData).subscribe({
      next: (response) => {
        // Step 3: Add the first transaction using the SAME studentId
        const transactionFormData = new FormData();
        transactionFormData.append('studentId', this.newRecord.studentId);
        transactionFormData.append('fee', this.newRecord.fee);
        transactionFormData.append('amount', this.newRecord.amount.toString());
        transactionFormData.append('method', this.newRecord.method);
        transactionFormData.append('balance', this.newRecord.balance.toString());
        transactionFormData.append('status', this.newRecord.status);
        transactionFormData.append('date', this.newRecord.date);

        if (this.newRecord.selectedFile) {
          transactionFormData.append('receipt', this.newRecord.selectedFile, this.newRecord.selectedFile.name);
        }

        this.http.post<any>(`${this.apiUrl}/transactions`, transactionFormData).subscribe({
          next: () => {
            alert("Student and initial payment added successfully!");
            this.closeAddForm();
            this.loadRecords();
          },
          error: (err) => {
            alert("Student was created, but the first payment failed: " + (err.error?.error || "Unknown error"));
            this.closeAddForm();
            this.loadRecords();
          }
        });
      },
      error: (err) => alert(err.error?.error || "Failed to add student!")
    });
  }

  openAddForm() { this.showAddForm = true; this.showTransactionForm = false; this.selectedRecord = null; this.cdr.detectChanges(); }
  closeAddForm() { this.showAddForm = false; this.newRecord = this.getEmptyRecord(); this.cdr.detectChanges(); }

  openTransactionForm() {
    if (!this.filteredRecords.length) { alert("Search/select a student first."); return; }
    this.showTransactionForm = true; this.showAddForm = false; this.selectedRecord = null;
    this.newTransaction = this.getEmptyTransaction();
    this.cdr.detectChanges();
  }

  closeTransactionForm() { this.showTransactionForm = false; this.newTransaction = this.getEmptyTransaction(); this.cdr.detectChanges(); }

  editRecord(record: any) {
    this.selectedRecord = { ...record };
    this.selectedIndex = this.records.findIndex(r => r.studentId === record.studentId);
    this.showAddForm = false;
    this.showTransactionForm = false;
    this.cdr.detectChanges();
  }

  // ✅ FIXED: Use the Firestore document ID (record.id) not the studentId
  saveEdit() {
    if (!this.selectedRecord) { alert("No record selected for editing."); return; }

    // Instead of saving directly, submit an approval request
    alert("Please wait for admin approval.");

    this.http.post<any>(`${this.apiUrl}/approvals`, {
      requestedBy: 'Treasurer',
      studentId: this.selectedRecord.studentId,
      studentName: `${this.selectedRecord.firstName} ${this.selectedRecord.lastName}`,
      requestedData: {
        type: 'student_update',
        data: {
          firstName: this.selectedRecord.firstName,
          middleName: this.selectedRecord.middleName,
          lastName: this.selectedRecord.lastName,
          course: this.selectedRecord.course,
          year: this.selectedRecord.year
        }
      },
      originalData: this.records[this.selectedIndex]
    }).subscribe({
      next: () => {
        this.selectedRecord = null;
        this.selectedIndex = -1;
        this.cdr.detectChanges();
      },
      error: (err) => alert(err.error?.error || "Failed to submit approval request!")
    });
  }

  cancelEdit() { this.selectedRecord = null; this.cdr.detectChanges(); }

  // ✅ FIXED: Find the correct Firestore document ID before deleting
  deleteStudent(studentId: string) {
    if (!confirm("Are you sure you want to delete this student record?")) return;

    // Look up the server‑returned student object that matches this studentId
    const student = this.records.find(r => r.studentId === studentId);
    if (!student || !student.id) {
      alert("Could not find the record's document ID. Please reload the page.");
      return;
    }

    this.http.delete<any>(`${this.apiUrl}/students/${student.id}`).subscribe({
      next: () => {
        alert("Student deleted successfully!");
        this.filteredRecords = [];
        this.searchId = '';
        this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
          next: (data) => {
            this.records = this.sortRecords([...data]);
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => alert(err.error?.error || "Failed to delete student!")
    });
  }

  getUniqueStudents() {
    const seen = new Set();
    return this.records.filter(r => {
      if (seen.has(r.studentId)) return false;
      seen.add(r.studentId);
      return true;
    });
  }

  getRemainingBalances(student: any) {
    if (!student || !student.transactions) return [];

    const feeTotals: any = {};

    student.transactions.forEach((t: any) => {
      if (!feeTotals[t.fee]) {
        feeTotals[t.fee] = {
          fee: t.fee,
          totalFee: this.feeMap[t.fee] || 0,
          paid: 0
        };
      }
      feeTotals[t.fee].paid += Number(t.amount || 0);
    });

    return Object.values(feeTotals)
      .map((f: any) => ({
        fee: f.fee,
        balance: Math.max(0, f.totalFee - f.paid),
        totalFee: f.totalFee,
        paid: f.paid
      }))
      .filter((f: any) => f.balance > 0);
  }

  deleteTransaction(index: number) {
    const student = this.filteredRecords[0];
    if (!student) return;
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    const transaction = student.transactions[index];
    if (!transaction?.id) { alert("Transaction ID not found!"); return; }

    this.http.delete<any>(`${this.apiUrl}/transactions/${transaction.id}`).subscribe({
      next: () => {
        alert("Transaction deleted successfully!");
        this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
          next: (data) => {
            this.records = this.sortRecords([...data]);
            this.searchStudent();
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => alert(err.error?.error || "Failed to delete transaction!")
    });
  }
}