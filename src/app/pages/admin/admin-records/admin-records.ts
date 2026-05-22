import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { AdminNavbarComponent } from '../admin-navbar/admin-navbar';

@Component({
  selector: 'app-admin-records',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminNavbarComponent
  ],
  templateUrl: './admin-records.html',
  styleUrl: './admin-records.css'
})

export class AdminRecords implements OnInit {

  private apiUrl = 'http://localhost:3000/api';

  searchId = '';

  records: any[] = [];

  displayedRecords: any[] = [];

  selectedStudent: any = null;

  // ✅ Earnings Summary Properties
  dailyEarnings = 0;
  weeklyEarnings = 0;
  monthlyEarnings = 0;
  allTimeEarnings = 0; // ✅ NEW: Total of ALL transactions (no double-counting)
  today = new Date();
  currentWeekRange = '';
  currentMonth = '';

  // ✅ Filter Property
  selectedPeriod: 'all' | 'daily' | 'weekly' | 'monthly' = 'all';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadRecords();
    this.calculateEarnings();
  }

  loadRecords() {
    this.http
      .get<any[]>(`${this.apiUrl}/students`)
      .subscribe({
        next: (data) => {
          console.log('API DATA:', data);
          this.records = this.sortRecords(data || []);
          this.displayedRecords = [...this.records];
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('ERROR LOADING RECORDS:', err);
        }
      });
  }

  // ✅ Sort Records by Student ID
  sortRecords(data: any[]) {
    return data.sort((a, b) => {
      const idA = a.studentId ? a.studentId.toString() : '';
      const idB = b.studentId ? b.studentId.toString() : '';
      return idA.localeCompare(idB, undefined, { numeric: true });
    });
  }

  // ✅ Calculate Daily/Weekly/Monthly/All-Time Earnings
  calculateEarnings() {
    this.http.get<any[]>(`${this.apiUrl}/transactions`).subscribe({
      next: (transactions) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfWeek = this.getStartOfWeek(new Date());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // ✅ All-Time Earnings (total of ALL transactions - no double counting!)
        this.allTimeEarnings = transactions
          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        // Daily Earnings
        this.dailyEarnings = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0);
            return tDate.getTime() === today.getTime();
          })
          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        // Weekly Earnings
        this.weeklyEarnings = transactions
          .filter(t => new Date(t.date) >= startOfWeek)
          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        // Monthly Earnings
        this.monthlyEarnings = transactions
          .filter(t => new Date(t.date) >= startOfMonth)
          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        // Format week range
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        this.currentWeekRange = `${this.formatDate(startOfWeek)} - ${this.formatDate(endOfWeek)}`;
        this.currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error calculating earnings:', err)
    });
  }

  // ✅ Helper: Get all-time earnings (for the "All Records" card)
  getAllTimeEarnings(): number {
    return this.allTimeEarnings;
  }

  // ✅ NEW: Filter records by selected period
  filterByPeriod(period: 'all' | 'daily' | 'weekly' | 'monthly') {
    this.selectedPeriod = period;

    if (period === 'all') {
      this.displayedRecords = [...this.records];
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let startDate = new Date();

      if (period === 'daily') {
        startDate = today;
      } else if (period === 'weekly') {
        startDate = this.getStartOfWeek(new Date());
      } else if (period === 'monthly') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      }

      // Filter students who have transactions within the selected period
      this.displayedRecords = this.records.filter(student => {
        return (student.transactions || []).some((t: any) => {
          const tDate = new Date(t.date);
          tDate.setHours(0, 0, 0, 0);

          if (period === 'daily') {
            return tDate.getTime() === today.getTime();
          } else {
            return tDate >= startDate && tDate <= today;
          }
        });
      });
    }

    this.cdr.detectChanges();
  }

  getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  searchStudent() {
    const key = this.searchId.trim().toLowerCase();

    if (!key) {
      this.displayedRecords = [...this.records];
      return;
    }

    this.displayedRecords = this.records.filter((r: any) =>
      String(r.studentId).toLowerCase().includes(key)
    );
  }

  viewStudent(student: any) {
    this.selectedStudent = student;
  }

  closeView() {
    this.selectedStudent = null;
  }

  deleteStudent(studentId: string) {
    const confirmDelete = confirm('Are you sure you want to delete this student record?');

    if (!confirmDelete) return;

    // Look up the server-returned student object to get the Firestore document ID
    const student = this.records.find(r => r.studentId === studentId);
    if (!student || !student.id) {
      alert("Could not find the record's document ID. Please reload the page.");
      return;
    }

    this.http
      .delete<any>(`${this.apiUrl}/students/${student.id}`)
      .subscribe({
        next: () => {
          alert('Student record deleted successfully!');
          this.selectedStudent = null;
          this.loadRecords();
          this.calculateEarnings();
          this.filterByPeriod(this.selectedPeriod); // Re-apply filter after delete
        },
        error: (err) => {
          console.error(err);
          alert(err.error?.error || 'Failed to delete student!');
        }
      });
  }

  // ✅ Clear History (Deletes all transactions for a student)
  clearHistory(studentId: string) {
    const confirmClear = confirm("Are you sure you want to clear this student's payment history?");
    if (!confirmClear) return;

    const student = this.records.find(r => r.studentId === studentId);
    if (!student || !student.transactions || student.transactions.length === 0) {
      alert("This student has no payment history to clear.");
      return;
    }

    let deletedCount = 0;
    const total = student.transactions.length;

    student.transactions.forEach((t: any) => {
      if (t.id) {
        this.http.delete<any>(`${this.apiUrl}/transactions/${t.id}`).subscribe({
          next: () => {
            deletedCount++;
            if (deletedCount === total) {
              alert('Payment history cleared successfully!');
              this.loadRecords();
              this.calculateEarnings();
              this.filterByPeriod(this.selectedPeriod);
            }
          },
          error: (err) => console.error('Failed to delete transaction:', err)
        });
      }
    });
  }

  getTotalPaid(student: any): number {
    if (!student.transactions || student.transactions.length === 0) return 0;

    return student.transactions.reduce((total: number, t: any) => {
      return total + (Number(t.amount) || 0);
    }, 0);
  }

  getTotalBalance(student: any): number {
    const feeMap: any = {
      "organization fee": 100,
      "usg fee": 500,
      "miscellaneous fee": 1000,
      "tuition fee": 5000
    };

    const paidAmounts: { [key: string]: number } = {};

    (student.transactions || []).forEach((t: any) => {
      const feeKey = (t.fee || '').toString().toLowerCase().trim();
      if (feeKey && !paidAmounts[feeKey]) {
        paidAmounts[feeKey] = 0;
      }
      if (feeKey) {
        paidAmounts[feeKey] += Number(t.amount) || 0;
      }
    });

    let totalBalance = 0;

    Object.keys(paidAmounts).forEach(feeKey => {
      const totalFeeAmount = feeMap[feeKey] || 0;
      const paidForThisFee = paidAmounts[feeKey] || 0;
      const remaining = Math.max(0, totalFeeAmount - paidForThisFee);
      totalBalance += remaining;
    });

    return totalBalance;
  }
}