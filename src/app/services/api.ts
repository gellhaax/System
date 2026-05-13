import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { FirebaseService } from './firebase-service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private firebase = inject(FirebaseService);

  constructor() {}

  // ── STUDENTS ──────────────────────────────────────────────

  async getStudents(): Promise<any[]> {
    const snapshot = await getDocs(collection(this.firebase.firestore, 'students'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async getStudent(studentId: string): Promise<any> {
    // Try by document ID first
    const docRef = doc(this.firebase.firestore, 'students', studentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };

    // Fallback: search by studentId field
    const q = query(
      collection(this.firebase.firestore, 'students'),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const d = snapshot.docs[0];
      return { id: d.id, ...d.data() };
    }
    return null;
  }

  async addStudent(data: any): Promise<any> {
    const payload = {
      ...data,
      created_at: Timestamp.now()
    };
    const docRef = await addDoc(collection(this.firebase.firestore, 'students'), payload);
    return { id: docRef.id, ...payload };
  }

  async updateStudent(studentId: string, data: any): Promise<any> {
    // Find document by studentId field
    const q = query(
      collection(this.firebase.firestore, 'students'),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, data);
      return { id: snapshot.docs[0].id, ...data };
    }
    // Fallback: try as document ID
    const docRef = doc(this.firebase.firestore, 'students', studentId);
    await updateDoc(docRef, data);
    return { id: studentId, ...data };
  }

  async deleteStudent(studentId: string): Promise<void> {
    // Find document by studentId field
    const q = query(
      collection(this.firebase.firestore, 'students'),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      await deleteDoc(snapshot.docs[0].ref);
      return;
    }
    // Fallback: try as document ID
    await deleteDoc(doc(this.firebase.firestore, 'students', studentId));
  }

  // ── TRANSACTIONS ──────────────────────────────────────────

  async addTransaction(data: any): Promise<any> {
    const payload = {
      ...data,
      created_at: Timestamp.now()
    };
    const docRef = await addDoc(collection(this.firebase.firestore, 'transactions'), payload);
    return { id: docRef.id, ...payload };
  }

  async deleteTransaction(id: string): Promise<void> {
    await deleteDoc(doc(this.firebase.firestore, 'transactions', id));
  }

  // ── APPROVALS ─────────────────────────────────────────────

  async sendApproval(data: any): Promise<any> {
    const payload = {
      ...data,
      status:     'pending',
      created_at: Timestamp.now()
    };
    const docRef = await addDoc(collection(this.firebase.firestore, 'approvals'), payload);
    return { id: docRef.id, ...payload };
  }

  async getPendingApprovals(): Promise<any[]> {
    const q = query(
      collection(this.firebase.firestore, 'approvals'),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async respondToApproval(id: string, status: string): Promise<any> {
    const docRef = doc(this.firebase.firestore, 'approvals', id);
    await updateDoc(docRef, { status });
    return { id, status };
  }
}