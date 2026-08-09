import { createClient } from '@supabase/supabase-js';
import { Worker, Machine, DailyWork, AdminAttendance, Attendance, Salary, Company } from '../types';

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

// ==========================================
// FETCH ALL FUNCTIONS FROM SUPABASE
// ==========================================

export async function fetchSupabaseCompanies(): Promise<Company[]> {
  const { data, error } = await supabase.from('companies').select('*');
  if (error) {
    console.warn('Companies fetch notice:', error.message);
    return [];
  }
  return (data || []).map((item: any) => ({
    companyId: item.companyId,
    name: item.name
  }));
}

export async function fetchSupabaseWorkers(): Promise<Worker[]> {
  const { data, error } = await supabase.from('workers').select('*');
  if (error) throw new Error(`Workers fetch failed: ${error.message}`);
  return (data || []).map((item: any) => ({
    workerId: item.workerId,
    name: item.name,
    mobileNumber: item.mobileNumber || '',
    address: item.address || '',
    joiningDate: item.joiningDate || '',
    bankDetails: typeof item.bankDetails === 'string' ? JSON.parse(item.bankDetails) : (item.bankDetails || { bankName: '', accountNumber: '', ifscCode: '', beneficiaryName: '' }),
    aadhaarNumber: item.aadhaarNumber || '',
    isActive: item.isActive ?? true,
    perMachineRate: Number(item.perMachineRate ?? 0),
    employeeType: item.employeeType || 'Worker',
    companyName: item.companyName || ''
  }));
}

export async function fetchSupabaseMachines(): Promise<Machine[]> {
  const { data, error } = await supabase.from('machines').select('*');
  if (error) throw new Error(`Machines fetch failed: ${error.message}`);
  return (data || []).map((item: any) => ({
    machineId: item.machineId,
    isActive: item.isActive ?? true,
    companyName: item.companyName || ''
  }));
}

export async function fetchSupabaseDailyWorks(): Promise<DailyWork[]> {
  const { data, error } = await supabase.from('daily_works').select('*');
  if (error) throw new Error(`DailyWorks fetch failed: ${error.message}`);
  return (data || []).map((item: any) => ({
    workId: item.workId,
    workerId: item.workerId,
    date: item.date,
    selectedMachines: typeof item.selectedMachines === 'string' ? JSON.parse(item.selectedMachines) : (item.selectedMachines || []),
    machineCount: Number(item.machineCount ?? 0),
    perMachineRate: Number(item.perMachineRate ?? 0),
    calculatedWage: Number(item.calculatedWage ?? 0),
    shift: item.shift || 'Day'
  }));
}

export async function fetchSupabaseAdminAttendances(): Promise<AdminAttendance[]> {
  const { data, error } = await supabase.from('admin_attendances').select('*');
  if (error) throw new Error(`AdminAttendances fetch failed: ${error.message}`);
  return (data || []).map((item: any) => ({
    adminAttendanceId: item.adminAttendanceId,
    workerId: item.workerId,
    date: item.date,
    status: item.status,
    calculatedWage: Number(item.calculatedWage ?? 0)
  }));
}

export async function fetchSupabaseAttendances(): Promise<Attendance[]> {
  const { data, error } = await supabase.from('attendances').select('*');
  if (error) throw new Error(`Attendances fetch failed: ${error.message}`);
  return (data || []).map((item: any) => ({
    attendanceId: item.attendanceId,
    workerId: item.workerId,
    date: item.date,
    status: item.status,
    inTime: item.inTime || '',
    outTime: item.outTime || ''
  }));
}

export async function fetchSupabaseSalaries(): Promise<Salary[]> {
  const { data, error } = await supabase.from('salaries').select('*');
  if (error) throw new Error(`Salaries fetch failed: ${error.message}`);
  return (data || []).map((item: any) => ({
    salaryId: item.salaryId,
    workerId: item.workerId,
    month: item.month,
    baseSalary: Number(item.baseSalary ?? 0),
    bonus: Number(item.bonus ?? 0),
    advance: Number(item.advance ?? 0),
    deductions: Number(item.deductions ?? 0),
    netSalary: Number(item.netSalary ?? 0),
    status: item.status || 'Pending'
  }));
}

// ==========================================
// ATOMIC CRUD FUNCTIONS FOR COMPANIES
// ==========================================

export async function createCompany(company: Company): Promise<void> {
  const payload = { companyId: company.companyId, name: company.name };
  const { error } = await supabase.from('companies').upsert([payload], { onConflict: 'companyId' });
  if (error) throw new Error(`Create company failed: ${error.message}`);
}

export async function updateCompany(companyId: string, newName: string): Promise<void> {
  const payload = { name: newName };
  const { error } = await supabase.from('companies').update(payload).eq('companyId', companyId);
  if (error) throw new Error(`Update company failed: ${error.message}`);
}

export async function deleteCompany(companyId: string): Promise<void> {
  const { error } = await supabase.from('companies').delete().eq('companyId', companyId);
  if (error) throw new Error(`Delete company failed: ${error.message}`);
}

// ==========================================
// ATOMIC CRUD FUNCTIONS FOR WORKERS
// ==========================================

export async function createWorker(worker: Worker): Promise<void> {
  const payload = {
    workerId: worker.workerId,
    name: worker.name,
    mobileNumber: worker.mobileNumber,
    address: worker.address,
    joiningDate: worker.joiningDate,
    bankDetails: worker.bankDetails,
    aadhaarNumber: worker.aadhaarNumber,
    isActive: worker.isActive,
    perMachineRate: worker.perMachineRate,
    employeeType: worker.employeeType,
    companyName: worker.companyName
  };
  const { error } = await supabase.from('workers').upsert([payload], { onConflict: 'workerId' });
  if (error) throw new Error(`Create worker failed: ${error.message}`);
}

export async function updateWorker(worker: Worker): Promise<void> {
  const payload = {
    name: worker.name,
    mobileNumber: worker.mobileNumber,
    address: worker.address,
    joiningDate: worker.joiningDate,
    bankDetails: worker.bankDetails,
    aadhaarNumber: worker.aadhaarNumber,
    isActive: worker.isActive,
    perMachineRate: worker.perMachineRate,
    employeeType: worker.employeeType,
    companyName: worker.companyName
  };
  const { error } = await supabase.from('workers').update(payload).eq('workerId', worker.workerId);
  if (error) throw new Error(`Update worker failed: ${error.message}`);
}

export async function deleteWorker(workerId: string): Promise<void> {
  const { error } = await supabase.from('workers').delete().eq('workerId', workerId);
  if (error) throw new Error(`Delete worker failed: ${error.message}`);
}

// ==========================================
// ATOMIC CRUD FUNCTIONS FOR MACHINES
// ==========================================

export async function createMachine(machine: Machine): Promise<void> {
  const payload = { 
    machineId: machine.machineId, 
    isActive: machine.isActive,
    companyName: machine.companyName || '' 
  };
  const { error } = await supabase.from('machines').upsert([payload], { onConflict: 'machineId' });
  if (error) throw new Error(`Create machine failed: ${error.message}`);
}

export async function updateMachine(machine: Machine): Promise<void> {
  const payload = { 
    isActive: machine.isActive,
    companyName: machine.companyName || '' 
  };
  const { error } = await supabase.from('machines').update(payload).eq('machineId', machine.machineId);
  if (error) throw new Error(`Update machine failed: ${error.message}`);
}

export async function deleteMachine(machineId: string): Promise<void> {
  const { error } = await supabase.from('machines').delete().eq('machineId', machineId);
  if (error) throw new Error(`Delete machine failed: ${error.message}`);
}

// ==========================================
// ATOMIC CRUD FUNCTIONS FOR DAILY WORKS
// ==========================================

export async function createDailyWork(work: DailyWork): Promise<void> {
  const payload = {
    workId: work.workId,
    workerId: work.workerId,
    date: work.date,
    selectedMachines: work.selectedMachines,
    machineCount: work.machineCount,
    perMachineRate: work.perMachineRate,
    calculatedWage: work.calculatedWage,
    shift: work.shift || 'Day'
  };
  const { error } = await supabase.from('daily_works').upsert([payload], { onConflict: 'workId' });
  if (error) throw new Error(`Create daily work failed: ${error.message}`);
}

export async function updateDailyWork(work: DailyWork): Promise<void> {
  const payload = {
    workerId: work.workerId,
    date: work.date,
    selectedMachines: work.selectedMachines,
    machineCount: work.machineCount,
    perMachineRate: work.perMachineRate,
    calculatedWage: work.calculatedWage,
    shift: work.shift || 'Day'
  };
  const { error } = await supabase.from('daily_works').update(payload).eq('workId', work.workId);
  if (error) throw new Error(`Update daily work failed: ${error.message}`);
}

export async function deleteDailyWork(workId: string): Promise<void> {
  const { error } = await supabase.from('daily_works').delete().eq('workId', workId);
  if (error) throw new Error(`Delete daily work failed: ${error.message}`);
}

// ==========================================
// ATOMIC CRUD FUNCTIONS FOR ADMIN ATTENDANCE
// ==========================================

export async function createAdminAttendance(attendance: AdminAttendance): Promise<void> {
  const payload = {
    adminAttendanceId: attendance.adminAttendanceId,
    workerId: attendance.workerId,
    date: attendance.date,
    status: attendance.status,
    calculatedWage: attendance.calculatedWage
  };
  const { error } = await supabase.from('admin_attendances').upsert([payload], { onConflict: 'adminAttendanceId' });
  if (error) throw new Error(`Create admin attendance failed: ${error.message}`);
}

export async function updateAdminAttendance(attendance: AdminAttendance): Promise<void> {
  const payload = {
    workerId: attendance.workerId,
    date: attendance.date,
    status: attendance.status,
    calculatedWage: attendance.calculatedWage
  };
  const { error } = await supabase.from('admin_attendances').update(payload).eq('adminAttendanceId', attendance.adminAttendanceId);
  if (error) throw new Error(`Update admin attendance failed: ${error.message}`);
}

export async function deleteAdminAttendance(adminAttendanceId: string): Promise<void> {
  const { error } = await supabase.from('admin_attendances').delete().eq('adminAttendanceId', adminAttendanceId);
  if (error) throw new Error(`Delete admin attendance failed: ${error.message}`);
}

// ==========================================
// ATOMIC CRUD FUNCTIONS FOR LOOM ATTENDANCE
// ==========================================

export async function createAttendance(attendance: Attendance): Promise<void> {
  const payload = {
    attendanceId: attendance.attendanceId,
    workerId: attendance.workerId,
    date: attendance.date,
    status: attendance.status,
    inTime: attendance.inTime,
    outTime: attendance.outTime
  };
  const { error } = await supabase.from('attendances').upsert([payload], { onConflict: 'attendanceId' });
  if (error) throw new Error(`Create attendance failed: ${error.message}`);
}

export async function updateAttendance(attendance: Attendance): Promise<void> {
  const payload = {
    workerId: attendance.workerId,
    date: attendance.date,
    status: attendance.status,
    inTime: attendance.inTime,
    outTime: attendance.outTime
  };
  const { error } = await supabase.from('attendances').update(payload).eq('attendanceId', attendance.attendanceId);
  if (error) throw new Error(`Update attendance failed: ${error.message}`);
}

export async function deleteAttendance(attendanceId: string): Promise<void> {
  const { error } = await supabase.from('attendances').delete().eq('attendanceId', attendanceId);
  if (error) throw new Error(`Delete attendance failed: ${error.message}`);
}

// ==========================================
// ATOMIC CRUD FUNCTIONS FOR SALARIES
// ==========================================

export async function createSalary(salary: Salary): Promise<void> {
  const payload = {
    salaryId: salary.salaryId,
    workerId: salary.workerId,
    month: salary.month,
    baseSalary: salary.baseSalary,
    bonus: salary.bonus,
    advance: salary.advance,
    deductions: salary.deductions,
    netSalary: salary.netSalary,
    status: salary.status
  };
  const { error } = await supabase.from('salaries').upsert([payload], { onConflict: 'salaryId' });
  if (error) throw new Error(`Create salary failed: ${error.message}`);
}

export async function updateSalary(salary: Salary): Promise<void> {
  const payload = {
    workerId: salary.workerId,
    month: salary.month,
    baseSalary: salary.baseSalary,
    bonus: salary.bonus,
    advance: salary.advance,
    deductions: salary.deductions,
    netSalary: salary.netSalary,
    status: salary.status
  };
  const { error } = await supabase.from('salaries').update(payload).eq('salaryId', salary.salaryId);
  if (error) throw new Error(`Update salary failed: ${error.message}`);
}

export async function deleteSalary(salaryId: string): Promise<void> {
  const { error } = await supabase.from('salaries').delete().eq('salaryId', salaryId);
  if (error) throw new Error(`Delete salary failed: ${error.message}`);
}

// ==========================================
// RECONCILIATION & SYNC FUNCTIONS
// ==========================================

export async function reconcileCompaniesToSupabase(companies: Company[]): Promise<void> {
  const { data: remoteData, error: fetchErr } = await supabase.from('companies').select('companyId');
  if (fetchErr) return;

  const remoteIds = (remoteData || []).map((r: any) => r.companyId);
  const currentIds = new Set(companies.map(c => c.companyId));
  const idsToDelete = remoteIds.filter(id => !currentIds.has(id));

  if (idsToDelete.length > 0) {
    await supabase.from('companies').delete().in('companyId', idsToDelete);
  }

  if (companies.length > 0) {
    const payload = companies.map(c => ({
      companyId: c.companyId,
      name: c.name
    }));
    await supabase.from('companies').upsert(payload, { onConflict: 'companyId' });
  }
}

export async function reconcileWorkersToSupabase(workers: Worker[]): Promise<void> {
  const { data: remoteData, error: fetchErr } = await supabase.from('workers').select('workerId');
  if (fetchErr) throw new Error(`Sync workers fetch failed: ${fetchErr.message}`);

  const remoteIds = (remoteData || []).map((r: any) => r.workerId);
  const currentIds = new Set(workers.map(w => w.workerId));
  const idsToDelete = remoteIds.filter(id => !currentIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: delErr } = await supabase.from('workers').delete().in('workerId', idsToDelete);
    if (delErr) throw new Error(`Sync workers delete failed: ${delErr.message}`);
  }

  if (workers.length > 0) {
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
      employeeType: w.employeeType,
      companyName: w.companyName
    }));
    const { error: upsertErr } = await supabase.from('workers').upsert(payload, { onConflict: 'workerId' });
    if (upsertErr) throw new Error(`Sync workers upsert failed: ${upsertErr.message}`);
  }
}

export async function reconcileMachinesToSupabase(machines: Machine[]): Promise<void> {
  const { data: remoteData, error: fetchErr } = await supabase.from('machines').select('machineId');
  if (fetchErr) throw new Error(`Sync machines fetch failed: ${fetchErr.message}`);

  const remoteIds = (remoteData || []).map((r: any) => r.machineId);
  const currentIds = new Set(machines.map(m => m.machineId));
  const idsToDelete = remoteIds.filter(id => !currentIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: delErr } = await supabase.from('machines').delete().in('machineId', idsToDelete);
    if (delErr) throw new Error(`Sync machines delete failed: ${delErr.message}`);
  }

  if (machines.length > 0) {
    const payload = machines.map(m => ({
      machineId: m.machineId,
      isActive: m.isActive,
      companyName: m.companyName || ''
    }));
    const { error: upsertErr } = await supabase.from('machines').upsert(payload, { onConflict: 'machineId' });
    if (upsertErr) throw new Error(`Sync machines upsert failed: ${upsertErr.message}`);
  }
}

export async function reconcileDailyWorksToSupabase(dailyWorks: DailyWork[]): Promise<void> {
  const { data: remoteData, error: fetchErr } = await supabase.from('daily_works').select('workId');
  if (fetchErr) throw new Error(`Sync daily works fetch failed: ${fetchErr.message}`);

  const remoteIds = (remoteData || []).map((r: any) => r.workId);
  const currentIds = new Set(dailyWorks.map(dw => dw.workId));
  const idsToDelete = remoteIds.filter(id => !currentIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: delErr } = await supabase.from('daily_works').delete().in('workId', idsToDelete);
    if (delErr) throw new Error(`Sync daily works delete failed: ${delErr.message}`);
  }

  if (dailyWorks.length > 0) {
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
    const { error: upsertErr } = await supabase.from('daily_works').upsert(payload, { onConflict: 'workId' });
    if (upsertErr) throw new Error(`Sync daily works upsert failed: ${upsertErr.message}`);
  }
}

export async function reconcileAdminAttendancesToSupabase(adminAttendances: AdminAttendance[]): Promise<void> {
  const { data: remoteData, error: fetchErr } = await supabase.from('admin_attendances').select('adminAttendanceId');
  if (fetchErr) throw new Error(`Sync admin attendances fetch failed: ${fetchErr.message}`);

  const remoteIds = (remoteData || []).map((r: any) => r.adminAttendanceId);
  const currentIds = new Set(adminAttendances.map(aa => aa.adminAttendanceId));
  const idsToDelete = remoteIds.filter(id => !currentIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: delErr } = await supabase.from('admin_attendances').delete().in('adminAttendanceId', idsToDelete);
    if (delErr) throw new Error(`Sync admin attendances delete failed: ${delErr.message}`);
  }

  if (adminAttendances.length > 0) {
    const payload = adminAttendances.map(aa => ({
      adminAttendanceId: aa.adminAttendanceId,
      workerId: aa.workerId,
      date: aa.date,
      status: aa.status,
      calculatedWage: aa.calculatedWage
    }));
    const { error: upsertErr } = await supabase.from('admin_attendances').upsert(payload, { onConflict: 'adminAttendanceId' });
    if (upsertErr) throw new Error(`Sync admin attendances upsert failed: ${upsertErr.message}`);
  }
}

export async function reconcileAttendancesToSupabase(attendances: Attendance[]): Promise<void> {
  const { data: remoteData, error: fetchErr } = await supabase.from('attendances').select('attendanceId');
  if (fetchErr) throw new Error(`Sync attendances fetch failed: ${fetchErr.message}`);

  const remoteIds = (remoteData || []).map((r: any) => r.attendanceId);
  const currentIds = new Set(attendances.map(a => a.attendanceId));
  const idsToDelete = remoteIds.filter(id => !currentIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: delErr } = await supabase.from('attendances').delete().in('attendanceId', idsToDelete);
    if (delErr) throw new Error(`Sync attendances delete failed: ${delErr.message}`);
  }

  if (attendances.length > 0) {
    const payload = attendances.map(a => ({
      attendanceId: a.attendanceId,
      workerId: a.workerId,
      date: a.date,
      status: a.status,
      inTime: a.inTime,
      outTime: a.outTime
    }));
    const { error: upsertErr } = await supabase.from('attendances').upsert(payload, { onConflict: 'attendanceId' });
    if (upsertErr) throw new Error(`Sync attendances upsert failed: ${upsertErr.message}`);
  }
}

export async function reconcileSalariesToSupabase(salaries: Salary[]): Promise<void> {
  const { data: remoteData, error: fetchErr } = await supabase.from('salaries').select('salaryId');
  if (fetchErr) throw new Error(`Sync salaries fetch failed: ${fetchErr.message}`);

  const remoteIds = (remoteData || []).map((r: any) => r.salaryId);
  const currentIds = new Set(salaries.map(s => s.salaryId));
  const idsToDelete = remoteIds.filter(id => !currentIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: delErr } = await supabase.from('salaries').delete().in('salaryId', idsToDelete);
    if (delErr) throw new Error(`Sync salaries delete failed: ${delErr.message}`);
  }

  if (salaries.length > 0) {
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
    const { error: upsertErr } = await supabase.from('salaries').upsert(payload, { onConflict: 'salaryId' });
    if (upsertErr) throw new Error(`Sync salaries upsert failed: ${upsertErr.message}`);
  }
}

// Backwards compatibility alias functions for bulk sync
export const syncWorkersToSupabase = reconcileWorkersToSupabase;
export const syncMachinesToSupabase = reconcileMachinesToSupabase;
export const syncDailyWorksToSupabase = reconcileDailyWorksToSupabase;
export const syncAdminAttendancesToSupabase = reconcileAdminAttendancesToSupabase;
export const syncAttendancesToSupabase = reconcileAttendancesToSupabase;
export const syncSalariesToSupabase = reconcileSalariesToSupabase;

export const SUPABASE_SETUP_SQL = `-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql):

CREATE TABLE IF NOT EXISTS companies (
  "companyId" TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

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
  "employeeType" TEXT DEFAULT 'Worker',
  "companyName" TEXT
);

ALTER TABLE workers ADD COLUMN IF NOT EXISTS "companyName" TEXT;

CREATE TABLE IF NOT EXISTS machines (
  "machineId" TEXT PRIMARY KEY,
  "isActive" BOOLEAN DEFAULT true,
  "companyName" TEXT
);

ALTER TABLE machines ADD COLUMN IF NOT EXISTS "companyName" TEXT;

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
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public companies" ON companies;
CREATE POLICY "Allow public companies" ON companies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public workers" ON workers;
CREATE POLICY "Allow public workers" ON workers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public machines" ON machines;
CREATE POLICY "Allow public machines" ON machines FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public daily_works" ON daily_works;
CREATE POLICY "Allow public daily_works" ON daily_works FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public admin_attendances" ON admin_attendances;
CREATE POLICY "Allow public admin_attendances" ON admin_attendances FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public attendances" ON attendances;
CREATE POLICY "Allow public attendances" ON attendances FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public salaries" ON salaries;
CREATE POLICY "Allow public salaries" ON salaries FOR ALL USING (true) WITH CHECK (true);
`;
