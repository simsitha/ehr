'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { OvertimeRequest } from '@/lib/types';
import { getOvertimeRateConfig } from '@/lib/overtime-calc';
import { formatLocalizedText } from '@/lib/translations';
import { Printer, X, Shield, FileText } from 'lucide-react';

interface OvertimePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: OvertimeRequest | null;
}

export default function OvertimePrintModal({
  isOpen,
  onClose,
  request,
}: OvertimePrintModalProps) {
  const { language, overtimeSettings } = useApp();

  if (!isOpen || !request) return null;

  const rateConfig = getOvertimeRateConfig(request.ot_rate_type, overtimeSettings?.rates);
  const khrAmount = Math.round(request.estimated_pay * 4100);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Top Controls (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">
              {language === 'km' ? 'ទិដ្ឋភាពបោះពុម្ពលិខិតអនុញ្ញាតថែមម៉ោងផ្លូវការ (A4)' : 'Official Overtime Authorization Preview (A4)'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>{language === 'km' ? 'បោះពុម្ពឯកសារ (Print)' : 'Print Document'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Paper (A4) */}
        <div className="flex-1 overflow-y-auto p-10 bg-white text-slate-900 print:p-0 print:overflow-visible print:bg-white print:text-black">
          {/* Kingdom of Cambodia Header */}
          <div className="text-center mb-6">
            {language === 'km' ? (
              <>
                <p className="font-bold text-base tracking-wide text-slate-800 font-serif">
                  ព្រះរាជាណាចក្រកម្ពុជា
                </p>
                <p className="font-semibold text-sm tracking-widest text-slate-700 font-serif mt-0.5">
                  ជាតិ សាសនា ព្រះមហាក្សត្រ
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-base tracking-wide text-slate-800 font-serif">
                  KINGDOM OF CAMBODIA
                </p>
                <p className="font-semibold text-xs tracking-widest text-slate-700 font-serif mt-0.5">
                  NATION &bull; RELIGION &bull; KING
                </p>
              </>
            )}
            <div className="w-24 h-0.5 bg-amber-600 mx-auto my-1.5 opacity-60" />
            {language === 'km' && (
              <p className="text-[11px] text-slate-500 italic">
                KINGDOM OF CAMBODIA • NATION RELIGION KING
              </p>
            )}
          </div>

          {/* Company Information & Form Number */}
          <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-6">
            <div>
              <div className="font-bold text-slate-900 text-lg uppercase tracking-wide">
                HESTRA HRM ENTERPRISE CAMBODIA
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {language === 'km'
                  ? 'ការិយាល័យកណ្តាល៖ មហាវិថីព្រះមុនីវង្ស រាជធានីភ្នំពេញ • ទូរស័ព្ទ៖ +855 23 999 888'
                  : 'Head Office: Preah Monivong Blvd, Phnom Penh • Tel: +855 23 999 888'}
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="font-mono text-slate-500">
                {language === 'km' ? 'លេខយោង / Ref:' : 'Ref:'} <strong className="text-slate-800">OT-{request.id.slice(-8).toUpperCase()}</strong>
              </div>
              <div className="text-slate-600 mt-0.5">
                {language === 'km' ? `កាលបរិច្ឆេទ / Date: ${new Date().toLocaleDateString('km-KH')}` : `Date: ${new Date().toLocaleDateString('en-GB')}`}
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center my-4">
            {language === 'km' && (
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 font-khmer">
                លិខិតស្នើសុំ និងអនុញ្ញាតធ្វើការថែមម៉ោង
              </h2>
            )}
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mt-0.5">
              OVERTIME WORK REQUEST & AUTHORIZATION FORM
            </p>
          </div>

          {/* Section 1: Employee Information */}
          <div className="mb-5">
            <div className="bg-slate-100 p-2 text-xs font-bold uppercase text-slate-800 border border-slate-300">
              {language === 'km' ? '១. ព័ត៌មានបុគ្គលិកស្នើសុំ (Employee Information)' : '1. EMPLOYEE INFORMATION'}
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 bg-slate-50 font-semibold w-1/4">
                    {language === 'km' ? 'ឈ្មោះបុគ្គលិក (Name):' : 'Employee Name:'}
                  </td>
                  <td className="border border-slate-300 p-2 font-bold w-1/4">{request.employee_name}</td>
                  <td className="border border-slate-300 p-2 bg-slate-50 font-semibold w-1/4">
                    {language === 'km' ? 'អត្តលេខ (Emp ID):' : 'Employee ID:'}
                  </td>
                  <td className="border border-slate-300 p-2 font-mono w-1/4">{request.employee_id}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">
                    {language === 'km' ? 'តួនាទី (Position):' : 'Position / Role:'}
                  </td>
                  <td className="border border-slate-300 p-2">{formatLocalizedText(request.employee_role, language)}</td>
                  <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">
                    {language === 'km' ? 'នាយកដ្ឋាន (Department):' : 'Department:'}
                  </td>
                  <td className="border border-slate-300 p-2">{formatLocalizedText(request.department_name, language)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Overtime Details */}
          <div className="mb-5">
            <div className="bg-slate-100 p-2 text-xs font-bold uppercase text-slate-800 border border-slate-300">
              {language === 'km' ? '២. កាលវិភាគ និងព័ត៌មានថែមម៉ោង (Overtime Details)' : '2. OVERTIME DETAILS'}
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 bg-slate-50 font-semibold w-1/4">
                    {language === 'km' ? 'កាលបរិច្ឆេទ (Date):' : 'Date:'}
                  </td>
                  <td className="border border-slate-300 p-2 font-bold w-1/4">{request.date}</td>
                  <td className="border border-slate-300 p-2 bg-slate-50 font-semibold w-1/4">
                    {language === 'km' ? 'ម៉ោងថែម (Time Duration):' : 'Time Duration:'}
                  </td>
                  <td className="border border-slate-300 p-2 font-mono w-1/4">{request.start_time} - {request.end_time}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">
                    {language === 'km' ? 'ចំនួនម៉ោងសរុប (Total Hours):' : 'Total Hours:'}
                  </td>
                  <td className="border border-slate-300 p-2 font-bold font-mono">
                    {request.hours} {language === 'km' ? 'ម៉ោង (hrs)' : 'hrs'}
                  </td>
                  <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">
                    {language === 'km' ? 'អត្រាថែមម៉ោង (Rate Multiplier):' : 'Rate Multiplier:'}
                  </td>
                  <td className="border border-slate-300 p-2 font-bold text-indigo-700">
                    {Math.round(rateConfig.multiplier * 100)}% ({language === 'km' ? rateConfig.label_km : rateConfig.label_en})
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">
                    {language === 'km' ? 'គម្រោង / កិច្ចការ (Project):' : 'Project / Task:'}
                  </td>
                  <td className="border border-slate-300 p-2" colSpan={3}>
                    {request.project_name || 'General Operations / Support'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">
                    {language === 'km' ? 'មូលហេតុចាំបាច់ (Justification):' : 'Justification:'}
                  </td>
                  <td className="border border-slate-300 p-2 italic" colSpan={3}>
                    &ldquo;{request.reason}&rdquo;
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Remuneration Breakdown */}
          <div className="mb-6">
            <div className="bg-slate-100 p-2 text-xs font-bold uppercase text-slate-800 border border-slate-300">
              {language === 'km' ? '៣. ការគណនាប្រាក់ឧបត្ថម្ភថែមម៉ោង (Remuneration Breakdown)' : '3. REMUNERATION BREAKDOWN'}
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 bg-slate-50 font-semibold w-1/4">
                    {language === 'km' ? 'ប្រាក់ឈ្នួលគោល/ម៉ោង (Base Rate):' : 'Base Rate / Hour:'}
                  </td>
                  <td className="border border-slate-300 p-2 font-mono w-1/4">
                    ${request.hourly_rate.toFixed(4)} / {language === 'km' ? 'ម៉ោង' : 'hr'}
                  </td>
                  <td className="border border-slate-300 p-2 bg-slate-50 font-semibold w-1/4">
                    {language === 'km' ? 'អត្រាថែមម៉ោង/ម៉ោង (OT Rate):' : 'Overtime Rate / Hour:'}
                  </td>
                  <td className="border border-slate-300 p-2 font-mono w-1/4">
                    ${(request.hourly_rate * request.multiplier).toFixed(4)} / {language === 'km' ? 'ម៉ោង' : 'hr'}
                  </td>
                </tr>
                <tr className="bg-indigo-50/50">
                  <td className="border border-slate-300 p-2 font-bold text-slate-900" colSpan={2}>
                    {language === 'km' ? 'ប្រាក់ឈ្នួលថែមម៉ោងសរុប (Total Gross Overtime Compensation):' : 'Total Gross Overtime Compensation:'}
                  </td>
                  <td className="border border-slate-300 p-2 font-bold text-indigo-800 font-mono text-sm" colSpan={2}>
                    {language === 'km'
                      ? `+${request.estimated_pay.toFixed(2)} USD (≈ ៛${khrAmount.toLocaleString()} KHR)`
                      : `+$${request.estimated_pay.toFixed(2)} USD (≈ KHR ${khrAmount.toLocaleString()})`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legal Compliance Clause */}
          <div className="p-3 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-700 space-y-1 mb-10">
            <p className="font-bold">
              {language === 'km' ? 'អនុលោមភាពច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា៖' : 'Cambodia Labor Law & Prakas Compliance:'}
            </p>
            <p>
              {language === 'km'
                ? 'ការងារថែមម៉ោងនេះត្រូវបានអនុវត្តស្របតាមមាត្រា ១៣៩ នៃច្បាប់ការងារ និងប្រកាសលេខ ៨០/៩៩ របស់ក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ។ ការងារថែមម៉ោងត្រូវបានធ្វើឡើងដោយផ្អែកលើការព្រមព្រៀងស្ម័គ្រចិត្តរវាងនិយោជក និងកម្មករនិយោជិត និងមានការអនុញ្ញាតត្រឹមត្រូវ។'
                : 'This overtime work is performed in compliance with Article 139 of the Cambodia Labor Law and Prakas No. 80/99 of the Ministry of Labour and Vocational Training. Overtime was voluntarily agreed upon between employer and employee with statutory authorization.'}
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              {language === 'km' && <p className="font-bold text-slate-800 mb-1">ហត្ថលេខាសាមីខ្លួន</p>}
              <p className="text-[11px] text-slate-600 font-bold uppercase">{language === 'km' ? 'Employee Signature' : 'Employee Signature'}</p>
              <div className="h-16 flex items-end justify-center">
                <div className="w-36 border-b border-dashed border-slate-400" />
              </div>
              <p className="text-slate-700 mt-1 font-semibold">{request.employee_name}</p>
            </div>

            <div>
              {language === 'km' && <p className="font-bold text-slate-800 mb-1">ពិនិត្យដោយប្រធានផ្នែក</p>}
              <p className="text-[11px] text-slate-600 font-bold uppercase">{language === 'km' ? 'Line Manager Approval' : 'Line Manager Approval'}</p>
              <div className="h-16 flex items-end justify-center">
                <div className="w-36 border-b border-dashed border-slate-400" />
              </div>
              <p className="text-slate-700 mt-1 font-semibold">{request.line_manager_comments || 'Approved'}</p>
            </div>

            <div>
              {language === 'km' && <p className="font-bold text-slate-800 mb-1">អនុម័តដោយនាយកប្រតិបត្តិ / HR</p>}
              <p className="text-[11px] text-slate-600 font-bold uppercase">{language === 'km' ? 'Executive / HR Director' : 'Executive / HR Director'}</p>
              <div className="h-16 flex items-end justify-center">
                <div className="w-36 border-b border-dashed border-slate-400" />
              </div>
              <p className="text-slate-700 mt-1 font-semibold">
                {request.status === 'Approved' ? (language === 'km' ? '✓ បានអនុម័តផ្លូវការ' : '✓ Duly Approved') : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
