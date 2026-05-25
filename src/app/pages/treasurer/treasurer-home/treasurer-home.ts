import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Navbar } from '../treasurer-navbar/treasurer-navbar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './treasurer-home.html',
  styleUrl: './treasurer-home.css',
})
export class Home implements OnInit, OnDestroy {

  private apiUrl = 'http://localhost:3000/api';
  private routerSub!: Subscription;

  records: any[] = [];
  notifications: any[] = [];
  refreshInterval: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadNotifications();

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadData();
      this.loadNotifications();
    });

    this.refreshInterval = setInterval(() => {
      this.loadNotifications();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.routerSub) this.routerSub.unsubscribe();
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadData() {
    this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
      next: (data) => {
        this.records = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error:', err)
    });
  }

  loadNotifications() {
    this.http.get<any[]>(`${this.apiUrl}/notifications?role=treasurer`).subscribe({
      next: (data) => {
        const uniqueData = data.filter((v, i, a) => a.findIndex(t => (t.message === v.message && t.created_at === v.created_at)) === i);
        this.notifications = uniqueData.map(n => ({
          ...n,
          date: n.created_at ? new Date(n.created_at).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }) : 'Unknown date'
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching notifications:', err)
    });
  }

  markAsRead(notification: any) {
    notification.isRead = true;
    this.http.put(`${this.apiUrl}/notifications/${notification.id}`, { isRead: true }).subscribe();
    this.cdr.detectChanges();
  }

  markAsUnread(notification: any) {
    notification.isRead = false;
    this.http.put(`${this.apiUrl}/notifications/${notification.id}`, { isRead: false }).subscribe();
    this.cdr.detectChanges();
  }

  deleteNotification(id: string) {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    this.http.delete(`${this.apiUrl}/notifications/${id}`).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to delete notification:', err)
    });
  }

  get totalCash(): number {
    let total = 0;
    this.records.forEach(student => {
      (student.transactions || []).forEach((t: any) => {
        if (t.method === 'Cash') total += Number(t.amount || 0);
      });
    });
    return total;
  }

  get totalGCash(): number {
    let total = 0;
    this.records.forEach(student => {
      (student.transactions || []).forEach((t: any) => {
        if (t.method === 'GCash') total += Number(t.amount || 0);
      });
    });
    return total;
  }

  get totalPayment(): number {
    let total = 0;
    this.records.forEach(student => {
      (student.transactions || []).forEach((t: any) => {
        total += Number(t.amount || 0);
      });
    });
    return total;
  }
}