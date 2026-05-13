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

  // ── UI STATE ─────────────────────────────────────────────────
  showLoginSection = true;
  showLoginPassword = false;
  showRegisterPassword = false;

  // ── POPUP ────────────────────────────────────────────────────
  popupMessage = '';
  isSuccessPopup = false; // true = green success, false = warning/error

  // ── VALIDATION TRIGGER ───────────────────────────────────────
  submitted = false; // becomes true when Register is clicked

  // ── LOGIN FIELDS ─────────────────────────────────────────────
  loginUsername = '';
  loginPassword = '';

  // ── REGISTER FIELDS ──────────────────────────────────────────
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

  // ── ADDRESS ──────────────────────────────────────────────────
  selectedProvince = '';
  selectedMunicipality = '';
  selectedBarangay = '';
  selectedProvinceName = '';
  selectedMunicipalityName = '';
  provinces: any[] = [];
  municipalities: any[] = [];
  barangays: any[] = [];

  // ─────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadProvinces();
  }

  // ─────────────────────────────────────────────────────────────
  // ADDRESS LOADERS
  // ─────────────────────────────────────────────────────────────
  loadProvinces() {
    this.http.get<any[]>('https://psgc.gitlab.io/api/provinces/').subscribe((data) => {
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

    if (!this.selectedProvince) return;

    this.http
      .get<any[]>(`https://psgc.gitlab.io/api/provinces/${this.selectedProvince}/cities-municipalities/`)
      .subscribe((data) => {
        const allowed = ['Cagayan de Oro City', 'Tagoloan', 'Villanueva'];
        this.municipalities = data.filter((m: any) => allowed.includes(m.name));
      });
  }

  onMunicipalityChange() {
    const municipality = this.municipalities.find(m => m.code === this.selectedMunicipality);
    this.selectedMunicipalityName = municipality?.name || '';
    this.selectedBarangay = '';
    this.barangays = [];

    if (!this.selectedMunicipality) return;

    this.http
      .get<any[]>(`https://psgc.gitlab.io/api/cities-municipalities/${this.selectedMunicipality}/barangays/`)
      .subscribe((data) => {
        // Sort alphabetically for easier selection
        this.barangays = data.sort((a: any, b: any) => a.name.localeCompare(b.name));
      });
  }

  // ─────────────────────────────────────────────────────────────
  // INLINE VALIDATORS
  // ─────────────────────────────────────────────────────────────
  isEmailValid(): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(this.regEmail);
  }

  isContactValid(): boolean {
    // Philippine mobile: 09 + 9 digits = 11 chars total
    const pattern = /^09\d{9}$/;
    return pattern.test(this.regContact);
  }

  isPasswordValid(): boolean {
    // At least 6 chars, 1 uppercase, 1 digit
    const pattern = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    return pattern.test(this.regPassword);
  }

  isFormValid(): boolean {
    return !!(
      this.regFirstName &&
      this.regLastName &&
      this.regEmail && this.isEmailValid() &&
      this.regContact && this.isContactValid() &&
      this.selectedProvince &&
      this.selectedMunicipality &&
      this.selectedBarangay &&
      this.regBirthDate &&
      this.regAge !== null && this.regAge > 15 &&
      this.regGender &&
      this.regUsername &&
      this.regPassword && this.isPasswordValid()
    );
  }

  // ─────────────────────────────────────────────────────────────
  // TOGGLE HELPERS
  // ─────────────────────────────────────────────────────────────
  toggleLoginPassword() { this.showLoginPassword = !this.showLoginPassword; }
  toggleRegisterPassword() { this.showRegisterPassword = !this.showRegisterPassword; }

  // ─────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────
  showRegister() {
    this.submitted = false;
    this.showLoginSection = false;
  }

  showLogin() {
    this.submitted = false;
    this.showLoginSection = true;
  }

  // ─────────────────────────────────────────────────────────────
  // POPUP
  // ─────────────────────────────────────────────────────────────
  showPopup(message: string, success = false) {
    this.popupMessage = message;
    this.isSuccessPopup = success;
  }

  closePopup() {
    const wasSuccess = this.isSuccessPopup;
    this.popupMessage = '';
    this.isSuccessPopup = false;

    // After successful registration → redirect to Login
    if (wasSuccess) {
      this.showLogin();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // AGE CALCULATOR
  // ─────────────────────────────────────────────────────────────
  computeAge() {
    if (!this.regBirthDate) { this.regAge = null; return; }
    const today = new Date();
    const birthDate = new Date(this.regBirthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    this.regAge = age;
  }

  // ─────────────────────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────────────────────
  register() {
    // Mark as submitted so all red labels appear
    this.submitted = true;

    // Stop here if form is invalid — red labels are already visible
    if (!this.isFormValid()) return;

    const userData = {
      first_name: this.regFirstName,
      last_name: this.regLastName,
      email: this.regEmail,
      contact: this.regContact,
      address:
        this.selectedBarangay + ', ' +
        this.selectedMunicipalityName + ', ' +
        this.selectedProvinceName,
      dob: this.regBirthDate,
      age: this.regAge,
      gender: this.regGender,
      username: this.regUsername,
      password: this.regPassword,
      role: this.regRole,
    };

    this.http.post<any>('http://localhost:3000/api/register', userData).subscribe({
      next: () => {
        this.showPopup('Registration Successful! You can now log in.', true);
        this.resetRegisterForm();
      },
      error: (err) => {
        this.showPopup(err.error?.error || 'Registration failed. Please try again.');
      },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // RESET REGISTER FORM
  // ─────────────────────────────────────────────────────────────
  resetRegisterForm() {
    this.submitted = false;
    this.regFirstName = '';
    this.regLastName = '';
    this.regEmail = '';
    this.regContact = '';
    this.regBirthDate = '';
    this.regAge = null;
    this.regGender = '';
    this.regUsername = '';
    this.regPassword = '';
    this.regRole = 'admin';
    this.selectedProvince = '';
    this.selectedMunicipality = '';
    this.selectedBarangay = '';
    this.selectedProvinceName = '';
    this.selectedMunicipalityName = '';
    this.municipalities = [];
    this.barangays = [];
  }

  // ─────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────
  login() {
    if (!this.loginUsername || !this.loginPassword) {
      this.showPopup('Please enter your username and password.');
      return;
    }

    this.http
      .post<any>('http://localhost:3000/api/login', {
        username: this.loginUsername,
        password: this.loginPassword,
      })
      .subscribe({
        next: (res) => {
          localStorage.setItem('currentUser', JSON.stringify(res.user));
          if (res.user.role === 'admin') this.router.navigate(['/admin-dashboard']);
          else this.router.navigate(['/treasurer-home']);
        },
        error: (err) => {
          this.showPopup(err.error?.error || 'Invalid username or password!');
        },
      });
  }
}