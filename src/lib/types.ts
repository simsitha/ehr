export type Role = 'Admin' | 'Manager' | 'Employee' | 'Medical Officer' | 'HR Officer' | 'IT Support';

export type Theme = 'nordic' | 'midnight' | 'indigo';

export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern';

export type EmployeeStatus = 'Active' | 'On Leave' | 'Remote' | 'Terminated';

export interface Department {
  id: string;
  name: string;
  description: string;
  manager_id?: string;
  manager_name?: string;
  manager_avatar?: string;
  color: string;
  employee_count?: number;
  group_count?: number;
  groups?: EmployeeGroup[];
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  khmer_name?: string;
  email: string;
  phone: string;
  role: string;
  department_id: string;
  department_name?: string;
  employment_type: string;
  status: string;
  salary: number;
  join_date: string;
  manager_id?: string;
  manager_name?: string;
  avatar: string;
  location: string;
  bio?: string;
  labor_type?: string;
  group_name?: string;
  group_id?: string;
  resignation_date?: string;
  working_period?: number;
  // 1. Personal Information
  gender?: string;
  dob?: string;
  nationality?: string;
  marital_status?: string;
  national_id?: string;
  // 2. Contact Information
  current_address?: string;
  province_city?: string;
  district?: string;
  commune_sangkat?: string;
  village?: string;
  // 3. Employee & Contract Information
  employee_type?: string;
  contract_type?: string;
  contract_start?: string;
  contract_end?: string;
  work_location?: string;
  // 4. Salary & Payroll
  salary_currency?: string;
  salary_frequency?: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  transport_allowance?: number;
  meal_allowance?: number;
  housing_allowance?: number;
  housing_transport_allowance?: number;
  attendance_allowance?: number;
  skill_allowance?: number;
  seniority_bonus?: number;
  position_allowance?: number;
  sewing_skill_matrix?: number;
  monthly_eval_bonus?: number;
  severance_pay?: number;
  pay_grade?: string;
  last_salary_review?: string;
  // 5. NSSF Information
  nssf_member?: string;
  nssf_number?: string;
  nssf_reg_date?: string;
  // 6. Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergency_contact_address?: string;
  // 7. Documents
  doc_national_id?: string;
  doc_passport?: string;
  doc_contract?: string;
  doc_others?: string;
  created_at: string;
}

/**
 * Determines if an employee is a Member of the Board of Directors.
 * Members of the Board of Directors are exempt from salary, daily attendance tracking,
 * and operational tasks (overtime, appraisals, duty rosters, piece rates).
 */
export function isBoardMember(emp: {
  role?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  employee_type?: string | null;
  employment_type?: string | null;
} | null | undefined): boolean {
  if (!emp) return false;
  const role = (emp.role || '').toLowerCase();
  const dept = (emp.department_name || '').toLowerCase();
  const deptId = (emp.department_id || '').toLowerCase();
  const empType = (emp.employee_type || '').toLowerCase();
  const employmentType = (emp.employment_type || '').toLowerCase();

  // Check department
  if (dept.includes('board of directors') || dept.includes('ក្រុមប្រឹក្សាភិបាល')) return true;
  if (deptId === 'dept-1791471602578' || deptId.includes('bod')) return true;

  // Check role
  if (
    role === 'chairman' ||
    role.includes('board member') ||
    role.includes('board of director') ||
    role.includes('director of board') ||
    role.includes('ក្រុមប្រឹក្សាភិបាល')
  ) return true;

  // Check employee / employment types
  if (empType.includes('board') || empType.includes('ក្រុមប្រឹក្សាភិបាល')) return true;
  if (employmentType.includes('board') || employmentType.includes('ក្រុមប្រឹក្សាភិបាល')) return true;

  return false;
}

export type AttendanceStatus = 'Present' | 'Late' | 'Half Day' | 'Remote' | 'Absent';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  khmer_name?: string;
  employee_role?: string;
  employee_avatar?: string;
  department_name?: string;
  date: string;
  clock_in?: string;
  clock_out?: string;
  status: AttendanceStatus;
  code?: string;
  work_hours: number;
  hours?: number;
  overtime_hours?: number;
  source?: string;
  notes?: string;
}

export type ShiftType = 'morning' | 'office' | 'evening' | 'night' | 'weekend_duty' | 'on_call' | 'off' | 'custom' | (string & {});

export interface ShiftSession {
  name_en: string;
  name_km: string;
  start_time: string;
  end_time: string;
  hours: number;
}

export interface ShiftDefinition {
  id: string;
  name_en: string;
  name_km: string;
  short_code: string;
  start_time: string;
  end_time: string;
  default_hours: number;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  is_active?: boolean;
  break_time?: string;
  sub_shifts?: ShiftSession[];
}

export interface ShiftSettings {
  shifts: Record<string, ShiftDefinition>;
  isCustomized?: boolean;
  updated_at?: string;
}

export interface DutyRosterEntry {
  id: string;
  employee_id: string;
  employee_name?: string;
  khmer_name?: string;
  employee_role?: string;
  employee_avatar?: string;
  department_id?: string;
  department_name?: string;
  date: string;
  shift_type: ShiftType;
  start_time?: string;
  end_time?: string;
  hours: number;
  location?: string;
  notes?: string;
  created_at: string;
}

export type OvertimeRateType = 'normal_day_150' | 'night_200' | 'weekend_200' | 'holiday_200';
export type OvertimeStatus =
  | 'Draft'
  | 'Submitted'
  | 'Pending'
  | 'Pending Manager'
  | 'Pending Admin'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled';

export interface OvertimeRateConfig {
  id: OvertimeRateType;
  multiplier: number;
  label_km: string;
  label_en: string;
  short_label: string;
  short_label_en?: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  law_reference: string;
  description_km: string;
  description_en: string;
}

export interface OvertimeSettings {
  standardMonthlyHours: number;
  rates: Record<OvertimeRateType, OvertimeRateConfig>;
  isCustomized?: boolean;
  updated_at?: string;
}

export interface OvertimeRequest {
  id: string;
  employee_id: string;
  employee_name?: string;
  khmer_name?: string;
  gender?: string;
  group_name?: string;
  employee_role?: string;
  employee_avatar?: string;
  department_id?: string;
  department_name?: string;
  date: string;
  start_time: string;
  end_time: string;
  hours: number;
  ot_rate_type: OvertimeRateType;
  multiplier: number;
  hourly_rate: number;
  estimated_pay: number;
  overtime_food?: number;
  reason: string;
  project_name?: string;
  status: OvertimeStatus;
  requested_by?: string;
  approved_by?: string;
  line_manager_id?: string;
  line_manager_reviewed_at?: string;
  line_manager_comments?: string;
  admin_reviewer_id?: string;
  admin_reviewed_at?: string;
  admin_comments?: string;
  created_at: string;
}

export type LeaveType = 'Annual' | 'Sick' | 'Maternity/Paternity' | 'Casual' | 'Unpaid';
export type LeaveStatus = 'Pending' | 'Pending Manager' | 'Pending Admin' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name?: string;
  khmer_name?: string;
  employee_role?: string;
  employee_avatar?: string;
  department_name?: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: LeaveStatus;
  // Step 1: Line Manager
  line_manager_id?: string;
  line_manager_name?: string;
  line_manager_reviewed_at?: string;
  line_manager_comments?: string;
  // Step 2: Administrator
  admin_reviewer_id?: string;
  admin_reviewer_name?: string;
  admin_reviewed_at?: string;
  admin_comments?: string;
  // General Reviewer fields
  reviewer_id?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  reviewer_comments?: string;
  created_at: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  annual_total: number;
  annual_used: number;
  sick_total: number;
  sick_used: number;
  casual_total: number;
  casual_used: number;
}

export type PayrollStatus = 'Paid' | 'Pending' | 'Draft' | 'Processing' | 'Approved' | 'Locked' | 'Failed';

export interface PayrollRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  khmer_name?: string;
  employee_role?: string;
  employee_avatar?: string;
  department_name?: string;
  join_date?: string;
  pay_period: string;
  payment_date: string;
  base_salary: number;
  allowances: number;
  bonuses: number;
  tax_deduction: number;
  insurance_deduction: number;
  other_deductions: number;
  net_salary: number;
  status: PayrollStatus;
  payment_method: string;
  created_at: string;
  // Factory and Tax on Salary detailed breakdown
  working_days?: number;
  absent_days?: number;
  unpaid_days?: number;
  basic_working_salary?: number;
  seniority_bonus?: number;
  position_allowance?: number;
  sewing_skill_matrix?: number;
  skill_allowance?: number;
  transport_housing?: number;
  attendance_allowance?: number;
  food_allowance?: number;
  overtime_pay?: number;
  overtime_food?: number;
  achievement_bonus?: number;
  monthly_eval_bonus?: number;
  annual_leave?: number;
  salary_adjustment?: number;
  gross_salary?: number;
  non_taxable_amount?: number;
  taxable_salary_usd?: number;
  taxable_salary_khr?: number;
  pension_usd?: number;
  pension_khr?: number;
  dependents_count?: number;
  taxable_base_khr?: number;
  tax_rate?: string;
  tax_khr?: number;
  tax_usd?: number;
  after_tax_salary?: number;
  first_paid?: number;
  target_bonus?: number;
  severance_pay?: number;
  seniority_payback?: number;
  paid_final_salary?: number;
  second_paid?: number;
  total_paid?: number;
  labor_type?: string;
  bank_name?: string;
  bank_account_number?: string;
  national_id?: string;
  contract_type?: string;
  period_id?: string;
  locked_at?: string;
  calculation_trace?: string;
  exchange_rate_khr?: number;
  nssf_rate_khr?: number;
}

export type PositionPaymentType = 'Allowance' | 'Bonus' | 'Other';
export type PositionPaymentStatus = 'Active' | 'Inactive';
export type PositionPaymentCurrency = 'USD' | 'KHR';

export interface PositionPayment {
  id: string;
  employee_id: string;
  employee_name?: string;
  khmer_name?: string;
  department_id?: string;
  department_name?: string;
  current_position?: string;
  payment_name: string;
  payment_type: PositionPaymentType;
  amount: number;
  currency: PositionPaymentCurrency;
  payroll_period: string;
  effective_date: string;
  end_date?: string | null;
  taxable?: boolean;
  include_in_nssf?: boolean;
  remarks?: string | null;
  status: PositionPaymentStatus;
  created_by?: string;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PositionPaymentSummary {
  totalPayments: number;
  totalUsdAmount: number;
  totalKhrAmount: number;
  distinctEmployeesCount: number;
}

export type JobStatus = 'Active' | 'Draft' | 'Closed';

export interface JobPosting {
  id: string;
  title: string;
  department_id: string;
  department_name?: string;
  location: string;
  type: EmploymentType;
  experience_level: string;
  salary_range: string;
  description: string;
  requirements: string;
  status: JobStatus;
  posted_date: string;
  applicants_count: number;
}

export type CandidateStage = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';

export interface JobCandidate {
  id: string;
  job_id: string;
  job_title?: string;
  name: string;
  email: string;
  phone: string;
  stage: CandidateStage;
  rating: number;
  applied_date: string;
  notes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name?: string;
  category: 'General' | 'Policy' | 'Celebration' | 'Urgent';
  pinned: number;
  created_at: string;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  employee_name?: string;
  khmer_name?: string;
  employee_role?: string;
  employee_avatar?: string;
  reviewer_id: string;
  reviewer_name?: string;
  review_period: string;
  rating: number;
  goals_achievement: number;
  strengths: string;
  areas_for_growth: string;
  status: 'Completed' | 'In Progress' | 'Scheduled';
  created_at: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  newHiresThisMonth: number;
  attendanceToday: {
    present: number;
    remote: number;
    absent: number;
    late: number;
    percentage: number;
  };
  pendingLeavesCount: number;
  openPositionsCount: number;
  monthlyPayrollTotal: number;
  departmentDistribution: {
    name: string;
    count: number;
    color: string;
  }[];
  recentActivities: {
    id: string;
    type: 'leave' | 'hire' | 'payroll' | 'attendance' | 'announcement';
    title: string;
    subtitle: string;
    timestamp: string;
    statusBadge?: string;
  }[];
  upcomingBirthdaysAndAnniversaries: {
    id: string;
    name: string;
    avatar: string;
    type: 'birthday' | 'anniversary';
    date: string;
    subtitle: string;
  }[];
}

export type UserRole = 'Admin' | 'Manager' | 'Employee' | 'Medical Officer' | 'HR Officer' | 'IT Support';
export type UserStatus = 'Active' | 'Suspended' | 'Pending';

export interface UserAccount {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  employee_id?: string;
  department_name?: string;
  avatar?: string;
  two_factor_enabled: number;
  permissions: string;
  password?: string;
  last_login?: string;
  created_at: string;
}

export interface SalaryAdjustment {
  id: string;
  employee_id: string;
  employee_name?: string;
  khmer_name?: string;
  employee_role?: string;
  employee_avatar?: string;
  department_name?: string;
  previous_salary: number;
  new_salary: number;
  increase_amount: number;
  increase_percentage: number;
  effective_date: string;
  adjustment_type: string;
  currency: string;
  reason?: string;
  approved_by?: string;
  created_at: string;
}

export interface SalaryOverview {
  totalMonthlySalary: number;
  totalAllowances: number;
  averageSalary: number;
  minSalary: number;
  maxSalary: number;
  compliantCount: number;
  nonCompliantCount: number;
  totalEmployees: number;
  minWageStandard: number;
}

export type ApprovalRequestStatus =
  | 'Pending Line Manager'
  | 'Pending HR'
  | 'Pending Top Management'
  | 'Approved'
  | 'Rejected';

export interface ApprovalRequest {
  id: string;
  request_number: string;
  employee_id: string;
  employee_name?: string;
  khmer_name?: string;
  employee_role?: string;
  employee_avatar?: string;
  department_name?: string;
  department_id?: string;
  request_type: string;
  item_name: string;
  item_category: 'standard_material' | 'high_value_asset' | 'salary_increase';
  requires_top_management: number; // 0 or 1
  current_salary: number;
  proposed_salary: number;
  estimated_cost: number;
  quantity: number;
  urgency: 'Low' | 'Medium' | 'High' | 'Urgent';
  reason: string;
  specifications?: string;
  status: ApprovalRequestStatus;
  line_manager_id?: string;
  line_manager_name?: string;
  line_manager_status: 'Pending' | 'Approved' | 'Rejected';
  line_manager_reviewed_at?: string;
  line_manager_comments?: string;
  hr_reviewer_id?: string;
  hr_reviewer_name?: string;
  hr_status: 'Pending' | 'Approved' | 'Rejected';
  hr_reviewed_at?: string;
  hr_comments?: string;
  top_management_id?: string;
  top_management_name?: string;
  top_management_status: 'Pending' | 'Approved' | 'Rejected' | 'N/A';
  top_management_reviewed_at?: string;
  top_management_comments?: string;
  rejected_by_stage?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanySettings {
  name: string;
  address: string;
  currency: string;
  workHours: string;
  timezone: string;
  fiscalYearStart: string;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'HESTRA-GLOVES HRM (Cambodia) Ltd',
  address: 'Royal Group Phnom Penh Special Economic Zone (RGPPSEZ) in Khan Kambol, Phnom Penh, Cambodia',
  currency: 'USD ($) & KHR',
  workHours: '8.0',
  timezone: 'Asia/Phnom_Penh (GMT+7)',
  fiscalYearStart: 'January 1st',
};

export type NotificationType = 'request' | 'leave' | 'overtime' | 'announcement' | 'recruitment' | 'payroll' | 'system';

export interface NotificationItem {
  id: string;
  user_id?: string | null;
  role: 'All' | 'Admin' | 'Manager' | 'Employee';
  title: string;
  title_km?: string;
  message?: string;
  message_km?: string;
  type: NotificationType;
  link: string;
  is_read: boolean;
  created_at: string;
}

// ==========================================
// 1. Employee Groups & Labor Classifications
// ==========================================
export interface EmployeeGroup {
  id: string;
  name: string;
  department_id?: string;
  department_name?: string;
  description?: string;
  employee_count?: number;
  created_at?: string;
}

// ==========================================
// 2. Attendance Status Codes (1, 0.5, AB, AL, ML, HL, SL, OL, OFF)
// ==========================================
export interface AttendanceStatusCode {
  code: string;
  name_en: string;
  name_km: string;
  description?: string;
  is_paid: boolean | number;
  attendance_value: number; // 1.0, 0.5, 0.0
  payroll_effect: 'full' | 'half' | 'unpaid' | 'leave' | 'holiday' | 'none';
  badge_color: string;
  badge_bg: string;
  is_active?: boolean | number;
}

// ==========================================
// 3. Monthly Attendance Calendar (10. Attendant 202610.xlsx)
// ==========================================
export interface MonthlyEmployeeAttendance {
  employee_id: string;
  employee_name: string;
  khmer_name: string;
  department_id: string;
  department_name: string;
  group_name: string;
  labor_type: string;
  position?: string;
  days: Record<string, string>; // { "01": "1", "02": "1", ..., "31": "OFF" }
  scheduled_days?: number;
  scheduled_working_days: number;
  actual_working_days: number;
  present_days: number;
  half_days: number;
  absent_days: number;
  annual_leave_days: number;
  sick_leave_days: number;
  maternity_leave_days: number;
  holiday_days: number;
  other_leave_days: number;
  total_paid_days: number;
  unpaid_days: number;
  total_work_hours: number;
  is_non_absent_bonus_eligible: boolean;
}

export interface MonthlyAttendanceReport {
  year: number;
  month: number;
  period_label: string;
  total_calendar_days: number;
  scheduled_working_days: number;
  codes: AttendanceStatusCode[];
  groups: string[];
  departments: Array<{ id: string; name: string }>;
  employees: MonthlyEmployeeAttendance[];
  summary: {
    total_staff: number;
    avg_present_days: number;
    total_absent_days: number;
    total_al_days: number;
    total_sl_days: number;
    total_ot_hours: number;
  };
}

// ==========================================
// 4. Weekly Absent + AL Report (10.Absent + AL reporting weekly.xlsx)
// ==========================================
export interface WeeklyDayData {
  date: string;
  day_label: string; // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  code: string;
  hours: number;
}

export interface WeeklyEmployeeRow {
  employee_id: string;
  employee_name: string;
  khmer_name: string;
  department_name: string;
  group_name: string;
  labor_type: string;
  days: Record<string, WeeklyDayData>;
  total_present: number;
  total_absent: number;
  total_al: number;
  total_half: number;
  total_other: number;
  total_hours: number;
}

export interface WeeklyGroupSummaryRow {
  group_name: string;
  headcount: number;
  total_present: number;
  total_absent: number;
  total_al: number;
  total_half: number;
  total_other: number;
  attendance_rate: number;
}

export interface WeeklyAbsentAlReportData {
  week_start: string;
  week_end: string;
  week_number: number;
  employees: WeeklyEmployeeRow[];
  group_summaries: WeeklyGroupSummaryRow[];
  total_headcount: number;
  grand_total_present: number;
  grand_total_absent: number;
  grand_total_al: number;
  grand_total_half: number;
  overall_attendance_rate: number;
}

// ==========================================
// 5. Sewing Production Bonus (8.2 2nd Payroll Test.xlsx - B1, B2, B3)
// ==========================================
export interface SewingWeeklyProduction {
  id: string;
  week_number: number;
  week_start: string;
  week_end: string;
  month: string;
  employee_id: string;
  employee_name?: string;
  khmer_name?: string;
  group_name: string;
  mon_qty: number;
  tue_qty: number;
  wed_qty: number;
  thu_qty: number;
  fri_qty: number;
  sat_qty: number;
  total_qty: number;
  target_qty: number;
  achievement_pct: number;
  bonus_amount: number;
  status: 'Draft' | 'Submitted' | 'Approved';
  notes?: string;
  created_at: string;
}

export interface SewingBonusRule {
  id: string;
  group_name: string;
  weekly_target_qty: number;
  base_bonus: number;
  tier_1_min_pct: number;
  tier_1_bonus: number;
  tier_2_min_pct: number;
  tier_2_bonus: number;
  tier_3_min_pct: number;
  tier_3_bonus: number;
  is_active: boolean;
}

export interface DailyTargetRule {
  id?: string;
  rule_name?: string;
  daily_target_qty: number;
  base_min_pct: number;
  base_bonus: number;
  tier_1_min_pct: number;
  tier_1_bonus: number;
  tier_2_min_pct: number;
  tier_2_bonus: number;
  tier_3_min_pct: number;
  tier_3_bonus: number;
  is_active?: boolean;
}

// ==========================================
// 6. Payroll Periods & Workflow
// ==========================================
export type PayrollPeriodStatus = 'Draft' | 'Processing' | 'Pending Review' | 'Approved' | 'Locked' | 'Paid';

export interface PayrollPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  working_days: number;
  working_hours_per_day: number;
  status: PayrollPeriodStatus;
  locked_by?: string;
  locked_at?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
}

// ==========================================
// 7. Configurable Payroll & Attendance Rules
// ==========================================
export interface SeniorityTier {
  years: number;
  amount: number;
}

export interface PayrollRulesConfig {
  working_days_per_month: number;
  daily_working_hours: number;
  ot_multiplier_normal: number;
  ot_multiplier_night: number;
  ot_multiplier_weekend: number;
  ot_multiplier_holiday: number;
  non_absent_bonus_amount: number;
  non_absent_bonus_allowed_leaves: string[];
  seniority_tiers: SeniorityTier[];
  nssf_employee_rate: number;
  nssf_employer_rate: number;
  nssf_cap_khr: number;
  nssf_rate_khr: number;
  gdt_rate_khr: number;
  tax_relief_per_dependent_khr: number;
  meal_allowance_per_day?: number;
  housing_transport_monthly?: number;
  housing_transport_threshold_days?: number;
  housing_transport_half_amount?: number;
}

// ==========================================
// 8. Excel Reconciliation
// ==========================================
export interface PayrollReconciliationItem {
  employee_id: string;
  employee_name: string;
  field: string;
  field_label_km: string;
  field_label_en: string;
  excel_value: number | string;
  system_value: number | string;
  difference: number;
  status: 'MATCH' | 'DIFFERENCE';
  reason?: string;
}

// ==========================================
// 9. Audit Log
// ==========================================
export interface AuditLogEntry {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  module: string;
  record_id?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  ip_address?: string | null;
  created_at: string;
}

// ==========================================
// 10. Database Backup & Restore
// ==========================================
export interface DatabaseBackupItem {
  fileName: string;
  path: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  type: 'manual' | 'safety' | 'seed';
}

export interface DatabaseStats {
  fileSize: number;
  fileSizeFormatted: string;
  walSize: number;
  walSizeFormatted: string;
  totalTables: number;
  totalRecords: number;
  journalMode: string;
  tables: { name: string; rowCount: number }[];
  backups: DatabaseBackupItem[];
  engine?: string;
  databasePath?: string;
}

export interface RestoreResult {
  success: boolean;
  tableCounts: Record<string, number>;
  totalTables: number;
  totalRecords: number;
  sourceFile: string;
}

// ==========================================
// 11. IT Asset & Inventory Management
// ==========================================
export type ITAssetCategory =
  | 'Laptops & Computers'
  | 'Biometric & Clocks'
  | 'Barcode Scanners'
  | 'Printers & Imaging'
  | 'Monitors & Displays'
  | 'Network & Servers'
  | 'Mobile & Tablets'
  | 'Accessories & Parts'
  | 'Software & Cloud Licenses';

export type ITAssetStatus =
  | 'In Use'
  | 'Available'
  | 'Maintenance'
  | 'Damaged'
  | 'Retired';

export type ITAssetCondition = 'New' | 'Good' | 'Fair' | 'Poor' | 'Broken';

export interface ITAsset {
  id: string;
  asset_tag: string;
  name: string;
  category: ITAssetCategory;
  brand: string;
  model: string;
  serial_number?: string;
  status: ITAssetStatus;
  condition: ITAssetCondition;
  assigned_to?: string | null;
  assigned_employee_name?: string | null;
  assigned_khmer_name?: string | null;
  assigned_role?: string | null;
  assigned_department?: string | null;
  assigned_avatar?: string | null;
  assigned_date?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  department?: string | null;
  location?: string | null;
  ip_address?: string | null;
  mac_address?: string | null;
  purchase_date?: string | null;
  purchase_cost?: number;
  currency?: string | null;
  warranty_expiry?: string | null;
  warranty_end?: string | null;
  vendor?: string | null;
  specifications?: string | null;
  specs?: string | null;
  notes?: string | null;
  windows_operation?: string | null;
  os_version?: string | null;
  m365_account?: string | null;
  local_account?: string | null;
  username?: string | null;
  device_username?: string | null;
  password?: string | null;
  device_password?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ITAssetLog {
  id: string;
  asset_id: string;
  asset_tag?: string;
  asset_name?: string;
  action: 'Created' | 'Assigned' | 'Returned' | 'Maintenance' | 'Status Changed' | 'Relocated';
  performed_by: string;
  employee_id?: string | null;
  employee_name?: string | null;
  notes?: string | null;
  created_at: string;
}

// ==========================================
// 12. Microsoft 365 Cloud Accounts & Licenses
// ==========================================
export type M365LicensePlan =
  | 'Microsoft 365 Business Basic'
  | 'Microsoft 365 Business Standard'
  | 'Microsoft 365 Business Premium'
  | 'Microsoft 365 Apps for enterprise'
  | 'Office 365 E3'
  | 'Office 365 E5'
  | 'Exchange Online Plan 1';

export type M365AccountStatus = 'Active' | 'Available' | 'Suspended';
export type M365MFAStatus = 'Enforced' | 'Enabled' | 'Disabled';

export interface M365Account {
  id: string;
  email: string;
  display_name: string;
  license_plan: M365LicensePlan;
  status: M365AccountStatus;
  assigned_to?: string | null;
  assigned_employee_name?: string | null;
  assigned_khmer_name?: string | null;
  assigned_role?: string | null;
  assigned_department?: string | null;
  assigned_avatar?: string | null;
  assigned_date?: string | null;
  mfa_status: M365MFAStatus;
  mailbox_usage_gb: number;
  mailbox_quota_gb: number;
  onedrive_usage_gb: number;
  onedrive_quota_gb: number;
  monthly_cost: number;
  renewal_date?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface M365Overview {
  totalLicenses: number;
  assignedCount: number;
  availableCount: number;
  suspendedCount: number;
  mfaEnforcedCount: number;
  mfaEnforcedRate: number;
  totalMonthlySpend: number;
  totalAnnualSpend: number;
  planBreakdown: Record<string, { total: number; assigned: number; available: number }>;
}

// ==========================================
// ZKTeco Attendance Integration Types
// ==========================================

export type ZKTecoConnectionType = 'TCP/IP' | 'SDK' | 'Push/ADMS' | 'API';
export type ZKTecoDeviceStatus = 'Online' | 'Offline' | 'Syncing' | 'Error' | 'Disabled';

export interface ZKTecoDevice {
  id: string;
  name: string;
  model: string;
  platform?: string;
  serial_number: string;
  firmware_version?: string;
  mac_address?: string;
  fingerprint_alg?: string;
  face_alg?: string;
  ip_address: string;
  port: number;
  connection_type: ZKTecoConnectionType;
  auth_password?: string | null;
  location: string;
  site_name?: string;
  department_id?: string | null;
  department_name?: string | null;
  is_enabled: boolean | number;
  status: ZKTecoDeviceStatus;
  last_connected_at?: string | null;
  last_connection?: string | null;
  last_successful_connection?: string | null;
  last_sync_at?: string | null;
  last_sync?: string | null;
  last_successful_sync?: string | null;
  last_error?: string | null;
  error_code?: string | null;
  last_sync_status?: string | null;
  user_count: number;
  log_count: number;
  fingerprint_count: number;
  face_count: number;
  device_time?: string | null;
  server_time?: string | null;
  time_difference_sec?: number;
  sync_interval_minutes?: number;
  connection_timeout?: number;
  retry_attempts?: number;
  auto_sync?: boolean | number;
  created_at: string;
  updated_at?: string;
}

export interface ZKTecoDeviceUser {
  id: string;
  device_id: string;
  device_name?: string;
  device_user_id: string;
  employee_id?: string | null;
  employee_name?: string | null;
  khmer_name?: string | null;
  employee_role?: string | null;
  employee_avatar?: string | null;
  user_photo?: string | null;
  department_name?: string | null;
  device_user_name?: string | null;
  card_number?: string | null;
  privilege: 'User' | 'Enroller' | 'Admin' | 'SuperAdmin';
  has_fingerprint: boolean | number;
  has_face: boolean | number;
  has_card: boolean | number;
  has_password: boolean | number;
  biometric_status: 'Enrolled' | 'Not Enrolled' | 'Partial';
  sync_status: 'Mapped' | 'Needs Mapping' | 'Unmapped' | 'Ignored';
  match_confidence: number;
  match_method: string;
  last_sync_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ZKTecoRawTransaction {
  id: string;
  device_id: string;
  device_name?: string;
  device_user_id: string;
  employee_id?: string | null;
  employee_name?: string | null;
  khmer_name?: string | null;
  department_name?: string | null;
  employee_avatar?: string | null;
  transaction_uid?: string | null;
  transaction_id?: string;
  attendance_timestamp: string;
  punch_date: string;
  punch_time: string;
  attendance_type: 'Check-In' | 'Check-Out' | 'Break-Out' | 'Break-In' | 'OT-In' | 'OT-Out';
  verification_method: 'Fingerprint' | 'Face' | 'Card' | 'Password' | 'PIN' | 'Other';
  device_serial?: string | null;
  device_ip?: string | null;
  location?: string | null;
  raw_payload?: string | null;
  raw_data?: string | null;
  is_processed: boolean | number;
  processed_at?: string | null;
  attendance_record_id?: string | null;
  source: string;
  created_at: string;
}

export interface ZKTecoSyncLog {
  id: string;
  timestamp: string;
  device_id?: string | null;
  device_name?: string | null;
  operation: string;
  result: 'SUCCESS' | 'FAILED' | 'WARNING';
  records_retrieved: number;
  records_created: number;
  duplicates: number;
  errors: number;
  duration_sec: number;
  ip_address?: string | null;
  user_name?: string | null;
  details?: string | null;
  error_code?: string | null;
  created_at: string;
}

export interface ZKTecoDeviceEvent {
  id: string;
  device_id: string;
  device_name?: string;
  device_user_id?: string;
  employee_id?: string | null;
  employee_name?: string | null;
  khmer_name?: string | null;
  department_name?: string | null;
  employee_avatar?: string | null;
  event_time: string;
  event_type: 'CHECK-IN' | 'CHECK-OUT' | 'BREAK-OUT' | 'BREAK-IN' | 'ACCESS_GRANTED' | 'DEVICE_ONLINE' | 'DEVICE_OFFLINE' | 'SYNC_ERROR';
  verification_method?: string;
  location?: string;
  created_at: string;
}

export interface ZKTecoSettings {
  enabled: boolean;
  default_port: number;
  sync_interval_minutes: number;
  connection_timeout_seconds: number;
  retry_attempts: number;
  retry_delay_seconds: number;
  offline_threshold_minutes: number;
  historical_sync_limit_days: number;
  auto_user_sync: boolean;
  auto_attendance_sync: boolean;
  grace_period_minutes: number;
  late_threshold_minutes: number;
  early_leave_threshold_minutes: number;
  break_duration_minutes: number;
  updated_at?: string;
}

export const DEFAULT_ZKTECO_SETTINGS: ZKTecoSettings = {
  enabled: true,
  default_port: 4370,
  sync_interval_minutes: 5,
  connection_timeout_seconds: 10,
  retry_attempts: 3,
  retry_delay_seconds: 5,
  offline_threshold_minutes: 30,
  historical_sync_limit_days: 30,
  auto_user_sync: true,
  auto_attendance_sync: true,
  grace_period_minutes: 10,
  late_threshold_minutes: 15,
  early_leave_threshold_minutes: 15,
  break_duration_minutes: 60,
};

export interface ZKTecoDashboardStats {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  total_mapped_users: number;
  unmapped_users: number;
  total_raw_logs: number;
  today_punches: number;
  last_sync?: string | null;
  sync_errors_today: number;
}

export interface AttendanceCorrection {
  id: string;
  attendance_id: string;
  employee_id: string;
  employee_name?: string;
  khmer_name?: string;
  date: string;
  field_changed: string;
  old_value?: string | null;
  new_value: string;
  reason: string;
  changed_by: string;
  changed_at: string;
}

// ==========================================
// Medicine & Medical Management System Types
// ==========================================

export type MedicineCategory =
  | 'Analgesics & Antipyretics'
  | 'Antibiotics'
  | 'Antihistamines & Allergy'
  | 'Gastrointestinal'
  | 'First Aid & Topical'
  | 'Vitamins & Supplements'
  | 'Respiratory & Cold'
  | 'Cardiovascular & Hypertensive'
  | 'Dermatology & Skin'
  | 'Eye & Ear Drops'
  | 'Other';

export type MedicineStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Expired' | 'Expiring Soon';

export interface Medicine {
  id: string;
  name: string;
  generic_name?: string;
  category: MedicineCategory | string;
  unit: string;
  dosage: string;
  supplier: string;
  batch_number: string;
  expiry_date: string;
  quantity_in_stock: number;
  min_stock_level: number;
  purchase_price: number;
  status: MedicineStatus;
  storage_location?: string;
  description?: string;
  side_effects?: string;
  created_at: string;
  updated_at: string;
}

export type StockTransactionType =
  | 'Stock-in'
  | 'Stock-out'
  | 'Adjustment'
  | 'Expired Disposal'
  | 'Issue Deduction'
  | 'Return';

export interface MedicineStockTransaction {
  id: string;
  medicine_id: string;
  medicine_name?: string;
  generic_name?: string;
  transaction_type: StockTransactionType;
  quantity: number;
  batch_number?: string;
  previous_stock: number;
  new_stock: number;
  unit_cost: number;
  total_cost: number;
  supplier_or_dest?: string;
  reference_id?: string;
  performed_by: string;
  notes?: string;
  created_at: string;
}

export interface EmployeeMedicalRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  khmer_name?: string;
  employee_role?: string;
  department_name?: string;
  employee_avatar?: string;
  visit_date: string;
  visit_time?: string;
  symptoms: string;
  diagnosis: string;
  temperature?: number;
  blood_pressure?: string;
  heart_rate?: number;
  respiratory_rate?: number;
  weight_kg?: number;
  medicine_prescribed?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  doctor_name: string;
  medical_notes?: string;
  recommended_action?: string;
  medical_leave_granted?: number;
  medical_leave_days?: number;
  follow_up_date?: string;
  status?: string; // 'Completed' | 'Follow-up Required' | 'Hospital Referred' | 'Under Observation'
  created_at: string;
  updated_at: string;
}

export interface MedicineIssuance {
  id: string;
  medical_record_id?: string;
  employee_id: string;
  employee_name?: string;
  khmer_name?: string;
  department_name?: string;
  employee_avatar?: string;
  medicine_id: string;
  medicine_name?: string;
  generic_name?: string;
  dosage?: string;
  unit?: string;
  quantity_issued: number;
  prescription_instruction?: string;
  frequency?: string;
  duration?: string;
  issued_by: string;
  issued_at: string;
  cost_at_issue: number;
  total_cost: number;
  batch_number?: string;
  notes?: string;
}

export interface MedicalDashboardStats {
  totalMedicines: number;
  totalStockUnits: number;
  totalInventoryValue: number;
  lowStockCount: number;
  expiringCount: number;
  expiredCount: number;
  totalVisitsMonth: number;
  totalIssuedMonth: number;
  medicalCostMonth: number;
  totalSickLeaveDaysMonth: number;
}

// ==========================================
// ATTENDANCE BONUS CALCULATION MODULE TYPES
// ==========================================

export interface AttendanceBonusRule {
  id: string;
  rule_name: string;
  minimum_attendance_days: number;
  maximum_attendance_days: number | null;
  bonus_amount: number;
  currency: 'USD' | 'KHR';
  effective_from?: string | null;
  effective_to?: string | null;
  is_active: number; // 1 or 0
  priority?: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceBonusPolicyConfig {
  count_annual_leave: boolean;
  count_sick_leave: boolean;
  count_public_holidays: boolean;
  count_maternity_leave: boolean;
  count_special_leave: boolean;
  half_day_attendance_weight: number;
  late_threshold_penalty: number;
  currency: 'USD' | 'KHR';
  gdt_exchange_rate: number;
}

export type AttendanceBonusStatus = 'Pending' | 'Reviewed' | 'Approved' | 'Rejected' | 'Posted';

export interface DailyAttendanceDetail {
  date: string;
  day_of_month: number;
  day_of_week: string;
  is_rest_day: boolean;
  is_scheduled: boolean;
  code: string;
  status: string;
  clock_in?: string | null;
  clock_out?: string | null;
  work_hours: number;
  overtime_hours: number;
  is_half_day: boolean;
  qualifies_for_bonus: boolean;
  attendance_contribution: number;
  late_minutes?: number;
  early_departure_minutes?: number;
  notes?: string | null;
}

export interface AttendanceBonusCalculation {
  id: string;
  employee_id: string;
  employee_name?: string;
  khmer_name?: string;
  department_id?: string;
  department_name?: string;
  position?: string;
  group_name?: string;
  avatar?: string;
  join_date?: string;
  payroll_period_id: string;
  period_name: string;
  attendance_days: number;
  scheduled_days: number;
  present_days: number;
  half_days: number;
  approved_leave_days: number;
  unpaid_leave_days: number;
  absent_days: number;
  late_count: number;
  early_departure_count: number;
  applied_rule_id?: string | null;
  tier_name?: string | null;
  bonus_amount: number;
  bonus_amount_khr: number;
  currency: 'USD' | 'KHR';
  calculation_status: AttendanceBonusStatus;
  calculated_at: string;
  calculated_by?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  posted_to_payroll_at?: string | null;
  posted_by?: string | null;
  notes?: string | null;
  details_json?: string | null;
}

export interface AttendanceBonusSummary {
  payroll_period_id: string;
  period_name: string;
  period_status: string;
  total_employees: number;
  eligible_employees: number;
  ineligible_employees: number;
  total_bonus_usd: number;
  total_bonus_khr: number;
  pending_hr_review: number;
  reviewed_count: number;
  approved_count: number;
  posted_count: number;
  approved_bonus_amount_usd: number;
  approved_bonus_amount_khr: number;
  tier_distribution: Record<string, number>;
}

export interface AttendanceBonusAuditLog {
  id: string;
  calculation_id?: string | null;
  employee_id?: string | null;
  payroll_period_id: string;
  action: 'CALCULATE' | 'RECALCULATE' | 'SUBMIT_REVIEW' | 'APPROVE' | 'REJECT' | 'POST_TO_PAYROLL' | 'MANUAL_OVERRIDE' | 'RULE_CHANGE';
  performed_by: string;
  previous_attendance_days?: number | null;
  new_attendance_days?: number | null;
  previous_bonus_amount?: number | null;
  new_bonus_amount?: number | null;
  previous_status?: string | null;
  new_status?: string | null;
  reason?: string | null;
  metadata_json?: string | null;
  timestamp: string;
}



