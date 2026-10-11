import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { AccountStatus, UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (
    email: string,
    pass: string,
    fullName: string,
    role: 'student' | 'faculty' | 'maintenance',
    idNumber: string,
    department: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  isDemoMode: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Built-in Demo accounts for quick evaluation during viva/grading
export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  admin: {
    id: 'demo_admin_uid',
    email: 'admin@campusfix.edu',
    fullName: 'Dr. Suresh Venkatesh',
    role: 'admin',
    idNumber: 'ADM-8801',
    department: 'Campus Estate & Operations Directorate',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    phone: '+91 94440 12345'
  },
  maintenance: {
    id: 'demo_maint_uid',
    email: 'maintenance.lead@campusfix.edu',
    fullName: 'Vikram Joshi (Maintenance Lead)',
    role: 'maintenance',
    idNumber: 'MNT-4402',
    department: 'General Facilities & Water Works Division',
    status: 'active',
    createdAt: '2026-01-15T00:00:00Z',
    phone: '+91 98450 55678'
  },
  faculty: {
    id: 'demo_faculty_uid',
    email: 'shalini.faculty@campusfix.edu',
    fullName: 'Dr. Shalini Ramanathan',
    role: 'faculty',
    idNumber: 'FAC-1092',
    department: 'Department of Chemical Engineering',
    status: 'active',
    createdAt: '2026-02-01T00:00:00Z',
    phone: '+91 97890 22114'
  },
  student: {
    id: 'demo_student_uid',
    email: 'aarav.student@campusfix.edu',
    fullName: 'Aarav Nair',
    role: 'student',
    idNumber: 'STU-2023-CS-041',
    department: 'Computer Science & Engineering (Hostel B)',
    status: 'active',
    createdAt: '2026-03-01T00:00:00Z',
    phone: '+91 91234 56789'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Load user profile from Firestore or set up initial admin profile
  const fetchProfile = async (fbUser: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      const isBootstrappedAdminEmail = fbUser.email?.toLowerCase() === 'sanjithmeda123@gmail.com' || fbUser.email?.toLowerCase() === 'admin@campusfix.edu';

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        // Ensure bootstrapped admin is always admin
        if (isBootstrappedAdminEmail && data.role !== 'admin') {
          data.role = 'admin';
          data.status = 'active';
          await setDoc(userRef, data, { merge: true });
        }
        setUserProfile(data);
      } else {
        // Create initial profile for user
        const newProfile: UserProfile = {
          id: fbUser.uid,
          email: fbUser.email || '',
          fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Campus User',
          role: isBootstrappedAdminEmail ? 'admin' : 'student',
          idNumber: isBootstrappedAdminEmail ? 'ADM-001' : 'STU-NEW',
          department: isBootstrappedAdminEmail ? 'Estate Operations' : 'General Campus',
          status: 'active',
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      // Fallback local profile if offline or initializing
      if (fbUser.email) {
        setUserProfile({
          id: fbUser.uid,
          email: fbUser.email,
          fullName: fbUser.email.split('@')[0],
          role: fbUser.email.includes('admin') ? 'admin' : 'student',
          idNumber: 'SYS-USER',
          department: 'General',
          status: 'active',
          createdAt: new Date().toISOString()
        });
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setError(null);
      if (fbUser) {
        setCurrentUser(fbUser);
        setIsDemoMode(false);
        await fetchProfile(fbUser);
      } else {
        // If not authenticated and no demo active, prompt login
        setCurrentUser(null);
        if (!isDemoMode) {
          // Check local storage for demo role preference
          const savedDemo = localStorage.getItem('campusfix_demo_role');
          if (savedDemo && DEMO_PROFILES[savedDemo as UserRole]) {
            setUserProfile(DEMO_PROFILES[savedDemo as UserRole]);
            setIsDemoMode(true);
          } else {
            setUserProfile(null);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      setIsDemoMode(false);
      localStorage.removeItem('campusfix_demo_role');
      await fetchProfile(cred.user);
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = 'Failed to sign in. Please verify your email and password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. Please check your credentials or register a new account.';
      } else if (err.code === 'auth/wrong-password') {
        msg = 'Incorrect password. Try again or click Forgot Password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please wait a few moments and try again.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid campus email address.';
      }
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      setIsDemoMode(false);
      localStorage.removeItem('campusfix_demo_role');
      await fetchProfile(cred.user);
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      let msg = err.message || 'Google sign-in could not be completed.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Google sign-in was cancelled.';
      }
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    pass: string,
    fullName: string,
    role: 'student' | 'faculty' | 'maintenance',
    idNumber: string,
    department: string
  ) => {
    setError(null);
    setLoading(true);
    try {
      // Rule: Maintenance team registrations MUST be marked pending_approval!
      // Student & Faculty are activated automatically
      const initialStatus: AccountStatus = role === 'maintenance' ? 'pending_approval' : 'active';

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const newProfile: UserProfile = {
        id: cred.user.uid,
        email: email.trim(),
        fullName: fullName.trim(),
        role,
        idNumber: idNumber.trim(),
        department: department.trim(),
        status: initialStatus,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setUserProfile(newProfile);
      setCurrentUser(cred.user);
      setIsDemoMode(false);
      localStorage.removeItem('campusfix_demo_role');
    } catch (err: any) {
      console.error('Registration error:', err);
      let msg = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this campus email already exists. Please log in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters with a combination of letters and numbers.';
      }
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('campusfix_demo_role');
      setIsDemoMode(false);
      setUserProfile(null);
      setCurrentUser(null);
      await signOut(auth);
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('Reset password error:', err);
      throw err;
    }
  };

  const switchDemoRole = (role: UserRole) => {
    const profile = DEMO_PROFILES[role];
    setUserProfile(profile);
    setIsDemoMode(true);
    localStorage.setItem('campusfix_demo_role', role);
  };

  const refreshUserProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        error,
        login,
        loginWithGoogle,
        register,
        logout,
        resetPassword,
        switchDemoRole,
        isDemoMode,
        refreshUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
