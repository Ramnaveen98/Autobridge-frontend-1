import { postJSON } from "./client";

export type LoginResponse = {
  userId: number;
  email: string;
  role: "USER" | "ADMIN" | "AGENT";
  token: string | null;
  message?: string;
};

export type SignupResponse = {
  userId: number;
  email: string;
  role: "USER" | "ADMIN" | "AGENT";
  token: string | null;
  message?: string;
};

export const authApi = {
  async login(email: string, password: string) {
    return postJSON<LoginResponse>("/api/v1/auth/login", { email, password });
  },
  async signup(body: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    accountType?: "USER" | "ADMIN" | "AGENT";
    inviteCode?: string;
  }) {
    return postJSON<SignupResponse>("/api/v1/auth/signup", body);
  }
};
