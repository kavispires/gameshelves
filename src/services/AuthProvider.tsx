import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, type PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import { auth, signIn as firebaseSignIn } from 'services/firebase';

export type SignInProps = {
  email: string;
  password: string;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
};

type AuthContextValue = AuthState & {
  isSigningIn: boolean;
  signIn: (values: SignInProps) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true, error: null });
  const [isSigningIn, setIsSigningIn] = useState(false);
  const signingIn = useRef(false);

  useEffect(
    () =>
      onAuthStateChanged(
        auth,
        (user) => setState({ user, isLoading: false, error: null }),
        (error) => setState({ user: null, isLoading: false, error }),
      ),
    [],
  );

  async function signIn({ email, password }: SignInProps) {
    if (signingIn.current) return;
    signingIn.current = true;
    setIsSigningIn(true);
    try {
      await firebaseSignIn(email, password);
    } finally {
      signingIn.current = false;
      setIsSigningIn(false);
    }
  }

  return <AuthContext.Provider value={{ ...state, isSigningIn, signIn }}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within an AuthProvider');
  return context;
}
