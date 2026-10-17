'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  Calculator,
  Award,
  CheckCircle2,
  Check,
  ShieldCheck,
  Zap,
  Scissors,
  User,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface SewingMatrixCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: {
    id: string;
    name?: string;
    khmer_name?: string;
    role?: string;
    group_name?: string;
    currentMatrix?: number;
    base_salary?: number;
  } | null;
  onSuccess?: (amount?: number) => void;
}

// 12 Standard Factory Tiers in Hestra
export const STANDARD_SEWING_MATRIX_TIERS = [
  { amount: 3, grade: 'Grade E', label: 'Novice Stitcher', labelKm: 'កម្រិតដំបូង', description: 'Single basic machine, simple straight join' },
  { amount: 5, grade: 'Grade D', label: 'Basic Operator', labelKm: 'កម្រិតមូលដ្ឋាន', description: 'SNLS straight seams & simple hems' },
  { amount: 7, grade: 'Grade D+', label: 'Standard Operator', labelKm: 'កម្រិតស្តង់ដារ', description: 'SNLS + Overlock, clean edge joins' },
  { amount: 8, grade: 'Grade C-', label: 'Capable Operator', labelKm: 'កម្រិតសមត្ថភាព', description: 'Cuffs, piping & multi-step joining' },
  { amount: 10, grade: 'Grade C', label: 'Proficient Operator', labelKm: 'កម្រិតជំនាញ', description: 'Elastic attachment, collar & binding' },
  { amount: 12, grade: 'Grade C+', label: 'Skilled Operator', labelKm: 'កម្រិតជំនាញច្បាស់', description: 'Twin-needle, curved seams, fourchettes' },
  { amount: 15, grade: 'Grade B-', label: 'Advanced Operator', labelKm: 'កម្រិតជាន់ខ្ពស់', description: 'Palm insertion, curved stitching' },
  { amount: 20, grade: 'Grade B', label: 'Senior Operator', labelKm: 'កម្រិតជើងចាស់', description: 'Multi-machine versatility, glove assembly' },
  { amount: 25, grade: 'Grade B+', label: 'Specialist Operator', labelKm: 'កម្រិតឯកទេស', description: 'High-difficulty glove parts & lining' },
  { amount: 30, grade: 'Grade A-', label: 'Expert Craftsman', labelKm: 'កម្រិតអ្នកជំនាញ', description: 'Waterproof membrane, zero-defect' },
  { amount: 35, grade: 'Grade A', label: 'Master Operator', labelKm: 'កម្រិតមេការ/កំពូល', description: 'All 5+ machine classes, line balance' },
  { amount: 50, grade: 'Grade A+', label: 'Technical Master / Trainer', labelKm: 'កម្រិតគ្រូបណ្តុះបណ្តាល', description: 'Sample glove maker, line trainer' },
];

export default function SewingMatrixCalculatorModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: SewingMatrixCalculatorModalProps) {
  const { showToast, language } = useApp();

  const [activeTab, setActiveTab] = useState<'calculator' | 'tiers' | 'manual'>('calculator');
  const [saving, setSaving] = useState(false);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');

  // Synchronize with active payroll checkbox
  const [syncPayroll, setSyncPayroll] = useState(true);

  // Calculator Parameters
  const [selectedMachines, setSelectedMachines] = useState<string[]>([
    'snls', // default single needle
  ]);
  const [operationLevel, setOperationLevel] = useState<number>(3); // 1-5
  const [qualityGrade, setQualityGrade] = useState<'A+' | 'A' | 'B' | 'C'>('A');
  const [efficiencyRating, setEfficiencyRating] = useState<'high' | 'normal' | 'learning'>('normal');
  const [isLineFloater, setIsLineFloater] = useState<boolean>(false);

  // Manual input state
  const [manualAmount, setManualAmount] = useState<number>(10);

  // Load employees if opened without specific employee
  useEffect(() => {
    if (isOpen) {
      fetch('/api/bonus/sewing/matrix')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.workers)) {
            setAllEmployees(data.workers);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (employee && employee.id) {
      setSelectedEmpId(employee.id);
      setManualAmount(employee.currentMatrix !== undefined ? employee.currentMatrix : 10);
    } else if (allEmployees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(allEmployees[0].id);
      setManualAmount(allEmployees[0].sewing_skill_matrix !== undefined ? Number(allEmployees[0].sewing_skill_matrix) : 10);
    }
  }, [employee, allEmployees]);

  const activeEmployee = useMemo(() => {
    if (employee && employee.id === selectedEmpId) return employee;
    return allEmployees.find((e) => e.id === selectedEmpId) || employee || null;
  }, [selectedEmpId, employee, allEmployees]);

  // Compute calculated matrix allowance from criteria
  const calculatedResult = useMemo(() => {
    let score = 0;

    // 1. Machine Proficiencies
    const machineWeights: Record<string, number> = {
      snls: 3, // Single Needle
      dnls: 4, // Twin Needle
      overlock: 4, // Overlock 3/4/5 thread
      postbed: 6, // Post-bed / Cylinder specialized for gloves
      flatlock: 5, // Flatlock
      autotack: 4, // Programmable bartack
    };

    selectedMachines.forEach((m) => {
      score += machineWeights[m] || 0;
    });

    // 2. Operation Complexity (Weight: 4 per level)
    score += operationLevel * 4;

    // 3. Quality & Defect Rating
    if (qualityGrade === 'A+') score += 5;
    else if (qualityGrade === 'A') score += 2;
    else if (qualityGrade === 'C') score -= 3;

    // 4. Efficiency Rating
    if (efficiencyRating === 'high') score += 4;
    else if (efficiencyRating === 'learning') score -= 2;

    // 5. Line Floater / Versatility
    if (isLineFloater) score += 6;

    // Map score to standard Hestra allowance tier
    let matchedTier = STANDARD_SEWING_MATRIX_TIERS[0];
    if (score >= 42) matchedTier = STANDARD_SEWING_MATRIX_TIERS[11]; // $50
    else if (score >= 37) matchedTier = STANDARD_SEWING_MATRIX_TIERS[10]; // $35
    else if (score >= 33) matchedTier = STANDARD_SEWING_MATRIX_TIERS[9]; // $30
    else if (score >= 29) matchedTier = STANDARD_SEWING_MATRIX_TIERS[8]; // $25
    else if (score >= 25) matchedTier = STANDARD_SEWING_MATRIX_TIERS[7]; // $20
    else if (score >= 21) matchedTier = STANDARD_SEWING_MATRIX_TIERS[6]; // $15
    else if (score >= 18) matchedTier = STANDARD_SEWING_MATRIX_TIERS[5]; // $12
    else if (score >= 15) matchedTier = STANDARD_SEWING_MATRIX_TIERS[4]; // $10
    else if (score >= 12) matchedTier = STANDARD_SEWING_MATRIX_TIERS[3]; // $8
    else if (score >= 10) matchedTier = STANDARD_SEWING_MATRIX_TIERS[2]; // $7
    else if (score >= 7) matchedTier = STANDARD_SEWING_MATRIX_TIERS[1]; // $5
    else matchedTier = STANDARD_SEWING_MATRIX_TIERS[0]; // $3

    return {
      score,
      matchedTier,
      recommendedAmount: matchedTier.amount,
    };
  }, [selectedMachines, operationLevel, qualityGrade, efficiencyRating, isLineFloater]);

  // Active target allowance to be saved
  const finalAllowance = useMemo(() => {
    if (activeTab === 'calculator') return calculatedResult.recommendedAmount;
    return manualAmount;
  }, [activeTab, calculatedResult, manualAmount]);

  if (!isOpen) return null;

  const toggleMachine = (code: string) => {
    if (selectedMachines.includes(code)) {
      if (selectedMachines.length > 1) {
        setSelectedMachines(selectedMachines.filter((m) => m !== code));
      }
    } else {
      setSelectedMachines([...selectedMachines, code]);
    }
  };

  const handleSaveAllowance = async () => {
    if (!selectedEmpId) {
      showToast('Please select an employee', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/bonus/sewing/matrix', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedEmpId,
          sewing_skill_matrix: finalAllowance,
          updateActivePayroll: syncPayroll,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update allowance');

      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.65 },
        });
      } catch (e) {}

      showToast(
        language === 'km'
          ? `បានកំណត់ប្រាក់ឧបត្ថម្ភម៉ាទ្រីស $${finalAllowance.toFixed(2)} សម្រាប់ ${selectedEmpId} ជោគជ័យ! ✓`
          : `Sewing Matrix Allowance updated to $${finalAllowance.toFixed(2)} for ${selectedEmpId}! ✓`,
        'success'
      );

      if (onSuccess) onSuccess(finalAllowance);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error updating allowance', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[92vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Calculator size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>{language === 'km' ? 'គណនាប្រាក់ឧបត្ថម្ភកម្រិតម៉ាទ្រីសដេរ' : 'Sewing Matrix Grade Allowance'}</span>
                <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  $3 – $50
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {language === 'km'
                  ? 'វាយតម្លៃជំនាញម៉ាស៊ីន ភាពលំបាក និងកំណត់ប្រាក់ឧបត្ថម្ភ (Sewing Skill Matrix)'
                  : 'Evaluate machine skills, operation complexity, and set monthly matrix allowance'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
          {/* Employee Selector & Active Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center font-bold">
                <User size={16} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  Target Worker
                </span>
                {employee ? (
                  <div className="font-bold text-slate-900">
                    {employee.id} - {employee.name || (employee as any).first_name || ''} {employee.khmer_name ? `(${employee.khmer_name})` : ''} [{employee.group_name || employee.role || 'Line'}]
                  </div>
                ) : allEmployees.length > 0 ? (
                  <select
                    value={selectedEmpId}
                    onChange={(e) => {
                      setSelectedEmpId(e.target.value);
                      const found = allEmployees.find((emp) => emp.id === e.target.value);
                      if (found) {
                        setManualAmount(found.sewing_skill_matrix !== undefined ? Number(found.sewing_skill_matrix) : 10);
                      }
                    }}
                    className="font-bold text-slate-900 bg-transparent border-0 p-0 text-xs focus:ring-0 cursor-pointer"
                  >
                    {allEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.id} - {emp.first_name} {emp.last_name} {emp.khmer_name ? `(${emp.khmer_name})` : ''} [{emp.group_name || 'Line'}]
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-bold text-slate-900">
                    {activeEmployee?.name || activeEmployee?.id || 'Worker'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  Current Allowance
                </span>
                <span className="font-mono font-bold text-slate-600 text-xs">
                  ${Number(activeEmployee?.currentMatrix ?? (activeEmployee as any)?.sewing_skill_matrix ?? 0).toFixed(2)}/mo
                </span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
              <div className="text-right bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase tracking-wider">
                  New Allowance
                </span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  +${finalAllowance.toFixed(2)}/mo
                </span>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap size={14} />
              <span>{language === 'km' ? 'ម៉ាស៊ីនគណនាជំនាញ (Calculator)' : 'Skill Matrix Calculator'}</span>
            </button>

            <button
              onClick={() => setActiveTab('tiers')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'tiers'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award size={14} />
              <span>{language === 'km' ? 'កម្រិតស្តង់ដាររោងចក្រ (Factory Tiers)' : '12 Factory Tiers'}</span>
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scissors size={14} />
              <span>{language === 'km' ? 'បញ្ចូលដោយផ្ទាល់ (Direct Input)' : 'Direct Input ($)'}</span>
            </button>
          </div>

          {/* TAB 1: INTERACTIVE CALCULATOR */}
          {activeTab === 'calculator' && (
            <div className="space-y-4">
              {/* Factor 1: Machine Capabilities */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>{language === 'km' ? '1. Sewing Machine Proficiencies (ម៉ាស៊ីនដែលចេះដេរ)' : '1. Sewing Machine Proficiencies'}</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    {selectedMachines.length} machine(s) selected
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'snls', name: 'Single Needle (SNLS)', desc: 'Standard lockstitch', pts: '+3' },
                    { id: 'dnls', name: 'Twin Needle (DNLS)', desc: 'Parallel seam stitching', pts: '+4' },
                    { id: 'overlock', name: 'Overlock / Serger', desc: '3/4/5 thread hemming', pts: '+4' },
                    { id: 'postbed', name: 'Post-Bed / Cylinder', desc: 'Curved 3D glove seams', pts: '+6' },
                    { id: 'flatlock', name: 'Flatlock / Coverstitch', desc: 'Comfort flat join', pts: '+5' },
                    { id: 'autotack', name: 'Auto-Tack / Pattern', desc: 'Programmable tacker', pts: '+4' },
                  ].map((m) => {
                    const isChecked = selectedMachines.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleMachine(m.id)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-xs ${isChecked ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {m.name}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${isChecked ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
                            {m.pts}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{m.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Factor 2: Operation Complexity Level */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    {language === 'km' ? '2. Operation Difficulty Level (កម្រិតភាពស្មុគស្មាញ)' : '2. Operation Difficulty Level'}
                  </label>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                    Level {operationLevel}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                  {[
                    { lvl: 1, title: 'L.1 Basic', sub: 'Straight hems ($3-$5)' },
                    { lvl: 2, title: 'L.2 Binding', sub: 'Cuffs & piping ($7-$10)' },
                    { lvl: 3, title: 'L.3 Assembly', sub: 'Palms & curves ($12-$20)' },
                    { lvl: 4, title: 'L.4 Complex', sub: 'Membrane & lining ($25-$35)' },
                    { lvl: 5, title: 'L.5 Master', sub: 'Sample & Trainer ($50)' },
                  ].map((o) => (
                    <button
                      key={o.lvl}
                      type="button"
                      onClick={() => setOperationLevel(o.lvl)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        operationLevel === o.lvl
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="font-bold block text-xs">{o.title}</span>
                      <span className={`text-[9px] block mt-0.5 ${operationLevel === o.lvl ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {o.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Factor 3 & 4: Quality & Efficiency Ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Quality / Defect Rate
                  </label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                  >
                    <option value="A+">Grade A+ (&lt; 0.5% defect) - Exceptional</option>
                    <option value="A">Grade A (0.5% – 1.0%) - Standard Good</option>
                    <option value="B">Grade B (1.0% – 2.0%) - Acceptable</option>
                    <option value="C">Grade C (&gt; 2.0%) - Developing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Efficiency / Speed
                  </label>
                  <select
                    value={efficiencyRating}
                    onChange={(e) => setEfficiencyRating(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                  >
                    <option value="high">100%+ Quota Speed (High Output)</option>
                    <option value="normal">90% – 100% Standard Quota</option>
                    <option value="learning">80% – 90% Developing Pace</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Multi-Line Versatility
                  </label>
                  <label className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 bg-white cursor-pointer mt-0.5">
                    <input
                      type="checkbox"
                      checked={isLineFloater}
                      onChange={(e) => setIsLineFloater(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-[11px] text-slate-700">Line Balance Floater</span>
                  </label>
                </div>
              </div>

              {/* Calculated Result Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between shadow-lg">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 block tracking-wider flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-400" />
                    Calculated Matrix Grade & Allowance
                  </span>
                  <div className="text-lg font-black text-white flex items-center gap-2">
                    <span>{calculatedResult.matchedTier.grade}</span>
                    <span className="text-xs font-semibold text-slate-300">
                      ({calculatedResult.matchedTier.label})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {calculatedResult.matchedTier.description}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    Recommended Allowance
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                    +${calculatedResult.recommendedAmount.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400">/ calendar month</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 12 STANDARD FACTORY TIERS */}
          {activeTab === 'tiers' && (
            <div className="space-y-2.5">
              <p className="text-slate-500 text-[11px]">
                Click on any of the 12 standard Hestra factory skill matrix tiers to select:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STANDARD_SEWING_MATRIX_TIERS.map((t) => {
                  const isSelected = manualAmount === t.amount;
                  return (
                    <div
                      key={t.amount}
                      onClick={() => setManualAmount(t.amount)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{t.grade}</span>
                        <span className="font-mono font-black text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          +${t.amount}.00
                        </span>
                      </div>
                      <span className="font-bold text-slate-700 text-[11px] block mt-1">
                        {t.label}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                        {t.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT MANUAL INPUT */}
          {activeTab === 'manual' && (
            <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">
                  Custom Sewing Matrix Allowance Amount ($ USD)
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    step="1"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Standard factory matrix tiers are typically $3, $5, $7, $8, $10, $12, $15, $20, $25, $30, $35, $50.
                </p>
              </div>

              {/* Quick Pick Pills */}
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Quick Amount Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 3, 5, 7, 8, 10, 12, 15, 20, 25, 30, 35, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setManualAmount(amt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        manualAmount === amt
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payroll Sync Toggle */}
          <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={syncPayroll}
                onChange={(e) => setSyncPayroll(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-indigo-900">
                {language === 'km'
                  ? 'ធ្វើបច្ចុប្បន្នភាពក្នុងបញ្ជីប្រាក់ខែសកម្មស្វ័យប្រវត្តិ (Sync Active Payroll)'
                  : 'Sync and update current active monthly payroll register'}
              </span>
            </label>
            <span className="text-[10px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
              Instant Recalculation
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {language === 'km' ? 'បោះបង់' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSaveAllowance}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>{language === 'km' ? 'កំពុងរក្សាទុក...' : 'Applying Allowance...'}</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>
                  {language === 'km'
                    ? `រក្សាទុក $${finalAllowance.toFixed(2)}/ខែ (Apply Allowance)`
                    : `Apply $${finalAllowance.toFixed(2)} / Month Allowance`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
