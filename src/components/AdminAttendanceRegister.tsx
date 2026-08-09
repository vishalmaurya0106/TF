/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Worker, AdminAttendance, AttendanceStatus } from '../types';
import { formatCurrency, formatDate, naturalSortWorkers } from '../utils';
import ConfirmModal from './ConfirmModal';
import { DateInput } from './DateInput';
import { 
  Building, UserCheck, ClipboardCheck, 
  Trash2, Plus, Info, Check, Sparkles, Save 
} from 'lucide-react';

interface AdminAttendanceRegisterProps {
  workers: Worker[];
  adminAttendances: AdminAttendance[];
  onAddAdminAttendance: (attendance: AdminAttendance) => void;
  onDeleteAdminAttendance: (id: string) => void;
  isAdmin?: boolean;
}

export default function AdminAttendanceRegister({
  workers,
  adminAttendances,
  onAddAdminAttendance,
  onDeleteAdminAttendance,
  isAdmin = true
}: AdminAttendanceRegisterProps) {
  
  // Filter active Admin Staff
  const adminStaff = workers.filter(w => w.isActive && w.employeeType === 'Admin Employee');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveAllSuccess, setSaveAllSuccess] = useState(false);

  // Staged selection before clicking save
  const [stagedStatuses, setStagedStatuses] = useState<Record<string, AttendanceStatus>>({});

  // Confirmation Modal State
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteAdminAttendanceId, setDeleteAdminAttendanceId] = useState('');
  const [deleteAdminAttendanceMessage, setDeleteAdminAttendanceMessage] = useState('');

  // Get saved attendance status for a worker on the selected date
  const getSavedAttendance = (workerId: string) => {
    return adminAttendances.find(a => a.workerId === workerId && a.date === selectedDate);
  };

  // Synchronize staged selections whenever date or saved records change
  useEffect(() => {
    const newStaged: Record<string, AttendanceStatus> = {};
    adminStaff.forEach(admin => {
      const rec = adminAttendances.find(a => a.workerId === admin.workerId && a.date === selectedDate);
      newStaged[admin.workerId] = rec ? rec.status : 'Present';
    });
    setStagedStatuses(newStaged);
  }, [selectedDate, adminAttendances, workers]);

  const handleSelectStatus = (workerId: string, status: AttendanceStatus) => {
    setStagedStatuses(prev => ({
      ...prev,
      [workerId]: status
    }));
  };

  const handleSaveSingleAdmin = (admin: Worker) => {
    const status = stagedStatuses[admin.workerId] || 'Present';
    setSavingId(admin.workerId);

    let calculatedWage = 0;
    if (status === 'Present') {
      calculatedWage = admin.perMachineRate;
    } else if (status === 'Half-Day') {
      calculatedWage = admin.perMachineRate / 2;
    } else if (status === 'Absent') {
      calculatedWage = 0;
    }

    const matchedId = adminAttendances.find(a => a.workerId === admin.workerId && a.date === selectedDate)?.adminAttendanceId;

    const payload: AdminAttendance = {
      adminAttendanceId: matchedId || `AA-${Date.now()}-${admin.workerId}`,
      workerId: admin.workerId,
      date: selectedDate,
      status,
      calculatedWage: parseFloat(calculatedWage.toFixed(2))
    };

    onAddAdminAttendance(payload);

    setTimeout(() => {
      setSavingId(null);
    }, 500);
  };

  const handleSaveAllAdmins = () => {
    adminStaff.forEach(admin => {
      const status = stagedStatuses[admin.workerId] || 'Present';
      let calculatedWage = 0;
      if (status === 'Present') {
        calculatedWage = admin.perMachineRate;
      } else if (status === 'Half-Day') {
        calculatedWage = admin.perMachineRate / 2;
      } else if (status === 'Absent') {
        calculatedWage = 0;
      }

      const matchedId = adminAttendances.find(a => a.workerId === admin.workerId && a.date === selectedDate)?.adminAttendanceId;

      const payload: AdminAttendance = {
        adminAttendanceId: matchedId || `AA-${Date.now()}-${admin.workerId}`,
        workerId: admin.workerId,
        date: selectedDate,
        status,
        calculatedWage: parseFloat(calculatedWage.toFixed(2))
      };

      onAddAdminAttendance(payload);
    });

    setSaveAllSuccess(true);
    setTimeout(() => {
      setSaveAllSuccess(false);
    }, 1500);
  };

  // Sorted admins list by Employee ID (Natural Sort)
  const sortedAdmins = naturalSortWorkers(adminStaff);

  // Filter adminAttendances to only include records for Admin Employee staff
  const adminWorkerIds = new Set(workers.filter(w => w.employeeType === 'Admin Employee').map(w => w.workerId));
  const adminOnlyAttendances = adminAttendances.filter(a => adminWorkerIds.has(a.workerId));

  // Group logs by date, sort descending, and then natural sort admins
  const uniqueDates = Array.from(new Set(adminOnlyAttendances.map(a => a.date))).sort((a, b) => b.localeCompare(a));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Attendance Register Board (Left 2 columns in large screen) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h2 id="admin-att-title" className="text-xl font-bold text-slate-900">Admin Staff attendance</h2>
                <p className="text-sm text-slate-500 font-medium">Record daily attendance and auto-calculate daily wages</p>
              </div>
            </div>

            {/* Date Select & Batch Save */}
            <div className="flex flex-wrap items-center gap-2.5">
              <DateInput
                id="admin-att-date-input"
                value={selectedDate}
                onChange={setSelectedDate}
                className="w-40 shadow-2xs"
              />

              {sortedAdmins.length > 0 && (
                <button
                  type="button"
                  id="save-all-admin-attendance-btn"
                  onClick={handleSaveAllAdmins}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{saveAllSuccess ? 'All Saved ✓' : 'Save All'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Guidelines info */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/60 flex items-start gap-3 text-xs text-slate-500 mb-6">
            <Info className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700">Wage Rules: </span>
              Present = Full standard daily rate (<span className="font-mono font-semibold">100%</span>). 
              Half-Day = Half standard daily rate (<span className="font-mono font-semibold">50%</span>). 
              Absent = No wage (<span className="font-mono font-semibold">₹0.00</span>). 
              Select status and click <span className="font-bold text-emerald-700">Save</span>.
            </div>
          </div>

          {/* Admin List */}
          <div className="space-y-4">
            {sortedAdmins.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <UserCheck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                No active Admin staff found. Please register Admin employees in the Directory.
              </div>
            ) : (
              sortedAdmins.map((admin) => {
                const record = getSavedAttendance(admin.workerId);
                const currentStatus = stagedStatuses[admin.workerId] || 'Present';
                const isSaving = savingId === admin.workerId;
                const isModified = !record || record.status !== currentStatus;

                let projectedWage = admin.perMachineRate;
                if (currentStatus === 'Half-Day') projectedWage = admin.perMachineRate / 2;
                if (currentStatus === 'Absent') projectedWage = 0;

                return (
                  <div 
                    key={admin.workerId}
                    id={`admin-att-row-${admin.workerId}`}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all"
                  >
                    {/* Admin ID & Name */}
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-bold text-sm text-slate-400 bg-slate-100 h-9 w-9 rounded-lg flex items-center justify-center border border-slate-200">
                        {admin.workerId}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {admin.workerId} - {admin.name}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          Standard rate: <span className="font-mono font-bold text-slate-600">{formatCurrency(admin.perMachineRate)}</span>/day
                        </div>
                      </div>
                    </div>

                    {/* Attendance Status Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        id={`btn-present-${admin.workerId}`}
                        onClick={() => handleSelectStatus(admin.workerId, 'Present')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                          currentStatus === 'Present'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm shadow-emerald-500/10'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {currentStatus === 'Present' && <Check className="h-3 w-3" />}
                        Present
                      </button>

                      <button
                        type="button"
                        id={`btn-half-${admin.workerId}`}
                        onClick={() => handleSelectStatus(admin.workerId, 'Half-Day')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                          currentStatus === 'Half-Day'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/10'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {currentStatus === 'Half-Day' && <Check className="h-3 w-3" />}
                        Half-Day
                      </button>

                      <button
                        type="button"
                        id={`btn-absent-${admin.workerId}`}
                        onClick={() => handleSelectStatus(admin.workerId, 'Absent')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                          currentStatus === 'Absent'
                            ? 'bg-red-500 text-white border-red-600 shadow-sm shadow-red-500/10'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {currentStatus === 'Absent' && <Check className="h-3 w-3" />}
                        Absent
                      </button>
                    </div>

                    {/* Day's wage & Save Button */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {formatCurrency(projectedWage)}
                      </span>

                      <button
                        type="button"
                        id={`btn-save-admin-${admin.workerId}`}
                        onClick={() => handleSaveSingleAdmin(admin)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          isSaving
                            ? 'bg-emerald-700 text-white'
                            : isModified
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/30'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>{isSaving ? 'Saving...' : 'Save'}</span>
                      </button>

                      {isSaving && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 animate-pulse bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                          <Sparkles className="h-2.5 w-2.5" /> Saved
                        </span>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* History logs (Right column) */}
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm max-h-[85vh] overflow-y-auto">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
            <ClipboardCheck className="text-indigo-600 h-5 w-5" />
            <h3 id="admin-log-title" className="font-bold text-slate-900 text-base">Attendance logs</h3>
          </div>

          <div className="space-y-6">
            {uniqueDates.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No attendance records found.</p>
            ) : (
              uniqueDates.map(dateStr => {
                const dateRecords = adminOnlyAttendances.filter(a => a.date === dateStr);
                
                // Grouping is done by date. For each date, sort records by Natural Sort of workerId
                const recordsWithAdmins = dateRecords.map(a => {
                  const workerObj = workers.find(w => w.workerId === a.workerId);
                  return {
                    ...a,
                    workerId: a.workerId // needed for naturalSortWorkers interface
                  };
                });

                const sortedDateRecords = naturalSortWorkers(recordsWithAdmins);

                return (
                  <div key={dateStr} className="space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase bg-slate-50 px-2.5 py-1 rounded-md border inline-block tracking-wide">
                      {formatDate(dateStr)}
                    </h4>
                    <div className="space-y-2.5">
                      {sortedDateRecords.map((rec) => {
                        const adminObj = workers.find(w => w.workerId === rec.workerId);
                        
                        // Status badge styling
                        let badgeStyle = "bg-slate-100 text-slate-700";
                        if (rec.status === 'Present') badgeStyle = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                        else if (rec.status === 'Half-Day') badgeStyle = "bg-amber-50 text-amber-700 border border-amber-100";
                        else if (rec.status === 'Absent') badgeStyle = "bg-red-50 text-red-700 border border-red-100";

                        return (
                          <div 
                            key={rec.adminAttendanceId} 
                            className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between items-start group relative transition-all"
                          >
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 text-xs">
                                {rec.workerId} - {adminObj?.name || 'Unknown Staff'}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className={`text-[9px] font-extrabold rounded-full px-2 py-0.5 ${badgeStyle}`}>
                                  {rec.status}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-1.5">
                              <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                                {formatCurrency(rec.calculatedWage)}
                              </div>
                              {isAdmin && (
                                <button
                                  title="Delete attendance record"
                                  onClick={() => {
                                    setDeleteAdminAttendanceId(rec.adminAttendanceId);
                                    setDeleteAdminAttendanceMessage(`Do you want to delete attendance record for ${adminObj?.name || rec.workerId} on ${formatDate(dateStr)}?`);
                                    setIsConfirmDeleteOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {isConfirmDeleteOpen && (
        <ConfirmModal
          isOpen={isConfirmDeleteOpen}
          title="Delete Attendance Record"
          message={deleteAdminAttendanceMessage}
          onConfirm={() => {
            onDeleteAdminAttendance(deleteAdminAttendanceId);
            setIsConfirmDeleteOpen(false);
          }}
          onCancel={() => {
            setIsConfirmDeleteOpen(false);
          }}
        />
      )}

    </div>
  );
}
