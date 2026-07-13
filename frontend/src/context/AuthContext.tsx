import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import axios from "axios";
import type { AuthContextValue, AuthResult, AuthUser } from "../types/auth";

// ----------------------------------------------------------------------------
// Real backend authentication.
//
// This replaces the previous localStorage-simulated "fake users database"
// with actual calls to the Express + JWT backend. Only two things are
// persisted client-side now:
//   1. The JWT token returned by the backend
//   2. The logged-in user object returned alongside it
//
// The PUBLIC API of this module is unchanged: AuthProvider, useAuth, and
// the login/register/logout functions all keep the exact same signatures,
// so LoginPage, RegisterPage, DashboardPage, Navbar, and ProtectedRoute
// all continue to work without modification.
// ----------------------------------------------------------------------------

// Base URL for the Express backend. Read from the environment so the
// same frontend build works for local development and production.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Authentication endpoint.
const AUTH_API_BASE_URL = `${API_BASE_URL}/api/auth`;

const TOKEN_KEY = "afnd_token";
const USER_KEY = "afnd_user";

/** Shape of the backend's response for both /login and /register. */
interface AuthApiResponse {
  success: boolean;
  message?: string;
  token?: string;
  data?: AuthUser;
}

// --- localStorage helpers (guarded against unavailable/corrupt storage) ---

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistSession(token: string, user: AuthUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Storage may be unavailable (e.g. Safari private mode); the user
    // stays logged in for the current tab via React state regardless.
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Nothing further we can do if localStorage itself is unavailable.
  }
}

/** Attaches (or removes) the JWT on the default axios instance so every
 *  subsequent request automatically includes it, without every call site
 *  having to set the header manually. */
function applyAuthHeader(token: string | null): void {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
}

/** Extracts a user-friendly error message from an Axios error, falling
 *  back sensibly if the backend didn't send a structured message. */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const data = error.response.data as Partial<AuthApiResponse> | undefined;
      return data?.message || `Request failed with status ${error.response.status}.`;
    }
    if (error.request) {
      return "Could not reach the server. Check your connection and try again.";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Restore session on refresh ("remember logged-in user") ---
  useEffect(() => {
    const token = readStoredToken();
    const storedUser = readStoredUser();

    if (token && storedUser) {
      applyAuthHeader(token);
      setUser(storedUser);
    }

    setIsLoading(false);
  }, []);

  // --- Keep auth state in sync across browser tabs ---
  // If the user logs out (or in) in one tab, other open tabs pick up
  // the change instantly instead of holding onto a stale session.
  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key !== USER_KEY && event.key !== TOKEN_KEY) return;

      const token = readStoredToken();
      const storedUser = readStoredUser();

      if (token && storedUser) {
        applyAuthHeader(token);
        setUser(storedUser);
      } else {
        applyAuthHeader(null);
        setUser(null);
      }
    }

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const response = await axios.post<AuthApiResponse>(
          `${AUTH_API_BASE_URL}/login`,
          { email: email.trim().toLowerCase(), password }
        );

        const payload = response.data;

        if (!payload?.success || !payload.token || !payload.data) {
          return {
            success: false,
            error: payload?.message || "Login failed. Please try again.",
          };
        }

        persistSession(payload.token, payload.data);
        applyAuthHeader(payload.token);
        setUser(payload.data);

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: extractErrorMessage(error, "Invalid email or password."),
        };
      }
    },
    []
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ): Promise<AuthResult> => {
      try {
        const response = await axios.post<AuthApiResponse>(
          `${AUTH_API_BASE_URL}/register`,
          {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          }
        );

        const payload = response.data;

        if (!payload?.success || !payload.token || !payload.data) {
          return {
            success: false,
            error: payload?.message || "Registration failed. Please try again.",
          };
        }

        persistSession(payload.token, payload.data);
        applyAuthHeader(payload.token);
        setUser(payload.data);

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: extractErrorMessage(
            error,
            "Could not create your account. Please try again."
          ),
        };
      }
    },
    []
  );

  // Proper logout: clears the persisted token/user, strips the axios
  // auth header, and resets in-memory state so ProtectedRoute redirects
  // immediately and no stale user data lingers.
  const logout = useCallback(() => {
    clearSession();
    applyAuthHeader(null);
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

/**
 * Hook for consuming the auth context. Throws clearly if used outside
 * an AuthProvider, so misuse fails fast during development instead of
 * silently returning undefined fields.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}