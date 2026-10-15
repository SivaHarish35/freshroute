import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LeafIcon, ShieldCheckIcon, PlayIcon, CheckIcon, AlertIcon } from "../components/common/Icons";

export const LoginPage: React.FC = () => {
  const { login, register, demoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("Operations Lead");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isRegister) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      const ok = await register(email, password, fullName, organization, role);
      if (!ok) setError("Registration failed. Please check credentials or try another email.");
    } else {
      const ok = await login(email, password);
      if (!ok) setError("Invalid email or password. You can also use 1-Click Demo Login.");
    }
    setLoading(false);
  };

  const handleDemoClick = async () => {
    setLoading(true);
    setError(null);
    const ok = await demoLogin();
    if (!ok) setError("Demo login failed.");
    setLoading(false);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[var(--pale-green)] border border-[var(--fresh-green)]/40 mx-auto flex items-center justify-center shadow-xs">
            <LeafIcon className="w-8 h-8 text-[var(--fresh-green)]" />
          </div>
          <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">
            Fresh<span className="text-[var(--primary-gold)]">Route</span>
          </h1>
          <p className="text-xs font-semibold text-[var(--primary-gold)] tracking-wide uppercase">
            Smarter Routes. Fresher Produce. Less Waste.
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Intelligent Decision Support for Perishable Produce Distribution
          </p>
        </div>

        {/* 1-Click Judge Demo Button */}
        <div className="p-4 rounded-2xl bg-[var(--soft-gold)]/50 border border-[var(--primary-gold)]/40 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-[var(--deep-gold)] uppercase tracking-wider">
            <ShieldCheckIcon className="w-4 h-4 text-[var(--primary-gold)]" />
            Hackathon Judge & Evaluation Access
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
            Experience the full decision support workflow instantly with loaded synthetic produce data.
          </p>
          <button
            type="button"
            onClick={handleDemoClick}
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-[var(--primary-gold)] hover:opacity-90 text-white shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <PlayIcon className="w-4 h-4" /> 1-Click Instant Demo Login
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--border-color)]" />
          <span className="text-[11px] text-[var(--text-muted)] font-medium">Or Sign In with Credentials</span>
          <div className="flex-1 h-px bg-[var(--border-color)]" />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[var(--pale-red)] border border-[var(--critical-red)]/30 text-xs text-[var(--critical-red)] flex items-center gap-2">
            <AlertIcon className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resetSent && (
          <div className="p-3 rounded-xl bg-[var(--pale-amber)] border border-[var(--warning-amber)]/30 text-xs text-[var(--warning-amber)]">
            Password reset simulated. (SMTP email delivery disabled in local hackathon dev mode).
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="font-semibold block mb-1 text-[var(--text-main)]">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--primary-gold)]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-[var(--text-main)]">Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Pacific Logistics"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-main)]"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-[var(--text-main)]">Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Logistics Director"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-main)]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="font-semibold block mb-1 text-[var(--text-main)]">Email Address</label>
            <input
              type="email"
              placeholder="operator@freshroute.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--primary-gold)]"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-[var(--text-main)]">Password</label>
              {!isRegister && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-[var(--primary-gold)] hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--primary-gold)]"
              required
            />
          </div>

          {isRegister && (
            <div>
              <label className="font-semibold block mb-1 text-[var(--text-main)]">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--primary-gold)]"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-[var(--text-main)] text-[var(--bg-primary)] hover:opacity-90 shadow-xs cursor-pointer transition-opacity disabled:opacity-50"
          >
            {loading ? "Processing..." : (isRegister ? "Create Enterprise Account" : "Sign In to FreshRoute")}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-[var(--text-secondary)]">
          {isRegister ? (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(null); }}
                className="font-bold text-[var(--primary-gold)] hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{" "}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(null); }}
                className="font-bold text-[var(--primary-gold)] hover:underline"
              >
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
