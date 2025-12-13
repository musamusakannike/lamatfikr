"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { apiClient, getErrorMessage } from "@/lib/api";
import type {
  AuthUser,
  User,
  LoginInput,
  RegisterInput,
  SocialAuthInput,
  CompleteSocialProfileInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ResendVerificationInput,
  AuthResponse,
  RegisterResponse,
  SocialAuthResponse,
  MessageResponse,
} from "@/types/auth";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<RegisterResponse>;
  socialAuth: (data: SocialAuthInput) => Promise<SocialAuthResponse>;
  completeSocialProfile: (data: CompleteSocialProfileInput) => Promise<void>;
  logout: () => void;
  forgotPassword: (data: ForgotPasswordInput) => Promise<MessageResponse>;
  resetPassword: (data: ResetPasswordInput) => Promise<MessageResponse>;
  resendVerification: (data: ResendVerificationInput) => Promise<MessageResponse>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setUser(null);
        return;
      }

      const response = await apiClient.get<{ user: User }>("/auth/me");
      const userData = response.user;

      setUser({
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        email: userData.email,
        avatar: userData.avatar,
        verified: userData.verified,
        role: userData.role,
      });
    } catch {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await fetchUser();
      setIsLoading(false);
    };

    initAuth();
  }, [fetchUser]);

  const login = useCallback(
    async (data: LoginInput) => {
      const response = await apiClient.post<AuthResponse>("/auth/login", data);
      localStorage.setItem("accessToken", response.accessToken);
      setUser(response.user);
      router.push("/");
    },
    [router]
  );

  const register = useCallback(async (data: RegisterInput) => {
    const response = await apiClient.post<RegisterResponse>(
      "/auth/register",
      data
    );
    return response;
  }, []);

  const socialAuth = useCallback(
    async (data: SocialAuthInput) => {
      const response = await apiClient.post<SocialAuthResponse>(
        "/auth/social",
        data
      );

      if (!response.requiresProfileCompletion && response.accessToken && response.user) {
        localStorage.setItem("accessToken", response.accessToken);
        setUser(response.user);
        router.push("/");
      }

      return response;
    },
    [router]
  );

  const completeSocialProfile = useCallback(
    async (data: CompleteSocialProfileInput) => {
      const response = await apiClient.post<AuthResponse>(
        "/auth/social/complete-profile",
        data
      );
      localStorage.setItem("accessToken", response.accessToken);
      setUser(response.user);
      router.push("/");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    setUser(null);
    router.push("/login");
  }, [router]);

  const forgotPassword = useCallback(async (data: ForgotPasswordInput) => {
    return await apiClient.post<MessageResponse>("/auth/forgot-password", data);
  }, []);

  const resetPassword = useCallback(async (data: ResetPasswordInput) => {
    return await apiClient.post<MessageResponse>("/auth/reset-password", data);
  }, []);

  const resendVerification = useCallback(
    async (data: ResendVerificationInput) => {
      return await apiClient.post<MessageResponse>(
        "/auth/resend-verification",
        data
      );
    },
    []
  );

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    socialAuth,
    completeSocialProfile,
    logout,
    forgotPassword,
    resetPassword,
    resendVerification,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { getErrorMessage };
