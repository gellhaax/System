import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../treasurer-navbar/treasurer-navbar';

@Component({
  selector: 'app-treasurer-contact',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './treasurer-contact.html',
  styleUrls: ['./treasurer-contact.css']
})
export class TreasurerContactComponent {}