import * as SecureStore from "expo-secure-store";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "../api/client";

export type UserRole = "admin" | "student" | "faculty";

export interface AuthUser {
  id: number;
  username: string;
  account_type: number;
  role: UserRole;
  name: string;
  profile: Record<string, unknown>;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app start, check if a token already exists (keeps user logged in between app opens)
  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync("auth_token");
      const storedUser = await SecureStore.getItemAsync("auth_user");

      if (token && storedUser) {
        setUser(JSON.parse(storedUser) as AuthUser);
      }
      setIsLoading(false);
    })();
  }, []);

  async function login(username: string, password: string): Promise<AuthUser> {
    const data = await apiFetch<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    await SecureStore.setItemAsync("auth_token", data.token);
    await SecureStore.setItemAsync("auth_user", JSON.stringify(data.user));
    setUser(data.user);

    return data.user;
  }

  async function logout(): Promise<void> {
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch (e) {
      // even if the server call fails (e.g. token already expired), clear local state
    }

    await SecureStore.deleteItemAsync("auth_token");
    await SecureStore.deleteItemAsync("auth_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
