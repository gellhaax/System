import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminNavbarComponent],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit, OnDestroy {

  private apiUrl = 'http://localhost:3000/api';
  private routerSub!: Subscription;
  private refreshInterval: any;

  currentUser: any = null;
  today = new Date();
  records: any[] = [];

  feeMap: any = {
    "organization fee": 100,
    "usg fee": 500,
    "miscellaneous fee": 1000,
    "tuition fee": 5000
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const user = localStorage.getItem('currentUser');
    if (user) this.currentUser = JSON.parse(user);

    this.loadRecords();

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadRecords();
    });

    this.refreshInterval = setInterval(() => {
      this.loadRecords();
    }, 10000);
  }

  ngOnDestroy() {
    if (this.routerSub) this.routerSub.unsubscribe();
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadRecords() {
    this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
      next: (data) => {
        this.records = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error:', err)
    });
  }

  // ✅ Case-insensitive fee lookup
  getFeeAmount(feeName: string): number {
    if (!feeName) return 0;
    const key = Object.keys(this.feeMap).find(
      k => k.toLowerCase() === feeName.toLowerCase().trim()
    );
    return key ? this.feeMap[key] : 0;
  }

  // ✅ Get already paid amount for a specific fee category
  getAlreadyPaidForFee(student: any, feeName: string): number {
    if (!student.transactions) return 0;
    let paid = 0;
    student.transactions.forEach((t: any) => {
      if (t.fee.toLowerCase() === feeName.toLowerCase()) {
        paid += Number(t.amount || 0);
      }
    });
    return paid;
  }

  // ✅ Compute balance per student considering all fee categories
  getStudentBalance(student: any): number {
    if (!student.transactions || student.transactions.length === 0) return this.calculateTotalFees(student);

    const feeTotals: any = {};

    // Initialize all possible fees for this student
    student.transactions.forEach((t: any) => {
      const feeKey = t.fee?.toLowerCase().trim();
      if (!feeTotals[feeKey]) {
        feeTotals[feeKey] = { 
          totalFee: this.getFeeAmount(t.fee), 
          paid: 0 
        };
      }
    });

    // Calculate how much was paid for each fee type
    student.transactions.forEach((t: any) => {
      const feeKey = t.fee?.toLowerCase().trim();
      if (feeTotals[feeKey]) {
        feeTotals[feeKey].paid += Number(t.amount || 0);
      }
    });

    let balance = 0;
    Object.values(feeTotals).forEach((f: any) => {
      const b = f.totalFee - f.paid;
      if (b > 0) balance += b;
    });

    return balance;
  }

  // Calculate total original fees for a student
  calculateTotalFees(student: any): number {
    if (!student.transactions) return 0;
    
    const feeTypes: Set<string> = new Set();
    student.transactions.forEach((t: any) => {
      if (t.fee) {
        feeTypes.add(t.fee.toLowerCase().trim());
      }
    });
    
    let total = 0;
    feeTypes.forEach(feeType => {
      total += this.getFeeAmount(feeType);
    });
    
    return total;
  }

  // ✅ Get overall payment status per student
  getStudentStatus(student: any): string {
    if (!student.transactions || student.transactions.length === 0) return 'No Payment';
    const balance = this.getStudentBalance(student);
    
    // Check if student has any transactions at all
    if (student.transactions.length === 0) return 'No Payment';
    
    // If balance is 0, all fees are paid
    if (balance === 0) return 'Paid';
    
    // Otherwise, it's partial
    return 'Partial';
  }

  get paidStudents(): number {
    return this.records.filter(s => this.getStudentStatus(s) === 'Paid').length;
  }

  get partialStudents(): number {
    return this.records.filter(s => this.getStudentStatus(s) === 'Partial').length;
  }

  get totalStudents(): number {
    return this.records.length;
  }

  get totalCollected(): number {
    let total = 0;
    this.records.forEach(s => {
      (s.transactions || []).forEach((t: any) => {
        total += Number(t.amount || 0);
      });
    });
    return total;
  }

  get pendingBalance(): number {
    let total = 0;
    this.records.forEach(s => {
      total += this.getStudentBalance(s);
    });
    return total;
  }

  get collectionRate(): number {
    const total = this.totalCollected + this.pendingBalance;
    if (total === 0) return 0;
    return Math.round((this.totalCollected / total) * 100);
  }

  get recentPayments(): any[] {
    const all: any[] = [];
    this.records.forEach(s => {
      (s.transactions || []).forEach((t: any) => {
        all.push({
          name: `${s.firstName} ${s.lastName}`,
          course: s.course + ' - ' + s.year,
          amount: t.amount,
          status: this.getStudentStatus(s),
          date: t.date
        });
      });
    });
    return all.slice(-5).reverse();
  }

  get weeklyTotal(): number {
    const now = new Date();
    const firstDay = new Date(now);
    firstDay.setDate(now.getDate() - now.getDay());
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    let total = 0;
    this.records.forEach(s => {
      (s.transactions || []).forEach((t: any) => {
        const d = new Date(t.date);
        if (d >= firstDay && d <= lastDay) total += Number(t.amount || 0);
      });
    });
    return total;
  }

  get monthlyTotal(): number {
    const now = new Date();
    let total = 0;
    this.records.forEach(s => {
      (s.transactions || []).forEach((t: any) => {
        const d = new Date(t.date);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          total += Number(t.amount || 0);
        }
      });
    });
    return total;
  }

  get currentMonth(): string {
    return this.today.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  get weekRange(): string {
    const now = new Date();
    const firstDay = new Date(now);
    firstDay.setDate(now.getDate() - now.getDay());
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    return `${firstDay.toLocaleDateString()} - ${lastDay.toLocaleDateString()}`;
  }
}