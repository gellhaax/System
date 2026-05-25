import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './treasurer-navbar.html',
  styleUrls: ['./treasurer-navbar.css']
})
export class Navbar implements OnInit {

  profileImage: string | null = null;
  notifications: any[] = [];
  unreadCount = 0;
  showDropdown = false;
  showAllNotifs = false;
  private apiUrl = 'http://localhost:3000/api';
  private refreshInterval: any;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadProfileImage();
    this.loadNotifications();
    this.refreshInterval = setInterval(() => this.loadNotifications(), 5000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadNotifications() {
    this.http.get<any[]>(`${this.apiUrl}/notifications?role=treasurer`).subscribe({
      next: (data) => {
        this.notifications = data.map(n => ({
          ...n,
          date: n.created_at ? new Date(n.created_at).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }) : 'Unknown date',
          timeAgo: this.getTimeAgo(n.created_at)
        }));
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching notifications:', err)
    });
  }

  getTimeAgo(dateStr: string): string {
    if (!dateStr) return 'Unknown date';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffInSeconds < 172800) return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
    if (!this.showDropdown) {
      this.showAllNotifs = false;
    }
    this.cdr.detectChanges();
  }

  showPreviousNotifications(event: Event) {
    event.stopPropagation();
    this.showAllNotifs = true;
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event) {
    if (this.showDropdown) {
      this.showDropdown = false;
      this.showAllNotifs = false;
      this.cdr.detectChanges();
    }
  }

  markAllAsRead(event: Event) {
    event.stopPropagation();
    const unread = this.notifications.filter(n => !n.isRead);
    unread.forEach(n => {
      n.isRead = true;
      this.http.put(`${this.apiUrl}/notifications/${n.id}`, { isRead: true }).subscribe();
    });
    this.unreadCount = 0;
    this.cdr.detectChanges();
  }

  loadProfileImage() {
    this.profileImage = localStorage.getItem('profileImage');
  }

  // auto-update if changed in another page/tab
  @HostListener('window:storage')
  onStorageChange() {
    this.loadProfileImage();
  }
}