import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminAccessCode } from "../lib/env";

const STORAGE_KEY = "golf_admin_authenticated";

interface AdminAuthValue {
  isAuthenticated: boolean;
  isConfigured: boolean;
  login: (code: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

function readInitialAuthentication() {
  if (!adminAccessCode) {
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    readInitialAuthentication,
  );

  const login = useCallback((code: string) => {
    if (!adminAccessCode || code !== adminAccessCode) {
      return false;
    }
    localStorage.setItem(STORAGE_KEY, "true");
    setIsAuthenticated(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isConfigured: Boolean(adminAccessCode),
      login,
      logout,
    }),
    [isAuthenticated, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider.");
  }
  return context;
}
