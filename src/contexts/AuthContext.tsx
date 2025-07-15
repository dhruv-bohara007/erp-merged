
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export type UserRole = 'company_admin' | 'super_admin' | 'employee';

export interface AuthUser extends User {
  role?: UserRole;
  companyId?: string;
  hasCompletedSetup?: boolean;
  needsPasswordReset?: boolean;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateEmployeePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (user: User) => {
    try {
      // First check if user is in users collection (admin)
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          ...user,
          role: userData?.role || 'company_admin',
          companyId: userData?.companyId,
          hasCompletedSetup: userData?.hasCompletedSetup || false,
          needsPasswordReset: userData?.needsPasswordReset || false
        };
      }

      // If not in users, check employees collection
      const employeesRef = collection(db, 'employees');
      const q = query(employeesRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const employeeDoc = querySnapshot.docs[0];
        const employeeData = employeeDoc.data();
        return {
          ...user,
          role: 'employee' as UserRole,
          companyId: employeeData?.companyId,
          hasCompletedSetup: true,
          needsPasswordReset: employeeData?.needsPasswordReset || false
        };
      }

      // Default fallback for users not found in either collection
      return {
        ...user,
        role: 'company_admin' as UserRole,
        hasCompletedSetup: false,
        needsPasswordReset: false
      };
    } catch (error) {
      console.log('Error fetching user data:', error);
      return {
        ...user,
        role: 'company_admin' as UserRole,
        hasCompletedSetup: false,
        needsPasswordReset: false
      };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const authUser = await fetchUserData(userCredential.user);
      setCurrentUser(authUser);
    } catch (error: any) {
      // If login fails, check if it's an employee with temporary password
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        // Check if there's an employee with this email and a temporary password
        const employeesRef = collection(db, 'employees');
        const q = query(employeesRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const employeeDoc = querySnapshot.docs[0];
          const employeeData = employeeDoc.data();
          
          if (employeeData.temporaryPassword === password && employeeData.needsPasswordReset) {
            // Create Firebase Auth account for this employee with temporary password
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              
              // Update the employee document with the real Firebase Auth UID
              await updateDoc(employeeDoc.ref, {
                userId: userCredential.user.uid,
                updatedAt: new Date().toISOString()
              });
              
              // Create the user object for immediate login
              const authUser: AuthUser = {
                ...userCredential.user,
                role: 'employee' as UserRole,
                companyId: employeeData.companyId,
                hasCompletedSetup: true,
                needsPasswordReset: true
              };
              
              setCurrentUser(authUser);
              return; // Successfully logged in
            } catch (createError: any) {
              console.error('Error creating Firebase Auth account for employee:', createError);
              if (createError.code === 'auth/email-already-in-use') {
                // Account already exists, try to sign in again
                try {
                  const userCredential = await signInWithEmailAndPassword(auth, email, password);
                  const authUser = await fetchUserData(userCredential.user);
                  setCurrentUser(authUser);
                  return;
                } catch (retryError) {
                  throw new Error('Invalid email or password');
                }
              }
              throw new Error('Failed to create employee account');
            }
          }
        }
      }
      throw error;
    }
  };

  const register = async (email: string, password: string, role: UserRole = 'company_admin') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    try {
      // Store user role in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        role: role,
        hasCompletedSetup: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.log('Error storing user data:', error);
    }

    const authUser: AuthUser = {
      ...userCredential.user,
      role: role,
      hasCompletedSetup: false,
      needsPasswordReset: false
    };
    
    setCurrentUser(authUser);
  };

  const updateEmployeePassword = async (newPassword: string) => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    // Update Firebase Auth password
    await updatePassword(auth.currentUser, newPassword);

    // Update employee document in Firestore
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, where('userId', '==', auth.currentUser.uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const employeeDoc = querySnapshot.docs[0];
      await updateDoc(employeeDoc.ref, {
        needsPasswordReset: false,
        temporaryPassword: null,
        updatedAt: new Date().toISOString()
      });
    }

    // Refresh user data
    await refreshUser();
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      const authUser = await fetchUserData(auth.currentUser);
      setCurrentUser(authUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const authUser = await fetchUserData(user);
        setCurrentUser(authUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    register,
    logout,
    refreshUser,
    updateEmployeePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
