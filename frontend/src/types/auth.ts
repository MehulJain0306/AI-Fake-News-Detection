export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<AuthResult>;
  logout: () => void;
}

export interface StoredCredential {
  id: string;
  name: string;
  email: string;
  password: string;
}
