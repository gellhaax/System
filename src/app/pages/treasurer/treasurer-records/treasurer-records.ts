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
  ) {}

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
        this.records = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading records:', err)
    });
  }

  getEmptyRecord() {
    return { studentId: '', firstName: '', middleName: '', lastName: '', course: '', year: '', fee: '', amount: 0, method: '', balance: 0, status: '', date: '', receipt: '' };
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
            this.records = [...data];
            this.searchStudent();
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => alert(err.error?.error || "Failed to add transaction!")
    });
  }

  addRecord() {
    if (!this.newRecord.studentId?.trim()) { alert("Student ID is required!"); return; }
    if (!this.newRecord.firstName?.trim()) { alert("First Name is required!"); return; }
    if (!this.newRecord.lastName?.trim()) { alert("Last Name is required!"); return; }
    if (!this.newRecord.course) { alert("Course is required!"); return; }
    if (!this.newRecord.year) { alert("Year is required!"); return; }
    if (!this.newRecord.fee) { alert("Fee is required!"); return; }
    if (!this.newRecord.amount) { alert("Amount is required!"); return; }
    if (!this.newRecord.method) { alert("Payment Method is required!"); return; }
    if (!this.newRecord.date) { alert("Date is required!"); return; }

    this.computeBalance(this.newRecord);

    const formData = new FormData();
    formData.append('studentId', this.newRecord.studentId);
    formData.append('firstName', this.newRecord.firstName);
    formData.append('middleName', this.newRecord.middleName);
    formData.append('lastName', this.newRecord.lastName);
    formData.append('course', this.newRecord.course);
    formData.append('year', this.newRecord.year);

    const transactionData = {
      fee: this.newRecord.fee,
      amount: this.newRecord.amount,
      method: this.newRecord.method,
      balance: this.newRecord.balance,
      status: this.newRecord.status,
      date: this.newRecord.date
    };

    formData.append('transactions', JSON.stringify([transactionData]));

    if (this.newRecord.selectedFile) {
      formData.append('receipt', this.newRecord.selectedFile, this.newRecord.selectedFile.name);
    }

    this.http.post<any>(`${this.apiUrl}/students`, formData).subscribe({
      next: () => {
        alert("Student added successfully!");
        this.closeAddForm();
        this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
          next: (data) => {
            this.records = [...data];
            this.cdr.detectChanges();
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

  saveEdit() {
    if (!this.selectedRecord) { alert("No record selected for editing."); return; }

    this.http.put<any>(`${this.apiUrl}/students/${this.selectedRecord.studentId}`, {
      firstName: this.selectedRecord.firstName,
      middleName: this.selectedRecord.middleName,
      lastName: this.selectedRecord.lastName,
      course: this.selectedRecord.course,
      year: this.selectedRecord.year
    }).subscribe({
      next: () => {
        alert("Student updated successfully!");
        this.selectedRecord = null;
        this.selectedIndex = -1;
        this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
          next: (data) => {
            this.records = [...data];
            this.searchStudent();
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => alert(err.error?.error || "Failed to update student!")
    });
  }

  cancelEdit() { this.selectedRecord = null; this.cdr.detectChanges(); }

  deleteStudent(studentId: string) {
    if (!confirm("Are you sure you want to delete this student record?")) return;
    this.http.delete<any>(`${this.apiUrl}/students/${studentId}`).subscribe({
      next: () => {
        alert("Student deleted successfully!");
        this.filteredRecords = [];
        this.searchId = '';
        this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
          next: (data) => {
            this.records = [...data];
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

  // ✅ FIXED: Only show fees that the student actually has transactions for
  getRemainingBalances(student: any) {
    if (!student || !student.transactions) return [];
    
    const feeTotals: any = {};

    // Only track fees that appear in the student's transactions
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

    // Return only fees with remaining balance > 0
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
            this.records = [...data];
            this.searchStudent();
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => alert(err.error?.error || "Failed to delete transaction!")
    });
  }
}