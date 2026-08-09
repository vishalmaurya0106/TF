/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Worker, Machine, DailyWork, AdminAttendance, Attendance, Salary, Company } from './types';

export const DEFAULT_COMPANIES: Company[] = [
  { companyId: 'comp-1', name: 'TexFlow Textiles Pvt Ltd' },
  { companyId: 'comp-2', name: 'Vraj Weaving Mills' }
];

// Natural Sort Algorithm for Employee IDs
export function naturalSortWorkers<T extends { workerId: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    return a.workerId.localeCompare(b.workerId, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });
}

// Decimal Currency Formatter
export function formatCurrency(amount: number | string): string {
  const parsed = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(parsed)) return '₹0.00';
  return `₹${parsed.toFixed(2)}`;
}

// Helper to format date cleanly as DD/MM/YYYY
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanDateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return dateStr;
}

// Generate the 30 Loom Machines
export const DEFAULT_MACHINES: Machine[] = Array.from({ length: 30 }, (_, i) => {
  const idNum = i + 1;
  const idStr = idNum < 10 ? `0${idNum}` : `${idNum}`;
  return {
    machineId: `Machine ${idStr}`,
    isActive: true,
    companyName: 'TexFlow Textiles Pvt Ltd',
  };
});

// Seed workers list
export const SEED_WORKERS: Worker[] = [
  {
    workerId: "220",
    name: "Vishal Maurya",
    mobileNumber: "9876543210",
    address: "Sector 4, Gandhinagar, Gujarat",
    joiningDate: "2025-01-15",
    bankDetails: {
      bankName: "State Bank of India",
      accountNumber: "32104598761",
      ifscCode: "SBIN0001043",
      beneficiaryName: "Vishal Maurya"
    },
    aadhaarNumber: "1234-5678-9012",
    isActive: true,
    perMachineRate: 350.50, // Per machine run rate
    employeeType: "Worker",
    companyName: "TexFlow Textiles Pvt Ltd"
  },
  {
    workerId: "3",
    name: "Rajesh Kumar",
    mobileNumber: "9123456789",
    address: "Block B, GIDC, Surat",
    joiningDate: "2024-11-01",
    bankDetails: {
      bankName: "HDFC Bank",
      accountNumber: "5010043219876",
      ifscCode: "HDFC0000120",
      beneficiaryName: "Rajesh Kumar"
    },
    aadhaarNumber: "4321-8765-1209",
    isActive: true,
    perMachineRate: 320.25,
    employeeType: "Worker",
    companyName: "TexFlow Textiles Pvt Ltd"
  },
  {
    workerId: "22",
    name: "Amir Khan",
    mobileNumber: "8899001122",
    address: "Katargam, Surat, Gujarat",
    joiningDate: "2025-03-10",
    bankDetails: {
      bankName: "Bank of Baroda",
      accountNumber: "0245010002341",
      ifscCode: "BARB0SURATX",
      beneficiaryName: "Amir Khan"
    },
    aadhaarNumber: "9876-5432-1111",
    isActive: true,
    perMachineRate: 340.00,
    employeeType: "Worker",
    companyName: "Vraj Weaving Mills"
  },
  {
    workerId: "2",
    name: "Satish Kumar",
    mobileNumber: "7766554433",
    address: "Adajan Road, Surat",
    joiningDate: "2023-05-20",
    bankDetails: {
      bankName: "Punjab National Bank",
      accountNumber: "10982345101123",
      ifscCode: "PUNB0123400",
      beneficiaryName: "Satish Kumar"
    },
    aadhaarNumber: "1122-3344-5566",
    isActive: true,
    perMachineRate: 1200.75, // Standard daily rate for Admin
    employeeType: "Admin Employee",
    companyName: "TexFlow Textiles Pvt Ltd"
  },
  {
    workerId: "10",
    name: "Priya Sharma",
    mobileNumber: "9988776655",
    address: "Textile Hub Complex, Ring Road, Surat",
    joiningDate: "2024-02-18",
    bankDetails: {
      bankName: "ICICI Bank",
      accountNumber: "001205006789",
      ifscCode: "ICIC0000012",
      beneficiaryName: "Priya Sharma"
    },
    aadhaarNumber: "5566-7788-9900",
    isActive: true,
    perMachineRate: 1550.00, // Standard daily rate for Admin
    employeeType: "Admin Employee",
    companyName: "TexFlow Textiles Pvt Ltd"
  }
];

// Seed some initial data for production & attendance to make the dashboard alive
export const SEED_DAILY_WORK: DailyWork[] = [
  // Current month (2026-08) entries
  {
    workId: "w101",
    workerId: "220",
    date: "2026-08-01",
    selectedMachines: ["Machine 01", "Machine 02", "Machine 03", "Machine 04"],
    machineCount: 4,
    perMachineRate: 350.50,
    calculatedWage: 1402.00,
    shift: 'Day'
  },
  {
    workId: "w102",
    workerId: "220",
    date: "2026-08-05",
    selectedMachines: ["Machine 01", "Machine 02", "Machine 03"],
    machineCount: 3,
    perMachineRate: 350.50,
    calculatedWage: 1051.50,
    shift: 'Day'
  },
  {
    workId: "w103",
    workerId: "3",
    date: "2026-08-02",
    selectedMachines: ["Machine 05", "Machine 06", "Machine 07"],
    machineCount: 3,
    perMachineRate: 320.25,
    calculatedWage: 960.75,
    shift: 'Day'
  },
  {
    workId: "w104",
    workerId: "22",
    date: "2026-08-03",
    selectedMachines: ["Machine 11", "Machine 12", "Machine 13", "Machine 14"],
    machineCount: 4,
    perMachineRate: 340.00,
    calculatedWage: 1360.00,
    shift: 'Day'
  },
  // Previous month (2026-07) entries
  {
    workId: "w1",
    workerId: "220",
    date: "2026-07-01",
    selectedMachines: ["Machine 01", "Machine 02", "Machine 03"],
    machineCount: 3,
    perMachineRate: 350.50,
    calculatedWage: 1051.50
  },
  {
    workId: "w2",
    workerId: "220",
    date: "2026-07-02",
    selectedMachines: ["Machine 01", "Machine 02", "Machine 03", "Machine 04"],
    machineCount: 4,
    perMachineRate: 350.50,
    calculatedWage: 1402.00
  },
  {
    workId: "w3",
    workerId: "220",
    date: "2026-07-03",
    selectedMachines: ["Machine 02", "Machine 03"],
    machineCount: 2,
    perMachineRate: 350.50,
    calculatedWage: 701.00
  },
  {
    workId: "w4",
    workerId: "3",
    date: "2026-07-01",
    selectedMachines: ["Machine 05", "Machine 06"],
    machineCount: 2,
    perMachineRate: 320.25,
    calculatedWage: 640.50
  },
  {
    workId: "w5",
    workerId: "3",
    date: "2026-07-02",
    selectedMachines: ["Machine 05", "Machine 06", "Machine 07"],
    machineCount: 3,
    perMachineRate: 320.25,
    calculatedWage: 960.75
  },
  {
    workId: "w6",
    workerId: "22",
    date: "2026-07-01",
    selectedMachines: ["Machine 11", "Machine 12", "Machine 13"],
    machineCount: 3,
    perMachineRate: 340.00,
    calculatedWage: 1020.00
  }
];

export const SEED_ADMIN_ATTENDANCE: AdminAttendance[] = [
  // Current month (2026-08) entries
  {
    adminAttendanceId: "a101",
    workerId: "2",
    date: "2026-08-01",
    status: "Present",
    calculatedWage: 1200.75
  },
  {
    adminAttendanceId: "a102",
    workerId: "2",
    date: "2026-08-02",
    status: "Present",
    calculatedWage: 1200.75
  },
  {
    adminAttendanceId: "a103",
    workerId: "10",
    date: "2026-08-01",
    status: "Present",
    calculatedWage: 1550.00
  },
  {
    adminAttendanceId: "a104",
    workerId: "10",
    date: "2026-08-02",
    status: "Present",
    calculatedWage: 1550.00
  },
  // Previous month (2026-07) entries
  {
    adminAttendanceId: "a1",
    workerId: "2",
    date: "2026-07-01",
    status: "Present",
    calculatedWage: 1200.75
  },
  {
    adminAttendanceId: "a2",
    workerId: "2",
    date: "2026-07-02",
    status: "Half-Day",
    calculatedWage: 600.375
  },
  {
    adminAttendanceId: "a3",
    workerId: "2",
    date: "2026-07-03",
    status: "Present",
    calculatedWage: 1200.75
  },
  {
    adminAttendanceId: "a4",
    workerId: "10",
    date: "2026-07-01",
    status: "Present",
    calculatedWage: 1550.00
  },
  {
    adminAttendanceId: "a5",
    workerId: "10",
    date: "2026-07-02",
    status: "Present",
    calculatedWage: 1550.00
  },
  {
    adminAttendanceId: "a6",
    workerId: "10",
    date: "2026-07-03",
    status: "Absent",
    calculatedWage: 0.00
  }
];

export const SEED_LOOM_ATTENDANCE: Attendance[] = [
  {
    attendanceId: "la1",
    workerId: "220",
    date: "2026-07-01",
    status: "Present",
    inTime: "08:30",
    outTime: "18:00"
  },
  {
    attendanceId: "la2",
    workerId: "220",
    date: "2026-07-02",
    status: "Present",
    inTime: "08:15",
    outTime: "18:30"
  },
  {
    attendanceId: "la3",
    workerId: "3",
    date: "2026-07-01",
    status: "Present",
    inTime: "08:45",
    outTime: "17:45"
  },
  {
    attendanceId: "la4",
    workerId: "22",
    date: "2026-07-01",
    status: "Present",
    inTime: "09:00",
    outTime: "18:00"
  }
];

// Seed custom salary adjustments for previous records if needed
export const SEED_SALARIES: Salary[] = [
  {
    salaryId: "220-2026-07",
    workerId: "220",
    month: "2026-07",
    baseSalary: 3154.50, // 1051.50 + 1402.00 + 701.00
    bonus: 150.00,
    advance: 500.00,
    deductions: 50.00,
    netSalary: 2754.50, // 3154.50 + 150 - 500 - 50
    status: "Paid"
  },
  {
    salaryId: "2-2026-07",
    workerId: "2",
    month: "2026-07",
    baseSalary: 3001.875, // 1200.75 + 600.375 + 1200.75
    bonus: 200.00,
    advance: 0,
    deductions: 0,
    netSalary: 3201.875,
    status: "Pending"
  }
];
