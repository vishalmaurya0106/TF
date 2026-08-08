/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Worker, Attendance, AttendanceStatus } from '../types';
import { formatDate, naturalSortWorkers } from '../utils';
import ConfirmModal from './ConfirmModal';
import { 
  ClipboardList, Clock, Calendar, Check, Sparkles, 
  UserCheck, Trash2, ShieldAlert, ArrowRight 
} from 'lucide-react';

interface AttendanceRegisterProps {
  workers: Worker[];
  attendances: Attendance[];
  onAddAttendance: (attendance: Attendance) => void;
  onDeleteAttendance: (id: string) => void;
  isAdmin?: boolean;
}

export default function AttendanceRegister({
  workers,
  attendances,
  onAddAttendance,
  onDeleteAttendance,
  isAdmin = true
}: AttendanceRegisterProps) {
  
  // Filter active loom workers
  const loomOperators = workers.filter(w => w.isActive && w.employeeType === 'Worker');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Confirmation Modal State
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteAttendanceId, setDeleteAttendanceId] = useState('');
  const [deleteAttendanceMessage, setDeleteAttendanceMessage] = useState('');

  // Get attendance record for selected date
  const getRecord = (workerId: string) => {
    return attendances.find(a => a.workerId === workerId && a.date === selectedDate);
  };

  const handleUpdateRecord = (
    workerId: string, 
    status: AttendanceStatus, 
    inTime: string = "08:30", 
    outTime: string = "18:00"
  ) => {
    setSavingId(workerId);

    const existingRecord = getRecord(workerId);
    
    const payload: Attendance = {
      attendanceId: existingRecord?.attendanceId || `LA-${Date.now()}-${workerId}`,
      workerId,
      date: selectedDate,
      status,
      inTime: status === 'Present' || status === 'Half-Day' ? inTime : '',
      outTime: status === 'Present' || status === 'Half-Day' ? outTime : ''
    };

    onAddAttendance(payload);

    setTimeout(() => {
      setSavingId(null);
    }, 400);
  };

  const sortedOperators = naturalSortWorkers(loomOperators);
  const uniqueDates = Array.from(new Set(attendances.map(a => a.date))).sort((a, b) => b.localeCompare(a));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Attendance Form Sheet (Left Columns) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h2 id="loom-att-title" className="text-xl font-bold text-slate-900">Loom Operator shift register</h2>
                <p className="text-sm text-slate-500 font-medium">Log shift attendance and exact In/Out operational timings</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2.5 bg-slate-50 border px-3 py-2 rounded-xl">
              <Calendar className="h-4.5 w-4.5 text-slate-400" />
              <input
                id="loom-att-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Table list */}
          <div className="space-y-4">
            {sortedOperators.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <UserCheck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                No active Loom Operators found. Please register Loom Operators in the Directory.
              </div>
            ) : (
              sortedOperators.map((operator) => {
                const rec = getRecord(operator.workerId);
                const currentStatus = rec?.status;
                const currentIn = rec?.inTime || "08:30";
                const currentOut = rec?.outTime || "18:00";
                const isSaving = savingId === operator.workerId;

                return (
                  <div 
                    key={operator.workerId}
                    id={`loom-att-row-${operator.workerId}`}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all"
                  >
                    
                    {/* ID & Name */}
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-bold text-sm text-slate-400 bg-slate-100 h-9 w-9 rounded-lg flex items-center justify-center border border-slate-200">
                        {operator.workerId}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {operator.workerId} - {operator.name}
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Loom Operator</p>
                      </div>
                    </div>

                    {/* Status & Timing inputs */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full sm:w-auto">
                      {/* Segmented Status Selector */}
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`btn-loom-present-${operator.workerId}`}
                          onClick={() => handleUpdateRecord(operator.workerId, 'Present', currentIn, currentOut)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            currentStatus === 'Present'
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          id={`btn-loom-half-${operator.workerId}`}
                          onClick={() => handleUpdateRecord(operator.workerId, 'Half-Day', currentIn, currentOut)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            currentStatus === 'Half-Day'
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          Half-Day
                        </button>
                        <button
                          id={`btn-loom-absent-${operator.workerId}`}
                          onClick={() => handleUpdateRecord(operator.workerId, 'Absent', '', '')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            currentStatus === 'Absent'
                              ? 'bg-red-500 text-white border-red-600 shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          Absent
                        </button>
                      </div>

                      {/* Timings (Visible only if Present / Half-Day) */}
                      {(currentStatus === 'Present' || currentStatus === 'Half-Day') && (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                          <input
                            id={`in-time-${operator.workerId}`}
                            type="time"
                            value={currentIn}
                            onChange={(e) => handleUpdateRecord(operator.workerId, currentStatus, e.target.value, currentOut)}
                            className="bg-transparent text-xs font-mono font-bold text-slate-800 border-none outline-none"
                          />
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <input
                            id={`out-time-${operator.workerId}`}
                            type="time"
                            value={currentOut}
                            onChange={(e) => handleUpdateRecord(operator.workerId, currentStatus, currentIn, e.target.value)}
                            className="bg-transparent text-xs font-mono font-bold text-slate-800 border-none outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Saving Feedback */}
                    <div className="flex items-center gap-1.5">
                      {isSaving && (
                        <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 animate-pulse bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <Sparkles className="h-2.5 w-2.5" /> Saved
                        </span>
                      )}
                      {!rec && (
                        <span className="text-[11px] text-slate-300 italic">No entry today</span>
                      )}
                      {rec && !isSaving && (
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-0.5 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          Recorded
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

      {/* History Log Column */}
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm max-h-[85vh] overflow-y-auto">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
            <ClipboardList className="text-indigo-600 h-5 w-5" />
            <h3 id="loom-att-log-title" className="font-bold text-slate-900 text-base">Register logs</h3>
          </div>

          <div className="space-y-6">
            {uniqueDates.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No shift logs found.</p>
            ) : (
              uniqueDates.map(dateStr => {
                const dateRecords = attendances.filter(a => a.date === dateStr);
                
                // Grouping is done by date, and sorted within date by Natural Sort of workerId
                const recordsWithOperators = dateRecords.map(a => {
                  return {
                    ...a,
                    workerId: a.workerId // needed for naturalSortWorkers interface
                  };
                });

                const sortedDateRecords = naturalSortWorkers(recordsWithOperators);

                return (
                  <div key={dateStr} className="space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase bg-slate-50 px-2.5 py-1 rounded-md border inline-block tracking-wide">
                      {formatDate(dateStr)}
                    </h4>
                    <div className="space-y-2.5">
                      {sortedDateRecords.map((rec) => {
                        const operatorObj = workers.find(w => w.workerId === rec.workerId);
                        
                        let badgeStyle = "bg-slate-100 text-slate-700";
                        if (rec.status === 'Present') badgeStyle = "bg-indigo-50 text-indigo-700 border border-indigo-100";
                        else if (rec.status === 'Half-Day') badgeStyle = "bg-amber-50 text-amber-700 border border-amber-100";
                        else if (rec.status === 'Absent') badgeStyle = "bg-red-50 text-red-700 border border-red-100";

                        return (
                          <div 
                            key={rec.attendanceId} 
                            className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between items-start group relative transition-all"
                          >
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 text-xs">
                                {rec.workerId} - {operatorObj?.name || 'Unknown operator'}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className={`text-[9px] font-extrabold rounded-full px-2 py-0.5 ${badgeStyle}`}>
                                  {rec.status}
                                </span>
                                {(rec.status === 'Present' || rec.status === 'Half-Day') && (
                                  <span className="text-[9px] text-slate-400 font-mono font-bold bg-white border rounded px-1.5 py-0.5">
                                    {rec.inTime} - {rec.outTime}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-1.5">
                              {isAdmin && (
                                <button
                                  title="Delete shift record"
                                  onClick={() => {
                                    setDeleteAttendanceId(rec.attendanceId);
                                    setDeleteAttendanceMessage(`Do you want to delete shift record for ${operatorObj?.name || rec.workerId} on ${formatDate(dateStr)}?`);
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
          title="Delete Shift Record"
          message={deleteAttendanceMessage}
          onConfirm={() => {
            onDeleteAttendance(deleteAttendanceId);
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
