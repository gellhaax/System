import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './treasurer-navbar.html',
  styleUrls: ['./treasurer-navbar.css']
})
export class Navbar implements OnInit {

  profileImage: string | null = null;

  ngOnInit(): void {
    this.loadProfileImage();
  }

  loadProfileImage() {
    this.profileImage = localStorage.getItem('profileImage');
  }

  // 👇 this makes it auto-update if changed in another page/tab
  @HostListener('window:storage')
  onStorageChange() {
    this.loadProfileImage();
  }
}