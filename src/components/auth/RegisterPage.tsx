import React, { useState } from 'react';
import {
  Wrench,
  Mail,
  Lock,
  User,
  Shield,
  Briefcase,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Info,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { CampusFixLogo } from '../common/CampusFixLogo';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<'student' | 'faculty' | 'maintenance'>('student');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation checks
  const hasMinLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !idNumber.trim() || !department.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please provide a valid institutional email address.');
      return;
    }

    if (!hasMinLength) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to institutional campus maintenance guidelines.');
      return;
    }

    try {
      setLoading(true);
      await register(email, password, fullName, role, idNumber, department);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <CampusFixLogo variant="stacked" size="lg" className="mb-2" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Create Campus Account</h1>
          <p className="mt-1 text-xs text-slate-500">
            Register your institutional profile on the CampusFix Portal
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 bg-white py-8 px-6 shadow-xs rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select Your Campus Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    role === 'student'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20 font-bold'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <GraduationCap className={`w-5 h-5 mb-1 ${role === 'student' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-xs">Student</span>
                  <span className="text-[10px] text-slate-400">Auto-activated</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('faculty')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    role === 'faculty'
                      ? 'border-sky-500 bg-sky-50/70 text-sky-900 ring-2 ring-sky-500/20 font-bold'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <Briefcase className={`w-5 h-5 mb-1 ${role === 'faculty' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span className="text-xs">Faculty</span>
                  <span className="text-[10px] text-slate-400">Auto-activated</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('maintenance')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    role === 'maintenance'
                      ? 'border-amber-500 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20 font-bold'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <Wrench className={`w-5 h-5 mb-1 ${role === 'maintenance' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className="text-xs">Maintenance</span>
                  <span className="text-[10px] text-amber-600 font-semibold">Requires Approval</span>
                </button>
              </div>

              {role === 'maintenance' && (
                <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Institutional Security Policy:</strong> Maintenance Team accounts are registered in <em>Pending Approval</em> state and cannot take work orders until an authorized Main Administrator verifies employee credentials.
                  </p>
                </div>
              )}
            </div>

            {/* Full Name & College Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maya Iyer"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  College Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. maya@campusfix.edu"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* ID Number & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {role === 'student' ? 'Student Roll/ID' : role === 'faculty' ? 'Faculty ID' : 'Employee ID'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={role === 'student' ? 'STU-2024-EC-08' : 'EMP-3049'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Department / Section <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Mechanical Engg / Hostel 4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Password strength indicators */}
            <div className="flex gap-4 text-[11px] text-slate-500">
              <span className={`inline-flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-semibold' : ''}`}>
                <Check className={`w-3 h-3 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                6+ chars
              </span>
              <span className={`inline-flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600 font-semibold' : ''}`}>
                <Check className={`w-3 h-3 ${passwordsMatch ? 'text-emerald-600' : 'text-slate-300'}`} />
                Passwords match
              </span>
            </div>

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600 leading-snug">
                  I confirm the accuracy of my university credentials and agree to use CampusFix for legitimate facility issue reporting according to the college code of conduct.
                </span>
              </label>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                {loading ? 'Creating Profile...' : 'Complete Registration'}
              </button>
            </div>
          </form>

          {/* Back to Login */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
