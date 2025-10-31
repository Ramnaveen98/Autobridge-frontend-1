import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

export default function ThankYouPage() {
  const { state } = useLocation();
  const nav = useNavigate();
  const feedback = state?.feedback;
  const [showConfetti, setShowConfetti] = useState(true);

  // Stop confetti after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!feedback) nav("/app/user");
  }, [feedback, nav]);

  if (!feedback) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white overflow-hidden px-4">
      {showConfetti && <Confetti recycle={false} numberOfPieces={250} />}

      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-700 rounded-2xl shadow-2xl p-10 w-full max-w-md text-center animate-fade-in">
        <h1 className="text-4xl font-bold text-blue-400 mb-3">
          🎉 Thank You for Your Feedback!
        </h1>
        <p className="text-gray-300 mb-5">
          We truly appreciate you for using{" "}
          <span className="font-semibold text-white">AutoBridge</span>.
        </p>

        <div className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-5 text-left mb-6 shadow-inner">
          <p className="text-lg mb-2 text-white">
            <span className="font-semibold text-blue-400">Service:</span>{" "}
            {feedback.serviceName}
          </p>
          <p className="text-lg mb-2 text-white">
            <span className="font-semibold text-blue-400">Feedback:</span>{" "}
            {feedback.comments}
          </p>
          {feedback.rating && (
            <p className="text-lg text-yellow-400 font-semibold mt-3">
              {"★".repeat(feedback.rating)}{"☆".repeat(5 - feedback.rating)}
            </p>
          )}
        </div>

        <p className="text-emerald-400 font-medium mb-5">
          A confirmation email has been sent to your registered address.
        </p>

        <button
          onClick={() => nav("/app/user")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-base font-medium transition"
        >
          Go to Dashboard
        </button>

        <div className="absolute inset-x-0 bottom-4 text-xs text-gray-500">
          © 2025 AutoBridge
        </div>
      </div>
    </div>
  );
}
