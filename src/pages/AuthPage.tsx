import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await login({ email, password }, remember);
        if (!res.success) setError(res.error || 'Login failed');
      } else {
        if (!username.trim()) { setError('Username is required'); return; }
        const res = await register({ username, email, password });
        if (!res.success) setError(res.error || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dot-grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1A1A2E] mb-4">
            <BookOpen className="h-8 w-8 text-[#F5A623]" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Master of English</h1>
          <p className="text-sm text-muted-foreground mt-1">Your vocabulary learning companion</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          {/* Toggle */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form key={mode}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}
              onSubmit={handleSubmit} className="space-y-4">

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Your display name"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
                    required />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
                  required />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Min 6 characters' : 'Your password'}
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
                    required />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="rounded" />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
              )}

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100">
                  {error}
                </motion.div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-[#1A1A2E] text-white rounded-xl text-sm font-semibold hover:bg-[#252540] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {loading
                  ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : mode === 'login'
                  ? <><LogIn className="h-4 w-4" /> Sign In</>
                  : <><UserPlus className="h-4 w-4" /> Create Account</>
                }
              </button>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Cross-device note */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Register on any device · sign in anywhere with the same email
        </p>
      </div>
    </div>
  );
}
