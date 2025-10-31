import React, { useState } from "react";
import { ReactNode } from "react"; // (add this at top)
import { useNavigate } from "react-router-dom";
import {
  requestPasswordOtp,
  verifyPasswordOtp,
  resetPassword,
} from "@/services/authReset";

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  
const [error, setError] = useState<ReactNode | null>(null);
  const [loading, setLoading] = useState(false);
  

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestPasswordOtp(email);
      setMessage("OTP sent to your email (if account exists).");
      setStep(2);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Email not found. Please check again or ";
      if (msg.includes("User not found"))
        setError(
          <>
            Email not found. Please{" "}
            <a className="text-blue-600 underline" href="/signup">
              create an account
            </a>
            .
          </>
        );
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyPasswordOtp(email, otp);
      setStep(3);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Invalid OTP. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword, confirmPassword);
      alert("Password updated successfully. Please sign in.");
      nav("/login");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Failed to reset password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Reset Password
        </h2>

        {step === 1 && (
          <p className="text-center text-gray-700 font-semibold mb-4">
            Enter an existing email
          </p>
        )}

        {message && <p className="text-green-600 text-center">{message}</p>}
        {error && (
          <p className="text-red-600 text-center text-sm mt-2">{error}</p>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full px-3 py-2 rounded-lg text-gray-800 placeholder-gray-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-gray-700 text-center">
              Enter the 6-digit OTP sent to <b>{email}</b>
            </p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full px-3 py-2 rounded-lg text-gray-800 placeholder-gray-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full px-3 py-2 rounded-lg text-gray-800 placeholder-gray-500"
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full px-3 py-2 rounded-lg text-gray-800 placeholder-gray-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {loading ? "Saving..." : "Update Password"}
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-sm text-gray-600">
          Remembered your password?{" "}
          <a href="/login" className="text-blue-600 font-medium underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
