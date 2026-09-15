import { createContext } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User as DbUser } from '../types';

export interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  dbUser: DbUser | null;
  token: string | null;
  loading: boolean;
  isConfigured: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    pass: string,
    name: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
