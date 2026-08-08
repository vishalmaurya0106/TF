/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Worker, Salary, DailyWork, AdminAttendance, PayrollStatus } from '../types';
import { formatCurrency, naturalSortWorkers } from '../utils';
import { 
  FileText, Calendar, Check, Landmark, ArrowUpRight, 
  Settings, Percent, CreditCard, CheckCircle2, AlertCircle,
  Search, Download
} from 'lucide-react';
import SalarySlipPDF from './SalarySlipPDF';

interface MonthlySalarySheetProps {
  workers: Worker[];
  salaries: Salary[];
  dailyWorks: DailyWork[];
  adminAttendances: AdminAttendance[];
  onUpdateSalary: (salary: Salary) => void;
}

export default function MonthlySalarySheet({
  workers,
  salaries,
  dailyWorks,
  adminAttendances,
  onUpdateSalary
}: MonthlySalarySheetProps) {
  
  // State for selected Month (defaults to current month YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));

  // State for launching Payslip PDF
  const [activeSlipWorker, setActiveSlipWorker] = useState<Worker | null>(null);
  const [activeSlipSalary, setActiveSlipSalary] = useState<Salary | null>(null);

  // Search Filter State
  const [searchTerm, setSearchTerm] = useState('');

  // Date Range State for Bank File Download
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // Helper to calculate date range for the selected month
  const getMonthDateRange = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const y = parseInt(year);
    const m = parseInt(month);
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate };
  };

  // Automatically update start & end dates when the month changes
  useEffect(() => {
    const { startDate, endDate } = getMonthDateRange(selectedMonth);
    setExportStartDate(startDate);
    setExportEndDate(endDate);
  }, [selectedMonth]);

  // Helper to calculate base salary for a worker in the selected month
  const calculateBaseSalary = (worker: Worker): number => {
    if (worker.employeeType === 'Worker') {
      // Sum up daily loom production for this month
      const monthWorks = dailyWorks.filter(dw => 
        dw.workerId === worker.workerId && 
        dw.date.startsWith(selectedMonth)
      );
      const total = monthWorks.reduce((sum, dw) => sum + dw.calculatedWage, 0);
      return parseFloat(total.toFixed(2));
    } else {
      // Sum up admin daily attendance wages for this month
      const monthAdminAtt = adminAttendances.filter(aa => 
        aa.workerId === worker.workerId && 
        aa.date.startsWith(selectedMonth)
      );
      const total = monthAdminAtt.reduce((sum, aa) => sum + aa.calculatedWage, 0);
      return parseFloat(total.toFixed(2));
    }
  };

  // Helper to get or mock the salary record for a worker
  const getSalaryRecord = (workerId: string, baseSal: number): Salary => {
    const existing = salaries.find(s => s.workerId === workerId && s.month === selectedMonth);
    if (existing) {
      // Sync the base salary if it changed due to new production/attendance
      if (existing.baseSalary !== baseSal) {
        const netSal = parseFloat((baseSal + existing.bonus - existing.advance - existing.deductions).toFixed(2));
        return {
          ...existing,
          baseSalary: baseSal,
          netSalary: netSal
        };
      }
      return existing;
    }

    // Default mock-record if none exists
    return {
      salaryId: `${workerId}-${selectedMonth}`,
      workerId,
      month: selectedMonth,
      baseSalary: baseSal,
      bonus: 0,
      advance: 0,
      deductions: 0,
      netSalary: baseSal,
      status: 'Pending'
    };
  };

  // Export Bank Excel/CSV File
  const handleDownloadBankFile = () => {
    if (!exportStartDate || !exportEndDate) {
      alert("Error: Date cannot be zero! Page is refreshing...");
      window.location.reload();
      return;
    }

    // Headers exactly as requested
    const headers = [
      "Employee ID", 
      "Name", 
      "Net Final Salary", 
      "Beneficiary Name", 
      "Account Number", 
      "IFSC Code"
    ];
    
    const rows = sortedWorkers
      .map(worker => {
        // Calculate base salary for this worker in the specified date range
        let baseSalRange = 0;
        if (worker.employeeType === 'Worker') {
          const rangeWorks = dailyWorks.filter(dw => 
            dw.workerId === worker.workerId && 
            dw.date >= exportStartDate && 
            dw.date <= exportEndDate
          );
          baseSalRange = rangeWorks.reduce((sum, dw) => sum + dw.calculatedWage, 0);
        } else {
          const rangeAdminAtt = adminAttendances.filter(aa => 
            aa.workerId === worker.workerId && 
            aa.date >= exportStartDate && 
            aa.date <= exportEndDate
          );
          baseSalRange = rangeAdminAtt.reduce((sum, aa) => sum + aa.calculatedWage, 0);
        }
        baseSalRange = parseFloat(baseSalRange.toFixed(2));

        // Fetch adjustments (bonus, advance, deductions) from the selected month record
        const salaryRecord = getSalaryRecord(worker.workerId, baseSalRange);
        const netSalary = parseFloat(
          (baseSalRange + salaryRecord.bonus - salaryRecord.advance - salaryRecord.deductions).toFixed(2)
        );

        return {
          worker,
          netSalary
        };
      })
      .filter(item => item.netSalary > 0)
      .map(item => {
        const rawAcc = item.worker.bankDetails?.accountNumber?.trim() || '';
        // Format account number as Excel string formula `="ACC_NO"` to prevent scientific notation (1.09823E+13) and keep full digits
        const formattedAcc = rawAcc ? `="${rawAcc}"` : '';
        const rawIfsc = item.worker.bankDetails?.ifscCode?.trim() || '';
        const formattedIfsc = rawIfsc ? `="${rawIfsc}"` : '';

        return [
          item.worker.workerId,
          item.worker.name,
          item.netSalary,
          item.worker.bankDetails?.beneficiaryName || item.worker.name,
          formattedAcc,
          formattedIfsc
        ];
      });

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => {
        const strVal = String(val);
        if (strVal.startsWith('=')) {
          return strVal;
        }
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(','))
    ].join('\n');

    // Trigger download
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bank_Salary_Sheet_${exportStartDate}_to_${exportEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateField = (workerId: string, baseSal: number, field: 'bonus' | 'advance' | 'deductions', valueStr: string) => {
    const parsedVal = parseFloat(valueStr);
    const value = isNaN(parsedVal) || parsedVal < 0 ? 0 : parseFloat(parsedVal.toFixed(2));
    
    const record = getSalaryRecord(workerId, baseSal);
    const updatedRecord = { ...record };
    
    if (field === 'bonus') updatedRecord.bonus = value;
    if (field === 'advance') updatedRecord.advance = value;
    if (field === 'deductions') updatedRecord.deductions = value;

    // Recalculate net final
    updatedRecord.netSalary = parseFloat((updatedRecord.baseSalary + updatedRecord.bonus - updatedRecord.advance - updatedRecord.deductions).toFixed(2));

    onUpdateSalary(updatedRecord);
  };

  const handleToggleStatus = (workerId: string, baseSal: number) => {
    const record = getSalaryRecord(workerId, baseSal);
    const newStatus: PayrollStatus = record.status === 'Paid' ? 'Pending' : 'Paid';
    
    const updatedRecord = {
      ...record,
      status: newStatus
    };

    onUpdateSalary(updatedRecord);
  };

  const handleOpenSlip = (worker: Worker, salaryRecord: Salary) => {
    setActiveSlipWorker(worker);
    setActiveSlipSalary(salaryRecord);
  };

  // Get active month's names (e.g. 2026-07 -> July 2026)
  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // List of all employees (sorted unki Employee ID ke natural order me as required!)
  const sortedWorkers = naturalSortWorkers(workers);

  // Filter workers based on Name or Employee ID
  const filteredWorkers = sortedWorkers.filter(worker => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    return (
      worker.name.toLowerCase().includes(query) ||
      worker.workerId.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 id="salary-sheet-title" className="text-xl font-bold text-slate-900">Monthly Salary ledger</h2>
            <p className="text-sm text-slate-500 font-medium">Review monthly production & attendance accumulations and apply payroll adjustments</p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl">
          <Calendar className="h-4.5 w-4.5 text-slate-400" />
          <input
            id="salary-month-select"
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                alert("Error: Date cannot be zero! Page is refreshing...");
                window.location.reload();
                return;
              }
              setSelectedMonth(val);
            }}
            className="bg-transparent border-none outline-none text-sm font-bold text-slate-800"
          />
        </div>
      </div>

      {/* Search & Export Tools Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search Input Box */}
        <div className="flex flex-col justify-center space-y-2">
          <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider">
            Search Employee (Name or Employee ID)
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="employee-ledger-search"
              type="text"
              placeholder="Enter Employee ID (e.g. TFW-01) or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          {searchTerm && (
            <p className="text-[10px] text-indigo-600 font-bold">
              Showing {filteredWorkers.length} of {sortedWorkers.length} employees
            </p>
          )}
        </div>

        {/* Bank Export Section with Date Filters */}
        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="h-4 w-4 text-indigo-600" /> Bank Excel/CSV Export
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Start Date</label>
              <input
                id="export-start-date"
                type="date"
                value={exportStartDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    alert("Error: Date cannot be zero! Page is refreshing...");
                    window.location.reload();
                    return;
                  }
                  setExportStartDate(val);
                }}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">End Date</label>
              <input
                id="export-end-date"
                type="date"
                value={exportEndDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    alert("Error: Date cannot be zero! Page is refreshing...");
                    window.location.reload();
                    return;
                  }
                  setExportEndDate(val);
                }}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="button"
            id="download-bank-excel-btn"
            onClick={handleDownloadBankFile}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download Bank Excel/CSV File
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
          <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
            Payroll Ledger for {getMonthName(selectedMonth)} ({filteredWorkers.length} staff displayed)
          </h3>
          <div className="flex gap-4 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Paid</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400"></span> Pending</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-5 py-4">Employee</th>
                <th className="px-5 py-4">Designation</th>
                <th className="px-5 py-4 text-right">Base Accumulation</th>
                <th className="px-5 py-4 text-center">Bonus (+)</th>
                <th className="px-5 py-4 text-center">Advance (-)</th>
                <th className="px-5 py-4 text-center">Deductions (-)</th>
                <th className="px-5 py-4 text-right">Net Final Salary</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-sm font-medium text-slate-700">
              {sortedWorkers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400 font-semibold">
                    No registered employees found. Please register staff in the Directory.
                  </td>
                </tr>
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400 font-semibold">
                    No employees matching the search criteria found.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => {
                  const baseSal = calculateBaseSalary(worker);
                  const salaryRecord = getSalaryRecord(worker.workerId, baseSal);

                  return (
                    <tr key={worker.workerId} className="hover:bg-slate-50/50 transition-colors">
                      {/* Employee ID - Name */}
                      <td className="px-5 py-4.5">
                        <div className="font-semibold text-slate-900">{worker.workerId} - {worker.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {worker.bankDetails?.bankName} {worker.bankDetails?.accountNumber ? `| Acc: ${worker.bankDetails.accountNumber}` : ''}
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="px-5 py-4.5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          worker.employeeType === 'Worker' 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                            : 'bg-purple-50 text-purple-700 border border-purple-100'
                        }`}>
                          {worker.employeeType === 'Worker' ? 'Loom' : 'Admin'}
                        </span>
                      </td>

                      {/* Base Accumulation */}
                      <td className="px-5 py-4.5 text-right font-mono text-slate-900">
                        {formatCurrency(baseSal)}
                      </td>

                      {/* Bonus Inline Input */}
                      <td className="px-4 py-4.5 text-center">
                        <div className="relative inline-block w-24">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">₹</span>
                          <input
                            id={`bonus-input-${worker.workerId}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={salaryRecord.bonus || ''}
                            onChange={(e) => handleUpdateField(worker.workerId, baseSal, 'bonus', e.target.value)}
                            className="w-full pl-6 pr-2 py-1 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg outline-none text-xs font-mono font-bold text-center text-emerald-600"
                          />
                        </div>
                      </td>

                      {/* Advance Inline Input */}
                      <td className="px-4 py-4.5 text-center">
                        <div className="relative inline-block w-24">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">₹</span>
                          <input
                            id={`advance-input-${worker.workerId}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={salaryRecord.advance || ''}
                            onChange={(e) => handleUpdateField(worker.workerId, baseSal, 'advance', e.target.value)}
                            className="w-full pl-6 pr-2 py-1 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg outline-none text-xs font-mono font-bold text-center text-red-600"
                          />
                        </div>
                      </td>

                      {/* Deductions Inline Input */}
                      <td className="px-4 py-4.5 text-center">
                        <div className="relative inline-block w-24">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">₹</span>
                          <input
                            id={`deductions-input-${worker.workerId}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={salaryRecord.deductions || ''}
                            onChange={(e) => handleUpdateField(worker.workerId, baseSal, 'deductions', e.target.value)}
                            className="w-full pl-6 pr-2 py-1 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg outline-none text-xs font-mono font-bold text-center text-red-600"
                          />
                        </div>
                      </td>

                      {/* Net Final Salary (Computed live with 2 decimal precision!) */}
                      <td className="px-5 py-4.5 text-right font-mono text-base font-extrabold text-slate-900">
                        {formatCurrency(salaryRecord.netSalary)}
                      </td>

                      {/* Status Checkbox Button */}
                      <td className="px-5 py-4.5 text-center">
                        <button
                          id={`status-toggle-btn-${worker.workerId}`}
                          onClick={() => handleToggleStatus(worker.workerId, baseSal)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-colors cursor-pointer ${
                            salaryRecord.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {salaryRecord.status === 'Paid' ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Paid
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3.5 w-3.5" />
                              Pending
                            </>
                          )}
                        </button>
                      </td>

                      {/* Salary Slip Print trigger */}
                      <td className="px-5 py-4.5 text-right">
                        <button
                          id={`print-slip-row-btn-${worker.workerId}`}
                          onClick={() => handleOpenSlip(worker, salaryRecord)}
                          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-transparent hover:-translate-y-0.5 transition-all cursor-pointer shadow-sm"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5 text-white" />
                          Slip
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Slip Overlay PDF Portal */}
      {activeSlipWorker && activeSlipSalary && (
        <SalarySlipPDF
          worker={activeSlipWorker}
          salary={activeSlipSalary}
          onClose={() => {
            setActiveSlipWorker(null);
            setActiveSlipSalary(null);
          }}
        />
      )}

    </div>
  );
}
