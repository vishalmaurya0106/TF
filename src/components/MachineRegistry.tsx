/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Machine } from '../types';
import { Cpu, Power, PowerOff, ShieldCheck, Hammer, Plus, Trash2, X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface MachineRegistryProps {
  machines: Machine[];
  onToggleMachine: (machineId: string) => void;
  onAddMachine: (newMachine: Machine) => void;
  onDeleteMachine: (machineId: string) => void;
}

export default function MachineRegistry({ 
  machines, 
  onToggleMachine,
  onAddMachine,
  onDeleteMachine
}: MachineRegistryProps) {
  const activeCount = machines.filter(m => m.isActive).length;

  // Add Machine Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMachineId, setNewMachineId] = useState('');
  const [newMachineActive, setNewMachineActive] = useState(true);
  const [error, setError] = useState('');

  // Delete Machine Modal State
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteMachineId, setDeleteMachineId] = useState('');

  // Calculate smart suggested name for next machine
  const getSuggestedMachineId = () => {
    let maxNum = 0;
    machines.forEach(m => {
      const match = m.machineId.match(/Machine\s+(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum > 0 ? maxNum + 1 : machines.length + 1;
    return `Machine ${nextNum.toString().padStart(2, '0')}`;
  };

  const handleOpenAddModal = () => {
    setNewMachineId(getSuggestedMachineId());
    setNewMachineActive(true);
    setError('');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedId = newMachineId.trim();
    if (!formattedId) {
      setError('Machine Name/ID is required.');
      return;
    }

    // Check if duplicate exists
    const duplicate = machines.some(
      m => m.machineId.toLowerCase() === formattedId.toLowerCase()
    );
    if (duplicate) {
      setError(`A loom machine with the name "${formattedId}" already exists.`);
      return;
    }

    onAddMachine({
      machineId: formattedId,
      isActive: newMachineActive
    });
    setIsAddModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    onDeleteMachine(deleteMachineId);
    setIsConfirmDeleteOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h2 id="machine-registry-title" className="text-xl font-bold text-slate-900">Loom Machine Registry</h2>
            <p className="text-sm text-slate-500 font-medium">Manage, add, remove and monitor operational status for all factory loom machines</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 h-11 shadow-sm">
            <ShieldCheck className="text-indigo-400 h-4 w-4" />
            <span>{activeCount} / {machines.length} Machines Active</span>
          </div>
          
          <button
            type="button"
            id="add-machine-btn"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-100 hover:shadow-lg transition-all cursor-pointer h-11"
          >
            <Plus className="h-4 w-4" />
            Add Loom Machine
          </button>
        </div>
      </div>

      {/* Grid of machines */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {machines.map((machine) => {
          // Robust display extraction for Loom number/code
          const parts = machine.machineId.split(' ');
          const machineDisplay = parts.length > 1 ? parts.slice(1).join(' ') : machine.machineId;

          return (
            <div 
              key={machine.machineId}
              id={`machine-card-${machine.machineId.replace(/\s+/g, '-')}`}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between items-start h-32 ${
                machine.isActive 
                  ? 'bg-white border-slate-200 shadow-sm hover:border-indigo-200 group' 
                  : 'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-[10px] font-extrabold text-slate-400 font-mono uppercase tracking-wider">
                  {parts.length > 1 ? parts[0] : 'Loom'}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    id={`toggle-machine-btn-${machine.machineId.replace(/\s+/g, '-')}`}
                    onClick={() => onToggleMachine(machine.machineId)}
                    title={machine.isActive ? 'Deactivate Machine (Maintenance)' : 'Activate Machine'}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      machine.isActive 
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                    }`}
                  >
                    {machine.isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                  </button>
                  
                  <button
                    id={`delete-machine-btn-${machine.machineId.replace(/\s+/g, '-')}`}
                    onClick={() => {
                      setDeleteMachineId(machine.machineId);
                      setIsConfirmDeleteOpen(true);
                    }}
                    title="Delete Machine"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xl font-mono font-black text-slate-900 leading-none">{machineDisplay}</p>
                <div className="flex items-center gap-1">
                  {machine.isActive ? (
                    <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Operational
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold text-rose-500 flex items-center gap-1">
                      <Hammer className="h-3 w-3" />
                      Maintenance
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Machine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">Add New Loom Machine</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-2 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Machine Identifier / Number</label>
                <input
                  type="text"
                  required
                  value={newMachineId}
                  onChange={(e) => {
                    setNewMachineId(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. Machine 31, Loom 10B"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Leave as suggested or customize. Pattern can be "Machine XX" or anything you like.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Initial Operational Status</label>
                <label className="flex items-center gap-3 bg-slate-50 p-3.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={newMachineActive}
                    onChange={(e) => setNewMachineActive(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-700 block">Mark Operational</span>
                    <span className="text-[10px] text-slate-400 font-medium block">Machine starts as operational and ready for work assignment.</span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold rounded-xl border border-slate-200 text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer"
                >
                  Create Machine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Machine Confirmation */}
      {isConfirmDeleteOpen && (
        <ConfirmModal
          isOpen={isConfirmDeleteOpen}
          title="Delete Loom Machine"
          message={`Are you sure you want to delete ${deleteMachineId}? This machine will no longer be available for loom production assignments.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsConfirmDeleteOpen(false)}
        />
      )}

    </div>
  );
}
