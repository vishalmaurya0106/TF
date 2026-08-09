/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trash2, AlertTriangle, Lock, Eye, EyeOff, X, ShieldAlert } from 'lucide-react';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: () => void;
}

export default function ClearDataModal({
  isOpen,
  onClose,
  onConfirmClear
}: ClearDataModalProps) {
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPass = adminPassword.trim().toUpperCase();

    if (!cleanPass) {
      setErrorMessage('Please enter the Admin Password.');
      return;
    }

    if (cleanPass === 'ADMIN') {
      onConfirmClear();
      setAdminPassword('');
      setErrorMessage('');
    } else {
      setErrorMessage('Incorrect Admin Password! Please enter the correct admin password.');
    }
  };

  const handleModalClose = () => {
    setAdminPassword('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-rose-600 px-6 py-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Clear All Factory Data</h3>
              <p className="text-[11px] text-rose-100">Admin Authorization Required</p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Warning Banner */}
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Permanent Data Deletion Notice</p>
              <p className="text-rose-700 leading-relaxed">
                This action will permanently delete all employee records, attendance logs, daily production entries, and salary registers. This operation cannot be undone.
              </p>
            </div>
          </div>

          {/* Admin Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              Enter Admin Password to Confirm
            </label>
            <div className="relative">
              <input
                id="clear-data-admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                autoFocus
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl outline-none text-xs font-bold font-mono transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Default admin password: <span className="font-mono font-bold text-slate-600">ADMIN</span></p>
          </div>

          {/* Error Feedback */}
          {errorMessage && (
            <div className="p-2.5 bg-rose-100 border border-rose-300 text-rose-800 rounded-lg text-xs font-semibold animate-shake">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-clear-data-submit-btn"
              disabled={!adminPassword.trim()}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span>Confirm Clear All Data</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
