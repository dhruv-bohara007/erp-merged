
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

export default app;
