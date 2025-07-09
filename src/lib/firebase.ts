
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

// Production Firebase configuration - we'll use this for both dev and prod
const firebaseConfig = {
  apiKey: "AIzaSyCoKtOAobG9m9_Obvn-iKyHxOu2D3pdAqU",
  authDomain: "invoiceapp-71dc1.firebaseapp.com",
  projectId: "invoiceapp-71dc1",
  storageBucket: "invoiceapp-71dc1.firebasestorage.app",
  messagingSenderId: "138380180266",
  appId: "1:138380180266:web:77e93ddef3062203513c53",
  measurementId: "G-0RWWX0L8JZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Storage
export const storage = getStorage(app);

// Note: Emulators are disabled to avoid connection issues
// If you want to use emulators, make sure they're running on ports 9099 (Auth) and 8080 (Firestore)
console.log('Using production Firebase configuration');

export default app;
