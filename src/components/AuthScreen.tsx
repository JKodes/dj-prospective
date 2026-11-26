import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

const PASSWORD_RESET_REDIRECT = "cratefire://auth/reset-password";

type AuthScreenProps = {
  onAuthenticated: () => void;
  passwordRecovery?: boolean;
  onPasswordResetComplete?: () => void;
  externalError?: string;
};

export default function AuthScreen({
  onAuthenticated,
  passwordRecovery = false,
  onPasswordResetComplete,
  externalError = "",
}: AuthScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (passwordRecovery) {
        if (password !== confirmPassword) {
          throw new Error("Your passwords do not match.");
        }

        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) throw error;

        setPasswordUpdated(true);
        return;
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: PASSWORD_RESET_REDIRECT,
        });

        if (error) throw error;

        setMessage(
          "If an account exists for that email, a password reset link has been sent.",
        );

        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName.trim(),
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          onAuthenticated();
        } else {
          setMessage(
            "Account created. Check your email to verify your account.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        onAuthenticated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card bg-dark text-light border-secondary">
            <div className="card-body p-4">
              <h2 className="mb-2">CrateFire</h2>

              <p className="text-secondary mb-4">
                {passwordRecovery
                  ? "Choose a new password for your account."
                  : mode === "forgot"
                    ? "Enter your email to receive a password reset link."
                    : "Sign in to your DJ workspace."}
              </p>

              {!passwordRecovery && mode !== "forgot" && (
                <div className="btn-group w-100 mb-4">
                  <button
                    className={`btn ${
                      mode === "signin" ? "btn-danger" : "btn-outline-secondary"
                    }`}
                    onClick={() => {
                      setMode("signin");
                      setError("");
                      setMessage("");
                    }}
                    type="button"
                  >
                    Sign In
                  </button>

                  <button
                    className={`btn ${
                      mode === "signup" ? "btn-danger" : "btn-outline-secondary"
                    }`}
                    onClick={() => {
                      setMode("signup");
                      setError("");
                      setMessage("");
                    }}
                    type="button"
                  >
                    Create Account
                  </button>
                </div>
              )}

              {passwordRecovery && passwordUpdated ? (
                <>
                  <div className="alert alert-success">
                    Your password has been updated successfully.
                  </div>

                  <button
                    className="btn btn-danger w-100"
                    type="button"
                    onClick={onPasswordResetComplete}
                  >
                    Continue to CrateFire
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmit}>
                  {!passwordRecovery && (
                    <>
                      {mode === "signup" && (
                        <div className="mb-3">
                          <label
                            className="form-label"
                            htmlFor="auth-display-name"
                          >
                            Display Name{" "}
                            <span className="text-secondary">(optional)</span>
                          </label>

                          <input
                            id="auth-display-name"
                            className="form-control bg-dark text-light"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            autoComplete="name"
                            maxLength={50}
                            placeholder="Your DJ name"
                          />
                        </div>
                      )}
                      {mode === "signup" && (
                        <div className="mb-3">
                          <label htmlFor="displayName" className="form-label">
                            Display Name
                          </label>
                          <input
                            id="displayName"
                            type="text"
                            className="form-control"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="What should we call you?"
                            autoComplete="name"
                            required
                          />
                        </div>
                      )}
                      <div className="mb-3">
                        <label className="form-label" htmlFor="auth-email">
                          Email
                        </label>

                        <input
                          id="auth-email"
                          className="form-control bg-dark text-light"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                          required
                        />
                      </div>
                    </>
                  )}

                  {(passwordRecovery || mode !== "forgot") && (
                    <div className="mb-3">
                      <label className="form-label" htmlFor="auth-password">
                        {passwordRecovery ? "New Password" : "Password"}
                      </label>

                      <input
                        id="auth-password"
                        className="form-control bg-dark text-light"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={
                          passwordRecovery || mode === "signup"
                            ? "new-password"
                            : "current-password"
                        }
                        minLength={6}
                        required
                      />
                    </div>
                  )}

                  {passwordRecovery && (
                    <div className="mb-3">
                      <label
                        className="form-label"
                        htmlFor="auth-confirm-password"
                      >
                        Confirm New Password
                      </label>

                      <input
                        id="auth-confirm-password"
                        className="form-control bg-dark text-light"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                    </div>
                  )}

                  {!passwordRecovery && mode === "signin" && (
                    <div className="mb-3 text-end">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-decoration-none"
                        onClick={() => {
                          setMode("forgot");
                          setError("");
                          setMessage("");
                        }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {!passwordRecovery && mode === "forgot" && (
                    <div className="mb-3">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-decoration-none"
                        onClick={() => {
                          setMode("signin");
                          setError("");
                          setMessage("");
                        }}
                      >
                        Back to Sign In
                      </button>
                    </div>
                  )}

                  {externalError && (
                    <div className="alert alert-danger">{externalError}</div>
                  )}

                  {error && <div className="alert alert-danger">{error}</div>}

                  {message && (
                    <div className="alert alert-success">{message}</div>
                  )}

                  <button
                    className="btn btn-danger w-100"
                    type="submit"
                    disabled={loading}
                  >
                    {loading
                      ? "Please wait..."
                      : passwordRecovery
                        ? "Update Password"
                        : mode === "forgot"
                          ? "Send Reset Link"
                          : mode === "signin"
                            ? "Sign In"
                            : "Create Account"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
