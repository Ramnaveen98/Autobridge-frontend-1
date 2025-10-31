import { api } from "@/services/client";

export async function requestPasswordOtp(email: string) {
  const res = await api.post("/api/v1/auth/forgot-password", { email });
  return res.data;
}

export async function verifyPasswordOtp(email: string, code: string) {
  const res = await api.post("/api/v1/auth/verify-otp", { email, code });
  return res.data;
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string
) {
  const res = await api.post("/api/v1/auth/reset-password", {
    email,
    code,
    newPassword,
    confirmPassword,
  });
  return res.data;
}
