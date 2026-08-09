/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Worker, Salary } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Printer, X, CreditCard, Building2, User, CalendarDays, FileSpreadsheet } from 'lucide-react';

interface SalarySlipPDFProps {
  worker: Worker;
  salary: Salary;
  onClose: () => void;
}

export default function SalarySlipPDF({ worker, salary, onClose }: SalarySlipPDFProps) {
  const payslipId = `SLIP-${salary.month.replace('-', '')}-${worker.workerId}`;

  const handlePrint = () => {
    // Add print styles dynamically
    const style = document.createElement('style');
    style.id = 'print-style-patch';
    style.innerHTML = `
      @media print {
        body {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        /* Hide everything */
        #root, .no-print {
          display: none !important;
        }
        /* Show print area only */
        #print-area-wrapper {
          display: block !important;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 0;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Trigger print
    window.print();
    
    // Cleanup
    setTimeout(() => {
      const existingStyle = document.getElementById('print-style-patch');
      if (existingStyle) {
        existingStyle.remove();
      }
    }, 500);
  };

  // Format month name (e.g. 2026-07 -> July 2026)
  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div id="salary-slip-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-start overflow-y-auto p-4 md:p-8 z-50 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden mt-4 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Controls */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-indigo-400 h-5 w-5" />
            <h2 id="payslip-preview-title" className="font-semibold text-lg">Salary Slip Preview</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="print-slip-btn"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
            <button
              id="close-slip-btn"
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Area Wrapper */}
        <div className="p-6 md:p-10 bg-slate-50 overflow-x-auto">
          {/* Printable Container matching standard A4 look */}
          <div 
            id="print-area-wrapper" 
            className="bg-white border border-slate-300 shadow-sm mx-auto p-8 md:p-12 w-[100%] min-w-[750px] text-slate-800 font-sans"
            style={{ minHeight: '297mm' }} // A4 height proportion
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-950 pb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">{worker.companyName || 'TexFlow Textile Factory'}</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">GIDC Textile Hub, Ring Road, Surat, Gujarat - 395002</p>
                <p className="text-xs text-slate-400">Mobile: +91 98765 43210 | Email: accounts@texflow.com</p>
              </div>
              <div className="text-right">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-300 uppercase tracking-wider">
                  {salary.status === 'Paid' ? 'PAID' : 'PENDING'}
                </span>
                <p className="text-xs font-semibold text-slate-400 mt-3">PAYSLIP ID</p>
                <p className="text-sm font-mono font-bold text-slate-900">{payslipId}</p>
              </div>
            </div>

            {/* Payslip Subtitle */}
            <div className="text-center my-6 py-2 bg-slate-100 border-y border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 tracking-wide uppercase">
                SALARY SLIP FOR THE MONTH OF {formatMonthName(salary.month).toUpperCase()}
              </h2>
            </div>

            {/* Employee & Bank Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Employee Details Column */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-500" /> Employee Details
                </h3>
                <div className="grid grid-cols-3 gap-y-2 text-sm">
                  <span className="text-slate-500 font-medium">Company:</span>
                  <span className="col-span-2 font-bold text-indigo-900">{worker.companyName || 'TexFlow Textiles Pvt Ltd'}</span>

                  <span className="text-slate-500 font-medium">Employee ID:</span>
                  <span className="col-span-2 font-mono font-bold text-slate-900">{worker.workerId}</span>

                  <span className="text-slate-500 font-medium">Full Name:</span>
                  <span className="col-span-2 font-semibold text-slate-900">{worker.name}</span>

                  <span className="text-slate-500 font-medium">Designation:</span>
                  <span className="col-span-2 text-slate-700">
                    {worker.employeeType === 'Worker' ? 'Loom Operator / Worker' : 'Admin Staff / Employee'}
                  </span>

                  <span className="text-slate-500 font-medium">Mobile No:</span>
                  <span className="col-span-2 text-slate-700">{worker.mobileNumber || '-'}</span>

                  <span className="text-slate-500 font-medium">Aadhaar No:</span>
                  <span className="col-span-2 font-mono text-slate-700">{worker.aadhaarNumber || '-'}</span>

                  <span className="text-slate-500 font-medium">Joining Date:</span>
                  <span className="col-span-2 text-slate-700">{formatDate(worker.joiningDate) || '-'}</span>
                </div>
              </div>

              {/* Bank Details Column */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" /> Bank Transfer Details
                </h3>
                <div className="grid grid-cols-3 gap-y-2 text-sm">
                  <span className="text-slate-500 font-medium">Bank Name:</span>
                  <span className="col-span-2 font-semibold text-slate-900">{worker.bankDetails.bankName || '-'}</span>

                  <span className="text-slate-500 font-medium">Account No:</span>
                  <span className="col-span-2 font-mono font-semibold text-slate-900">{worker.bankDetails.accountNumber || '-'}</span>

                  <span className="text-slate-500 font-medium">IFSC Code:</span>
                  <span className="col-span-2 font-mono font-semibold text-slate-900">{worker.bankDetails.ifscCode || '-'}</span>

                  <span className="text-slate-500 font-medium">Beneficiary:</span>
                  <span className="col-span-2 text-slate-700">{worker.bankDetails.beneficiaryName || worker.name}</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="mb-8 border border-slate-200 rounded-lg p-3.5 bg-slate-50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Residential Address</p>
              <p className="text-sm text-slate-700">{worker.address || 'Address not registered'}</p>
            </div>

            {/* Salary Components Table */}
            <div className="border border-slate-950 rounded-lg overflow-hidden mb-8">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 text-white text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Salary Component</th>
                    <th className="px-4 py-3 font-semibold text-right">Earnings (+)</th>
                    <th className="px-4 py-3 font-semibold text-right">Deductions (-)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* Base Salary row */}
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>Base Accumulated Salary</div>
                      <div className="text-xs text-slate-400">
                        {worker.employeeType === 'Worker' 
                          ? `Calculated from active loom production runs @ ${formatCurrency(worker.perMachineRate)}`
                          : `Calculated from attendance entries @ ${formatCurrency(worker.perMachineRate)}/day`
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-slate-900">{formatCurrency(salary.baseSalary)}</td>
                    <td className="px-4 py-3 font-mono text-right text-slate-400">—</td>
                  </tr>

                  {/* Bonus row */}
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>Performance Bonus</div>
                      <div className="text-xs text-slate-400">Special seasonal & productivity incentives</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-emerald-600">
                      {salary.bonus > 0 ? `+${formatCurrency(salary.bonus)}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-slate-400">—</td>
                  </tr>

                  {/* Advance Salary row */}
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>Advance Draw-down</div>
                      <div className="text-xs text-slate-400">Recovery of advance wages disbursed during the month</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-slate-400">—</td>
                    <td className="px-4 py-3 font-mono text-right text-red-600">
                      {salary.advance > 0 ? `-${formatCurrency(salary.advance)}` : '—'}
                    </td>
                  </tr>

                  {/* Other Deductions row */}
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>Other Deductions</div>
                      <div className="text-xs text-slate-400">Custom cut-offs & other payroll adjustments</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-slate-400">—</td>
                    <td className="px-4 py-3 font-mono text-right text-red-600">
                      {salary.deductions > 0 ? `-${formatCurrency(salary.deductions)}` : '—'}
                    </td>
                  </tr>

                  {/* Summary row */}
                  <tr className="bg-slate-50 font-semibold border-t border-slate-300">
                    <td className="px-4 py-4 text-slate-900">Sub-totals</td>
                    <td className="px-4 py-4 font-mono text-right text-emerald-600">
                      {formatCurrency(salary.baseSalary + salary.bonus)}
                    </td>
                    <td className="px-4 py-4 font-mono text-right text-red-600">
                      {formatCurrency(salary.advance + salary.deductions)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Net Salary Highlight */}
            <div className="bg-slate-950 text-white rounded-xl p-6 flex flex-col md:flex-row justify-between items-center mb-12">
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Net Disbursable Salary (A4 Precision)</p>
                <p className="text-sm text-slate-400 mt-1">Exact fractional payment, after all additions & deductions</p>
              </div>
              <div className="text-right mt-4 md:mt-0">
                <span className="text-3xl font-mono font-bold text-white">{formatCurrency(salary.netSalary)}</span>
              </div>
            </div>

            {/* Declaration & Signature */}
            <div className="grid grid-cols-2 gap-12 text-center pt-8 border-t border-slate-200 mt-16 text-xs text-slate-500">
              <div className="flex flex-col justify-end items-center h-24">
                <p className="border-b border-slate-400 w-48 mb-2"></p>
                <p className="font-semibold text-slate-700">Authorized Signatory</p>
                <p className="text-slate-400">TexFlow Textile Factory</p>
              </div>
              <div className="flex flex-col justify-end items-center h-24">
                <p className="font-mono font-bold text-slate-800 text-sm italic mb-2">{worker.name}</p>
                <p className="border-b border-slate-400 w-48 mb-2"></p>
                <p className="font-semibold text-slate-700">Employee Signature</p>
                <p className="text-slate-400">Date of Acknowledgment</p>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center mt-12 text-[10px] text-slate-400 border-t border-slate-100 pt-4">
              This is a computer-generated salary slip and does not strictly require physical signatures to be valid under payroll audits. Please report discrepancies to the HR desk within 3 working days.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
