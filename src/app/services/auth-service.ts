import { Injectable, inject } from '@angular/core';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { FirebaseService } from './firebase-service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private firebase = inject(FirebaseService);

  constructor() {}

  // ── LOGIN ─────────────────────────────────────────────────
  async login(email: string, password: string): Promise<any> {
    const userCredential = await signInWithEmailAndPassword(
      this.firebase.auth,
      email,
      password
    );
    const uid = userCredential.user.uid;

    const userDoc = await getDoc(doc(this.firebase.firestore, 'users', uid));
    if (!userDoc.exists()) {
      throw { code: 'auth/user-not-found', message: 'User profile not found.' };
    }

    const userData = { uid, ...userDoc.data() };
    localStorage.setItem('currentUser', JSON.stringify(userData));
    return userData;
  }

  // ── REGISTER ──────────────────────────────────────────────
  async register(profileData: any, password: string): Promise<any> {
    const userCredential = await createUserWithEmailAndPassword(
      this.firebase.auth,
      profileData.email,
      password
    );
    const uid = userCredential.user.uid;

    await setDoc(doc(this.firebase.firestore, 'users', uid), {
      uid,
      firstName:    profileData.firstName    ?? '',
      lastName:     profileData.lastName     ?? '',
      email:        profileData.email        ?? '',
      contact:      profileData.contact      ?? '',
      username:     profileData.username     ?? '',
      province:     profileData.province     ?? '',
      municipality: profileData.municipality ?? '',
      barangay:     profileData.barangay     ?? '',
      birthDate:    profileData.birthDate    ?? '',
      age:          profileData.age          ?? null,
      gender:       profileData.gender       ?? '',
      role:         profileData.role         ?? 'admin',
      status:       profileData.status       ?? 'active',
      createdAt:    new Date().toISOString()
    });

    return userCredential.user;
  }

  // ── LOGOUT ────────────────────────────────────────────────
  async logout(): Promise<void> {
    await signOut(this.firebase.auth);
    localStorage.removeItem('currentUser');
  }

  // ── GET CURRENT USER ──────────────────────────────────────
  getCurrentUser(): any {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }
}