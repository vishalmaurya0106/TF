/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Worker, Machine, DailyWork, AdminAttendance, Attendance, Salary, UserSession 
} from './types';
import { 
  DEFAULT_MACHINES, SEED_WORKERS, SEED_DAILY_WORK, 
  SEED_ADMIN_ATTENDANCE, SEED_LOOM_ATTENDANCE, SEED_SALARIES 
} from './utils';
import DashboardOverview from './components/DashboardOverview';
import WorkersDirectory from './components/WorkersDirectory';
import LoomDailyWork from './components/LoomDailyWork';
import AttendanceRegister from './components/AttendanceRegister';
import AdminAttendanceRegister from './components/AdminAttendanceRegister';
import MonthlySalarySheet from './components/MonthlySalarySheet';
import MachineRegistry from './components/MachineRegistry';
import ConfirmModal from './components/ConfirmModal';
import LoginModal from './components/LoginModal';

import { 
  Cpu, Users, Cpu as LoomIcon, Clock, Building, FileText, 
  Settings, Download, Upload, Trash2, ShieldCheck, Factory,
  Menu, X, Monitor, HelpCircle, Laptop, Chrome, ArrowUpRight,
  Database, RefreshCw, CheckCircle2, AlertCircle, Copy, Check,
  LogOut, User, Lock, KeyRound
} from 'lucide-react';
import { 
  testSupabaseConnection, 
  fetchSupabaseWorkers, fetchSupabaseMachines, fetchSupabaseDailyWorks,
  fetchSupabaseAdminAttendances, fetchSupabaseAttendances, fetchSupabaseSalaries,
  createWorker, updateWorker, deleteWorker,
  createMachine, updateMachine, deleteMachine,
  createDailyWork, updateDailyWork, deleteDailyWork,
  createAdminAttendance, updateAdminAttendance, deleteAdminAttendance,
  createAttendance, updateAttendance, deleteAttendance,
  createSalary, updateSalary, deleteSalary,
  reconcileWorkersToSupabase, reconcileMachinesToSupabase, reconcileDailyWorksToSupabase,
  reconcileAdminAttendancesToSupabase, reconcileAttendancesToSupabase, reconcileSalariesToSupabase,
  SUPABASE_SETUP_SQL, SUPABASE_URL
} from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // --- Authentication States ---
  // In-memory session state: page refresh or browser close auto-logouts the user
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(true);

  const isAdmin = currentSession?.role === 'admin';

  const handleLogout = () => {
    try {
      localStorage.removeItem('texflow_auth_session');
    } catch {}
    setCurrentSession(null);
    setIsLoginModalOpen(true);
  };

  // --- PWA Desktop Installation States ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if running in standalone mode (already installed as desktop app)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User installation choice outcome: ${outcome}`);
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      // Show step-by-step user guide for browser installation
      setShowInstallGuide(true);
    }
  };

  // Helper to load state from localStorage with fallback
  const getLocalOrSeed = <T,>(key: string, seed: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as unknown as T;
      }
    } catch (e) {
      console.warn(`Failed to parse localStorage for ${key}`, e);
    }
    return seed;
  };

  // --- Database & Supabase Persistence States ---
  const [workers, setWorkers] = useState<Worker[]>(() => getLocalOrSeed('texflow_workers', SEED_WORKERS));
  const [machines, setMachines] = useState<Machine[]>(() => getLocalOrSeed('texflow_machines', DEFAULT_MACHINES));
  const [dailyWorks, setDailyWorks] = useState<DailyWork[]>(() => getLocalOrSeed('texflow_dailyWorks', SEED_DAILY_WORK));
  const [adminAttendances, setAdminAttendances] = useState<AdminAttendance[]>(() => getLocalOrSeed('texflow_adminAttendances', SEED_ADMIN_ATTENDANCE));
  const [attendances, setAttendances] = useState<Attendance[]>(() => getLocalOrSeed('texflow_attendances', SEED_LOOM_ATTENDANCE));
  const [salaries, setSalaries] = useState<Salary[]>(() => getLocalOrSeed('texflow_salaries', SEED_SALARIES));

  // Sync state to localStorage whenever it changes
  useEffect(() => { localStorage.setItem('texflow_workers', JSON.stringify(workers)); }, [workers]);
  useEffect(() => { localStorage.setItem('texflow_machines', JSON.stringify(machines)); }, [machines]);
  useEffect(() => { localStorage.setItem('texflow_dailyWorks', JSON.stringify(dailyWorks)); }, [dailyWorks]);
  useEffect(() => { localStorage.setItem('texflow_adminAttendances', JSON.stringify(adminAttendances)); }, [adminAttendances]);
  useEffect(() => { localStorage.setItem('texflow_attendances', JSON.stringify(attendances)); }, [attendances]);
  useEffect(() => { localStorage.setItem('texflow_salaries', JSON.stringify(salaries)); }, [salaries]);

  // Supabase Status States
  const [supabaseStatus, setSupabaseStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [supabaseMsg, setSupabaseMsg] = useState<string>('Connecting to Supabase...');
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // --- Load Data on Boot (From Supabase PostgreSQL + Local Cache Sync) ---
  useEffect(() => {
    async function initData() {
      setSupabaseStatus('connecting');
      setSupabaseMsg('Checking Supabase Database Connection...');
      const conn = await testSupabaseConnection();

      if (!conn.success) {
        setSupabaseStatus('error');
        setSupabaseMsg(`Local Cache Active (${conn.message})`);
        return;
      }

      setSupabaseStatus('connected');
      setSupabaseMsg('Connected & Live Synced with Supabase PostgreSQL');

      try {
        const [spWorkers, spMachines, spWorks, spAdminAtt, spAtt, spSalaries] = await Promise.all([
          fetchSupabaseWorkers().catch(() => null),
          fetchSupabaseMachines().catch(() => null),
          fetchSupabaseDailyWorks().catch(() => null),
          fetchSupabaseAdminAttendances().catch(() => null),
          fetchSupabaseAttendances().catch(() => null),
          fetchSupabaseSalaries().catch(() => null)
        ]);

        const totalCount = (spWorkers?.length || 0) + (spMachines?.length || 0) + 
                           (spWorks?.length || 0) + (spAdminAtt?.length || 0) + 
                           (spAtt?.length || 0) + (spSalaries?.length || 0);

        if (totalCount === 0) {
          // Initialize empty Supabase PostgreSQL database with current local state
          const curWorkers = getLocalOrSeed('texflow_workers', SEED_WORKERS);
          const curMachines = getLocalOrSeed('texflow_machines', DEFAULT_MACHINES);
          const curWorks = getLocalOrSeed('texflow_dailyWorks', SEED_DAILY_WORK);
          const curAdminAtt = getLocalOrSeed('texflow_adminAttendances', SEED_ADMIN_ATTENDANCE);
          const curAtt = getLocalOrSeed('texflow_attendances', SEED_LOOM_ATTENDANCE);
          const curSalaries = getLocalOrSeed('texflow_salaries', SEED_SALARIES);

          await Promise.all([
            reconcileWorkersToSupabase(curWorkers).catch(() => {}),
            reconcileMachinesToSupabase(curMachines).catch(() => {}),
            reconcileDailyWorksToSupabase(curWorks).catch(() => {}),
            reconcileAdminAttendancesToSupabase(curAdminAtt).catch(() => {}),
            reconcileAttendancesToSupabase(curAtt).catch(() => {}),
            reconcileSalariesToSupabase(curSalaries).catch(() => {})
          ]);
        } else {
          if (spWorkers && spWorkers.length > 0) setWorkers(spWorkers);
          if (spMachines && spMachines.length > 0) setMachines(spMachines);
          if (spWorks && spWorks.length > 0) setDailyWorks(spWorks);
          if (spAdminAtt && spAdminAtt.length > 0) setAdminAttendances(spAdminAtt);
          if (spAtt && spAtt.length > 0) setAttendances(spAtt);
          if (spSalaries && spSalaries.length > 0) setSalaries(spSalaries);
        }
      } catch (err: any) {
        setSupabaseStatus('error');
        setSupabaseMsg(`Supabase sync notice: ${err?.message || err}. Running on local storage.`);
      }
    }

    initData();
  }, []);

  const handleManualSyncAll = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([
        reconcileWorkersToSupabase(workers),
        reconcileMachinesToSupabase(machines),
        reconcileDailyWorksToSupabase(dailyWorks),
        reconcileAdminAttendancesToSupabase(adminAttendances),
        reconcileAttendancesToSupabase(attendances),
        reconcileSalariesToSupabase(salaries)
      ]);
      const conn = await testSupabaseConnection();
      if (conn.success) {
        setSupabaseStatus('connected');
        setSupabaseMsg('Data reconciled and synced with Supabase successfully!');
      } else {
        setSupabaseStatus('error');
        setSupabaseMsg(conn.message);
      }
    } catch (err: any) {
      setSupabaseStatus('error');
      setSupabaseMsg(`Sync Error: ${err?.message || err}`);
      alert(`Supabase Sync Error: ${err?.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Worker Operations ---
  const handleAddWorker = async (newWorker: Worker) => {
    setWorkers(prev => [...prev, newWorker]);
    try {
      await createWorker(newWorker);
    } catch (err: any) {
      console.warn('Saved locally, Supabase sync pending:', err?.message || err);
    }
  };

  const handleUpdateWorker = async (updatedWorker: Worker) => {
    setWorkers(prev => prev.map(w => w.workerId === updatedWorker.workerId ? updatedWorker : w));
    try {
      await updateWorker(updatedWorker);
    } catch (err: any) {
      console.warn('Updated locally, Supabase sync pending:', err?.message || err);
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    setWorkers(prev => prev.filter(w => w.workerId !== workerId));
    setDailyWorks(prev => prev.filter(dw => dw.workerId !== workerId));
    setAdminAttendances(prev => prev.filter(aa => aa.workerId !== workerId));
    setAttendances(prev => prev.filter(a => a.workerId !== workerId));
    setSalaries(prev => prev.filter(s => s.workerId !== workerId));

    try {
      await deleteWorker(workerId);
      const worksToDelete = dailyWorks.filter(dw => dw.workerId === workerId);
      for (const dw of worksToDelete) {
        await deleteDailyWork(dw.workId).catch(() => {});
      }
      const adminAttToDelete = adminAttendances.filter(aa => aa.workerId === workerId);
      for (const aa of adminAttToDelete) {
        await deleteAdminAttendance(aa.adminAttendanceId).catch(() => {});
      }
      const attToDelete = attendances.filter(a => a.workerId === workerId);
      for (const a of attToDelete) {
        await deleteAttendance(a.attendanceId).catch(() => {});
      }
      const salariesToDelete = salaries.filter(s => s.workerId === workerId);
      for (const s of salariesToDelete) {
        await deleteSalary(s.salaryId).catch(() => {});
      }
    } catch (err: any) {
      console.warn('Deleted locally, Supabase sync pending:', err?.message || err);
    }
  };

  // --- Machine Operations ---
  const handleToggleMachine = async (machineId: string) => {
    const target = machines.find(m => m.machineId === machineId);
    if (!target) return;
    const updated = { ...target, isActive: !target.isActive };
    setMachines(prev => prev.map(m => m.machineId === machineId ? updated : m));
    try {
      await updateMachine(updated);
    } catch (err: any) {
      console.warn('Updated machine locally, Supabase sync pending:', err?.message || err);
    }
  };

  const handleAddMachine = async (newMachine: Machine) => {
    setMachines(prev => [...prev, newMachine]);
    try {
      await createMachine(newMachine);
    } catch (err: any) {
      console.warn('Added machine locally, Supabase sync pending:', err?.message || err);
    }
  };

  const handleDeleteMachine = async (machineId: string) => {
    setMachines(prev => prev.filter(m => m.machineId !== machineId));
    try {
      await deleteMachine(machineId);
    } catch (err: any) {
      console.warn('Deleted machine locally, Supabase sync pending:', err?.message || err);
    }
  };

  // --- Daily Work Operations ---
  const handleAddDailyWork = async (newWork: DailyWork) => {
    setDailyWorks(prev => [...prev, newWork]);
    try {
      await createDailyWork(newWork);
    } catch (err: any) {
      console.warn('Saved daily work locally, Supabase sync pending:', err?.message || err);
    }
  };

  const handleDeleteDailyWork = async (workId: string) => {
    setDailyWorks(prev => prev.filter(dw => dw.workId !== workId));
    try {
      await deleteDailyWork(workId);
    } catch (err: any) {
      console.warn('Deleted daily work locally, Supabase sync pending:', err?.message || err);
    }
  };

  // --- Admin Attendance Operations ---
  const handleAddAdminAttendance = async (newAtt: AdminAttendance) => {
    const exists = adminAttendances.some(a => a.adminAttendanceId === newAtt.adminAttendanceId);
    if (exists) {
      setAdminAttendances(prev => prev.map(a => a.adminAttendanceId === newAtt.adminAttendanceId ? newAtt : a));
    } else {
      setAdminAttendances(prev => [...prev, newAtt]);
    }
    try {
      if (exists) {
        await updateAdminAttendance(newAtt);
      } else {
        await createAdminAttendance(newAtt);
      }
    } catch (err: any) {
      console.warn('Saved admin attendance locally, Supabase sync pending:', err?.message || err);
    }
  };

  const handleDeleteAdminAttendance = async (id: string) => {
    setAdminAttendances(prev => prev.filter(a => a.adminAttendanceId !== id));
    try {
      await deleteAdminAttendance(id);
    } catch (err: any) {
      console.warn('Deleted admin attendance locally, Supabase sync pending:', err?.message || err);
    }
  };

  // --- Loom Attendance Operations ---
  const handleAddAttendance = async (newAtt: Attendance) => {
    const exists = attendances.some(a => a.attendanceId === newAtt.attendanceId);
    if (exists) {
      setAttendances(prev => prev.map(a => a.attendanceId === newAtt.attendanceId ? newAtt : a));
    } else {
      setAttendances(prev => [...prev, newAtt]);
    }
    try {
      if (exists) {
        await updateAttendance(newAtt);
      } else {
        await createAttendance(newAtt);
      }
    } catch (err: any) {
      console.warn('Saved loom attendance locally, Supabase sync pending:', err?.message || err);
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    setAttendances(prev => prev.filter(a => a.attendanceId !== id));
    try {
      await deleteAttendance(id);
    } catch (err: any) {
      console.warn('Deleted loom attendance locally, Supabase sync pending:', err?.message || err);
    }
  };

  // --- Salary Operations ---
  const handleUpdateSalary = async (updatedSalary: Salary) => {
    const exists = salaries.some(s => s.salaryId === updatedSalary.salaryId);
    if (exists) {
      setSalaries(prev => prev.map(s => s.salaryId === updatedSalary.salaryId ? updatedSalary : s));
    } else {
      setSalaries(prev => [...prev, updatedSalary]);
    }
    try {
      if (exists) {
        await updateSalary(updatedSalary);
      } else {
        await createSalary(updatedSalary);
      }
    } catch (err: any) {
      console.warn('Saved salary locally, Supabase sync pending:', err?.message || err);
    }
  };

  // --- Backup and Reset Operations ---
  const handleExportBackup = () => {
    const data = {
      workers,
      machines,
      dailyWorks,
      adminAttendances,
      attendances,
      salaries,
      exportVersion: "1.0",
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `texflow_factory_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.workers && imported.machines && imported.dailyWorks) {
          setIsSyncing(true);
          const impWorkers = imported.workers || [];
          const impMachines = imported.machines || [];
          const impDailyWorks = imported.dailyWorks || [];
          const impAdminAtt = imported.adminAttendances || [];
          const impAtt = imported.attendances || [];
          const impSalaries = imported.salaries || [];

          await Promise.all([
            reconcileWorkersToSupabase(impWorkers),
            reconcileMachinesToSupabase(impMachines),
            reconcileDailyWorksToSupabase(impDailyWorks),
            reconcileAdminAttendancesToSupabase(impAdminAtt),
            reconcileAttendancesToSupabase(impAtt),
            reconcileSalariesToSupabase(impSalaries)
          ]);

          setWorkers(impWorkers);
          setMachines(impMachines);
          setDailyWorks(impDailyWorks);
          setAdminAttendances(impAdminAtt);
          setAttendances(impAtt);
          setSalaries(impSalaries);

          alert('Database successfully restored and written to Supabase from backup!');
        } else {
          alert('Invalid backup file format. Core fields missing.');
        }
      } catch (err: any) {
        alert('Error restoring backup to Supabase: ' + (err?.message || err));
      } finally {
        setIsSyncing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleResetToSeed = () => {
    setIsConfirmResetOpen(true);
  };

  const executeResetToSeed = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([
        reconcileWorkersToSupabase(SEED_WORKERS),
        reconcileMachinesToSupabase(DEFAULT_MACHINES),
        reconcileDailyWorksToSupabase(SEED_DAILY_WORK),
        reconcileAdminAttendancesToSupabase(SEED_ADMIN_ATTENDANCE),
        reconcileAttendancesToSupabase(SEED_LOOM_ATTENDANCE),
        reconcileSalariesToSupabase(SEED_SALARIES)
      ]);

      setWorkers(SEED_WORKERS);
      setMachines(DEFAULT_MACHINES);
      setDailyWorks(SEED_DAILY_WORK);
      setAdminAttendances(SEED_ADMIN_ATTENDANCE);
      setAttendances(SEED_LOOM_ATTENDANCE);
      setSalaries(SEED_SALARIES);

      alert('Database successfully reset to seed data in Supabase!');
    } catch (err: any) {
      alert('Error resetting database in Supabase: ' + (err?.message || err));
    } finally {
      setIsSyncing(false);
      setIsConfirmResetOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800 antialiased font-sans">
      
      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-900 text-white px-5 py-4 flex justify-between items-center z-40 border-b border-slate-800 no-print">
        <div className="flex items-center gap-2">
          <Factory className="h-6 w-6 text-indigo-400" />
          <span className="font-display font-bold tracking-tight text-base text-white">TexFlow <span className="text-indigo-400 font-light">ERP</span></span>
        </div>
        <div className="flex items-center gap-2">
          {currentSession && (
            <button
              onClick={handleLogout}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-400" />
              <span>{isAdmin ? 'Admin' : 'Staff'}</span>
            </button>
          )}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar navigation panel */}
      <aside className={`w-72 bg-slate-900 text-slate-200 flex flex-col justify-between border-r border-slate-800 z-30 no-print 
        fixed md:relative inset-y-0 left-0 transform md:translate-x-0 transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Core Sidebar Header & User Profile */}
        <div className="p-5 border-b border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Factory className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display font-bold tracking-tight text-white text-lg">TexFlow <span className="text-indigo-400 font-light font-sans text-base">ERP</span></h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Textile Management System</p>
            </div>
          </div>

          {/* Active User Account Card */}
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={`p-1.5 rounded-lg shrink-0 ${isAdmin ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                {isAdmin ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">
                  {currentSession ? currentSession.displayName : 'Not Logged In'}
                </p>
                <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                  {isAdmin ? '🛡️ Admin (Full Access)' : '👤 Staff (No Delete)'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsLoginModalOpen(true)}
              title="Switch Account or Logout"
              className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <Cpu className="h-4.5 w-4.5" /> },
            { id: 'directory', label: 'Employees Directory', icon: <Users className="h-4.5 w-4.5" /> },
            { id: 'production', label: 'Loom Production', icon: <LoomIcon className="h-4.5 w-4.5" /> },
            { id: 'admin-att', label: 'Admin attendance', icon: <Building className="h-4.5 w-4.5" /> },
            { id: 'salary', label: 'Monthly Salary ledger', icon: <FileText className="h-4.5 w-4.5" /> },
            { id: 'machines', label: 'Loom machines', icon: <Cpu className="h-4.5 w-4.5 text-indigo-400" /> },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`sidebar-tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-indigo-600/20 text-indigo-400 font-semibold shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer - Settings & Controls Quick Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <button
            type="button"
            id="open-settings-footer-btn"
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700/80 shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="h-4 w-4 text-indigo-400 group-hover:rotate-45 transition-transform duration-200" />
              <span>Settings & Controls</span>
            </div>
            <div className="flex items-center gap-1.5">
              {supabaseStatus === 'connected' ? (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              )}
            </div>
          </button>
        </div>

      </aside>

      {/* Main workspace frame */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-h-[100vh] w-full">
        
        {/* Tab content switcher */}
        <div className="max-w-7xl mx-auto space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              workers={workers}
              machines={machines}
              dailyWorks={dailyWorks}
              adminAttendances={adminAttendances}
              salaries={salaries}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'directory' && (
            <WorkersDirectory
              workers={workers}
              onAddWorker={handleAddWorker}
              onUpdateWorker={handleUpdateWorker}
              onDeleteWorker={handleDeleteWorker}
              isAdmin={isAdmin}
            />
          )}

          {activeTab === 'production' && (
            <LoomDailyWork
              workers={workers}
              machines={machines}
              dailyWorks={dailyWorks}
              onAddDailyWork={handleAddDailyWork}
              onDeleteDailyWork={handleDeleteDailyWork}
              isAdmin={isAdmin}
            />
          )}

          {activeTab === 'admin-att' && (
            <AdminAttendanceRegister
              workers={workers}
              adminAttendances={adminAttendances}
              onAddAdminAttendance={handleAddAdminAttendance}
              onDeleteAdminAttendance={handleDeleteAdminAttendance}
              isAdmin={isAdmin}
            />
          )}

          {activeTab === 'salary' && (
            <MonthlySalarySheet
              workers={workers}
              salaries={salaries}
              dailyWorks={dailyWorks}
              adminAttendances={adminAttendances}
              onUpdateSalary={handleUpdateSalary}
            />
          )}

          {activeTab === 'machines' && (
            <MachineRegistry
              machines={machines}
              onToggleMachine={handleToggleMachine}
              onAddMachine={handleAddMachine}
              onDeleteMachine={handleDeleteMachine}
              isAdmin={isAdmin}
            />
          )}
        </div>

      </main>

      {/* Settings & System Controls Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <Settings className="h-5.5 w-5.5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-white text-base">TexFlow Settings & System Controls</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Database Sync, Backup, Restore & App Installation</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* 1. Supabase Database Panel */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-emerald-600" /> Supabase Cloud Database Status
                  </h4>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                    {supabaseStatus === 'connected' ? (
                      <>
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700">Connected</span>
                      </>
                    ) : supabaseStatus === 'connecting' ? (
                      <>
                        <RefreshCw className="h-3 w-3 text-indigo-500 animate-spin" />
                        <span className="text-[11px] font-bold text-indigo-700">Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        <span className="text-[11px] font-bold text-amber-700">Local Cache Mode</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-emerald-100/80 flex items-start gap-2.5">
                  {supabaseStatus === 'connected' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : supabaseStatus === 'connecting' ? (
                    <RefreshCw className="h-4 w-4 text-indigo-500 animate-spin shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div className="text-[11px]">
                    <p className="font-bold text-slate-900">
                      {supabaseStatus === 'connected' ? 'Live Cloud Sync Active' : supabaseStatus === 'connecting' ? 'Connecting to Cloud...' : 'Running on Local Storage'}
                    </p>
                    <p className="text-slate-500 leading-relaxed mt-0.5">{supabaseMsg}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleManualSyncAll}
                    disabled={isSyncing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing Now...' : 'Sync Cloud Data Now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsModalOpen(false);
                      setShowSqlModal(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    <Database className="h-3.5 w-3.5" />
                    SQL Setup Script
                  </button>
                </div>
              </div>

              {/* 2. Backup & Restore Storage Manager */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Download className="h-4 w-4 text-indigo-600" /> Data Backup & Restore Manager
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Export all factory workers, loom work logs, and salary registers into a JSON backup file or restore previously saved data.
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    id="export-backup-btn"
                    onClick={handleExportBackup}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Download className="h-4 w-4 text-indigo-600" />
                    Export Backup (JSON)
                  </button>

                  <label
                    id="import-backup-label"
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer relative shadow-2xs"
                  >
                    <Upload className="h-4 w-4 text-emerald-600" />
                    <span>Restore Data</span>
                    <input
                      id="import-backup-file-input"
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>
                </div>
              </div>

              {/* 3. Windows Desktop App Installation */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3">
                <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Laptop className="h-4 w-4 text-indigo-600" /> Windows / Desktop Computer App
                </h4>
                <p className="text-[11px] text-indigo-900 font-medium">
                  Install TexFlow on your computer desktop for fast access without opening browser tabs manually.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="install-desktop-app-btn"
                    onClick={handleInstallClick}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Monitor className="h-4 w-4" />
                    Install App on PC
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsModalOpen(false);
                      setShowInstallGuide(true);
                    }}
                    className="px-3.5 py-2.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Manual Install Guide
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        currentSession={currentSession}
        onClose={() => {
          if (currentSession) {
            setIsLoginModalOpen(false);
          }
        }}
        onLoginSuccess={(session) => {
          setCurrentSession(session);
          setIsLoginModalOpen(false);
        }}
      />

      {isConfirmResetOpen && (
        <ConfirmModal
          isOpen={isConfirmResetOpen}
          title="Reset Demo Dataset"
          message="Are you sure you want to reset all data? This will overwrite your custom modifications with the fresh demo seed dataset."
          confirmLabel="Reset"
          type="warning"
          onConfirm={executeResetToSeed}
          onCancel={() => setIsConfirmResetOpen(false)}
        />
      )}

      {/* PWA Windows Installation Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <div className="flex items-center gap-2.5">
                <Laptop className="h-5.5 w-5.5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Install TexFlow Windows App</h3>
                  <p className="text-[11px] text-indigo-600 font-bold">Easy way to install app on desktop</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowInstallGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Critical Notice: Standalone link */}
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
                <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  ⚠️ Step 1: Open in New Tab
                </p>
                <p className="text-xs text-amber-950 font-semibold leading-relaxed">
                  If you are viewing this app inside the Google AI Studio preview window, please click the button below to open it in a full new tab first.
                </p>
                <a
                  href="https://ais-pre-565kt2wlwierafhv7gmnps-1026129663129.asia-southeast1.run.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg text-xs shadow-xs transition-colors mt-1"
                >
                  Open in New Tab
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Install guide */}
              <div className="space-y-4">
                <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                  Step 2: Installation in Browser
                </p>

                {/* Google Chrome */}
                <div className="flex gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 h-fit text-amber-500">
                    <Chrome className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">How to install in Google Chrome:</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      1. Look at the right side of the address bar for the <strong>Install / Computer with down arrow icon</strong> and click it.
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      2. Or click the <strong>3 dots (...)</strong> on the top right, go to <strong>"Cast, save and share"</strong>, and click <strong>"Install page as app"</strong>.
                    </p>
                  </div>
                </div>

                {/* Microsoft Edge */}
                <div className="flex gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 h-fit text-blue-500">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">How to install in Microsoft Edge:</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      1. Click the <strong>"App available" (four boxes with plus icon)</strong> on the right of the address bar.
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      2. Or click the <strong>3 dots (...)</strong> on top, go to <strong>"Apps"</strong>, and click <strong>"Install this site as an app"</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* What happens next */}
              <div className="p-3.5 bg-indigo-50 rounded-xl text-indigo-950 space-y-1 text-xs">
                <p className="font-bold">Benefits of Desktop App:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] font-medium text-indigo-900 leading-relaxed">
                  <li>Creates a <strong>Standalone Window</strong></li>
                  <li>Adds a <strong>Desktop Shortcut</strong> & Start Menu icon</li>
                  <li>Works super fast and is offline-ready!</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase SQL Setup Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <Database className="h-5.5 w-5.5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Supabase Automatic Table Generator</h3>
                  <p className="text-[11px] text-emerald-400 font-semibold">Copy and run this in Supabase SQL Editor</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs text-emerald-950">
                <p className="font-extrabold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Supabase Connection Configured!
                </p>
                <p className="font-medium text-[11px] text-emerald-900">
                  Target Project: <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono text-[10px]">{SUPABASE_URL}</code>
                </p>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium mt-1">
                  If database tables are not created yet in your Supabase project, copy the SQL code below, paste it into the Supabase SQL Editor, and click 'Run'.
                </p>
              </div>

              <div className="relative">
                <div className="flex justify-between items-center bg-slate-800 px-4 py-2 rounded-t-xl text-slate-300 text-xs font-mono">
                  <span>Supabase_Schema_Tables.sql</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md text-[11px] transition-all cursor-pointer"
                  >
                    {copiedSql ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedSql ? 'Copied!' : 'Copy SQL'}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-b-xl overflow-x-auto max-h-60 border border-slate-800 leading-relaxed">
                  {SUPABASE_SETUP_SQL}
                </pre>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="font-bold text-slate-800">Quick Steps in Supabase Dashboard:</p>
                <ol className="list-decimal pl-5 space-y-1 text-[11px] font-medium text-slate-600">
                  <li>Open your Supabase Dashboard: <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold">supabase.com/dashboard</a></li>
                  <li>Go to <strong>SQL Editor</strong> on the left sidebar menu.</li>
                  <li>Click <strong>New Query</strong>, paste the copied SQL above, and click <strong>RUN</strong>.</li>
                  <li>Refresh this TexFlow website page — your data will now save live in Supabase!</li>
                </ol>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
