import { useState } from "react";
import { useLocation } from "wouter";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setStatus("Signing in...");

    setTimeout(() => {
      setStatus("");
      window.location.href = "http://127.0.0.1:5000/prediction-tool";
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6">
        <h1 className="text-2xl font-bold text-foreground">Stock Predictor Login</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Demo login to access the prediction tool.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Password</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
          >
            Sign In
          </button>

          {status && (
            <div className="text-sm text-muted-foreground">{status}</div>
          )}
        </form>
      </div>
    </div>
  );
}
