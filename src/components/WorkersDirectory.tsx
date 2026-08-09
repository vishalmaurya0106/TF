/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Worker, EmployeeType } from '../types';
import { naturalSortWorkers, formatCurrency, formatDate } from '../utils';
import ConfirmModal from './ConfirmModal';
import { DateInput } from './DateInput';
import * as XLSX from 'xlsx';
import { 
  Users, UserPlus, Pencil, Eye, ToggleLeft, ToggleRight, 
  Search, ShieldAlert, CreditCard, Building2, UserCheck, 
  Trash2, X, Check, Landmark, CalendarDays, Smartphone, MapPin,
  Upload, Download, FileSpreadsheet
} from 'lucide-react';

interface WorkersDirectoryProps {
  workers: Worker[];
  onAddWorker: (worker: Worker) => void;
  onUpdateWorker: (worker: Worker) => void;
  onDeleteWorker: (workerId: string) => void;
  isAdmin?: boolean;
}

export default function WorkersDirectory({ 
  workers, 
  onAddWorker, 
  onUpdateWorker, 
  onDeleteWorker,
  isAdmin = true
}: WorkersDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | EmployeeType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Excel File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation Modal State
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteWorkerId, setDeleteWorkerId] = useState('');
  const [deleteWorkerName, setDeleteWorkerName] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentWorkerId, setCurrentWorkerId] = useState('');

  // Form Fields
  const [formWorkerId, setFormWorkerId] = useState('');
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState('');
  const [formAadhaar, setFormAadhaar] = useState('');
  const [formRate, setFormRate] = useState('');
  const [formMonthlySalary, setFormMonthlySalary] = useState('');
  const [formMonthlyDays, setFormMonthlyDays] = useState('');
  const [formType, setFormType] = useState<EmployeeType>('Worker');
  const [formIsActive, setFormIsActive] = useState(true);

  // Bank fields
  const [formBankName, setFormBankName] = useState('');
  const [formAccNumber, setFormAccNumber] = useState('');
  const [formIfsc, setFormIfsc] = useState('');
  const [formBeneficiary, setFormBeneficiary] = useState('');

  // Validation Error state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset form helper
  const resetForm = () => {
    setFormWorkerId('');
    setFormName('');
    setFormMobile('');
    setFormAddress('');
    setFormJoiningDate(new Date().toISOString().split('T')[0]);
    setFormAadhaar('');
    setFormRate('');
    setFormMonthlySalary('');
    setFormMonthlyDays('');
    setFormType('Worker');
    setFormIsActive(true);
    setFormBankName('');
    setFormAccNumber('');
    setFormIfsc('');
    setFormBeneficiary('');
    setErrors({});
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (worker: Worker) => {
    setIsEditMode(true);
    setCurrentWorkerId(worker.workerId);
    
    setFormWorkerId(worker.workerId);
    setFormName(worker.name);
    setFormMobile(worker.mobileNumber || '');
    setFormAddress(worker.address || '');
    setFormJoiningDate(worker.joiningDate || '');
    setFormAadhaar(worker.aadhaarNumber || '');
    setFormRate(worker.perMachineRate.toString());
    setFormMonthlySalary(worker.monthlySalary !== undefined ? worker.monthlySalary.toString() : '');
    setFormMonthlyDays(worker.monthlyDays !== undefined ? worker.monthlyDays.toString() : '');
    setFormType(worker.employeeType);
    setFormIsActive(worker.isActive);
    
    setFormBankName(worker.bankDetails?.bankName || '');
    setFormAccNumber(worker.bankDetails?.accountNumber || '');
    setFormIfsc(worker.bankDetails?.ifscCode || '');
    setFormBeneficiary(worker.bankDetails?.beneficiaryName || '');
    
    setErrors({});
    setIsModalOpen(true);
  };

  // Validate form fields (Mobile, Aadhaar, Bank details are OPTIONAL)
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formWorkerId.trim()) {
      newErrors.workerId = 'Employee ID is required';
    } else if (!isEditMode && workers.some(w => w.workerId.toLowerCase() === formWorkerId.trim().toLowerCase())) {
      newErrors.workerId = 'Employee ID already exists';
    }

    if (!formName.trim()) {
      newErrors.name = 'Employee Name is required';
    }

    if (!formRate.trim()) {
      newErrors.rate = 'Wages / Salary rate is required';
    } else if (isNaN(parseFloat(formRate)) || parseFloat(formRate) < 0) {
      newErrors.rate = 'Wages / Salary rate must be a valid number';
    }

    // Mobile is optional, but validate format if entered
    if (formMobile.trim() && formMobile.trim().length > 0) {
      const cleanDigits = formMobile.trim().replace(/\D/g, '');
      if (cleanDigits.length > 0 && cleanDigits.length !== 10) {
        newErrors.mobile = 'Mobile Number must be 10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const parsedRate = parseFloat(parseFloat(formRate).toFixed(2));
    const parsedMonthlySalary = formMonthlySalary.trim() !== '' && !isNaN(parseFloat(formMonthlySalary))
      ? parseFloat(parseFloat(formMonthlySalary).toFixed(2))
      : undefined;
    const parsedMonthlyDays = formMonthlyDays.trim() !== '' && !isNaN(parseFloat(formMonthlyDays))
      ? parseFloat(formMonthlyDays)
      : undefined;
    
    const workerPayload: Worker = {
      workerId: formWorkerId.trim(),
      name: formName.trim(),
      mobileNumber: formMobile.trim(),
      address: formAddress.trim(),
      joiningDate: formJoiningDate,
      aadhaarNumber: formAadhaar.trim(),
      isActive: formIsActive,
      perMachineRate: parsedRate,
      monthlySalary: parsedMonthlySalary,
      monthlyDays: parsedMonthlyDays,
      employeeType: formType,
      bankDetails: {
        bankName: formBankName.trim(),
        accountNumber: formAccNumber.trim(),
        ifscCode: formIfsc.trim().toUpperCase(),
        beneficiaryName: formBeneficiary.trim() || formName.trim()
      }
    };

    if (isEditMode) {
      onUpdateWorker(workerPayload);
    } else {
      onAddWorker(workerPayload);
    }
    
    setIsModalOpen(false);
  };

  // --- Excel Sample Download ---
  const handleDownloadExcelSample = () => {
    const sampleRows = [
      {
        "Employee ID": "101",
        "Full Name": "Ramesh Kumar",
        "Employee Type": "Worker",
        "Per Machine or Daily Rate": 350,
        "Monthly Salary": 15000,
        "Monthly Days": 26,
        "Mobile Number": "9876543210",
        "Aadhaar Number": "123456789012",
        "Address": "Quarter 4, TexFlow Factory",
        "Joining Date": "2026-01-01",
        "Bank Name": "State Bank of India",
        "Account Number": "32109876543",
        "IFSC Code": "SBIN0001234",
        "Beneficiary Name": "Ramesh Kumar"
      },
      {
        "Employee ID": "102",
        "Full Name": "Suresh Sharma",
        "Employee Type": "Admin Employee",
        "Per Machine or Daily Rate": 1200,
        "Monthly Salary": 30000,
        "Monthly Days": 30,
        "Mobile Number": "",
        "Aadhaar Number": "",
        "Address": "",
        "Joining Date": "2026-01-15",
        "Bank Name": "",
        "Account Number": "",
        "IFSC Code": "",
        "Beneficiary Name": ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees_Template");
    XLSX.writeFile(workbook, "TexFlow_Employee_Import_Sample.xlsx");
  };

  // --- Excel File Upload Parser ---
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          alert("The selected Excel file is empty or invalid.");
          return;
        }

        let addedCount = 0;
        let updatedCount = 0;

        jsonRows.forEach((row) => {
          const getKey = (possibleKeys: string[]) => {
            for (const key of possibleKeys) {
              const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
              if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
                return String(row[foundKey]).trim();
              }
            }
            return '';
          };

          const rawId = getKey(['Employee ID', 'workerId', 'ID', 'Id', 'Emp ID']);
          const rawName = getKey(['Full Name', 'Name', 'Employee Name', 'name']);
          
          if (!rawId || !rawName) return;

          const rawType = getKey(['Employee Type', 'Type', 'Designation']);
          const rawTypeLower = rawType.toLowerCase();
          const employeeType: EmployeeType = rawTypeLower.includes('admin') 
            ? 'Admin Employee' 
            : rawTypeLower.includes('other') 
              ? 'Others' 
              : 'Worker';

          const rawRate = getKey(['Per Machine or Daily Rate', 'Rate', 'perMachineRate', 'Salary', 'Wage']);
          const parsedRate = parseFloat(rawRate) || 0;

          const rawMonthlySalary = getKey(['Monthly Salary', 'monthlySalary', 'Monthly Fixed Salary']);
          const rawMonthlyDays = getKey(['Monthly Days', 'monthlyDays', 'Working Days']);
          const parsedMonthlySalary = rawMonthlySalary ? parseFloat(rawMonthlySalary) || undefined : undefined;
          const parsedMonthlyDays = rawMonthlyDays ? parseFloat(rawMonthlyDays) || undefined : undefined;

          const mobile = getKey(['Mobile Number', 'Mobile', 'mobileNumber', 'Phone']);
          const aadhaar = getKey(['Aadhaar Number', 'Aadhaar', 'aadhaarNumber']);
          const address = getKey(['Address', 'address']);
          const joiningDate = getKey(['Joining Date', 'Joining', 'joiningDate']) || new Date().toISOString().split('T')[0];
          const bankName = getKey(['Bank Name', 'Bank', 'bankName']);
          const accountNumber = getKey(['Account Number', 'Account', 'accountNumber']);
          const ifscCode = getKey(['IFSC Code', 'IFSC', 'ifscCode']);
          const beneficiaryName = getKey(['Beneficiary Name', 'Beneficiary', 'beneficiaryName']);

          const existingWorker = workers.find(w => w.workerId.toLowerCase() === rawId.toLowerCase());

          const workerObj: Worker = {
            workerId: rawId,
            name: rawName,
            mobileNumber: mobile,
            address: address,
            joiningDate: joiningDate,
            aadhaarNumber: aadhaar,
            isActive: true,
            perMachineRate: parsedRate,
            monthlySalary: parsedMonthlySalary,
            monthlyDays: parsedMonthlyDays,
            employeeType: employeeType,
            bankDetails: {
              bankName: bankName,
              accountNumber: accountNumber,
              ifscCode: ifscCode.toUpperCase(),
              beneficiaryName: beneficiaryName || rawName
            }
          };

          if (existingWorker) {
            onUpdateWorker(workerObj);
            updatedCount++;
          } else {
            onAddWorker(workerObj);
            addedCount++;
          }
        });

        alert(`Excel Import Successful!\n\n• New Employees Added: ${addedCount}\n• Existing Profiles Updated: ${updatedCount}`);
      } catch (err: any) {
        alert(`Error parsing Excel file: ${err?.message || 'Invalid format'}`);
      } finally {
        if (e.target) e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  const toggleWorkerStatus = (worker: Worker) => {
    onUpdateWorker({
      ...worker,
      isActive: !worker.isActive
    });
  };

  // Filter & Natural Sort
  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          w.workerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.mobileNumber.includes(searchTerm);
    const matchesType = typeFilter === 'all' || w.employeeType === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && w.isActive) || 
                          (statusFilter === 'inactive' && !w.isActive);
    return matchesSearch && matchesType && matchesStatus;
  });

  // CRITICAL REQUIREMENT: Sorted unki Employee ID (workerId) ke natural numeric order me
  const sortedWorkers = naturalSortWorkers(filteredWorkers);

  return (
    <div className="space-y-6">
      
      {/* Hidden File Input for Excel Import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .xls, .csv"
        onChange={handleExcelFileUpload}
        className="hidden"
      />

      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 id="workers-dir-title" className="text-xl font-bold text-slate-900">Employees Directory</h2>
            <p className="text-sm text-slate-500 font-medium">Manage and monitor Loom Operators and Administrative Staff</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Excel Sample Template */}
          <button
            type="button"
            onClick={handleDownloadExcelSample}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 transition-all text-xs cursor-pointer"
            title="Download Excel template for bulk employee upload"
          >
            <Download className="h-4 w-4 text-slate-600" />
            Excel Sample
          </button>

          {/* Upload Excel */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition-all text-xs cursor-pointer"
            title="Import employees from Excel (.xlsx, .csv) file"
          >
            <Upload className="h-4 w-4" />
            Upload Excel
          </button>

          {/* Register Single Employee */}
          <button
            id="add-worker-btn"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all text-xs cursor-pointer hover:-translate-y-0.5 duration-150"
          >
            <UserPlus className="h-4 w-4" />
            Register Employee
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
        {/* Search */}
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
          <input
            id="worker-search-input"
            type="text"
            placeholder="Search by Employee ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl outline-none text-sm transition-all font-medium"
          />
        </div>

        {/* Employee Type Filter */}
        <div>
          <select
            id="worker-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl outline-none text-sm transition-all font-medium"
          >
            <option value="all">All Employee Types</option>
            <option value="Worker">Loom Workers</option>
            <option value="Admin Employee">Admin Employees</option>
            <option value="Others">Others (Staff / Maintenance)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            id="worker-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl outline-none text-sm transition-all font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Employee ID</th>
                <th className="px-6 py-4">Name & Contact</th>
                <th className="px-6 py-4">Employee Type</th>
                <th className="px-6 py-4 text-right">Standard Rate</th>
                <th className="px-6 py-4">Bank Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {sortedWorkers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Users className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    No employees matching the criteria found.
                  </td>
                </tr>
              ) : (
                sortedWorkers.map((worker) => (
                  <tr key={worker.workerId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4.5 font-mono font-bold text-slate-900">
                      {worker.workerId}
                    </td>
                    <td className="px-6 py-4.5">
                      <div>
                        <div className="font-semibold text-slate-900">{worker.name}</div>
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> {worker.mobileNumber}</span>
                          {worker.joiningDate && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              • Joined: {formatDate(worker.joiningDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        worker.employeeType === 'Worker' 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                          : worker.employeeType === 'Admin Employee'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {worker.employeeType}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right font-mono text-slate-900">
                      <div>{formatCurrency(worker.perMachineRate)}</div>
                      <div className="text-[10px] text-slate-400 font-sans font-semibold">
                        {worker.employeeType === 'Worker' ? 'per loom run' : 'per day standard'}
                      </div>
                      {worker.monthlySalary !== undefined && worker.monthlySalary > 0 && (
                        <div className="text-[10px] text-indigo-600 font-bold font-mono mt-0.5">
                          Monthly: {formatCurrency(worker.monthlySalary)}
                          {worker.monthlyDays ? ` (${worker.monthlyDays}d)` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="max-w-[200px]">
                        <div className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-400" /> {worker.bankDetails.bankName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          A/C: {worker.bankDetails.accountNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <button
                        onClick={() => toggleWorkerStatus(worker)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                          worker.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${worker.isActive ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                        {worker.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          title="Edit Employee details"
                          onClick={() => handleOpenEditModal(worker)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            title="Delete Employee"
                            onClick={() => {
                              setDeleteWorkerId(worker.workerId);
                              setDeleteWorkerName(worker.name);
                              setIsConfirmDeleteOpen(true);
                            }}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Add / Edit Worker */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                <h3 id="modal-title" className="font-bold text-base">
                  {isEditMode ? 'Edit Employee Profile' : 'Register New Employee'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form id="worker-profile-form" onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Core Details */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 border-b pb-1">1. Company Profile</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Worker ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Employee ID (workerId) <span className="text-red-500">*</span></label>
                    <input
                      id="form-worker-id"
                      type="text"
                      placeholder=""
                      disabled={isEditMode}
                      value={formWorkerId}
                      onChange={(e) => setFormWorkerId(e.target.value)}
                      className={`w-full px-3.5 py-2.5 border rounded-xl outline-none text-sm transition-all font-medium ${
                        isEditMode ? 'bg-slate-100 border-slate-200 text-slate-500' : 'border-slate-200 focus:border-slate-400'
                      }`}
                    />
                    {errors.workerId && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.workerId}</p>}
                  </div>

                  {/* Employee Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Employee Designation Type <span className="text-red-500">*</span></label>
                    <select
                      id="form-worker-type"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as EmployeeType)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-slate-400 rounded-xl outline-none text-sm transition-all font-medium"
                    >
                      <option value="Worker">Loom operator (Loom Worker)</option>
                      <option value="Admin Employee">Administrative employee (Admin)</option>
                      <option value="Others">Others (Maintenance / Helpers / Staff)</option>
                    </select>
                  </div>

                  {/* Standard Wage Rate */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      {formType === 'Worker' ? 'Per Loom Machine Rate (₹)' : 'Standard Daily Wage Salary (₹)'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="form-worker-rate"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formRate}
                      onChange={(e) => setFormRate(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-slate-400 rounded-xl outline-none text-sm transition-all font-mono font-bold"
                    />
                    {errors.rate && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.rate}</p>}
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formType === 'Worker' 
                        ? 'Operational rate calculated per active loom machine production run.' 
                        : 'Standard daily salary disbursed based on attendance registers.'}
                    </span>
                  </div>

                  {/* Optional Monthly Salary & Working Days Config */}
                  <div className="col-span-1 sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Landmark className="h-3.5 w-3.5 text-indigo-600" />
                        Monthly Fixed Salary & Days Config <span className="text-slate-400 font-normal">(Optional)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Auto-calculates daily rate if entered</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Monthly Salary (₹) <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          id="form-worker-monthly-salary"
                          type="number"
                          step="0.01"
                          placeholder="e.g. 15000"
                          value={formMonthlySalary}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormMonthlySalary(val);
                            const numSal = parseFloat(val);
                            const numDays = parseFloat(formMonthlyDays) || 26;
                            if (numSal > 0 && numDays > 0 && (!formRate || parseFloat(formRate) === 0)) {
                              setFormRate((numSal / numDays).toFixed(2));
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-slate-400 rounded-lg outline-none text-xs transition-all font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Monthly Working Days <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          id="form-worker-monthly-days"
                          type="number"
                          placeholder="e.g. 26 or 30"
                          value={formMonthlyDays}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormMonthlyDays(val);
                            const numSal = parseFloat(formMonthlySalary);
                            const numDays = parseFloat(val);
                            if (numSal > 0 && numDays > 0) {
                              setFormRate((numSal / numDays).toFixed(2));
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-slate-400 rounded-lg outline-none text-xs transition-all font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date of Joining */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Joining Date</label>
                    <DateInput
                      id="form-worker-date"
                      value={formJoiningDate}
                      onChange={setFormJoiningDate}
                      className="w-full bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 border-b pb-1">2. Personal Profile</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Employee Full Name <span className="text-red-500">*</span></label>
                    <input
                      id="form-worker-name"
                      type="text"
                      placeholder=""
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-slate-400 rounded-xl outline-none text-sm transition-all font-medium"
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.name}</p>}
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Mobile Contact Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      id="form-worker-mobile"
                      type="tel"
                      maxLength={10}
                      placeholder=""
                      value={formMobile}
                      onChange={(e) => setFormMobile(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-slate-400 rounded-xl outline-none text-sm transition-all font-medium"
                    />
                    {errors.mobile && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.mobile}</p>}
                  </div>

                  {/* Aadhaar Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Aadhaar Card Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      id="form-worker-aadhaar"
                      type="text"
                      placeholder=""
                      value={formAadhaar}
                      onChange={(e) => setFormAadhaar(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-slate-400 rounded-xl outline-none text-sm transition-all font-mono"
                    />
                  </div>

                  {/* Residential Address */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Residential Address <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <textarea
                      id="form-worker-address"
                      placeholder=""
                      rows={2}
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-slate-400 rounded-xl outline-none text-sm transition-all font-medium resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 border-b pb-1 flex items-center gap-1">
                  <Landmark className="h-4 w-4 text-slate-500" /> 3. Bank Account & Remittance Details <span className="text-slate-400 font-normal capitalize">(Optional)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bank Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Bank Name <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      id="form-worker-bank"
                      type="text"
                      placeholder=""
                      value={formBankName}
                      onChange={(e) => setFormBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-slate-400 rounded-xl outline-none text-sm transition-all font-medium"
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Bank Account Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      id="form-worker-account"
                      type="text"
                      placeholder=""
                      value={formAccNumber}
                      onChange={(e) => setFormAccNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-slate-400 rounded-xl outline-none text-sm transition-all font-mono"
                    />
                  </div>

                  {/* IFSC Code */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">IFSC Code <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      id="form-worker-ifsc"
                      type="text"
                      placeholder=""
                      value={formIfsc}
                      onChange={(e) => setFormIfsc(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-slate-400 rounded-xl outline-none text-sm transition-all font-mono uppercase"
                    />
                  </div>

                  {/* Beneficiary Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Beneficiary Name <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      id="form-worker-beneficiary"
                      type="text"
                      placeholder=""
                      value={formBeneficiary}
                      onChange={(e) => setFormBeneficiary(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-slate-400 rounded-xl outline-none text-sm transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle (Only on edit) */}
              {isEditMode && (
                <div className="flex items-center justify-between border border-slate-100 rounded-xl p-4 bg-slate-50">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Is Employee Currently Active?</p>
                    <p className="text-xs text-slate-400 mt-0.5">Inactive staff are hidden from daily production operations and logs.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormIsActive(!formIsActive)}
                    className="cursor-pointer"
                  >
                    {formIsActive ? (
                      <ToggleRight className="h-10 w-10 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-10 w-10 text-slate-400" />
                    )}
                  </button>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  id="cancel-worker-form-btn"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4.5 py-2 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-worker-form-btn"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all rounded-xl text-sm flex items-center gap-1 cursor-pointer"
                >
                  <Check className="h-4.5 w-4.5 text-white" />
                  {isEditMode ? 'Update Profile' : 'Save & Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConfirmDeleteOpen && (
        <ConfirmModal
          isOpen={isConfirmDeleteOpen}
          title="Delete Employee"
          message={`Are you absolutely sure you want to delete ${deleteWorkerName} (ID: ${deleteWorkerId})? This will also remove their associated logs.`}
          onConfirm={() => {
            onDeleteWorker(deleteWorkerId);
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
