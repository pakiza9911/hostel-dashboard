import { useState } from "react";
import { motion } from "framer-motion";
import { Hotel, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../stores/authStore";
import { useNavigate } from "react-router-dom";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Login failed");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex bg-ink-50">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Hotel size={22} />
            </div>
            <span className="text-xl font-bold">HostelHub</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md"
          >
            <h1 className="text-4xl font-bold leading-tight">
              Run your hostel like a pro.
            </h1>
            <p className="mt-4 text-white/80 text-lg">
              Manage rooms, beds, tenants, payments and more. All in one
              beautifully designed dashboard.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { v: "500+", l: "Hostels" },
                { v: "12K+", l: "Beds tracked" },
                { v: "98%", l: "Uptime" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-xl bg-white/10 backdrop-blur p-4"
                >
                  <div className="text-2xl font-bold">{s.v}</div>
                  <div className="text-xs text-white/70 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
          <div className="text-xs text-white/60">© 2026 HostelHub Suite</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center">
              <Hotel size={20} />
            </div>
            <span className="text-xl font-bold">HostelHub</span>
          </div>
          <h2 className="text-3xl font-bold text-ink-900">Welcome back</h2>
          <p className="text-ink-500 mt-1">
            Sign in to continue to your dashboard
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@hostel.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
