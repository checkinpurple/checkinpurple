import { useState } from "react";
import { Link } from "react-router-dom";
import { Radio, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/signin`,
      });

      if (resetError) {
        throw resetError;
      }

      setMessage("If the email is registered, a password reset link has been sent.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send reset email.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/signin" className="flex items-center gap-3 hover:opacity-80 transition-opacity text-sm font-semibold text-primary">
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
        </div>
      </nav>

      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Radio className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Forgot your password?</h1>
            <p className="text-muted-foreground">Enter your email and we’ll send a reset link to get you back in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || message) && (
              <div className={`p-3 rounded-lg text-sm ${error ? "bg-destructive/10 border border-destructive/50 text-destructive" : "bg-emerald-500/10 border border-emerald-500/50 text-emerald-700"}`}>
                {error || (
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {message}
                  </span>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Remembered your password? <Link to="/signin" className="text-primary hover:underline">Sign in instead</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
