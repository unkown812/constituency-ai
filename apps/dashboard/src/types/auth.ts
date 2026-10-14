export type UserRole = "citizen" | "mp" | "admin";

export interface AuthUser {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  role: UserRole;
  constituency_id: string;
  constituency_name: string;
  avatar_url?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  phone: string;
  otp: string;
}

export interface SendOtpPayload {
  phone: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}
