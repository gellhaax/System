import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-reports.html',
  styleUrls: ['./admin-reports.css']
})
export class AdminReports implements OnInit {
  private apiUrl = 'http://localhost:3000/api';
  
  selectedPeriod: 'daily' | 'weekly' | 'monthly' = 'monthly';
  transactions: any[] = [];
  totalAmount = 0;
  isLoading = false;
  dateRangeLabel = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.updateDateLabel();
  }

  setPeriod(period: 'daily' | 'weekly' | 'monthly') {
    this.selectedPeriod = period;
    this.updateDateLabel();
    this.transactions = []; // Clear previous data
  }

  updateDateLabel() {
    const today = new Date();
    if (this.selectedPeriod === 'daily') {
      this.dateRangeLabel = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (this.selectedPeriod === 'weekly') {
      const start = this.getStartOfWeek(today);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      this.dateRangeLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      this.dateRangeLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  }

  getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  fetchData() {
    this.isLoading = true;
    const today = new Date();
    let startDate = new Date();

    if (this.selectedPeriod === 'daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (this.selectedPeriod === 'weekly') {
      startDate = this.getStartOfWeek(today);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    this.http.get<any[]>(`${this.apiUrl}/transactions`).subscribe({
      next: (data) => {
        this.transactions = data.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= startDate && tDate <= today;
        });
        this.totalAmount = this.transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }

  downloadPDF() {
    if (this.transactions.length === 0) return alert('No data to export!');

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Payment Report - ${this.selectedPeriod.charAt(0).toUpperCase() + this.selectedPeriod.slice(1)}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Period: ${this.dateRangeLabel}`, 14, 28);
    doc.text(`Total Collected: ₱${this.totalAmount.toFixed(2)}`, 14, 36);

    (doc as any).autoTable({
      startY: 44,
      head: [['Date', 'Student ID', 'Fee Category', 'Amount', 'Payment Method', 'Status']],
      body: this.transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.studentId,
        t.fee,
        `₱${parseFloat(t.amount).toFixed(2)}`,
        t.method,
        t.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`admin-report-${this.selectedPeriod}-${new Date().toISOString().split('T')[0]}.pdf`);
  }
}