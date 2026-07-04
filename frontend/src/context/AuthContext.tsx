import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type {
  AuthContextValue,
  AuthResult,
  AuthUser,
  StoredCredential,
} from "../types/auth";
import { isValidEmail, isValidPassword } from "../utils/validators";

// NOTE: This is a client-side-only authentication simulation for the
// front-end milestone of this project. There is no backend yet, so
// credentials are persisted in the browser's localStorage rather than
// a real database, and passwords are stored in plain text. This is
// NOT secure and must be replaced once the real backend/API is built.

const SESSION_KEY = "afnd_session_user";
const USERS_DB_KEY = "afnd_users_db";

function readUsersDb(): StoredCredential[] {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    return raw ? (JSON.parse(raw) as StoredCredential[]) : [];
  } catch {
    return [];
  }
}

function writeUsersDb(users: StoredCredential[]): void {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
}

function readSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function generateId(): string {
  return `usr_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(readSession());
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const normalizedEmail = email.trim().toLowerCase();

      if (!isValidEmail(normalizedEmail)) {
        return { success: false, error: "Enter a valid email address." };
      }
      if (!isValidPassword(password)) {
        return {
          success: false,
          error: "Password must be at least 8 characters.",
        };
      }

      const users = readUsersDb();
      const match = users.find((u) => u.email === normalizedEmail);

      if (!match || match.password !== password) {
        return { success: false, error: "Invalid email or password." };
      }

      const authUser: AuthUser = {
        id: match.id,
        name: match.name,
        email: match.email,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      setUser(authUser);
      return { success: true };
    },
    []
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ): Promise<AuthResult> => {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();

      if (!trimmedName) {
        return { success: false, error: "Full name is required." };
      }
      if (!isValidEmail(normalizedEmail)) {
        return { success: false, error: "Enter a valid email address." };
      }
      if (!isValidPassword(password)) {
        return {
          success: false,
          error: "Password must be at least 8 characters.",
        };
      }

      const users = readUsersDb();
      if (users.some((u) => u.email === normalizedEmail)) {
        return {
          success: false,
          error: "An account with this email already exists.",
        };
      }

      const newCredential: StoredCredential = {
        id: generateId(),
        name: trimmedName,
        email: normalizedEmail,
        password,
      };
      writeUsersDb([...users, newCredential]);

      const authUser: AuthUser = {
        id: newCredential.id,
        name: newCredential.name,
        email: newCredential.email,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      setUser(authUser);
      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
