import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyDnzolp8DqbHWU8pzXZ21JPWsOo46q6mew',
  authDomain:        'school-fees-system-e5b83.firebaseapp.com',
  projectId:         'school-fees-system-e5b83',
  storageBucket:     'school-fees-system-e5b83.firebasestorage.app',
  messagingSenderId: '889260058036',
  appId:             '1:889260058036:web:1b4d56de9299814b3a3ee1',
  measurementId:     'G-EZSXJMBZ7G'
};

const app: FirebaseApp = initializeApp(firebaseConfig);

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  readonly auth: Auth           = getAuth(app);
  readonly firestore: Firestore = getFirestore(app);

  constructor() {}
}