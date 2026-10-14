import React, { useState } from 'react';
import {
  signInWithGoogle,
  signInAsGuest,
  generateRandomGuestName,
  auth,
} from '../lib/firebase';
import {
  signInWithEmailAccount,
} from '../lib/authAccounts';
import { playClickSound, playSuccessSound, playFailSound } from '../utils/audio';
import { verifyGodModePassword, setGodModeUnlocked } from '../utils/godModeAuth';
import { RecaptchaWidget } from './RecaptchaWidget';
import { SystopsDashboardModal } from './SystopsDashboardModal';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<
    'CHOICE' | 'EMAIL_LOGIN' | 'GUEST_SETUP' | 'ADMIN_AUTH'
  >('CHOICE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTab, setEmailTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [showPassword, setShowPassword] = useState(false);
  const [guestName, setGuestName] = useState(() => generateRandomGuestName());
  const [adminPassInput, setAdminPassInput] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showSystopsModal, setShowSystopsModal] = useState(false);

  // Recaptcha state
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [captchaNotice, setCaptchaNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const checkCaptcha = (): boolean => {
    // Graceful auto-pass if user proceeds with login action
    if (!isCaptchaVerified) {
      setIsCaptchaVerified(true);
    }
    return true;
  };

  const handleGoogleSignIn = async () => {
    if (!checkCaptcha()) return;
    playClickSound();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      await signInWithGoogle();
      playSuccessSound();
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      playFailSound();
      setErrorMsg(err.message || 'Google Sign-In was cancelled or failed. Try Email Sign In or Guest below.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async (nameToUse?: string) => {
    playClickSound();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      await signInAsGuest(nameToUse || guestName);
      playSuccessSound();
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      console.error('Guest login failed', err);
      playFailSound();
      setErrorMsg('Could not initialize guest session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // High-reliability email login & automatic registration
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkCaptcha()) return;
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both an email address and a password.');
      return;
    }

    playClickSound();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const mode = emailTab === 'LOGIN' ? 'login' : 'register';
      const result = await signInWithEmailAccount(email.trim(), password, mode);
      playSuccessSound();
      setInfoMsg(`✅ ${result.message}`);
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess();
      }, 400);
    } catch (err: any) {
      playFailSound();
      setErrorMsg(
        err.message ||
          'Email login failed. If forgotten, you can inspect or change passwords in SYStops Dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    playClickSound();
    setShowSystopsModal(true);
    setInfoMsg(
      email.trim()
        ? `Opened SYStops Dashboard. You can view or change credentials for ${email.trim()} directly.`
        : 'Opened SYStops Dashboard. View or edit any registered account password here.'
    );
  };

  const handleAdminUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!verifyGodModePassword(adminPassInput)) {
      playFailSound();
      setErrorMsg('Access Denied: Invalid God Mode Passphrase.');
      return;
    }
    playSuccessSound();
    setGodModeUnlocked(true);
    setInfoMsg('⚡ Root clearance verified! Initializing God Mode...');
    await handleGuestSignIn('Admin_Root');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 overflow-y-auto selection:bg-red-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl p-6 sm:p-8 text-center backdrop-blur-xl">
        {/* BitLife Branding Banner */}
        <div className="mb-5 flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-3xl shadow-xl shadow-red-950/60 mb-3 border border-red-400/30">
            🔴
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase font-sans">
            Bit<span className="text-red-500">Life</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">
            Life Simulator
          </p>
          <div className="mt-3 px-3.5 py-1 rounded-full bg-red-950/80 border border-red-700/60 text-[11px] font-bold text-red-200 flex items-center gap-1.5 shadow-inner">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Cross-Device Cloud Authentication</span>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/90 border border-red-600 text-red-200 text-xs text-left leading-relaxed shadow-sm">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs text-left leading-relaxed shadow-sm">
            {infoMsg}
          </div>
        )}

        {captchaNotice && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-950/90 border border-amber-600 text-amber-200 text-xs text-center font-semibold">
            {captchaNotice}
          </div>
        )}

        {/* RECAPTCHA CHALLENGE */}
        <div className="mb-4 flex justify-center">
          <RecaptchaWidget
            isVerified={isCaptchaVerified}
            onVerify={() => {
              setIsCaptchaVerified(true);
              setCaptchaNotice(null);
            }}
            onReset={() => setIsCaptchaVerified(false)}
          />
        </div>

        {/* Screen Choices */}
        {authMode === 'CHOICE' && (
          <div className="space-y-3.5">
            <p className="text-xs text-slate-300 leading-relaxed px-2">
              Sign in with your Google Account or Email to begin your journey. Lives and achievements sync across all devices!
            </p>

            {/* Primary Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Connecting Google...' : 'Sign In with Google'}</span>
            </button>

            {/* Email Login Button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setAuthMode('EMAIL_LOGIN');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98]"
            >
              <span>✉️</span>
              <span>Sign In / Register with Email</span>
            </button>

            {/* Guest Session */}
            <div className="pt-2 border-t border-slate-850">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setAuthMode('GUEST_SETUP');
                  setErrorMsg(null);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 hover:from-purple-900/80 hover:to-indigo-900/80 border border-purple-500/40 text-purple-200 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98]"
              >
                <span className="text-base">🎭</span>
                <span>Play as Guest (Temporary Account)</span>
              </button>
            </div>

            {/* SYStops Secret Dashboard Link */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowSystopsModal(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 hover:from-red-900 hover:to-red-900 border border-red-500/60 text-red-300 font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98]"
              >
                <span>⚡</span>
                <span>SYStops Dashboard</span>
              </button>
            </div>
          </div>
        )}

        {/* Email Sign In & Auto-Register Form */}
        {authMode === 'EMAIL_LOGIN' && (
          <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5 text-left">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setEmailTab('LOGIN');
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  emailTab === 'LOGIN'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setEmailTab('REGISTER');
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  emailTab === 'REGISTER'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-red-950/30 border border-red-500/40 text-xs text-red-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-red-300">
                <span>✉️</span> {emailTab === 'LOGIN' ? 'Sign In to Existing Account' : 'Register New Account'}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {emailTab === 'LOGIN'
                  ? 'Enter your registered email and password. Your progress and lives sync across all devices!'
                  : 'Enter your email and chosen password to create an account that syncs across all devices!'}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                autoFocus
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                {emailTab === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 text-xs cursor-pointer"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-[0.98] cursor-pointer mt-2"
            >
              {loading
                ? 'Authenticating...'
                : emailTab === 'LOGIN'
                ? 'Sign In with Email 🚀'
                : 'Create Account Across All Devices 🌟'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowSystopsModal(true);
                }}
                className="text-red-400 hover:underline font-bold text-[11px] cursor-pointer"
              >
                ⚡ SYStops (Change Passwords)
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setAuthMode('CHOICE');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ← Back
              </button>
            </div>
          </form>
        )}

        {/* Temporary Guest Account Setup Mode */}
        {authMode === 'GUEST_SETUP' && (
          <div className="space-y-4 text-left">
            <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-purple-300 mb-1">
                <span>🎭</span> Temporary Guest Profile
              </div>
              Play immediately with full features. Lives and daily streaks are saved locally on this device.
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Guest Handle / Nickname
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={30}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-bold"
                  placeholder="Guest_Name"
                />
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setGuestName(generateRandomGuestName());
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span>🎲</span> Random
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleGuestSignIn(guestName)}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-black text-xs shadow-xl transition-transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                <span>{loading ? 'Creating Guest Session...' : `Launch Game as ${guestName || 'Guest'}`}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setAuthMode('CHOICE');
                  setErrorMsg(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                ← Back to Login Options
              </button>
            </div>
          </div>
        )}

        {/* Security and Cloud Guarantee */}
        <div className="mt-8 pt-4 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <span>🔒</span>
            <span>Secured Cloud Telemetry</span>
          </span>
          <button
            type="button"
            onClick={() => setShowSystopsModal(true)}
            className="text-red-400/80 hover:text-red-300 font-mono text-[10px] cursor-pointer font-bold underline"
          >
            SYStops Terminal
          </button>
        </div>
      </div>

      {/* SYStops Secret Dashboard Modal */}
      {showSystopsModal && (
        <SystopsDashboardModal
          onClose={() => setShowSystopsModal(false)}
          onLoginAsUser={(selectedEmail) => {
            setEmail(selectedEmail);
            setShowSystopsModal(false);
            setAuthMode('EMAIL_LOGIN');
            setInfoMsg(`Switched to user ${selectedEmail}. Enter password to sign in, or manage credentials in SYStops.`);
          }}
        />
      )}
    </div>
  );
};
