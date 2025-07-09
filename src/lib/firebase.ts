
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

// Local Firebase configuration for development
const localFirebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
};

// Production Firebase configuration
const productionFirebaseConfig = {
  apiKey: "AIzaSyCoKtOAobG9m9_Obvn-iKyHxOu2D3pdAqU",
  authDomain: "invoiceapp-71dc1.firebaseapp.com",
  projectId: "invoiceapp-71dc1",
  storageBucket: "invoiceapp-71dc1.firebasestorage.app",
  messagingSenderId: "138380180266",
  appId: "1:138380180266:web:77e93ddef3062203513c53",
  measurementId: "G-0RWWX0L8JZ"
};

// Use local config in development, production config otherwise
const firebaseConfig = isDevelopment ? localFirebaseConfig : productionFirebaseConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Connect to emulators in development only if not on Lovable platform
if (isDevelopment && !window.location.hostname.includes('lovable')) {
  try {
    // Connect to Auth emulator
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    console.log('Connected to Auth emulator');
  } catch (error) {
    console.log('Auth emulator not available, using production Firebase');
  }

  try {
    // Connect to Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Connected to Firestore emulator');
  } catch (error) {
    console.log('Firestore emulator not available, using production Firebase');
  }
}

export default app;
