import React, { useState } from "react";
import {
  requestPasswordOtp,
  verifyPasswordOtp,
  resetPassword,
} from "@/services/authReset";

interface Props {
  email: string;
  onClose: () => void;
}

export default function AdminResetPasswordModal({ email, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleSendOtp() {
    try {
      setLoading(true);
      setErr(null);
      await requestPasswordOtp(email);
      setMsg("OTP sent to user's email.");
      setStep(2);
    } catch (e: any) {
      const m = e?.response?.data || "Failed to send OTP.";
      setErr(m);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    try {
      setLoading(true);
      setErr(null);
      await verifyPasswordOtp(email, otp);
      setStep(3);
    } catch (e: any) {
      const m = e?.response?.data || "Invalid OTP.";
      setErr(m);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    try {
      setLoading(true);
      setErr(null);
      await resetPassword(email, otp, newPassword, confirmPassword);
      alert("Password updated successfully.");
      onClose();
    } catch (e: any) {
      const m = e?.response?.data || "Failed to update password.";
      setErr(m);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 text-white p-6 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-4">
          Reset Password for <span className="text-blue-400">{email}</span>
        </h2>

        {msg && <p className="text-green-400 text-center mb-2">{msg}</p>}
        {err && <p className="text-red-400 text-center text-sm mb-2">{err}</p>}

        {step === 1 && (
          <div className="space-y-4 text-center">
            <p>Send OTP to <strong>{email}</strong> to reset their password.</p>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border w-full px-3 py-2 rounded-lg bg-zinc-800 text-white"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              {loading ? "Verifying…" : "Verify OTP"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border w-full px-3 py-2 rounded-lg bg-zinc-800 text-white"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border w-full px-3 py-2 rounded-lg bg-zinc-800 text-white"
            />
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              {loading ? "Saving…" : "Update Password"}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full border py-2 mt-5 rounded-lg hover:bg-zinc-800 text-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
