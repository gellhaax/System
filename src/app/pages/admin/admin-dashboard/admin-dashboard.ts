import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  RouterModule,
  Router,
  NavigationEnd
} from '@angular/router';

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

  isLoading = true;

  showCourseBalances = false;

  feeMap: any = {
    'organization fee': 100,
    'usg fee': 500,
    'miscellaneous fee': 1000,
    'tuition fee': 5000
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  ngOnInit(): void {

    const user = localStorage.getItem('currentUser');

    if (user && user !== 'undefined') {
      this.currentUser = JSON.parse(user);
    }

    // LOAD IMMEDIATELY
    this.loadRecords();

    // AUTO REFRESH
    this.refreshInterval = setInterval(() => {

      this.zone.run(() => {
        this.loadRecords();
      });

    }, 3000);

    // REFRESH WHEN NAVIGATING
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {

        this.loadRecords();

      });
  }

  ngOnDestroy(): void {

    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadRecords(): void {

    this.isLoading = true;

    this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({

      next: (data) => {

        console.log('ADMIN RECORDS:', data);

        this.records = data ? [...data] : [];

        this.isLoading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error('LOAD ERROR:', err);

        this.records = [];

        this.isLoading = false;

        this.cdr.detectChanges();
      }
    });
  }

  // CASE INSENSITIVE FEE LOOKUP
  getFeeAmount(feeName: string): number {

    if (!feeName) return 0;

    const key = Object.keys(this.feeMap).find(
      k => k.toLowerCase() === feeName.toLowerCase().trim()
    );

    return key ? this.feeMap[key] : 0;
  }

  // ALREADY PAID FOR SPECIFIC FEE
  getAlreadyPaidForFee(student: any, feeName: string): number {

    if (!student.transactions) return 0;

    let paid = 0;

    student.transactions.forEach((t: any) => {

      if (
        t.fee &&
        t.fee.toLowerCase().trim() === feeName.toLowerCase().trim()
      ) {

        paid += Number(t.amount || 0);

      }
    });

    return paid;
  }

  // TOTAL ORIGINAL FEES
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

  // STUDENT BALANCE
  getStudentBalance(student: any): number {

    if (!student) return 0;

    const paidMap: any = {};

    (student.transactions || []).forEach((t: any) => {

      const fee = (t.fee || '').toLowerCase().trim();

      if (!paidMap[fee]) {
        paidMap[fee] = 0;
      }

      paidMap[fee] += Number(t.amount || 0);

    });

    let balance = 0;

    Object.keys(paidMap).forEach(fee => {

      const totalFee = this.feeMap[fee] || 0;

      const paid = paidMap[fee] || 0;

      balance += Math.max(0, totalFee - paid);

    });

    return balance;
  }

  // STUDENT STATUS
  getStudentStatus(student: any): string {

    if (!student.transactions || student.transactions.length === 0) {
      return 'No Payment';
    }

    const balance = this.getStudentBalance(student);

    if (balance === 0) {
      return 'Paid';
    }

    return 'Partial';
  }

  get paidStudents(): number {

    return this.records.filter(
      s => this.getStudentStatus(s) === 'Paid'
    ).length;
  }

  get partialStudents(): number {

    return this.records.filter(
      s => this.getStudentStatus(s) === 'Partial'
    ).length;
  }

  get totalStudents(): number {

    return this.records.length;
  }

  get totalCollected(): number {

    let total = 0;

    this.records.forEach(student => {

      (student.transactions || []).forEach((t: any) => {

        total += Number(t.amount || 0);

      });

    });

    return total;
  }

  get pendingBalance(): number {

    let total = 0;

    this.records.forEach(student => {

      total += this.getStudentBalance(student);

    });

    return total;
  }

  get collectionRate(): number {

    const total = this.totalCollected + this.pendingBalance;

    if (total === 0) return 0;

    return Math.round((this.totalCollected / total) * 100);
  }

  get courseBalances(): { course: string, balance: number }[] {

    const balances: any = {};

    this.records.forEach(student => {

      const course = (student.course || 'UNKNOWN').toUpperCase();

      if (!balances[course]) {
        balances[course] = 0;
      }

      balances[course] += this.getStudentBalance(student);

    });

    return Object.keys(balances).map(course => ({
      course,
      balance: balances[course]
    }));
  }

  get recentPayments(): any[] {

    const payments: any[] = [];

    this.records.forEach(student => {

      (student.transactions || []).forEach((t: any) => {

        payments.push({
          name: `${student.firstName} ${student.lastName}`,
          course: `${student.course} - ${student.year}`,
          amount: t.amount,
          status: this.getStudentStatus(student),
          date: t.date
        });

      });

    });

    return payments.reverse().slice(0, 5);
  }

  get weeklyTotal(): number {

    const now = new Date();

    const firstDay = new Date(now);

    firstDay.setDate(now.getDate() - now.getDay());

    const lastDay = new Date(firstDay);

    lastDay.setDate(firstDay.getDate() + 6);

    let total = 0;

    this.records.forEach(student => {

      (student.transactions || []).forEach((t: any) => {

        const d = new Date(t.date);

        if (d >= firstDay && d <= lastDay) {

          total += Number(t.amount || 0);

        }

      });

    });

    return total;
  }

  get monthlyTotal(): number {

    const now = new Date();

    let total = 0;

    this.records.forEach(student => {

      (student.transactions || []).forEach((t: any) => {

        const d = new Date(t.date);

        if (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        ) {

          total += Number(t.amount || 0);

        }

      });

    });

    return total;
  }

  get currentMonth(): string {

    return this.today.toLocaleString('default', {
      month: 'long',
      year: 'numeric'
    });
  }

  get weekRange(): string {

    const now = new Date();

    const firstDay = new Date(now);

    firstDay.setDate(now.getDate() - now.getDay());

    const lastDay = new Date(firstDay);

    lastDay.setDate(firstDay.getDate() + 6);

    return `${firstDay.toLocaleDateString()} - ${lastDay.toLocaleDateString()}`;
  }

  toggleCourseBalances(): void {
    this.showCourseBalances = !this.showCourseBalances;
    if (this.showCourseBalances) {
      this.cdr.detectChanges(); // Force refresh to grab latest values on open
    }
  }
}