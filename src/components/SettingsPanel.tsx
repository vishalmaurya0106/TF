/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Settings, Database, Download, Upload, Trash2, 
  RefreshCw, Laptop, Monitor, CheckCircle2, AlertCircle, 
  ShieldCheck, HardDrive, Key, Server
} from 'lucide-react';

interface SettingsPanelProps {
  supabaseStatus: string;
  supabaseMsg: string;
  isSyncing: boolean;
  onManualSyncAll: () => void;
  onShowSqlModal: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenClearDataModal: () => void;
  onResetToSeed: () => void;
  onInstallDesktopApp: () => void;
  onShowInstallGuide: () => void;
  isAdmin: boolean;
}

export default function SettingsPanel({
  supabaseStatus,
  supabaseMsg,
  isSyncing,
  onManualSyncAll,
  onShowSqlModal,
  onExportBackup,
  onImportBackup,
  onOpenClearDataModal,
  onResetToSeed,
  onInstallDesktopApp,
  onShowInstallGuide,
  isAdmin
}: SettingsPanelProps) {
  if (!isAdmin) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-sm space-y-3">
        <ShieldCheck className="h-12 w-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Admin Access Required</h3>
        <p className="text-xs text-slate-500">
          Settings and system controls are restricted to Admin account holders only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Settings className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-white">System Settings & Controls</h2>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Admin Panel
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage database synchronization, backup/restore factory records, and app configuration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Cloud Database Status:</span>
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            {supabaseStatus === 'connected' ? (
              <>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-400">Connected</span>
              </>
            ) : supabaseStatus === 'connecting' ? (
              <>
                <RefreshCw className="h-3 w-3 text-indigo-400 animate-spin" />
                <span className="text-xs font-bold text-indigo-300">Connecting...</span>
              </>
            ) : (
              <>
                <span className="inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                <span className="text-xs font-bold text-amber-400">Local Mode</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Settings Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Supabase Database Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cloud Database Sync</h3>
                  <p className="text-[11px] text-slate-500">Supabase real-time storage engine</p>
                </div>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                supabaseStatus === 'connected' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {supabaseStatus === 'connected' ? 'LIVE SYNC' : 'LOCAL CACHE'}
              </span>
            </div>

            <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-start gap-3">
              {supabaseStatus === 'connected' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : supabaseStatus === 'connecting' ? (
                <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-slate-900">
                  {supabaseStatus === 'connected' 
                    ? 'Cloud Database Connected' 
                    : supabaseStatus === 'connecting' 
                    ? 'Connecting to Supabase...' 
                    : 'Operating on Local Device Storage'}
                </p>
                <p className="text-slate-500 text-[11px] leading-relaxed">{supabaseMsg}</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <button
              type="button"
              id="settings-sync-now-btn"
              onClick={onManualSyncAll}
              disabled={isSyncing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing Now...' : 'Sync Cloud Data Now'}
            </button>
            <button
              type="button"
              id="settings-sql-script-btn"
              onClick={onShowSqlModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Server className="h-4 w-4" />
              SQL Setup
            </button>
          </div>
        </div>

        {/* 2. Data Backup & Restore Manager */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Data Backup & Restore</h3>
                <p className="text-[11px] text-slate-500">Export offline JSON copies or restore factory logs</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
              Generate a full offline JSON file containing all employees, loom daily work registers, attendance logs, and salary payments for safe archiving.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              id="settings-export-backup-btn"
              onClick={onExportBackup}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Download className="h-4 w-4 text-indigo-600" />
              Export Backup
            </button>

            <label
              id="settings-import-backup-label"
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer relative shadow-2xs"
            >
              <Upload className="h-4 w-4 text-emerald-600" />
              <span>Restore Data</span>
              <input
                id="settings-import-backup-input"
                type="file"
                accept=".json"
                onChange={onImportBackup}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>
        </div>

        {/* 3. Clear Data & Database Reset */}
        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-rose-100">
              <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Clear Data & Factory Reset</h3>
                <p className="text-[11px] text-slate-500">Authorized administrative reset actions</p>
              </div>
            </div>

            <p className="text-xs text-rose-900 leading-relaxed bg-rose-50/60 p-3.5 rounded-xl border border-rose-200">
              Wipe all database records (requires Admin Password authentication) or reset sample demo data for fresh factory setup.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              id="settings-clear-all-data-btn"
              onClick={onOpenClearDataModal}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </button>

            <button
              type="button"
              id="settings-reset-demo-btn"
              onClick={onResetToSeed}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className="h-4 w-4 text-rose-600" />
              Reset Demo Data
            </button>
          </div>
        </div>

        {/* 4. Desktop Computer Installation */}
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-indigo-100">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Windows / Desktop PC App</h3>
                <p className="text-[11px] text-slate-500">Standalone app installation for office computers</p>
              </div>
            </div>

            <p className="text-xs text-indigo-900 leading-relaxed bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200">
              Install TexFlow on your computer desktop for instant 1-click startup without typing URL web browser addresses.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              id="settings-install-desktop-btn"
              onClick={onInstallDesktopApp}
              className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Monitor className="h-4 w-4" />
              Install App on PC
            </button>
            <button
              type="button"
              id="settings-install-guide-btn"
              onClick={onShowInstallGuide}
              className="px-3.5 py-2.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Manual Guide
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
