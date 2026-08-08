import { createClient } from '@supabase/supabase-js';
import { Worker, Machine, DailyWork, AdminAttendance, Attendance, Salary } from '../types';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://sjkolutbcnbrnysipqun.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_bR-SNDMrlVI9m-J8vV9scw_a66pZ4qm";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper to test database connection
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; errorDetail?: string }> {
  try {
    const { data, error } = await supabase.from('workers').select('workerId').limit(1);
    if (error) {
      // Check if table missing
      if (error.code === '42P01' || error.message.includes('relation "public.workers" does not exist')) {
        return {
          success: false,
          message: 'Supabase table "workers" is missing. Please run the SQL setup script.',
          errorDetail: error.message
        };
      }
      return { success: false, message: error.message, errorDetail: JSON.stringify(error) };
    }
    return { success: true, message: 'Connected to Supabase successfully!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed' };
  }
}

// Data fetchers from Supabase
export async function fetchSupabaseWorkers(): Promise<Worker[] | null> {
  try {
    const { data, error } = await supabase.from('workers').select('*');
    if (error || !data) return null;
    return data.map((item: any) => ({
      workerId: item.workerId,
      name: item.name,
      mobileNumber: item.mobileNumber || '',
      address: item.address || '',
      joiningDate: item.joiningDate || '',
      bankDetails: typeof item.bankDetails === 'string' ? JSON.parse(item.bankDetails) : (item.bankDetails || { bankName: '', accountNumber: '', ifscCode: '', beneficiaryName: '' }),
      aadhaarNumber: item.aadhaarNumber || '',
      isActive: item.isActive ?? true,
      perMachineRate: item.perMachineRate ?? 0,
      employeeType: item.employeeType || 'Worker'
    }));
  } catch (e) {
    console.warn('Supabase fetch workers error:', e);
    return null;
  }
}

export async function fetchSupabaseMachines(): Promise<Machine[] | null> {
  try {
    const { data, error } = await supabase.from('machines').select('*');
    if (error || !data) return null;
    return data.map((item: any) => ({
      machineId: item.machineId,
      isActive: item.isActive ?? true
    }));
  } catch (e) {
    return null;
  }
}

export async function fetchSupabaseDailyWorks(): Promise<DailyWork[] | null> {
  try {
    const { data, error } = await supabase.from('daily_works').select('*');
    if (error || !data) return null;
    return data.map((item: any) => ({
      workId: item.workId,
      workerId: item.workerId,
      date: item.date,
      selectedMachines: typeof item.selectedMachines === 'string' ? JSON.parse(item.selectedMachines) : (item.selectedMachines || []),
      machineCount: item.machineCount ?? 0,
      perMachineRate: item.perMachineRate ?? 0,
      calculatedWage: item.calculatedWage ?? 0,
      shift: item.shift
    }));
  } catch (e) {
    return null;
  }
}

export async function fetchSupabaseAdminAttendances(): Promise<AdminAttendance[] | null> {
  try {
    const { data, error } = await supabase.from('admin_attendances').select('*');
    if (error || !data) return null;
    return data.map((item: any) => ({
      adminAttendanceId: item.adminAttendanceId,
      workerId: item.workerId,
      date: item.date,
      status: item.status,
      calculatedWage: item.calculatedWage ?? 0
    }));
  } catch (e) {
    return null;
  }
}

export async function fetchSupabaseAttendances(): Promise<Attendance[] | null> {
  try {
    const { data, error } = await supabase.from('attendances').select('*');
    if (error || !data) return null;
    return data.map((item: any) => ({
      attendanceId: item.attendanceId,
      workerId: item.workerId,
      date: item.date,
      status: item.status,
      inTime: item.inTime || '',
      outTime: item.outTime || ''
    }));
  } catch (e) {
    return null;
  }
}

export async function fetchSupabaseSalaries(): Promise<Salary[] | null> {
  try {
    const { data, error } = await supabase.from('salaries').select('*');
    if (error || !data) return null;
    return data.map((item: any) => ({
      salaryId: item.salaryId,
      workerId: item.workerId,
      month: item.month,
      baseSalary: item.baseSalary ?? 0,
      bonus: item.bonus ?? 0,
      advance: item.advance ?? 0,
      deductions: item.deductions ?? 0,
      netSalary: item.netSalary ?? 0,
      status: item.status || 'Pending'
    }));
  } catch (e) {
    return null;
  }
}

// Data pushers to Supabase
export async function syncWorkersToSupabase(workers: Worker[]) {
  try {
    if (workers.length === 0) return;
    const payload = workers.map(w => ({
      workerId: w.workerId,
      name: w.name,
      mobileNumber: w.mobileNumber,
      address: w.address,
      joiningDate: w.joiningDate,
      bankDetails: w.bankDetails,
      aadhaarNumber: w.aadhaarNumber,
      isActive: w.isActive,
      perMachineRate: w.perMachineRate,
      employeeType: w.employeeType
    }));
    await supabase.from('workers').upsert(payload, { onConflict: 'workerId' });
  } catch (e) {
    console.warn('Sync workers to Supabase error:', e);
  }
}

export async function syncMachinesToSupabase(machines: Machine[]) {
  try {
    if (machines.length === 0) return;
    const payload = machines.map(m => ({
      machineId: m.machineId,
      isActive: m.isActive
    }));
    await supabase.from('machines').upsert(payload, { onConflict: 'machineId' });
  } catch (e) {
    console.warn('Sync machines to Supabase error:', e);
  }
}

export async function syncDailyWorksToSupabase(dailyWorks: DailyWork[]) {
  try {
    if (dailyWorks.length === 0) return;
    const payload = dailyWorks.map(dw => ({
      workId: dw.workId,
      workerId: dw.workerId,
      date: dw.date,
      selectedMachines: dw.selectedMachines,
      machineCount: dw.machineCount,
      perMachineRate: dw.perMachineRate,
      calculatedWage: dw.calculatedWage,
      shift: dw.shift || 'Day'
    }));
    await supabase.from('daily_works').upsert(payload, { onConflict: 'workId' });
  } catch (e) {
    console.warn('Sync daily works to Supabase error:', e);
  }
}

export async function syncAdminAttendancesToSupabase(adminAttendances: AdminAttendance[]) {
  try {
    if (adminAttendances.length === 0) return;
    const payload = adminAttendances.map(aa => ({
      adminAttendanceId: aa.adminAttendanceId,
      workerId: aa.workerId,
      date: aa.date,
      status: aa.status,
      calculatedWage: aa.calculatedWage
    }));
    await supabase.from('admin_attendances').upsert(payload, { onConflict: 'adminAttendanceId' });
  } catch (e) {
    console.warn('Sync admin attendances to Supabase error:', e);
  }
}

export async function syncAttendancesToSupabase(attendances: Attendance[]) {
  try {
    if (attendances.length === 0) return;
    const payload = attendances.map(a => ({
      attendanceId: a.attendanceId,
      workerId: a.workerId,
      date: a.date,
      status: a.status,
      inTime: a.inTime,
      outTime: a.outTime
    }));
    await supabase.from('attendances').upsert(payload, { onConflict: 'attendanceId' });
  } catch (e) {
    console.warn('Sync attendances to Supabase error:', e);
  }
}

export async function syncSalariesToSupabase(salaries: Salary[]) {
  try {
    if (salaries.length === 0) return;
    const payload = salaries.map(s => ({
      salaryId: s.salaryId,
      workerId: s.workerId,
      month: s.month,
      baseSalary: s.baseSalary,
      bonus: s.bonus,
      advance: s.advance,
      deductions: s.deductions,
      netSalary: s.netSalary,
      status: s.status
    }));
    await supabase.from('salaries').upsert(payload, { onConflict: 'salaryId' });
  } catch (e) {
    console.warn('Sync salaries to Supabase error:', e);
  }
}

export const SUPABASE_SETUP_SQL = `-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql):

CREATE TABLE IF NOT EXISTS workers (
  "workerId" TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "mobileNumber" TEXT,
  address TEXT,
  "joiningDate" TEXT,
  "bankDetails" JSONB,
  "aadhaarNumber" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "perMachineRate" NUMERIC DEFAULT 0,
  "employeeType" TEXT DEFAULT 'Worker'
);

CREATE TABLE IF NOT EXISTS machines (
  "machineId" TEXT PRIMARY KEY,
  "isActive" BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS daily_works (
  "workId" TEXT PRIMARY KEY,
  "workerId" TEXT,
  date TEXT NOT NULL,
  "selectedMachines" JSONB,
  "machineCount" NUMERIC DEFAULT 0,
  "perMachineRate" NUMERIC DEFAULT 0,
  "calculatedWage" NUMERIC DEFAULT 0,
  shift TEXT
);

CREATE TABLE IF NOT EXISTS admin_attendances (
  "adminAttendanceId" TEXT PRIMARY KEY,
  "workerId" TEXT,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  "calculatedWage" NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS attendances (
  "attendanceId" TEXT PRIMARY KEY,
  "workerId" TEXT,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  "inTime" TEXT,
  "outTime" TEXT
);

CREATE TABLE IF NOT EXISTS salaries (
  "salaryId" TEXT PRIMARY KEY,
  "workerId" TEXT,
  month TEXT NOT NULL,
  "baseSalary" NUMERIC DEFAULT 0,
  bonus NUMERIC DEFAULT 0,
  advance NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  "netSalary" NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending'
);

-- Enable RLS & Public Read/Write Policies
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public workers" ON workers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public machines" ON machines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public daily_works" ON daily_works FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public admin_attendances" ON admin_attendances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public attendances" ON attendances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public salaries" ON salaries FOR ALL USING (true) WITH CHECK (true);
`;
