/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserSession, UserRole } from '../types';
import { 
  Factory, ShieldCheck, User, Lock, Eye, EyeOff, 
  KeyRound, CheckCircle2, AlertCircle, Sparkles, ArrowRight, X 
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (session: UserSession) => void;
  currentSession?: UserSession | null;
}

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  currentSession
}: LoginModalProps) {
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Staff Credentials state
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Please enter Admin ID and Password.');
      return;
    }

    // Admin authentication check (ID: ADMIN, Password: ADMIN)
    if (cleanUser.toUpperCase() === 'ADMIN' && cleanPass.toUpperCase() === 'ADMIN') {
      const session: UserSession = {
        role: 'admin',
        username: 'ADMIN',
        displayName: 'Factory Admin',
        loggedInAt: new Date().toISOString()
      };
      onLoginSuccess(session);
    } else {
      setErrorMsg('Invalid Credentials! For Admin access, ID is ADMIN and Password is ADMIN.');
    }
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanStaffUser = staffUsername.trim();
    const cleanStaffPass = staffPassword.trim();

    if (!cleanStaffUser || !cleanStaffPass) {
      setErrorMsg('Please enter Staff User ID and Password.');
      return;
    }

    const session: UserSession = {
      role: 'staff',
      username: cleanStaffUser.toUpperCase(),
      displayName: cleanStaffUser,
      loggedInAt: new Date().toISOString()
    };
    onLoginSuccess(session);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative">
        
        {/* Modal Header / Banner */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white text-center relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>

          {currentSession && onClose && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="inline-flex p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-3 border border-white/10">
            <Factory className="h-8 w-8 text-indigo-300" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">TexFlow ERP</h2>
          <p className="text-xs text-indigo-200 mt-1 font-medium">Loom Factory Management System</p>

          {currentSession && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs text-indigo-100 border border-white/10">
              <span>Currently logged in as:</span>
              <strong className="text-white font-bold">{currentSession.displayName} ({currentSession.role.toUpperCase()})</strong>
            </div>
          )}
        </div>

        {/* Role Selector Tabs */}
        <div className="p-2 bg-slate-100 flex gap-1 border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveRole('admin');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeRole === 'admin'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>Admin Login</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-extrabold">Full Access</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole('staff');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeRole === 'staff'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <User className="h-4 w-4 text-slate-500" />
            <span>Staff / User</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-extrabold">No Delete</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {activeRole === 'admin' ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs font-medium flex items-center gap-2.5 animate-shake">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Admin ID / Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Admin ID"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Admin Password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10 uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-2"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Log In as Admin</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs font-medium flex items-center gap-2.5 animate-shake">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Staff User ID Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Staff User ID
                </label>
                <input
                  type="text"
                  required
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value)}
                  placeholder="Enter Staff User ID"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
                />
              </div>

              {/* Staff Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  Staff Password
                </label>
                <div className="relative">
                  <input
                    type={showStaffPassword ? 'text' : 'password'}
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Enter Staff Password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showStaffPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-slate-900/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-2"
              >
                <User className="h-4 w-4 text-amber-400" />
                <span>Log In as Staff (Read/Write)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            TexFlow ERP • Secure Loom Factory Portal
          </p>
        </div>

      </div>
    </div>
  );
}
