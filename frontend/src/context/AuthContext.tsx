import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/auth";

import {
  login as loginRequest,
  register as registerRequest,
} from "../services/authService";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("jobconnect_user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("jobconnect_user");
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("jobconnect_token");
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(
        "jobconnect_user",
        JSON.stringify(user)
      );
    } else {
      localStorage.removeItem("jobconnect_user");
    }
  }, [user]);

  const login = async (data: LoginRequest) => {
    const response = await loginRequest(data);

    const loggedInUser: User = {
      userId: response.userId,
      name: response.name,
      email: response.email,
      role: response.role,
    };

    setToken(response.token);
    setUser(loggedInUser);

    localStorage.setItem("jobconnect_token", response.token);
    localStorage.setItem(
      "jobconnect_user",
      JSON.stringify(loggedInUser)
    );

    return response;
  };

  const register = async (data: RegisterRequest) => {
    const response = await registerRequest(data);

    const registeredUser: User = {
      userId: response.userId,
      name: response.name,
      email: response.email,
      role: response.role,
    };

    setToken(response.token);
    setUser(registeredUser);

    localStorage.setItem("jobconnect_token", response.token);
    localStorage.setItem(
      "jobconnect_user",
      JSON.stringify(registeredUser)
    );

    return response;
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("jobconnect_token");
    localStorage.removeItem("jobconnect_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}