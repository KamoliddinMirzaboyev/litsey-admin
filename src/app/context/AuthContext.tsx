import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AuthUser {
  username: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Check if user is already authenticated on mount
    const token = sessionStorage.getItem("auth_token");
    const userData = sessionStorage.getItem("auth_user");
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData) as AuthUser;
        const encodedPayload = token.split(".")[1] || "";
        const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
        const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        const payload = JSON.parse(atob(paddedBase64)) as { exp?: number };
        const isExpired = !payload.exp || payload.exp * 1000 <= Date.now();
        if (parsedUser.role !== "admin" || isExpired) {
          logout();
          return;
        }
        setIsAuthenticated(true);
        setUser(parsedUser);
      } catch (e) {
        console.error("Error parsing user data:", e);
        logout();
      }
    }
  }, []);

  const login = () => {
    const userData = sessionStorage.getItem("auth_user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData) as AuthUser;
        if (parsedUser.role !== "admin") {
          logout();
          return;
        }
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Error parsing user data on login:", e);
        logout();
      }
    }
  };

  const logout = () => {
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("auth_user");
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
