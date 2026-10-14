import React, { useState, useEffect } from 'react';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  saveCharacterToCloud,
  loadCharacterFromCloud,
} from '../lib/firebase';
import { signInWithEmailAccount } from '../lib/authAccounts';
import { User as FirebaseUser } from 'firebase/auth';
import { Character } from '../types/bitlife';
import { playCashSound, playClickSound, playFailSound, playSuccessSound } from '../utils/audio';

interface AuthModalProps {
  currentUser: any;
  character: Character;
  onCharacterLoaded: (char: Character) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  character,
  onCharacterLoaded,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'GOOGLE_OR_EMAIL' | 'EMAIL_FORM'>('GOOGLE_OR_EMAIL');
  const [isRegistering, setIsRegistering] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Quick Google Sign-In
  const handleGoogleSignIn = async () => {
    playClickSound();
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const user = await signInWithGoogle();
      playSuccessSound();
      setStatusMsg(`Successfully signed in as ${user.displayName || user.email}!`);
      // If cloud save exists across devices, load it; otherwise save current character
      const existingCloud = await loadCharacterFromCloud();
      if (existingCloud) {
        onCharacterLoaded(existingCloud);
        setSyncStatus(`Loaded active life "${existingCloud.firstName} ${existingCloud.lastName}" from Cloud ☁️`);
      } else {
        await saveCharacterToCloud(character);
        setSyncStatus('Character synced to Cloud Firestore ☁️');
      }
    } catch (err: any) {
      console.error(err);
      playFailSound();
      setErrorMsg(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Email / Password / Verification
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    playClickSound();
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const result = await signInWithEmailAccount(email, password, isRegistering ? 'register' : 'login');
      setStatusMsg(`✅ ${result.message}`);
      playSuccessSound();
      // If cloud save exists across devices, load it; otherwise save current character
      const existingCloud = await loadCharacterFromCloud();
      if (existingCloud) {
        onCharacterLoaded(existingCloud);
        setSyncStatus(`Loaded active life "${existingCloud.firstName} ${existingCloud.lastName}" from Cloud ☁️`);
      } else {
        await saveCharacterToCloud(character);
        setSyncStatus('Character backed up to Firestore ☁️');
      }
    } catch (err: any) {
      playFailSound();
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  // Save character manually
  const handleSaveToCloud = async () => {
    playClickSound();
    setLoading(true);
    setErrorMsg(null);
    try {
      await saveCharacterToCloud(character);
      playSuccessSound();
      playCashSound();
      setSyncStatus(`Saved "${character.firstName} ${character.lastName}" to Firestore! ☁️`);
    } catch (err: any) {
      playFailSound();
      setErrorMsg('Failed to save to cloud database.');
    } finally {
      setLoading(false);
    }
  };

  // Load character manually
  const handleLoadFromCloud = async () => {
    playClickSound();
    setLoading(true);
    setErrorMsg(null);
    try {
      const loaded = await loadCharacterFromCloud();
      if (loaded) {
        playSuccessSound();
        onCharacterLoaded(loaded);
        setStatusMsg(`Successfully loaded character: ${loaded.firstName} ${loaded.lastName}!`);
        onClose();
      } else {
        setErrorMsg('No active character save found in your cloud database.');
      }
    } catch (err: any) {
      playFailSound();
      setErrorMsg('Failed to load character from cloud database.');
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    playClickSound();
    setLoading(true);
    try {
      await signOutUser();
      playSuccessSound();
      setStatusMsg('Signed out successfully.');
    } catch (err: any) {
      setErrorMsg('Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white text-left">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">☁️</span>
            <div>
              <h3 className="font-bold text-sm text-white">Cloud Save & Identity</h3>
              <p className="text-[10px] text-slate-400">Firebase Firestore & Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
          >
            ✕
          </button>
        </div>

        {statusMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-xs">
            {statusMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-950/80 border border-red-600/60 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {syncStatus && (
          <div className="mb-3 p-2.5 rounded-xl bg-blue-950/80 border border-blue-600/60 text-blue-300 text-xs font-mono">
            {syncStatus}
          </div>
        )}

        {currentUser ? (
          /* User is Signed In */
          <div className="space-y-4">
            {currentUser.isAnonymous || currentUser.email?.includes('temporary.bitlife') || currentUser.email?.includes('guest.bitlife') ? (
              <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/50 text-purple-200 text-xs">
                <div className="flex items-center justify-between font-bold text-purple-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span>🎭</span> Temporary Guest Dummy Profile
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-800/80 text-white font-mono">
                    Device Save
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                  You are playing with a temporary guest dummy profile. Your live character and daily streak bonuses are saved on this device.
                </p>
                <button
                  onClick={() => {
                    playClickSound();
                    handleGoogleSignIn();
                  }}
                  disabled={loading}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shadow flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                  <span>Upgrade to Google Cloud Account</span>
                </button>
              </div>
            ) : null}

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Avatar"
                  className="w-11 h-11 rounded-full border-2 border-emerald-500 object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-purple-700 flex items-center justify-center font-black text-sm">
                  {currentUser.isAnonymous ? '🎭' : (currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U')}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-white truncate">
                  {currentUser.displayName || 'BitLife Player'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                <div className="text-[10px] flex items-center gap-1 mt-0.5">
                  {currentUser.isAnonymous ? (
                    <span className="text-purple-300 font-semibold flex items-center gap-0.5">
                      🎭 Temporary Guest Mode
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                      ✓ Cloud Account Active & Synced
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleSaveToCloud}
                disabled={loading}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow flex items-center justify-center gap-1.5"
              >
                <span>💾</span> Backup to Cloud
              </button>
              <button
                onClick={handleLoadFromCloud}
                disabled={loading}
                className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow flex items-center justify-center gap-1.5"
              >
                <span>📥</span> Load from Cloud
              </button>
            </div>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 font-semibold text-xs text-slate-300 border border-slate-700"
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* User is NOT Signed In */
          <div className="space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Sign in with Google or your email to persist your life simulations, past lives cemetery, and wealth across devices!
            </p>

            {authMode === 'GOOGLE_OR_EMAIL' ? (
              <div className="space-y-2.5">
                {/* Primary Google Login Button */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <span>Sign in with Google</span>
                </button>

                <div className="flex items-center my-2 text-slate-500 text-[10px]">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="px-2 uppercase tracking-wider font-semibold">Or with Email</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                <button
                  onClick={() => setAuthMode('EMAIL_FORM')}
                  className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2"
                >
                  <span>✉️</span> Continue with Email & Password
                </button>
              </div>
            ) : (
              /* Email Form */
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="player@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-transform active:scale-[0.98]"
                >
                  {isRegistering ? 'Create Account & Push Verify' : 'Sign In with Email'}
                </button>

                <div className="flex justify-between items-center text-[11px] pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-teal-400 hover:underline"
                  >
                    {isRegistering ? 'Have an account? Sign in' : 'Need an account? Register'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthMode('GOOGLE_OR_EMAIL')}
                    className="text-slate-400 hover:text-white"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
