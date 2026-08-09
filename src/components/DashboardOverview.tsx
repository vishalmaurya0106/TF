/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Worker, Machine, DailyWork, AdminAttendance, Salary } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { DateInput } from './DateInput';
import { 
  Cpu, Users, TrendingUp, IndianRupee, Clock, 
  CheckCircle, AlertCircle, Play, Layers, Landmark
} from 'lucide-react';

interface DashboardOverviewProps {
  workers: Worker[];
  machines: Machine[];
  dailyWorks: DailyWork[];
  adminAttendances: AdminAttendance[];
  salaries: Salary[];
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardOverview({
  workers,
  machines,
  dailyWorks,
  adminAttendances,
  salaries,
  onNavigateToTab
}: DashboardOverviewProps) {
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Current active month YYYY-MM
  const currentMonth = selectedDate.substring(0, 7);

  // Stats calculation
  const totalEmployees = workers.length;
  const activeEmployees = workers.filter(w => w.isActive).length;
  const loomOperators = workers.filter(w => w.employeeType === 'Worker').length;
  const adminStaff = workers.filter(w => w.employeeType === 'Admin Employee').length;

  // Total machines logged in production today
  const todaysProduction = dailyWorks.filter(dw => dw.date === selectedDate);
  const activeMachinesToday = new Set(
    todaysProduction.flatMap(dw => dw.selectedMachines)
  );

  // Accumulated wages this month
  const totalLoomWagesMonth = dailyWorks
    .filter(dw => dw.date.startsWith(currentMonth))
    .reduce((sum, dw) => sum + dw.calculatedWage, 0);

  const totalAdminWagesMonth = adminAttendances
    .filter(aa => aa.date.startsWith(currentMonth))
    .reduce((sum, aa) => sum + aa.calculatedWage, 0);

  const totalBaseWagesMonth = totalLoomWagesMonth + totalAdminWagesMonth;

  // Monthly payroll status sums
  const monthSalaries = salaries.filter(s => s.month === currentMonth);
  const totalPaidMonth = monthSalaries
    .filter(s => s.status === 'Paid')
    .reduce((sum, s) => sum + s.netSalary, 0);

  const totalPendingMonth = monthSalaries
    .filter(s => s.status === 'Pending')
    .reduce((sum, s) => sum + s.netSalary, 0);

  // Custom Chart Data: Wages trend over the last 7 days from selectedDate
  const getLast7Days = (endDateStr: string) => {
    const arr = [];
    const endDate = new Date(endDateStr);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() - i);
      arr.push(d.toISOString().split('T')[0]);
    }
    return arr;
  };

  const last7Days = getLast7Days(selectedDate);
  const chartData = last7Days.map(date => {
    const loomWages = dailyWorks
      .filter(dw => dw.date === date)
      .reduce((sum, dw) => sum + dw.calculatedWage, 0);
    
    const adminWages = adminAttendances
      .filter(aa => aa.date === date)
      .reduce((sum, aa) => sum + aa.calculatedWage, 0);

    return {
      dateStr: date,
      shortLabel: formatDate(date),
      loomWages,
      adminWages,
      totalWages: loomWages + adminWages
    };
  });

  const maxChartWage = Math.max(...chartData.map(d => d.totalWages), 100);

  return (
    <div className="space-y-6">
      
      {/* Date filter bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
        <div>
          <h2 id="dashboard-heading" className="text-xl font-bold text-slate-900">Dashboard overview</h2>
          <p className="text-sm text-slate-500 font-medium">Real-time production metrics, active loom floor maps, and ledger summaries</p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="dash-date-input" className="text-xs font-bold text-slate-500 whitespace-nowrap">
            Select Date:
          </label>
          <DateInput
            id="dash-date-input"
            value={selectedDate}
            onChange={setSelectedDate}
            className="w-40 shadow-2xs"
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Month Wages Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wages accrued ({currentMonth})</span>
            <span className="text-2xl font-mono font-bold text-slate-900 block">{formatCurrency(totalBaseWagesMonth)}</span>
            <span className="text-[10px] text-slate-500 font-semibold block">Loom: {formatCurrency(totalLoomWagesMonth)} | Admin: {formatCurrency(totalAdminWagesMonth)}</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <IndianRupee className="h-6 w-6" />
          </div>
        </div>

        {/* Employee Card */}
        <div 
          onClick={() => onNavigateToTab('directory')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm flex items-center justify-between cursor-pointer transition-colors"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Staff strength</span>
            <span className="text-2xl font-mono font-bold text-slate-900 block">{activeEmployees} <span className="text-xs text-slate-400 font-normal">/ {totalEmployees} active</span></span>
            <span className="text-[10px] text-slate-500 font-semibold block">Operators: {loomOperators} | Admins: {adminStaff}</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Active Machines today */}
        <div 
          onClick={() => onNavigateToTab('production')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm flex items-center justify-between cursor-pointer transition-colors"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Loom Floor Today</span>
            <span className="text-2xl font-mono font-bold text-slate-900 block">{activeMachinesToday.size} <span className="text-xs text-slate-400 font-normal">/ 30 runs</span></span>
            <span className="text-[10px] text-slate-500 font-semibold block">Logged on {formatDate(selectedDate)}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Cpu className="h-6 w-6" />
          </div>
        </div>

        {/* Paid vs Pending summary */}
        <div 
          onClick={() => onNavigateToTab('salary')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm flex items-center justify-between cursor-pointer transition-colors"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payroll Disbursed</span>
            <span className="text-2xl font-mono font-bold text-slate-900 block">{formatCurrency(totalPaidMonth)}</span>
            <span className="text-[10px] text-rose-500 font-semibold block flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" /> Pending: {formatCurrency(totalPendingMonth)}
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Main Content Dashboard row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Trend Chart (Left 2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-3.5 border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-indigo-600 h-5 w-5" />
              <h3 id="trend-chart-title" className="font-bold text-slate-900 text-base">Weekly wage disbursal trend</h3>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">7-Day Roller (₹)</span>
          </div>

          {/* SVG-Based Bar Chart */}
          <div className="space-y-4">
            <div className="h-60 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100 relative">
              
              {/* Chart Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] font-mono text-slate-400/80">
                <div className="border-t border-dashed border-slate-100 w-full pt-1">Max: {formatCurrency(maxChartWage)}</div>
                <div className="border-t border-dashed border-slate-100 w-full pt-1">Mid: {formatCurrency(maxChartWage / 2)}</div>
                <div className="w-full"></div> {/* Bottom baseline */}
              </div>

              {chartData.map((data, index) => {
                const totalHeightPct = (data.totalWages / maxChartWage) * 100;
                const loomHeightPct = data.totalWages > 0 ? (data.loomWages / data.totalWages) * totalHeightPct : 0;
                const adminHeightPct = data.totalWages > 0 ? (data.adminWages / data.totalWages) * totalHeightPct : 0;

                const isToday = data.dateStr === selectedDate;

                return (
                  <div key={data.dateStr} className="flex-1 flex flex-col items-center h-full group relative z-10">
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 pointer-events-none bg-slate-900 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg shadow-lg text-center transition-opacity whitespace-nowrap z-30">
                      <p className="font-sans text-slate-400 mb-0.5">{formatDate(data.dateStr)}</p>
                      <p className="font-mono text-indigo-300">Loom: {formatCurrency(data.loomWages)}</p>
                      <p className="font-mono text-purple-300">Admin: {formatCurrency(data.adminWages)}</p>
                      <p className="font-mono text-white border-t border-slate-700 mt-1 pt-1">Total: {formatCurrency(data.totalWages)}</p>
                    </div>

                    {/* Columns bar */}
                    <div className="w-full max-w-[32px] sm:max-w-[40px] flex flex-col justify-end h-full">
                      
                      {/* Admin wage block (Purple) */}
                      {adminHeightPct > 0 && (
                        <div 
                          className={`w-full bg-purple-500 rounded-t-sm group-hover:bg-purple-400 transition-all ${isToday ? 'ring-2 ring-purple-200' : ''}`}
                          style={{ height: `${adminHeightPct}%` }}
                        ></div>
                      )}

                      {/* Loom wage block (Indigo) */}
                      {loomHeightPct > 0 && (
                        <div 
                          className={`w-full bg-indigo-600 rounded-t-sm group-hover:bg-indigo-500 transition-all ${isToday ? 'ring-2 ring-indigo-200' : ''}`}
                          style={{ height: `${loomHeightPct}%` }}
                        ></div>
                      )}

                      {data.totalWages === 0 && (
                        <div className="h-1 w-full bg-slate-200 rounded-full"></div>
                      )}

                    </div>

                    {/* Date label */}
                    <span className={`text-[10px] font-bold mt-2.5 whitespace-nowrap ${isToday ? 'text-indigo-600 font-extrabold' : 'text-slate-500'}`}>
                      {data.shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend indicators */}
            <div className="flex items-center justify-center gap-6 text-xs font-bold text-slate-500 pt-2">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 bg-indigo-600 rounded-md"></span>
                Loom Worker Production Wages
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 bg-purple-500 rounded-md"></span>
                Admin Staff Attendance Salary
              </span>
            </div>
          </div>

        </div>

        {/* Floor Twin - Grid Map of 30 Loom Machines (Right 1 Column) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
          <div className="border-b pb-3.5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Cpu className="text-emerald-500 h-5 w-5 animate-pulse" />
              <h3 id="digital-floor-map-title" className="font-bold text-slate-900 text-base">Digital Twin loom floor</h3>
            </div>
            <span className="text-[10px] bg-slate-100 font-extrabold text-slate-500 px-2.5 py-1 rounded-full uppercase border">
              LIVE FLOOR
            </span>
          </div>

          <p className="text-xs text-slate-400 font-medium">
            Representing all 30 loom machines in the factory. Pulsing green indicates active runs logged on <strong>{formatDate(selectedDate)}</strong>.
          </p>

          {/* 30 loom machine miniature twin */}
          <div className="grid grid-cols-6 gap-1.5 pt-3">
            {machines.map((mac) => {
              const isActive = activeMachinesToday.has(mac.machineId);
              return (
                <div
                  key={mac.machineId}
                  title={`${mac.machineId}: ${isActive ? 'Active Operator Logging' : 'Idle machine'}`}
                  className={`h-9 border rounded-lg font-mono text-[10px] font-extrabold flex flex-col justify-center items-center relative transition-all ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm shadow-emerald-500/5'
                      : 'bg-slate-50/50 border-slate-100 text-slate-300'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  )}
                  <span>{mac.machineId.split(' ')[1]}</span>
                </div>
              );
            })}
          </div>

          {/* Quick Stats list */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Operational Capacity:</span>
              <span className="font-mono font-bold text-slate-700">
                {((activeMachinesToday.size / 30) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Idle Looms:</span>
              <span className="font-mono font-semibold text-slate-500">
                {30 - activeMachinesToday.size} machines
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
