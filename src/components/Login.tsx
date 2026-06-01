import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

type Mode = "admin" | "user";

const ACCOUNTS: Record<Mode, { email: string; hint: string }> = {
  admin: { email: "admin@cragleigh.local", hint: "Admin password" },
  user: { email: "user@cragleigh.local", hint: "View-only password" },
};

export default function Login() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>("user");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(ACCOUNTS[mode].email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Cragleigh Inventory</h1>
        <p className="login-sub">Sign in to browse the estate catalog</p>

        <div className="login-tabs">
          <button
            type="button"
            className={mode === "user" ? "active" : ""}
            onClick={() => setMode("user")}
          >
            View only
          </button>
          <button
            type="button"
            className={mode === "admin" ? "active" : ""}
            onClick={() => setMode("admin")}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            {ACCOUNTS[mode].hint}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
