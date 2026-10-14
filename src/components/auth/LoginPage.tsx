import React, { useState } from 'react';
import {
  Wrench,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Shield,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { useAuth, DEMO_PROFILES } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { CampusFixLogo } from '../common/CampusFixLogo';

interface LoginPageProps {
  onNavigateToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
  const { login, loginWithGoogle, resetPassword, switchDemoRole, error: authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Please provide both your college email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err: any) {
      setLocalError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetError('Please enter a valid campus email address.');
      return;
    }

    try {
      setResetLoading(true);
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    switchDemoRole(role);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 sm:py-12 px-3 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      {/* Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <CampusFixLogo variant="stacked" size="xl" className="mb-2" />
          <p className="mt-1 text-xs font-semibold text-sky-700">
            Intelligent Campus Maintenance & Resolution System
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Multi-role facilities incident triage, automated priority scoring, and lifecycle management.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-6 bg-white py-6 sm:py-8 px-4 sm:px-10 shadow-xs rounded-2xl border border-slate-200">
          {(localError || authError) && (() => {
            const errText = localError || authError || '';
            const isDomainError =
              errText.toLowerCase().includes('unauthorized-domain') ||
              errText.toLowerCase().includes('authorized domain');

            if (isDomainError) {
              const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'your-domain.vercel.app';
              return (
                <div className="mb-5 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-amber-900 block text-xs">
                        Deployment Domain Not Authorized in Firebase
                      </strong>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        Firebase blocks Google Sign-In popups on newly deployed domains (such as Vercel) until the domain is added to your project's allowlist.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-amber-200 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Domain to authorize:
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                      <code className="text-xs font-mono font-semibold text-indigo-700 truncate">
                        {currentHostname}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== 'undefined') {
                            navigator.clipboard.writeText(currentHostname);
                            setCopiedDomain(true);
                            setTimeout(() => setCopiedDomain(false), 2000);
                          }
                        }}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition flex items-center gap-1 shrink-0"
                      >
                        {copiedDomain ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>Copy Domain</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-amber-900 space-y-1 pt-1">
                    <p className="font-semibold">Quick Fix Steps in Firebase Console:</p>
                    <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-amber-800">
                      <li>Open Firebase Console &rarr; <strong>Authentication</strong> &rarr; <strong>Settings</strong> tab.</li>
                      <li>Scroll down to <strong>Authorized domains</strong> and click <strong>Add domain</strong>.</li>
                      <li>Paste <code className="font-mono bg-amber-100 px-1 rounded">{currentHostname}</code> and save.</li>
                    </ol>
                  </div>

                  <div className="pt-1 text-[11px] text-slate-600 border-t border-amber-200/80">
                    <em>Tip:</em> You can also sign in right now with <strong>Email & Password</strong> or use the <strong>Quick Demo</strong> buttons below without configuring domains.
                  </div>
                </div>
              );
            }

            return (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errText}</span>
              </div>
            );
          })()}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Campus Email Address
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@campusfix.edu"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 transition"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In to Portal
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-semibold text-[10px]">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In */}
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                try {
                  setLocalError(null);
                  await loginWithGoogle();
                } catch (err: any) {
                  setLocalError(err.message || 'Google sign-in could not be completed');
                }
              }}
              className="w-full flex justify-center items-center gap-2.5 py-2.5 px-4 border border-slate-200 rounded-lg shadow-xs text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Sign In with Google Account
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              New to CampusFix?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="font-semibold text-indigo-600 hover:text-indigo-800 transition"
              >
                Register a new campus account
              </button>
            </p>
          </div>
        </div>

        {/* Demo Roles Quick Switcher for Evaluation */}
        <div className="mt-5 bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Evaluation Demo Quick-Switcher
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Click any role to test dashboard views and workflows immediately:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleQuickDemo('admin')}
              className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-indigo-50/50 text-slate-800 rounded-lg border border-slate-200 hover:border-indigo-300 transition group"
            >
              <Shield className="w-4 h-4 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Main Admin</span>
              <span className="text-[10px] text-slate-500">Governance</span>
            </button>
            <button
              onClick={() => handleQuickDemo('maintenance')}
              className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-indigo-50/50 text-slate-800 rounded-lg border border-slate-200 hover:border-indigo-300 transition group"
            >
              <Wrench className="w-4 h-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Maintenance</span>
              <span className="text-[10px] text-slate-500">Work Orders</span>
            </button>
            <button
              onClick={() => handleQuickDemo('faculty')}
              className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-indigo-50/50 text-slate-800 rounded-lg border border-slate-200 hover:border-indigo-300 transition group"
            >
              <Briefcase className="w-4 h-4 text-sky-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Faculty</span>
              <span className="text-[10px] text-slate-500">Department</span>
            </button>
            <button
              onClick={() => handleQuickDemo('student')}
              className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-indigo-50/50 text-slate-800 rounded-lg border border-slate-200 hover:border-indigo-300 transition group"
            >
              <GraduationCap className="w-4 h-4 text-slate-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Student</span>
              <span className="text-[10px] text-slate-500">Hostel & Class</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Reset Password</h3>
            <p className="text-xs text-slate-600 mb-4">
              Enter your registered campus email address. A password recovery link will be dispatched via Firebase Auth.
            </p>

            {resetSent ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Password reset email dispatched! Please check your campus inbox and spam folder.
                </span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                {resetError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                    {resetError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="e.g. user@campusfix.edu"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setResetSent(false);
                      setResetError(null);
                    }}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                  >
                    {resetLoading ? 'Sending...' : 'Send Recovery Link'}
                  </button>
                </div>
              </form>
            )}

            {resetSent && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetSent(false);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
