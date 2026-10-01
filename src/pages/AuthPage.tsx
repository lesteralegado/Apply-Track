import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "../components/layout/AppShell";
import { useAuth } from "../features/auth/hooks/useAuth";
import {
  signIn,
  signUp,
  requestPasswordReset,
  updatePassword,
  checkPasswordResetCode,
} from "../features/auth/api/auth";
import { auth } from "../lib/firebase/client";
import { LoadingState } from "../components/ui/States";
type Mode = "sign-in" | "sign-up" | "forgot-password" | "update-password";
const copy = {
  "sign-in": {
    title: "Welcome back.",
    subtitle: "Your next opportunity is waiting. Pick up where you left off.",
    button: "Sign in",
    eyebrow: "YOUR PERSONAL WORKSPACE",
  },
  "sign-up": {
    title: "Start your next chapter.",
    subtitle: "A little organization. A lot more headspace.",
    button: "Create account",
    eyebrow: "MAKE ROOM FOR WHAT’S NEXT",
  },
  "forgot-password": {
    title: "Let’s get you back in.",
    subtitle: "Enter your email and we’ll send a password reset link.",
    button: "Send reset link",
    eyebrow: "PASSWORD RECOVERY",
  },
  "update-password": {
    title: "A fresh start.",
    subtitle: "Choose a new password for your ApplyTrack account.",
    button: "Update password",
    eyebrow: "UPDATE YOUR PASSWORD",
  },
};
export function AuthPage({ mode }: { mode: Mode }) {
  const { user, loading, error: sessionError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    (location.state as { passwordReset?: boolean } | null)?.passwordReset
      ? "Password updated. Sign in with your new password."
      : "",
  );
  const [busy, setBusy] = useState(false);
  const resetCode =
    mode === "update-password"
      ? new URLSearchParams(location.search).get("oobCode")
      : null;
  const [resetError, setResetError] = useState("");
  const [checkingCode, setCheckingCode] = useState(Boolean(resetCode));
  useEffect(() => {
    if (!resetCode) return;
    let active = true;
    setCheckingCode(true);
    setResetError("");
    void checkPasswordResetCode(resetCode)
      .catch((error: Error) => {
        if (active) setResetError(error.message);
      })
      .finally(() => {
        if (active) setCheckingCode(false);
      });
    return () => {
      active = false;
    };
  }, [resetCode]);
  const page = copy[mode];
  if (loading) return <LoadingState text="Restoring your session…" />;
  if (user && (mode === "sign-in" || mode === "sign-up"))
    return <Navigate to="/app/dashboard" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    try {
      if (mode === "sign-in") {
        await signIn(email, password);
        const from = (location.state as { from?: string } | null)?.from;
        navigate(from?.startsWith("/app/") ? from : "/app/dashboard", {
          replace: true,
        });
      } else if (mode === "sign-up") {
        await signUp(email, password);
        navigate("/app/dashboard", { replace: true });
      } else if (mode === "forgot-password") {
        await requestPasswordReset(email);
        setNotice(
          "If an account exists for that email, a reset link is on its way. Please check your inbox.",
        );
      } else {
        if (!resetCode)
          throw new Error(
            "This reset link is expired or incomplete. Request a new one.",
          );
        if (password !== form.get("confirmPassword"))
          throw new Error("Your passwords don’t match.");
        await updatePassword(password, resetCode);
        navigate("/sign-in", { replace: true, state: { passwordReset: true } });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <div className="auth-story">
        <Logo />
        <div>
          <span className="eyebrow">ONE STEP CLOSER</span>
          <h1>
            A clearer path
            <br />
            to your next
            <br />
            <em>chapter.</em>
          </h1>
          <p>
            Keep your opportunities, conversations, and next steps together.
            Give your job search a little breathing room.
          </p>
          <div className="auth-story-line" />
          <span className="auth-footnote">Small steps. New possibilities.</span>
        </div>
        <span className="auth-privacy">
          <ShieldCheck size={18} />
          Private by design. Yours to organize.
        </span>
      </div>
      <main className="auth-main">
        <Link to="/demo" className="text-link back-to-demo">
          <ArrowLeft size={16} />
          Explore the demo
        </Link>
        <div className="auth-card">
          <span className="eyebrow">{page.eyebrow}</span>
          <h2>{page.title}</h2>
          <p>{page.subtitle}</p>
          {!auth && (
            <p role="status" className="info-banner">
              Account services are not connected yet. The sample demo is
              available.
            </p>
          )}
          {sessionError && (
            <p className="error-banner" role="alert">
              {sessionError}
            </p>
          )}
          {mode === "update-password" && (!resetCode || resetError) ? (
            <div className="info-banner">
              {resetError ||
                "Open the link in your recovery email to update your password."}{" "}
              <Link to="/forgot-password">Request a new link</Link>.
            </div>
          ) : (
            <form onSubmit={submit}>
              <fieldset disabled={busy || !auth || checkingCode}>
                {mode !== "update-password" && (
                  <div className="form-field">
                    <label htmlFor="email">Email address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      autoFocus
                    />
                  </div>
                )}
                {mode !== "forgot-password" && (
                  <div className="form-field">
                    <label htmlFor="password">
                      {mode === "update-password" ? "New password" : "Password"}
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={mode === "sign-in" ? 1 : 8}
                      autoComplete={
                        mode === "sign-in" ? "current-password" : "new-password"
                      }
                    />
                    {mode !== "sign-in" && (
                      <span className="field-help">
                        Use at least 8 characters.
                      </span>
                    )}
                  </div>
                )}
                {mode === "update-password" && (
                  <div className="form-field">
                    <label htmlFor="confirmPassword">
                      Confirm new password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                )}
                {mode === "sign-in" && (
                  <Link className="forgot-link" to="/forgot-password">
                    Forgot password?
                  </Link>
                )}
                <button
                  className="button primary auth-submit"
                  disabled={busy || !auth || checkingCode}
                >
                  {busy ? "Please wait…" : page.button}
                  <ArrowRight size={17} />
                </button>
              </fieldset>
            </form>
          )}
          {error && (
            <p role="alert" className="error-banner">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="success-banner">
              {notice}
            </p>
          )}
          <div className="auth-switch">
            {mode === "sign-in" ? (
              <>
                New here? <Link to="/sign-up">Create an account</Link>
              </>
            ) : (
              <Link to="/sign-in">Back to sign in</Link>
            )}
          </div>
        </div>
        <p className="auth-bottom">
          ApplyTrack · Built for your next opportunity.
        </p>
      </main>
    </div>
  );
}
