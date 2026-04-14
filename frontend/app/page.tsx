'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register, verifyOTP, sendOTP } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // Step 1: Entry, Step 2: OTP
  const [isLoginMode, setIsLoginMode] = useState(false); // Toggle between Register and Login
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
  });
  const [loginIdentifier, setLoginIdentifier] = useState('');

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpIdentifier, setOtpIdentifier] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.full_name.trim()) throw new Error('Full name is required');
      if (!formData.email.trim()) throw new Error('Email is required');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) throw new Error('Invalid email format');
      if (!formData.mobile.match(/^\d{10}$/)) throw new Error('Mobile number must be 10 digits');

      const response = await register(formData);
      setSuccess(response.message);
      setOtpIdentifier(formData.email);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!loginIdentifier.trim()) throw new Error('Email or mobile is required');

      const response = await sendOTP({ identifier: loginIdentifier });
      setSuccess('OTP sent successfully!');
      setOtpIdentifier(loginIdentifier);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!otp.match(/^\d{6}$/)) throw new Error('OTP must be 6 digits');

      const response = await verifyOTP({ identifier: otpIdentifier, otp });
      setSuccess('OTP verified! Redirecting...');
      
      setTimeout(() => {
        router.push('/apply');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await sendOTP({ identifier: otpIdentifier });
      setSuccess('OTP resent successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setSuccess('');
  };

  const handleBackToEntry = () => {
    setStep(1);
    setError('');
    setSuccess('');
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950 flex items-center justify-center p-4 transition-colors duration-500">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-slate-700 backdrop-blur-sm transition-all duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">NexLoan</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Powered by Theoremlabs</p>
        </div>

        {step === 1 ? (
          // Step 1: Entry (Login or Register)
          !isLoginMode ? (
            <form onSubmit={handleRegister} className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Create Your Account</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Full Name</label>
                <input
                  type="text" name="full_name" value={formData.full_name} onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Email</label>
                <input
                  type="email" name="email" value={formData.email} onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Mobile Number</label>
                <input
                  type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange}
                  placeholder="10-digit mobile number" maxLength={10}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">{error}</div>}
              {success && <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm">{success}</div>}

              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-lg shadow-blue-500/30 disabled:bg-gray-400 dark:disabled:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-95">
                {loading ? 'Creating Account...' : 'Continue'}
              </button>

              <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6">
                Already have an account?{' '}
                <button type="button" onClick={toggleMode} className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">Sign in</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Welcome Back</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Email or Mobile Number</label>
                <input
                  type="text" value={loginIdentifier} onChange={(e) => { setLoginIdentifier(e.target.value); setError(''); }}
                  placeholder="Enter registered email or mobile"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">{error}</div>}
              {success && <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm">{success}</div>}

              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-lg shadow-blue-500/30 disabled:bg-gray-400 dark:disabled:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-95">
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6">
                Don't have an account?{' '}
                <button type="button" onClick={toggleMode} className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">Create one</button>
              </p>
            </form>
          )
        ) : (
          // Step 2: OTP Verification
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Verify Your Identity</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">
              We've sent a 6-digit OTP to <strong className="text-gray-900 dark:text-white">{otpIdentifier}</strong>
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">Enter 6-digit OTP</label>
              <input
                type="text" value={otp} onChange={(e) => { setOtp(e.target.value.slice(0, 6)); setError(''); }}
                placeholder="000000" maxLength={6}
                className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-center text-3xl font-bold tracking-[0.5em] text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-200 dark:placeholder:text-slate-800"
              />
            </div>

            {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm">{success}</div>}

            <button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-lg shadow-blue-500/30 disabled:bg-gray-400 dark:disabled:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 mb-4">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="flex gap-4 text-center text-sm pt-4">
              <button type="button" onClick={handleResendOTP} disabled={loading} className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium disabled:opacity-50 transition">
                Resend OTP
              </button>
              <button type="button" onClick={handleBackToEntry} disabled={loading} className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium disabled:opacity-50 transition">
                Back
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-slate-700 text-center text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold">
          <p>© 2026 NexLoan • Secured by Advanced Encryption</p>
        </div>
      </div>
    </div>

  );
}
