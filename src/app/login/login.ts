import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {
  constructor(private router: Router, private http: HttpClient) {}

  showLoginSection = true;
  showLoginPassword = false;
  showRegisterPassword = false;
  popupMessage = '';
  loginUsername = '';
  loginPassword = '';
  regFirstName = '';
  regLastName = '';
  regEmail = '';
  regContact = '';
  regBirthDate = '';
  regAge: number | null = null;
  regGender = '';
  regUsername = '';
  regPassword = '';
  regRole = 'admin';
  selectedProvince = '';
  selectedMunicipality = '';
  selectedBarangay = '';
  selectedProvinceName = '';
  selectedMunicipalityName = '';
  provinces: any[] = [];
  municipalities: any[] = [];
  barangays: any[] = [];

  ngOnInit(): void { this.loadProvinces(); }

  loadProvinces() {
    this.http.get<any>('https://psgc.gitlab.io/api/provinces/').subscribe((data) => {
      this.provinces = data.filter((p: any) => p.name === 'Misamis Oriental');
    });
  }

  onProvinceChange() {
    const province = this.provinces.find(p => p.code === this.selectedProvince);
    this.selectedProvinceName = province?.name || '';
    this.selectedMunicipality = '';
    this.selectedBarangay = '';
    this.municipalities = [];
    this.barangays = [];
    this.http.get<any>(`https://psgc.gitlab.io/api/provinces/${this.selectedProvince}/cities-municipalities/`).subscribe((data) => {
      const allowed = ['Cagayan de Oro City', 'Tagoloan', 'Villanueva'];
      this.municipalities = data.filter((m: any) => allowed.includes(m.name));
    });
  }

  onMunicipalityChange() {
    const municipality = this.municipalities.find(m => m.code === this.selectedMunicipality);
    this.selectedMunicipalityName = municipality?.name || '';
    this.selectedBarangay = '';
    this.barangays = [];
    this.http.get<any>(`https://psgc.gitlab.io/api/cities-municipalities/${this.selectedMunicipality}/barangays/`).subscribe((data) => {
      this.barangays = data;
    });
  }

  toggleLoginPassword() { this.showLoginPassword = !this.showLoginPassword; }
  toggleRegisterPassword() { this.showRegisterPassword = !this.showRegisterPassword; }
  showPopup(message: string) { this.popupMessage = message; }
  closePopup() { this.popupMessage = ''; }
  showRegister() { this.showLoginSection = false; }
  showLogin() { this.showLoginSection = true; }

  computeAge() {
    if (!this.regBirthDate) { this.regAge = null; return; }
    const today = new Date();
    const birthDate = new Date(this.regBirthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    this.regAge = age;
  }

  register() {
    if (!this.regFirstName || !this.regLastName || !this.regEmail || !this.regContact ||
      !this.selectedProvince || !this.selectedMunicipality || !this.selectedBarangay ||
      !this.regBirthDate || !this.regGender || !this.regUsername || !this.regPassword) {
      this.showPopup('All fields are required!'); return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.regEmail)) { this.showPopup('Invalid email address!'); return; }
    const phonePattern = /^09\d{9}$/;
    if (!phonePattern.test(this.regContact)) { this.showPopup('Contact number must follow PH format (09XXXXXXXXX)'); return; }
    if ((this.regAge ?? 0) <= 15) { this.showPopup('User must be 16 years old and above.'); return; }
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordPattern.test(this.regPassword)) { this.showPopup('Password must contain uppercase letter and number.'); return; }

    const userData = {
      first_name: this.regFirstName, last_name: this.regLastName, email: this.regEmail,
      contact: this.regContact,
      address: this.selectedBarangay + ', ' + this.selectedMunicipalityName + ', ' + this.selectedProvinceName,
      dob: this.regBirthDate, age: this.regAge, gender: this.regGender,
      username: this.regUsername, password: this.regPassword, role: this.regRole
    };
    this.http.post<any>('http://localhost:3000/api/register', userData).subscribe({
      next: () => this.showPopup('Registration Successful!'),
      error: (err) => this.showPopup(err.error?.error || 'Registration failed!')
    });
  }

  login() {
    this.http.post<any>('http://localhost:3000/api/login', {
      username: this.loginUsername, password: this.loginPassword
    }).subscribe({
      next: (res) => {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        if (res.user.role === 'admin') this.router.navigate(['/admin-dashboard']);
        else this.router.navigate(['/treasurer-home']);
      },
      error: (err) => this.showPopup(err.error?.error || 'Invalid username or password!')
    });
  }
}