import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  templateUrl: './admin-notifications.html',
  styleUrl: './admin-notifications.css'
})
export class AdminNotifications implements OnInit, OnDestroy {

  private apiUrl = 'http://localhost:3000/api';
  private routerSub!: Subscription;
  private refreshInterval: any;

  requests: any[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadRequests();

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadRequests();
    });

    this.refreshInterval = setInterval(() => {
      this.loadRequests();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.routerSub) this.routerSub.unsubscribe();
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadRequests() {
    this.http.get<any[]>(`${this.apiUrl}/approvals/pending`).subscribe({
      next: (data) => {
        this.requests = data.map(r => ({
          ...r,
          selected: false,
          requestedData: typeof r.requestedData === 'string' ? JSON.parse(r.requestedData) : r.requestedData,
          originalData: typeof r.originalData === 'string' ? JSON.parse(r.originalData) : r.originalData,
          data: typeof r.requestedData === 'string' ? JSON.parse(r.requestedData) : r.requestedData,
          date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }) : 'Unknown date'
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading approvals:', err)
    });
  }

  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    this.requests.forEach(r => r.selected = checked);
    this.cdr.detectChanges();
  }

  isAllSelected(): boolean {
    return this.requests.length > 0 && this.requests.every(r => r.selected);
  }

  approveSelected() {
    const selected = this.requests.filter(r => r.selected);
    if (selected.length === 0) { alert('Select a request first.'); return; }

    const approvals = selected.map(r =>
      this.http.put(`${this.apiUrl}/approvals/${r.id}`, { status: 'approved' }).toPromise()
    );

    Promise.all(approvals).then(() => {
      this.saveTreasurerNotification('approved', selected);
      alert('Selected requests approved.');
      this.loadRequests();
    }).catch(() => alert('Error approving requests'));
  }

  declineSelected() {
    const selected = this.requests.filter(r => r.selected);
    if (selected.length === 0) { alert('Select a request first.'); return; }

    const rejections = selected.map(r =>
      this.http.put(`${this.apiUrl}/approvals/${r.id}`, { status: 'rejected' }).toPromise()
    );

    Promise.all(rejections).then(() => {
      this.saveTreasurerNotification('rejected', selected);
      alert('Selected requests declined.');
      this.loadRequests();
    }).catch(() => alert('Error declining requests'));
  }

  saveTreasurerNotification(status: 'approved' | 'rejected', selected: any[]) {
    selected.forEach(r => {
      const message = status === 'approved'
        ? `✅ Admin APPROVED your edit request for student ${r.studentName} (${r.studentId})`
        : `❌ Admin REJECTED your edit request for student ${r.studentName} (${r.studentId})`;

      this.http.post(`${this.apiUrl}/notifications`, {
        recipientRole: 'treasurer',
        message: message
      }).subscribe({
        error: (err) => console.error('Failed to save notification:', err)
      });
    });
  }

  archiveSelected() {
    const selected = this.requests.filter(r => r.selected);
    if (selected.length === 0) { alert('Select a request first.'); return; }
    this.requests = this.requests.filter(r => !r.selected);
    this.cdr.detectChanges();
    alert('Selected requests archived.');
  }

  deleteSelected() {
    const selected = this.requests.filter(r => r.selected);
    if (selected.length === 0) { alert('Select a request first.'); return; }
    if (!confirm('Delete selected requests permanently?')) return;
    this.requests = this.requests.filter(r => !r.selected);
    this.cdr.detectChanges();
    alert('Selected requests deleted.');
  }

  get totalRequests() { return this.requests.length; }
  get unreadCount() { return this.requests.length; }
}