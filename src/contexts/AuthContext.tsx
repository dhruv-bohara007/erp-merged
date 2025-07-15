
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
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
  loginWithTemporaryPassword: (email: string, tempPassword: string) => Promise<{ needsPasswordReset: boolean }>;
  register: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
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
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      return {
        ...user,
        role: userData?.role || 'company_admin',
        companyId: userData?.companyId,
        hasCompletedSetup: userData?.hasCompletedSetup || false,
        needsPasswordReset: userData?.needsPasswordReset || false
      };
    } catch (error) {
      console.log('Error fetching user data:', error);
      // Return user with default values if Firestore fails
      return {
        ...user,
        role: 'company_admin' as UserRole,
        hasCompletedSetup: false,
        needsPasswordReset: false
      };
    }
  };

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const authUser = await fetchUserData(userCredential.user);
    setCurrentUser(authUser);
  };

  const loginWithTemporaryPassword = async (email: string, tempPassword: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, tempPassword);
    const authUser = await fetchUserData(userCredential.user);
    setCurrentUser(authUser);
    
    return { needsPasswordReset: authUser.needsPasswordReset || false };
  };

  const updateUserPassword = async (newPassword: string) => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    // Update password in Firebase Auth
    await updatePassword(auth.currentUser, newPassword);

    // Update user document in Firestore
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      needsPasswordReset: false,
      temporaryPassword: deleteField(),
      updatedAt: new Date().toISOString()
    });

    // Refresh user data
    await refreshUser();
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
      hasCompletedSetup: false
    };
    
    setCurrentUser(authUser);
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
    loginWithTemporaryPassword,
    register,
    logout,
    refreshUser,
    updateUserPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
