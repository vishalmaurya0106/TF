/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Worker, Machine, DailyWork } from '../types';
import { formatCurrency, formatDate, naturalSortWorkers } from '../utils';
import ConfirmModal from './ConfirmModal';
import { DateInput } from './DateInput';
import { 
  Cpu, Plus, Calendar, CheckSquare, Settings, 
  Trash2, ClipboardList, Check, Landmark, User, Clock, AlertTriangle, Filter, X
} from 'lucide-react';

interface LoomDailyWorkProps {
  workers: Worker[];
  machines: Machine[];
  dailyWorks: DailyWork[];
  onAddDailyWork: (work: DailyWork) => void;
  onDeleteDailyWork: (workId: string) => void;
  isAdmin?: boolean;
}

export default function LoomDailyWork({
  workers,
  machines,
  dailyWorks,
  onAddDailyWork,
  onDeleteDailyWork,
  isAdmin = true
}: LoomDailyWorkProps) {
  
  // Filter active loom operators
  const loomWorkers = useMemo(() => {
    return workers.filter(w => w.isActive && w.employeeType === 'Worker');
  }, [workers]);

  // Form State
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [customRate, setCustomRate] = useState<number | null>(null);
  const [selectedShift, setSelectedShift] = useState<'Day' | 'Night'>('Day');

  // Filter available operators who do NOT have a production entry for the selected date and shift
  const availableWorkers = useMemo(() => {
    return loomWorkers.filter(w => {
      return !dailyWorks.some(dw => 
        dw.workerId === w.workerId && 
        dw.date === selectedDate && 
        (dw.shift || 'Day') === selectedShift
      );
    });
  }, [loomWorkers, dailyWorks, selectedDate, selectedShift]);

  // Set of machine IDs that already have a production entry on the selected date and shift
  const assignedMachineIds = useMemo(() => {
    const set = new Set<string>();
    dailyWorks
      .filter(dw => dw.date === selectedDate && (dw.shift || 'Day') === selectedShift)
      .forEach(dw => {
        if (Array.isArray(dw.selectedMachines)) {
          dw.selectedMachines.forEach(mId => set.add(mId));
        }
      });
    return set;
  }, [dailyWorks, selectedDate, selectedShift]);

  // Available loom machines that have NOT been recorded yet for this date and shift
  const availableMachines = useMemo(() => {
    return machines.filter(m => !assignedMachineIds.has(m.machineId));
  }, [machines, assignedMachineIds]);

  // Clean up selection if date, shift, or assigned machines change
  useEffect(() => {
    setSelectedMachines(prev => prev.filter(mId => !assignedMachineIds.has(mId)));
  }, [assignedMachineIds]);

  // Error & Success Feedback State
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Clear feedback messages when operator, date, or shift changes
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
  }, [selectedWorkerId, selectedDate, selectedShift]);

  // Confirmation Modal State
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteWorkId, setDeleteWorkId] = useState('');
  const [deleteWorkMessage, setDeleteWorkMessage] = useState('');

  // Live Auto-calculated Wage
  const [liveWage, setLiveWage] = useState(0);

  // Find currently selected worker object
  const currentWorker = loomWorkers.find(w => w.workerId === selectedWorkerId);
  const currentRate = customRate !== null ? customRate : (currentWorker ? currentWorker.perMachineRate : 0);

  // Re-calculate live wage whenever selected worker, machines, or rate changes
  useEffect(() => {
    const count = selectedMachines.length;
    const rate = currentRate;
    setLiveWage(count * rate);
  }, [selectedMachines, selectedWorkerId, currentRate]);

  // Automatically keep selectedWorkerId synced to an available worker
  useEffect(() => {
    const sortedAvailable = naturalSortWorkers<Worker>(availableWorkers);
    if (sortedAvailable.length > 0) {
      if (!sortedAvailable.some(w => w.workerId === selectedWorkerId)) {
        setSelectedWorkerId(sortedAvailable[0].workerId);
      }
    } else {
      setSelectedWorkerId('');
    }
  }, [availableWorkers, selectedWorkerId]);

  const handleToggleMachine = (machineId: string) => {
    if (selectedMachines.includes(machineId)) {
      setSelectedMachines(prev => prev.filter(m => m !== machineId));
    } else {
      setSelectedMachines(prev => [...prev, machineId]);
    }
  };

  const handleSelectAllMachines = () => {
    if (selectedMachines.length === availableMachines.length && availableMachines.length > 0) {
      setSelectedMachines([]);
    } else {
      setSelectedMachines(availableMachines.map(m => m.machineId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedWorkerId) {
      setErrorMessage('Please select a Loom Operator first.');
      return;
    }
    if (selectedMachines.length === 0) {
      setErrorMessage('Please select at least one Loom Machine.');
      return;
    }

    // STRICT SHIFT CONSTRAINT: Check if entry already exists for this operator + date + shift
    const existingShiftEntry = dailyWorks.find(dw => 
      dw.workerId === selectedWorkerId && 
      dw.date === selectedDate && 
      (dw.shift || 'Day') === selectedShift
    );

    if (existingShiftEntry) {
      const operatorDisplay = currentWorker ? `${currentWorker.workerId} - ${currentWorker.name}` : selectedWorkerId;
      setErrorMessage(`Error: Production entry for ${operatorDisplay} on ${formatDate(selectedDate)} for ${selectedShift} Shift already exists! Second entry is not allowed.`);
      return;
    }

    const payload: DailyWork = {
      workId: `DW-${Date.now()}`,
      workerId: selectedWorkerId,
      date: selectedDate,
      selectedMachines: [...selectedMachines],
      machineCount: selectedMachines.length,
      perMachineRate: currentRate,
      calculatedWage: parseFloat(liveWage.toFixed(2)),
      shift: selectedShift
    };

    onAddDailyWork(payload);
    
    setSuccessMessage(`Production entry saved successfully for ${currentWorker?.name || selectedWorkerId} (${selectedShift} Shift)!`);
    setTimeout(() => setSuccessMessage(''), 3000);

    // Reset Form selections except worker & date to keep it easy for sequential entry
    setSelectedMachines([]);
    setCustomRate(null);
  };

  // Filter Date Range State
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Filter dailyWorks based on date range
  const filteredDailyWorks = dailyWorks.filter(dw => {
    if (filterStartDate && dw.date < filterStartDate) return false;
    if (filterEndDate && dw.date > filterEndDate) return false;
    return true;
  });

  // Group historical records by date, but sort records on same date by Worker ID (Natural Sort)
  const uniqueDates = Array.from(new Set(filteredDailyWorks.map(dw => dw.date))).sort((a, b) => b.localeCompare(a));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Production Form (Left 2 columns in large screen) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h2 id="loom-prod-title" className="text-xl font-bold text-slate-900">Loom Worker Production entry</h2>
              <p className="text-sm text-slate-500 font-medium">Record daily runs and auto-calculate double precision wages</p>
            </div>
          </div>

          <form id="production-entry-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-3 shadow-xs">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-3 shadow-xs">
                <CheckSquare className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {availableWorkers.length === 0 && loomWorkers.length > 0 && !successMessage && (
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-bold flex items-center gap-3 shadow-xs">
                <CheckSquare className="h-5 w-5 text-indigo-600 shrink-0" />
                <span className="leading-relaxed">All {loomWorkers.length} Loom Operators have already logged production entries for {selectedShift} Shift on {formatDate(selectedDate)}! Switch shift or date to add more entries.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" /> Production Date
                </label>
                <DateInput
                  id="prod-date-input"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  className="w-full"
                />
              </div>

              {/* Loom Worker Select (Format strictly ID - Name as requested!) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" /> Select Loom Operator
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    availableWorkers.length === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {availableWorkers.length}/{loomWorkers.length} Pending
                  </span>
                </label>
                <select
                  id="prod-worker-select"
                  value={selectedWorkerId}
                  onChange={(e) => {
                    setSelectedWorkerId(e.target.value);
                    setCustomRate(null); // Reset custom rate to use default
                  }}
                  disabled={availableWorkers.length === 0}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl outline-none text-sm transition-all font-medium ${
                    availableWorkers.length === 0 ? 'opacity-75 cursor-not-allowed text-slate-500' : 'cursor-pointer'
                  }`}
                >
                  {loomWorkers.length === 0 ? (
                    <option value="">No Active Operators Registered</option>
                  ) : availableWorkers.length === 0 ? (
                    <option value="">All operators entered for {selectedShift} Shift</option>
                  ) : (
                    naturalSortWorkers<Worker>(availableWorkers).map(w => (
                      <option key={w.workerId} value={w.workerId}>
                        {/* CRITICAL FORMAT REQUIREMENT: ID - Name */}
                        {w.workerId} - {w.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Shift Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Select Shift
                </label>
                <div className="grid grid-cols-2 gap-2 h-11 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedShift('Day')}
                    className={`rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedShift === 'Day'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    ☀️ Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedShift('Night')}
                    className={`rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedShift === 'Night'
                        ? 'bg-slate-900 text-indigo-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🌙 Night
                  </button>
                </div>
              </div>
            </div>

            {/* Live Stats summary banner */}
            {currentWorker && (
              <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-sm">
                  <div className="font-semibold text-slate-700">
                    Active Loom operator selected: <span className="font-bold text-slate-900">{currentWorker.workerId} - {currentWorker.name}</span>
                  </div>
                  <div className="text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                    <Landmark className="h-3 w-3" /> A/C: {currentWorker.bankDetails.bankName} (IFSC: {currentWorker.bankDetails.ifscCode})
                  </div>
                </div>
                <div className="text-right sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                  <span className="text-xs font-bold text-slate-400 block tracking-wider uppercase">STANDARD RATE</span>
                  <span className="font-mono font-bold text-indigo-600 text-lg">{formatCurrency(currentWorker.perMachineRate)}</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">per machine run</span>
                </div>
              </div>
            )}

            {/* Loom Machines Grid Multi-Select */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <span>Assign active loom machines ({selectedMachines.length} selected)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 normal-case font-mono">
                    {availableMachines.length} / {machines.length} Available
                  </span>
                </label>

                {availableMachines.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllMachines}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    {selectedMachines.length === availableMachines.length ? 'Deselect All' : 'Select All Available'}
                  </button>
                )}
              </div>

              {availableMachines.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Cpu className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-700 font-bold text-xs">All Loom Machines Recorded</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    All {machines.length} loom machines already have production entries logged for {selectedShift} Shift on {formatDate(selectedDate)}.
                  </p>
                </div>
              ) : (
                /* Grid representation of available machines */
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {availableMachines.map((machine) => {
                    const isSelected = selectedMachines.includes(machine.machineId);
                    return (
                      <button
                        key={machine.machineId}
                        type="button"
                        id={`machine-btn-${machine.machineId.replace(' ', '-')}`}
                        onClick={() => handleToggleMachine(machine.machineId)}
                        className={`h-11 rounded-xl font-mono text-xs font-bold flex flex-col justify-center items-center border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-750 shadow-md ring-2 ring-indigo-100 ring-offset-1 scale-102' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span className="text-[9px] uppercase tracking-wider block opacity-70">Loom</span>
                        <span className="text-xs mt-0.5">{machine.machineId.split(' ')[1]}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Calculation Board & Submit Button */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">WAGE AUTO-CALCULATION</p>
                <div className="font-mono text-sm mt-1.5 text-slate-300">
                  {selectedMachines.length} machines × {formatCurrency(currentRate)}
                </div>
                <div className="text-2xl font-mono font-bold text-white mt-1">
                  Total Earned: {formatCurrency(liveWage)}
                </div>
              </div>
              <button
                type="submit"
                id="submit-prod-entry-btn"
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5 stroke-[3]" />
                Record Production
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Production Logs History (Right 1 column in large screen) */}
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm max-h-[85vh] overflow-y-auto">
          <div className="space-y-3 mb-5 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <ClipboardList className="text-indigo-600 h-5 w-5" />
                <h3 id="history-log-title" className="font-bold text-slate-900 text-base">Production logs</h3>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                {filteredDailyWorks.length} Logs
              </span>
            </div>

            {/* Date Range Filter Controls */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Filter className="h-3.5 w-3.5 text-indigo-600" />
                <span>Filter by Date Range:</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">FROM DATE</label>
                  <DateInput
                    id="filter-start-date-input"
                    value={filterStartDate}
                    onChange={setFilterStartDate}
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">TO DATE</label>
                  <DateInput
                    id="filter-end-date-input"
                    value={filterEndDate}
                    onChange={setFilterEndDate}
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  id="btn-filter-entry-date"
                  onClick={() => {
                    setFilterStartDate(selectedDate);
                    setFilterEndDate(selectedDate);
                  }}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all cursor-pointer ${
                    filterStartDate === selectedDate && filterEndDate === selectedDate
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Entry Date ({formatDate(selectedDate)})
                </button>

                <button
                  type="button"
                  id="btn-filter-today"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setFilterStartDate(today);
                    setFilterEndDate(today);
                  }}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all cursor-pointer ${
                    filterStartDate === new Date().toISOString().split('T')[0] && filterEndDate === new Date().toISOString().split('T')[0]
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Today
                </button>

                {(filterStartDate || filterEndDate) && (
                  <button
                    type="button"
                    id="btn-filter-clear"
                    onClick={() => {
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className="text-[10px] font-bold px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <X className="h-3 w-3" /> All Dates
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {uniqueDates.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                {(filterStartDate || filterEndDate) ? 'No logs found in selected date range.' : 'No production logs recorded yet.'}
              </p>
            ) : (
              uniqueDates.map(dateStr => {
                const dateWorks = filteredDailyWorks.filter(dw => dw.date === dateStr);
                
                // Grouping is done by date. For each date, sort workers by Natural Sort on workerId
                // We'll map each work entry to its worker detail to sort correctly
                const worksWithWorkerDetail = dateWorks.map(dw => {
                  const workerObj = workers.find(w => w.workerId === dw.workerId);
                  return {
                    ...dw,
                    workerId: dw.workerId // needed for naturalSortWorkers interface
                  };
                });
                
                const sortedDateWorks = naturalSortWorkers(worksWithWorkerDetail);

                return (
                  <div key={dateStr} className="space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase bg-slate-50 px-2.5 py-1 rounded-md border inline-block tracking-wide">
                      {formatDate(dateStr)}
                    </h4>
                    <div className="space-y-2.5">
                      {sortedDateWorks.map((work) => {
                        const workerObj = workers.find(w => w.workerId === work.workerId);
                        return (
                          <div 
                            key={work.workId} 
                            className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between items-start group relative transition-all"
                          >
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 text-xs">
                                {work.workerId} - {workerObj?.name || 'Unknown Worker'}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                Machines: {work.selectedMachines.map(m => m.split(' ')[1]).join(', ')}
                              </p>
                              <div className="flex flex-wrap gap-1 items-center mt-1">
                                <span className="inline-block text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2 py-0.5">
                                  {work.machineCount} Runs
                                </span>
                                <span className={`inline-block text-[9px] font-bold border rounded-full px-2 py-0.5 ${
                                  (work.shift || 'Day') === 'Night'
                                    ? 'bg-slate-900 text-indigo-300 border-slate-800'
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                  {(work.shift || 'Day') === 'Night' ? '🌙 Night' : '☀️ Day'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-1.5">
                              <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                                {formatCurrency(work.calculatedWage)}
                              </div>
                              {isAdmin && (
                                <button
                                  title="Delete Log Entry"
                                  onClick={() => {
                                    setDeleteWorkId(work.workId);
                                    setDeleteWorkMessage(`Do you want to delete this production log for ${workerObj?.name || work.workerId} on ${formatDate(dateStr)}?`);
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
          title="Delete Production Log"
          message={deleteWorkMessage}
          onConfirm={() => {
            onDeleteDailyWork(deleteWorkId);
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
