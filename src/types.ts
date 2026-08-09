/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EmployeeType = 'Worker' | 'Admin Employee' | 'Others';
export type AttendanceStatus = 'Present' | 'Absent' | 'Half-Day';
export type PayrollStatus = 'Pending' | 'Paid';

export type UserRole = 'admin' | 'staff';

export interface UserSession {
  role: UserRole;
  username: string;
  displayName: string;
  loggedInAt: string;
}

export interface Company {
  companyId: string;
  name: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  beneficiaryName: string;
}

export interface Worker {
  workerId: string; // e.g. "1", "2", "220", "TFW-1001"
  name: string;
  mobileNumber: string;
  address: string;
  joiningDate: string; // YYYY-MM-DD
  bankDetails: BankDetails;
  aadhaarNumber: string;
  isActive: boolean;
  perMachineRate: number; // rate per loom for Loom Workers, standard daily rate for Admin staff
  employeeType: EmployeeType;
  companyName: string; // Mandatory Company selection
  monthlySalary?: number; // Optional fixed monthly salary
  monthlyDays?: number; // Optional standard monthly working days (e.g. 26 or 30)
}

export interface Machine {
  machineId: string; // e.g. "Machine 01" to "Machine 30"
  isActive: boolean;
  companyName?: string; // Company Name associated with the machine
}

export interface Attendance {
  attendanceId: string;
  workerId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  inTime: string; // HH:MM
  outTime: string; // HH:MM
}

export interface DailyWork {
  workId: string;
  workerId: string;
  date: string; // YYYY-MM-DD
  selectedMachines: string[]; // e.g. ["Machine 01", "Machine 03"]
  machineCount: number;
  perMachineRate: number;
  calculatedWage: number; // machineCount * perMachineRate
  shift?: 'Day' | 'Night';
}

export interface AdminAttendance {
  adminAttendanceId: string;
  workerId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  calculatedWage: number; // Present = full, Half-Day = half, Absent = 0
}

export interface Salary {
  salaryId: string; // e.g. "workerId-YYYY-MM"
  workerId: string;
  month: string; // YYYY-MM
  baseSalary: number; // accumulated from DailyWork (Loom Worker) or AdminAttendance (Admin Employee)
  bonus: number;
  advance: number;
  deductions: number;
  netSalary: number; // baseSalary + bonus - advance - deductions
  status: PayrollStatus;
}
