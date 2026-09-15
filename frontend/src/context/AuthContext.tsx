import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { api } from '../lib/api';
import type { User as DbUser } from '../types';
import { AuthContext } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(() => isFirebaseConfigured);

  const fetchDbProfile = async (rawToken: string) => {
    try {
      const profile = await api.auth.getMe(rawToken);
      setDbUser(profile);
    } catch (err) {
      console.warn('No se pudo sincronizar el perfil con backend:', err);
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (current) => {
      setFirebaseUser(current);
      if (current) {
        try {
          const rawToken = await current.getIdToken();
          setToken(rawToken);
          await fetchDbProfile(rawToken);
        } catch (err) {
          console.error('Error al obtener token de Firebase:', err);
        }
      } else {
        setToken(null);
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase no está configurado en frontend/.env');
    }
    const cred = await signInWithPopup(auth, googleProvider);
    const rawToken = await cred.user.getIdToken();
    setToken(rawToken);
    await fetchDbProfile(rawToken);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase no está configurado en frontend/.env');
    }
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const rawToken = await cred.user.getIdToken();
    setToken(rawToken);
    await fetchDbProfile(rawToken);
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
  ) => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase no está configurado en frontend/.env');
    }
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }
    const rawToken = await cred.user.getIdToken(true);
    setToken(rawToken);
    await fetchDbProfile(rawToken);
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
    setFirebaseUser(null);
    setDbUser(null);
    setToken(null);
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchDbProfile(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        dbUser,
        token,
        loading,
        isConfigured: isFirebaseConfigured,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
