import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../treasurer-navbar/treasurer-navbar';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './treasurer-about.html',
  styleUrls: ['./treasurer-about.css']
})
export class About {
  openFB(link: string) { window.open(link, '_blank'); }
}