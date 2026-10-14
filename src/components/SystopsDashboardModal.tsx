import React, { useState, useEffect } from 'react';
import {
  AccountRecord,
  LoginAuditRecord,
  getAllAccountsFromCloud,
  getAllLoginsFromCloud,
  subscribeToCloudAccounts,
  subscribeToCloudLogins,
  changeAccountPasswordInCloud,
  bulkChangeAllPasswordsInCloud,
  deleteAccountFromCloud,
  signInWithEmailAccount,
  verifySystopsPassword,
  SYSTOPS_MASTER_PASSWORD,
} from '../lib/authAccounts';
import {
  playClickSound,
  playSuccessSound,
  playFailSound,
  playCashSound,
} from '../utils/audio';

interface SystopsDashboardModalProps {
  onClose: () => void;
  onLoginAsUser?: (email: string) => void;
}

export const SystopsDashboardModal: React.FC<SystopsDashboardModalProps> = ({
  onClose,
  onLoginAsUser,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'PASSWORDS' | 'LOGINS' | 'NEW_ACCOUNT'>('PASSWORDS');
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [logins, setLogins] = useState<LoginAuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Search queries
  const [accountSearch, setAccountSearch] = useState('');
  const [loginSearch, setLoginSearch] = useState('');

  // Password editing state
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [showAllPasswords, setShowAllPasswords] = useState(false);

  // Direct target password change form
  const [targetEmailInput, setTargetEmailInput] = useState('');
  const [targetPassInput, setTargetPassInput] = useState('');

  // Bulk password change form
  const [bulkPasswordInput, setBulkPasswordInput] = useState('');
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // New account form
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (verifySystopsPassword(passwordInput)) {
      playSuccessSound();
      setIsUnlocked(true);
      setAuthError(null);
      loadAllData();
      showToast('⚡ SYStops Authorization Verified! Live connected across all devices.');
    } else {
      playFailSound();
      setAuthError('Access Denied: Invalid SYStops passphrase.');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [accs, logs] = await Promise.all([
        getAllAccountsFromCloud(),
        getAllLoginsFromCloud(),
      ]);
      setAccounts(accs);
      setLogins(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time Firestore sync across all devices when unlocked
  useEffect(() => {
    if (!isUnlocked) return;

    loadAllData();
    const unsubAccs = subscribeToCloudAccounts((liveAccs) => {
      setAccounts(liveAccs);
    });
    const unsubLogs = subscribeToCloudLogins((liveLogs) => {
      setLogins(liveLogs);
    });

    return () => {
      unsubAccs();
      unsubLogs();
    };
  }, [isUnlocked]);

  // Handle changing password for a specific account
  const handleSavePasswordChange = async (email: string, passwordToSet: string) => {
    if (!passwordToSet.trim()) {
      showToast('⚠️ Password cannot be empty.');
      return;
    }

    playClickSound();
    setLoading(true);
    try {
      await changeAccountPasswordInCloud(email, passwordToSet.trim());
      playSuccessSound();
      playCashSound();
      showToast(`✅ Password for ${email} successfully changed across all devices!`);
      setEditingEmail(null);
      setNewPasswordVal('');
      setTargetEmailInput('');
      setTargetPassInput('');
      await loadAllData();
    } catch (err: any) {
      playFailSound();
      showToast(`❌ Error: ${err.message || 'Could not update password.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk password change across all accounts
  const handleBulkChangeAllPasswords = async () => {
    if (!bulkPasswordInput.trim()) {
      showToast('⚠️ Please enter a new password for all accounts.');
      return;
    }

    playClickSound();
    setLoading(true);
    try {
      const updatedCount = await bulkChangeAllPasswordsInCloud(bulkPasswordInput.trim());
      playSuccessSound();
      playCashSound();
      showToast(`⚡ BULK OVERRIDE: Updated passwords for ${updatedCount} account(s) across all devices!`);
      setBulkPasswordInput('');
      setShowBulkConfirm(false);
      await loadAllData();
    } catch (err: any) {
      playFailSound();
      showToast(`❌ Error: ${err.message || 'Bulk password change failed.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle creating new user credentials from SYStops
  const handleCreateNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPass.trim()) {
      showToast('⚠️ Please enter both email and password.');
      return;
    }

    playClickSound();
    setLoading(true);
    try {
      await signInWithEmailAccount(newEmail.trim(), newPass.trim(), 'register');
      playSuccessSound();
      showToast(`✅ New account registered across all devices: ${newEmail.trim()}`);
      setNewEmail('');
      setNewPass('');
      setActiveTab('PASSWORDS');
      await loadAllData();
    } catch (err: any) {
      playFailSound();
      showToast(`❌ ${err.message || 'Registration failed.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle reveal password
  const toggleShowPassword = (email: string) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [email]: !prev[email],
    }));
  };

  // Filtered accounts
  const filteredAccounts = accounts.filter(
    (a) =>
      a.email.toLowerCase().includes(accountSearch.toLowerCase()) ||
      a.displayName?.toLowerCase().includes(accountSearch.toLowerCase()) ||
      a.role?.toLowerCase().includes(accountSearch.toLowerCase())
  );

  // Filtered logins
  const filteredLogins = logins.filter(
    (l) =>
      l.email.toLowerCase().includes(loginSearch.toLowerCase()) ||
      l.device?.toLowerCase().includes(loginSearch.toLowerCase()) ||
      l.action?.toLowerCase().includes(loginSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-slate-950 border border-red-500/80 shadow-2xl shadow-red-950/70 text-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-b border-red-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/30 border border-red-500 flex items-center justify-center text-2xl shadow-md">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wider text-red-300 uppercase font-mono">
                  SYStops Secret Dashboard
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-900/60 text-red-200 border border-red-500/40 font-bold">
                  RESTRICTED CONSOLE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync Across All Devices
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                View All Player Logins & Change All Account Passwords Across All Devices
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Close ✕
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="bg-emerald-600 text-slate-950 px-4 py-2 text-xs font-black text-center shadow-lg animate-in slide-in-from-top-1 shrink-0">
            {toastMsg}
          </div>
        )}

        {/* LOCKED STATE: Prompt for Master Passphrase */}
        {!isUnlocked ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-3xl bg-red-950/80 border border-red-600 flex items-center justify-center text-3xl shadow-xl animate-pulse">
              🔒
            </div>

            <div>
              <h4 className="text-lg font-black text-white uppercase tracking-wider font-mono">
                SYStops Passphrase Authorization
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Enter the secret SYStops master passphrase to inspect all active player logins and change passwords across all devices.
              </p>
            </div>

            {authError && (
              <div className="w-full p-2.5 rounded-xl bg-red-950/90 border border-red-600 text-red-200 text-xs font-bold">
                {authError}
              </div>
            )}

            <form onSubmit={handleUnlockSubmit} className="w-full space-y-3">
              <input
                type="password"
                autoFocus
                placeholder="Enter master passphrase..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-900 border border-red-700/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 text-white placeholder:text-slate-600 text-center font-mono text-sm tracking-widest outline-none"
              />

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/60 transition-transform active:scale-[0.98] cursor-pointer"
              >
                Authenticate & Access Dashboard 🔓
              </button>
            </form>
          </div>
        ) : (
          /* UNLOCKED STATE: DASHBOARD CONTROLS */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Tab Bar */}
            <div className="grid grid-cols-3 bg-slate-900 border-b border-slate-800 text-xs font-bold shrink-0">
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('PASSWORDS');
                }}
                className={`py-3 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'PASSWORDS'
                    ? 'bg-red-950/80 text-red-300 border-b-2 border-red-500'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🔑</span>
                <span>All Accounts & Passwords ({accounts.length})</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('LOGINS');
                }}
                className={`py-3 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'LOGINS'
                    ? 'bg-red-950/80 text-red-300 border-b-2 border-red-500'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📋</span>
                <span>All Logins & Live Stream ({logins.length})</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('NEW_ACCOUNT');
                }}
                className={`py-3 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'NEW_ACCOUNT'
                    ? 'bg-red-950/80 text-red-300 border-b-2 border-red-500'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>➕</span>
                <span>Create New User Login</span>
              </button>
            </div>

            {/* TAB 1: ALL ACCOUNTS & PASSWORDS */}
            {activeTab === 'PASSWORDS' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* TOOL 1: QUICK CHANGE ANY PASSWORD */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/60 via-slate-900 to-red-950/60 border border-red-500/50 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚡</span>
                      <div>
                        <h4 className="text-xs font-black text-red-300 uppercase tracking-wider font-mono">
                          Change Password for Any Account (Across All Devices)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Instantly overwrite the password in Cloud Firestore for any player email address.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="email"
                      placeholder="Target Email (e.g. user@test.com)"
                      value={targetEmailInput}
                      onChange={(e) => setTargetEmailInput(e.target.value)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 outline-none focus:border-red-500 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="New Password to assign"
                      value={targetPassInput}
                      onChange={(e) => setTargetPassInput(e.target.value)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 outline-none focus:border-red-500 font-mono"
                    />
                    <button
                      type="button"
                      disabled={loading || !targetEmailInput.trim() || !targetPassInput.trim()}
                      onClick={() => handleSavePasswordChange(targetEmailInput, targetPassInput)}
                      className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider shadow cursor-pointer transition-transform active:scale-95"
                    >
                      Update Password 🚀
                    </button>
                  </div>
                </div>

                {/* TOOL 2: BULK CHANGE ALL PASSWORDS */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔁</span>
                      <span className="text-xs font-bold text-slate-200">
                        Bulk Change ALL User Passwords at Once
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBulkConfirm(!showBulkConfirm)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                    >
                      {showBulkConfirm ? 'Cancel Bulk Tool' : 'Open Bulk Reset Tool'}
                    </button>
                  </div>

                  {showBulkConfirm && (
                    <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-600/40 space-y-2 animate-in slide-in-from-top-1">
                      <p className="text-[11px] text-amber-200">
                        Warning: This will set the new password across ALL {accounts.length} registered player accounts in Cloud Firestore!
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Uniform password for all accounts..."
                          value={bulkPasswordInput}
                          onChange={(e) => setBulkPasswordInput(e.target.value)}
                          className="flex-1 p-2 rounded-xl bg-slate-950 border border-amber-700/60 text-xs text-white font-mono outline-none"
                        />
                        <button
                          type="button"
                          disabled={loading || !bulkPasswordInput.trim()}
                          onClick={handleBulkChangeAllPasswords}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
                        >
                          Confirm Bulk Change ⚠️
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-between pt-1">
                  <div className="relative w-full sm:w-80">
                    <input
                      type="text"
                      placeholder="Search accounts by email or role..."
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      className="w-full py-2 pl-8 pr-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-red-500 outline-none"
                    />
                    <span className="absolute left-2.5 top-2 text-xs text-slate-500">🔍</span>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setShowAllPasswords(!showAllPasswords)}
                      className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{showAllPasswords ? '🙈' : '👁️'}</span>
                      <span>{showAllPasswords ? 'Hide All Passwords' : 'Show All Passwords'}</span>
                    </button>
                    <button
                      onClick={loadAllData}
                      disabled={loading}
                      className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🔄</span>
                      <span>{loading ? 'Syncing...' : 'Refresh'}</span>
                    </button>
                  </div>
                </div>

                {/* Account Cards / Table */}
                <div className="space-y-2">
                  {filteredAccounts.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                      <div className="text-3xl">📭</div>
                      <div className="font-bold text-sm text-slate-300">No User Accounts Found</div>
                      <p className="text-xs text-slate-500">
                        When players register or sign in with their email, their accounts and passwords appear here live across all devices.
                      </p>
                    </div>
                  ) : (
                    filteredAccounts.map((acc) => {
                      const isEditing = editingEmail === acc.email;
                      const isRevealed = showAllPasswords || !!showPasswordMap[acc.email];

                      return (
                        <div
                          key={acc.id}
                          className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-red-500/40 transition-colors space-y-2.5 shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-2xl shrink-0">👤</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-white truncate">
                                    {acc.email}
                                  </span>
                                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-500/40 font-bold shrink-0">
                                    {acc.role || 'USER'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">
                                  Display Name: <strong className="text-slate-300">{acc.displayName}</strong> · Device: {acc.lastDevice || 'Unknown'}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  playClickSound();
                                  setEditingEmail(isEditing ? null : acc.email);
                                  setNewPasswordVal(acc.password);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 border border-red-500/60 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                              >
                                <span>✏️</span>
                                <span>{isEditing ? 'Cancel' : 'Change Password'}</span>
                              </button>

                              {onLoginAsUser && (
                                <button
                                  onClick={() => {
                                    playClickSound();
                                    onLoginAsUser(acc.email);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer"
                                  title="Instantly sign into this account"
                                >
                                  Switch User ⚡
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Password Display / Edit Row */}
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-slate-500 font-sans font-bold text-[11px]">
                                Current Password:
                              </span>
                              <span className="font-bold text-amber-300 truncate max-w-xs text-sm">
                                {isRevealed ? acc.password : '••••••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleShowPassword(acc.email)}
                                className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] cursor-pointer"
                                title={isRevealed ? 'Hide Password' : 'Show Password'}
                              >
                                {isRevealed ? '🙈 Hide' : '👁️ Show'}
                              </button>
                            </div>

                            <div className="text-[10px] text-slate-500 font-sans">
                              Last login: {acc.lastLoginAt ? new Date(acc.lastLoginAt).toLocaleString() : 'Never'}
                            </div>
                          </div>

                          {/* Inline Password Change Drawer */}
                          {isEditing && (
                            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 space-y-2 animate-in slide-in-from-top-1">
                              <label className="text-[11px] font-bold text-red-300 block uppercase tracking-wider font-mono">
                                Set New Password for {acc.email} (Across All Devices)
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  autoFocus
                                  value={newPasswordVal}
                                  onChange={(e) => setNewPasswordVal(e.target.value)}
                                  placeholder="Type new password..."
                                  className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-red-700 text-white text-xs font-mono outline-none focus:border-red-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSavePasswordChange(acc.email, newPasswordVal)}
                                  disabled={loading}
                                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow cursor-pointer transition-transform active:scale-95 shrink-0"
                                >
                                  Save Password 💾
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ALL LOGINS & AUDIT STREAM */}
            {activeTab === 'LOGINS' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <input
                      type="text"
                      placeholder="Filter logins by email or device..."
                      value={loginSearch}
                      onChange={(e) => setLoginSearch(e.target.value)}
                      className="w-full py-2 pl-8 pr-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-red-500 outline-none"
                    />
                    <span className="absolute left-2.5 top-2 text-xs text-slate-500">🔍</span>
                  </div>

                  <button
                    onClick={loadAllData}
                    disabled={loading}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🔄</span>
                    <span>Refresh Logins Stream</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {filteredLogins.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                      <div className="text-3xl">📋</div>
                      <div className="font-bold text-sm text-slate-300">No Login Events Recorded</div>
                      <p className="text-xs text-slate-500">
                        Login events from every device will be recorded here live in real-time.
                      </p>
                    </div>
                  ) : (
                    filteredLogins.map((lg) => (
                      <div
                        key={lg.id}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-850 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">
                            {lg.action === 'password_change' || lg.action === 'bulk_password_reset' ? '🔑' : lg.action === 'register' ? '✉️' : '📲'}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white truncate">{lg.email}</span>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                                  lg.success
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                                    : 'bg-red-950 text-red-300 border border-red-600/50'
                                }`}
                              >
                                {lg.action.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">
                              Device: {lg.device} · IP: {lg.ip}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-500 shrink-0 text-right">
                          {lg.timestamp ? new Date(lg.timestamp).toLocaleString() : 'Just now'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: CREATE NEW USER LOGIN */}
            {activeTab === 'NEW_ACCOUNT' && (
              <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <div className="text-3xl mb-1">➕</div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Provision New User Login
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Instantly create new user credentials in Cloud Firestore. The player will be able to sign in immediately from any device!
                  </p>
                </div>

                <form onSubmit={handleCreateNewAccount} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      User Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="player@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-red-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Initial Password
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Assign password..."
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-red-500 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/60 cursor-pointer transition-transform active:scale-[0.98]"
                  >
                    {loading ? 'Creating Credentials...' : 'Create Account Across All Devices 🚀'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
