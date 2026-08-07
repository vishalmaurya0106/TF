/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Worker, Machine, DailyWork, AdminAttendance, Attendance, Salary 
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

import { 
  Cpu, Users, Cpu as LoomIcon, Clock, Building, FileText, 
  Settings, Download, Upload, Trash2, ShieldCheck, Factory,
  Menu, X, Monitor, HelpCircle, Laptop, Chrome, ArrowUpRight
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

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

  // --- Database Persistence States ---
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [dailyWorks, setDailyWorks] = useState<DailyWork[]>([]);
  const [adminAttendances, setAdminAttendances] = useState<AdminAttendance[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);

  // --- Load Data on Boot ---
  useEffect(() => {
    const loadedWorkers = localStorage.getItem('texflow_workers');
    const loadedMachines = localStorage.getItem('texflow_machines');
    const loadedDailyWorks = localStorage.getItem('texflow_daily_works');
    const loadedAdminAtt = localStorage.getItem('texflow_admin_attendances');
    const loadedAtt = localStorage.getItem('texflow_attendances');
    const loadedSalaries = localStorage.getItem('texflow_salaries');

    if (loadedWorkers) setWorkers(JSON.parse(loadedWorkers));
    else {
      setWorkers(SEED_WORKERS);
      localStorage.setItem('texflow_workers', JSON.stringify(SEED_WORKERS));
    }

    if (loadedMachines) setMachines(JSON.parse(loadedMachines));
    else {
      setMachines(DEFAULT_MACHINES);
      localStorage.setItem('texflow_machines', JSON.stringify(DEFAULT_MACHINES));
    }

    if (loadedDailyWorks) setDailyWorks(JSON.parse(loadedDailyWorks));
    else {
      setDailyWorks(SEED_DAILY_WORK);
      localStorage.setItem('texflow_daily_works', JSON.stringify(SEED_DAILY_WORK));
    }

    if (loadedAdminAtt) setAdminAttendances(JSON.parse(loadedAdminAtt));
    else {
      setAdminAttendances(SEED_ADMIN_ATTENDANCE);
      localStorage.setItem('texflow_admin_attendances', JSON.stringify(SEED_ADMIN_ATTENDANCE));
    }

    if (loadedAtt) setAttendances(JSON.parse(loadedAtt));
    else {
      setAttendances(SEED_LOOM_ATTENDANCE);
      localStorage.setItem('texflow_attendances', JSON.stringify(SEED_LOOM_ATTENDANCE));
    }

    if (loadedSalaries) setSalaries(JSON.parse(loadedSalaries));
    else {
      setSalaries(SEED_SALARIES);
      localStorage.setItem('texflow_salaries', JSON.stringify(SEED_SALARIES));
    }
  }, []);

  // --- State Synchronization Helpers ---
  const saveWorkers = (newWorkers: Worker[]) => {
    setWorkers(newWorkers);
    localStorage.setItem('texflow_workers', JSON.stringify(newWorkers));
  };

  const saveMachines = (newMachines: Machine[]) => {
    setMachines(newMachines);
    localStorage.setItem('texflow_machines', JSON.stringify(newMachines));
  };

  const saveDailyWorks = (newWorks: DailyWork[]) => {
    setDailyWorks(newWorks);
    localStorage.setItem('texflow_daily_works', JSON.stringify(newWorks));
  };

  const saveAdminAttendances = (newAdminAtt: AdminAttendance[]) => {
    setAdminAttendances(newAdminAtt);
    localStorage.setItem('texflow_admin_attendances', JSON.stringify(newAdminAtt));
  };

  const saveAttendances = (newAtt: Attendance[]) => {
    setAttendances(newAtt);
    localStorage.setItem('texflow_attendances', JSON.stringify(newAtt));
  };

  const saveSalaries = (newSalaries: Salary[]) => {
    setSalaries(newSalaries);
    localStorage.setItem('texflow_salaries', JSON.stringify(newSalaries));
  };

  // --- Worker Operations ---
  const handleAddWorker = (newWorker: Worker) => {
    saveWorkers([...workers, newWorker]);
  };

  const handleUpdateWorker = (updatedWorker: Worker) => {
    saveWorkers(workers.map(w => w.workerId === updatedWorker.workerId ? updatedWorker : w));
  };

  const handleDeleteWorker = (workerId: string) => {
    saveWorkers(workers.filter(w => w.workerId !== workerId));
    saveDailyWorks(dailyWorks.filter(dw => dw.workerId !== workerId));
    saveAdminAttendances(adminAttendances.filter(aa => aa.workerId !== workerId));
    saveAttendances(attendances.filter(a => a.workerId !== workerId));
    saveSalaries(salaries.filter(s => s.workerId !== workerId));
  };

  // --- Machine Operations ---
  const handleToggleMachine = (machineId: string) => {
    saveMachines(machines.map(m => m.machineId === machineId ? { ...m, isActive: !m.isActive } : m));
  };

  const handleAddMachine = (newMachine: Machine) => {
    saveMachines([...machines, newMachine]);
  };

  const handleDeleteMachine = (machineId: string) => {
    saveMachines(machines.filter(m => m.machineId !== machineId));
  };

  // --- Daily Work Operations ---
  const handleAddDailyWork = (newWork: DailyWork) => {
    saveDailyWorks([...dailyWorks, newWork]);
  };

  const handleDeleteDailyWork = (workId: string) => {
    saveDailyWorks(dailyWorks.filter(dw => dw.workId !== workId));
  };

  // --- Admin Attendance Operations ---
  const handleAddAdminAttendance = (newAtt: AdminAttendance) => {
    const exists = adminAttendances.some(a => a.adminAttendanceId === newAtt.adminAttendanceId);
    if (exists) {
      saveAdminAttendances(adminAttendances.map(a => a.adminAttendanceId === newAtt.adminAttendanceId ? newAtt : a));
    } else {
      saveAdminAttendances([...adminAttendances, newAtt]);
    }
  };

  const handleDeleteAdminAttendance = (id: string) => {
    saveAdminAttendances(adminAttendances.filter(a => a.adminAttendanceId !== id));
  };

  // --- Loom Attendance Operations ---
  const handleAddAttendance = (newAtt: Attendance) => {
    const exists = attendances.some(a => a.attendanceId === newAtt.attendanceId);
    if (exists) {
      saveAttendances(attendances.map(a => a.attendanceId === newAtt.attendanceId ? newAtt : a));
    } else {
      saveAttendances([...attendances, newAtt]);
    }
  };

  const handleDeleteAttendance = (id: string) => {
    saveAttendances(attendances.filter(a => a.attendanceId !== id));
  };

  // --- Salary Operations ---
  const handleUpdateSalary = (updatedSalary: Salary) => {
    const exists = salaries.some(s => s.salaryId === updatedSalary.salaryId);
    if (exists) {
      saveSalaries(salaries.map(s => s.salaryId === updatedSalary.salaryId ? updatedSalary : s));
    } else {
      saveSalaries([...salaries, updatedSalary]);
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
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.workers && imported.machines && imported.dailyWorks) {
          saveWorkers(imported.workers);
          saveMachines(imported.machines);
          saveDailyWorks(imported.dailyWorks);
          saveAdminAttendances(imported.adminAttendances || []);
          saveAttendances(imported.attendances || []);
          saveSalaries(imported.salaries || []);
          alert('Database restored successfully from file!');
        } else {
          alert('Invalid backup file format. Core fields missing.');
        }
      } catch (err) {
        alert('Error parsing backup JSON file: ' + err);
      }
    };
    reader.readAsText(file);
  };

  const handleResetToSeed = () => {
    setIsConfirmResetOpen(true);
  };

  const executeResetToSeed = () => {
    saveWorkers(SEED_WORKERS);
    saveMachines(DEFAULT_MACHINES);
    saveDailyWorks(SEED_DAILY_WORK);
    saveAdminAttendances(SEED_ADMIN_ATTENDANCE);
    saveAttendances(SEED_LOOM_ATTENDANCE);
    saveSalaries(SEED_SALARIES);
    setIsConfirmResetOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800 antialiased font-sans">
      
      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-900 text-white px-5 py-4 flex justify-between items-center z-40 border-b border-slate-800 no-print">
        <div className="flex items-center gap-2">
          <Factory className="h-6 w-6 text-indigo-400" />
          <span className="font-display font-bold tracking-tight text-base text-white">TexFlow <span className="text-indigo-400 font-light">ERP</span></span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Sidebar navigation panel */}
      <aside className={`w-72 bg-slate-900 text-slate-200 flex flex-col justify-between border-r border-slate-800 z-30 no-print 
        fixed md:relative inset-y-0 left-0 transform md:translate-x-0 transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Core Sidebar Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Factory className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display font-bold tracking-tight text-white text-lg">TexFlow <span className="text-indigo-400 font-light font-sans text-base">ERP</span></h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-1">Textile Management System</p>
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

        {/* PWA Desktop App Installer Panel */}
        <div className="p-4 border-t border-slate-800 bg-indigo-950/25 space-y-2">
          <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest px-2 flex items-center gap-1.5">
            <Laptop className="h-3.5 w-3.5" /> Windows Desktop App
          </p>
          <button
            type="button"
            id="install-desktop-app-btn"
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-950/40"
          >
            <Monitor className="h-3.5 w-3.5" />
            Install on Computer
          </button>
          <button
            type="button"
            onClick={() => setShowInstallGuide(true)}
            className="w-full text-center text-[10px] font-semibold text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer block"
          >
            How to install manually?
          </button>
        </div>

        {/* Backup, Restore & Reset Footer panel */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 space-y-2.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
            Storage & Backup Manager
          </p>
          <div className="grid grid-cols-2 gap-2">
            {/* Export Backup */}
            <button
              id="export-backup-btn"
              onClick={handleExportBackup}
              title="Download full TexFlow JSON backup"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Backup
            </button>

            {/* Import Backup */}
            <label
              id="import-backup-label"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer relative"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Restore</span>
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
            />
          )}

          {activeTab === 'production' && (
            <LoomDailyWork
              workers={workers}
              machines={machines}
              dailyWorks={dailyWorks}
              onAddDailyWork={handleAddDailyWork}
              onDeleteDailyWork={handleDeleteDailyWork}
            />
          )}

          {activeTab === 'admin-att' && (
            <AdminAttendanceRegister
              workers={workers}
              adminAttendances={adminAttendances}
              onAddAdminAttendance={handleAddAdminAttendance}
              onDeleteAdminAttendance={handleDeleteAdminAttendance}
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
            />
          )}
        </div>

      </main>

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
                  <p className="text-[11px] text-indigo-600 font-bold">कंप्यूटर में ऐप इंस्टॉल करने का आसान तरीका</p>
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
                  ⚠️ Step 1: Open in New Tab (न्यू टैब में खोलें)
                </p>
                <p className="text-xs text-amber-950 font-semibold leading-relaxed">
                  If you are viewing this app inside the Google AI Studio preview window, please click the button below to open it in a full new tab first (क्योंकि प्रीव्यू फ्रेम के अंदर से डायरेक्ट इंस्टॉल नहीं हो सकता)।
                </p>
                <a
                  href="https://ais-pre-565kt2wlwierafhv7gmnps-1026129663129.asia-southeast1.run.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg text-xs shadow-xs transition-colors mt-1"
                >
                  Open in New Tab (न्यू टैब में खोलें)
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Install guide */}
              <div className="space-y-4">
                <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                  Step 2: Installation in Browser (ब्राउज़र से इंस्टॉल करें)
                </p>

                {/* Google Chrome */}
                <div className="flex gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 h-fit text-amber-500">
                    <Chrome className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">Google Chrome में कैसे इंस्टॉल करें:</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      1. एड्रेस बार (Address Bar) के दाईं ओर देखें, आपको एक <strong>कम्प्यूटर और नीचे तीर (↓) का निशान</strong> दिखेगा, उस पर क्लिक करें।
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      2. या फिर दाईं तरफ <strong>3 डॉट्स (...)</strong> पर क्लिक करें, फिर <strong>"Cast, save and share"</strong> में जाएं, और <strong>"Install page as app"</strong> पर क्लिक करें।
                    </p>
                  </div>
                </div>

                {/* Microsoft Edge */}
                <div className="flex gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 h-fit text-blue-500">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">Microsoft Edge में कैसे इंस्टॉल करें:</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      1. ऊपर एड्रेस बार में दाईं ओर <strong>"App available" (चार बक्से वाला प्लस आइकन)</strong> दिखेगा, उस पर क्लिक करें।
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      2. या फिर ऊपर <strong>3 डॉट्स (...)</strong> पर क्लिक करें, <strong>"Apps"</strong> में जाएं, और <strong>"Install this site as an app"</strong> पर क्लिक करें।
                    </p>
                  </div>
                </div>
              </div>

              {/* What happens next */}
              <div className="p-3.5 bg-indigo-50 rounded-xl text-indigo-950 space-y-1 text-xs">
                <p className="font-bold">Benefits of Desktop App (इंस्टॉल करने के फायदे):</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] font-medium text-indigo-900 leading-relaxed">
                  <li>Creates a <strong>Standalone Window</strong> (बिना ब्राउज़र के अलग से ऐप खुलेगा)</li>
                  <li>Adds a <strong>Desktop Shortcut</strong> & Start Menu icon (डेस्कटॉप पर शॉर्टकट आ जाएगा)</li>
                  <li>Works super fast and is offline-ready! (बहुत तेज चलता है)</li>
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

    </div>
  );
}
