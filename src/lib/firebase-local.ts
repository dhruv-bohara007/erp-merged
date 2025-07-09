
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

// Connect to emulators in development
if (isDevelopment && !window.location.hostname.includes('lovable')) {
  try {
    // Only connect to emulators if not already connected
    if (!auth._delegate._config.emulator) {
      connectAuthEmulator(auth, "http://localhost:9099");
    }
    if (!db._delegate._databaseId.projectId.includes('emulator')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
  } catch (error) {
    console.log('Firebase emulators not available, using mock data');
  }
}

export default app;
