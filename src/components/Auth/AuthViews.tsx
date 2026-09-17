import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, LogIn, UserPlus, KeyRound, Mail, User as UserIcon, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuthProps {
  onSwitchMode: (mode: 'login' | 'register' | 'verify') => void;
}

export const LoginView: React.FC<AuthProps> = ({ onSwitchMode }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      if (err.message && err.message.includes('requires verification')) {
        onSwitchMode('verify');
      } else {
        setError(err.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('executive@vodafone.ie');
    setPassword('demo12345');
    setError(null);
  };

  return (
    <div className="w-full max-w-md bg-[#0b101c] border border-[#1b263c] rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Subtle top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 gradient-brand" />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-red-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Enterprise Analytics AI</h2>
          <p className="text-xs text-[#8ba8d1]">Vodafone Enterprise Intelligence</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white">Welcome back</h3>
        <p className="text-sm text-[#8ba8d1] mt-1">Sign in with your enterprise credentials to access analytics.</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl flex items-start gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8ba8d1] mb-1.5">
            Work Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#516c91] absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#516c91] focus:outline-none focus:border-[#d50072] focus:ring-1 focus:ring-[#d50072] transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8ba8d1]">
              Password
            </label>
            <button
              type="button"
              onClick={() => alert('Password reset link sent to enterprise administrator.')}
              className="text-xs text-[#d50072] hover:text-[#ff0018] transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-[#516c91] absolute left-3.5 top-3.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#516c91] focus:outline-none focus:border-[#d50072] focus:ring-1 focus:ring-[#d50072] transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl gradient-brand text-white font-semibold text-sm shadow-lg shadow-red-500/25 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#1b263c] flex flex-col gap-3">
        <button
          type="button"
          onClick={handleDemoFill}
          className="text-xs py-2 px-3 rounded-lg bg-[#1b263c]/60 hover:bg-[#1b263c] text-[#8ba8d1] hover:text-white border border-[#344967]/30 transition-colors flex items-center justify-center gap-2"
        >
          <span>Use verified demo credentials: executive@vodafone.ie</span>
        </button>

        <div className="text-center text-xs text-[#8ba8d1]">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => onSwitchMode('register')}
            className="text-white font-semibold hover:text-[#00d8ff] underline decoration-[#516c91] underline-offset-4 transition-colors"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
};

export const RegisterView: React.FC<AuthProps> = ({ onSwitchMode }) => {
  const { register, setVerificationPendingEmail } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation (Doc Page 6)
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(name, email, password, confirmPassword);
      setVerificationPendingEmail(email);
      onSwitchMode('verify');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#0b101c] border border-[#1b263c] rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 left-0 right-0 h-1 gradient-brand" />

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white">Create your account</h3>
        <p className="text-sm text-[#8ba8d1] mt-1">Register for enterprise access to BigQuery and Vertex AI analytics.</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl flex items-start gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8ba8d1] mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-[#516c91] absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Liam O'Connor"
              className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#516c91] focus:outline-none focus:border-[#d50072] focus:ring-1 focus:ring-[#d50072] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8ba8d1] mb-1.5">
            Work Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#516c91] absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#516c91] focus:outline-none focus:border-[#d50072] focus:ring-1 focus:ring-[#d50072] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8ba8d1] mb-1.5">
            Password (min. 6 characters)
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-[#516c91] absolute left-3.5 top-3.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#516c91] focus:outline-none focus:border-[#d50072] focus:ring-1 focus:ring-[#d50072] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8ba8d1] mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-[#516c91] absolute left-3.5 top-3.5" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#516c91] focus:outline-none focus:border-[#d50072] focus:ring-1 focus:ring-[#d50072] transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl gradient-brand text-white font-semibold text-sm shadow-lg shadow-red-500/25 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span>Creating account...</span>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#1b263c] text-center text-xs text-[#8ba8d1]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          className="text-white font-semibold hover:text-[#00d8ff] underline decoration-[#516c91] underline-offset-4 transition-colors"
        >
          Sign in
        </button>
      </div>
    </div>
  );
};

export const VerificationView: React.FC<AuthProps> = ({ onSwitchMode }) => {
  const { verify, verificationPendingEmail } = useAuth();
  const [email, setEmail] = useState(verificationPendingEmail || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verify(email, code);
      setSuccess(true);
      setTimeout(() => {
        onSwitchMode('login');
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#0b101c] border border-[#1b263c] rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 left-0 right-0 h-1 gradient-brand" />

      <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-[#00d8ff]/30 text-[#00d8ff] flex items-center justify-center mb-5">
        <ShieldCheck className="w-6 h-6" />
      </div>

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white">Account created</h3>
        <p className="text-sm text-[#8ba8d1] mt-1">A verification step is required before proceeding to the analytics workspace.</p>
      </div>

      {success && (
        <div className="mb-5 p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Verification successful! Redirecting to login...</span>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl flex items-start gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8ba8d1] mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#516c91] focus:outline-none focus:border-[#d50072]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8ba8d1]">
              6-Digit Verification Code
            </label>
            <span className="text-[11px] text-[#28e98c] font-mono">(Hint: default code or '123456')</span>
          </div>
          <input
            type="text"
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="w-full bg-[#101a2d] border border-[#1b263c] rounded-xl px-4 py-2.5 text-lg tracking-widest text-center font-mono text-[#00d8ff] placeholder-[#516c91] focus:outline-none focus:border-[#00d8ff]"
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full py-3 px-4 rounded-xl gradient-brand text-white font-semibold text-sm shadow-lg shadow-red-500/25 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span>Verifying...</span>
          ) : (
            <>
              <span>[ Continue ]</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#1b263c] text-center text-xs text-[#8ba8d1]">
        Back to{' '}
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          className="text-white font-semibold hover:text-[#00d8ff] underline decoration-[#516c91] underline-offset-4"
        >
          Sign in
        </button>
      </div>
    </div>
  );
};

export const AuthViews: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');

  return (
    <div className="min-h-screen w-full bg-[#050a12] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#e60000]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#d50072]/10 rounded-full blur-3xl pointer-events-none" />

      {mode === 'login' && <LoginView onSwitchMode={setMode} />}
      {mode === 'register' && <RegisterView onSwitchMode={setMode} />}
      {mode === 'verify' && <VerificationView onSwitchMode={setMode} />}
    </div>
  );
};

