import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Radio, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, error: authError } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, go straight to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      await signIn(formData.email, formData.password);
      // After sign in, go to dashboard (not back to wherever they came from,
      // to avoid landing on a role-locked page)
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : authError || "Sign in failed";

      if (errorMsg.includes("invalid login") || errorMsg.includes("wrong password") || errorMsg.includes("Invalid")) {
        setError("Invalid email or password. Check your details and try again.");
      } else if (errorMsg.includes("not confirmed")) {
        setError("Please confirm your email address before signing in.");
      } else if (errorMsg.includes("disabled")) {
        setError("This account has been disabled. Contact support.");
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Radio className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CheckinPurple
            </span>
          </Link>
        </div>
      </nav>

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Sign In</h1>
            <p className="text-muted-foreground">Welcome back to CheckinPurple</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || authError) && (
              <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
                {error || authError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-input text-foreground rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-4 text-right text-sm">
            <Link to="/forgot-password" className="text-primary font-medium hover:underline">
              Forgot password?
            </Link>
          </div>

          {/* Clear separation — this is sign in only, create account is separate */}
          <div className="mt-8 pt-6 border-t border-border/40 text-center">
            <p className="text-muted-foreground text-sm mb-3">Don't have an account yet?</p>
            <Link
              to="/signup"
              className="block w-full py-3 px-4 rounded-lg border-2 border-primary/40 text-primary font-semibold hover:bg-primary/5 transition-colors text-center"
            >
              Create a New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
