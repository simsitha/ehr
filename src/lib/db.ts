import { getPostgresDb, PostgresDatabase } from './pg-adapter';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import SQLite from 'better-sqlite3';
import {
  INITIAL_DEPARTMENTS,
} from './seed-data';
import {
  CompanySettings,
  DEFAULT_COMPANY_SETTINGS,
  NotificationItem,
  NotificationType,
  OvertimeRateType,
  OvertimeSettings,
  ShiftDefinition,
  ShiftSettings,
  AttendanceStatusCode,
  EmployeeGroup,
  PayrollPeriod,
  PayrollRulesConfig,
  AuditLogEntry,
  DatabaseBackupItem,
  DatabaseStats,
  RestoreResult,
  ITAsset,
  ITAssetLog,
  ITAssetCategory,
  ITAssetStatus,
  ITAssetCondition,
  M365Account,
  M365Overview,
  M365LicensePlan,
  M365AccountStatus,
  M365MFAStatus,
  ZKTecoDevice,
  ZKTecoDeviceUser,
  ZKTecoRawTransaction,
  ZKTecoSyncLog,
  ZKTecoDashboardStats,
  AttendanceCorrection,
  Medicine,
  MedicineStockTransaction,
  StockTransactionType,
  EmployeeMedicalRecord,
  MedicineIssuance,
  MedicalDashboardStats,
} from './types';
import { DEFAULT_PAYROLL_RULES } from './payrollRules';
import { DEFAULT_OVERTIME_SETTINGS } from './overtime-calc';
import { DEFAULT_SHIFTS, DEFAULT_SHIFT_SETTINGS } from './roster-shifts';
import {
  seedInitialMedicalData,
  getMedicines as getMedicinesInternal,
  getMedicineById as getMedicineByIdInternal,
  saveMedicine as saveMedicineInternal,
  deleteMedicine as deleteMedicineInternal,
  recordStockTransaction as recordStockTransactionInternal,
  getMedicineStockTransactions as getMedicineStockTransactionsInternal,
  issueMedicine as issueMedicineInternal,
  getMedicineIssuances as getMedicineIssuancesInternal,
  getEmployeeMedicalRecords as getEmployeeMedicalRecordsInternal,
  getMedicalRecordById as getMedicalRecordByIdInternal,
  saveMedicalRecord as saveMedicalRecordInternal,
  deleteMedicalRecord as deleteMedicalRecordInternal,
  getMedicalDashboardStats as getMedicalDashboardStatsInternal,
  getMedicalReportsData as getMedicalReportsDataInternal,
  getMedicalAccess,
  computeMedicineStatus,
} from './medical-db';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'hr.db');

let dbInstance: PostgresDatabase | null = null;

export function getDb(): PostgresDatabase {
  if (!dbInstance) {
    dbInstance = getPostgresDb();
    initDatabase(dbInstance);
  }
  return dbInstance;
}

function initDatabase(db: PostgresDatabase) {
  // SQLite compatibility functions in PostgreSQL
  try {
    db.exec(`
      CREATE OR REPLACE FUNCTION instr(text, text) RETURNS integer AS $$ SELECT POSITION($2 IN $1); $$ LANGUAGE sql IMMUTABLE;
      CREATE OR REPLACE FUNCTION datetime(VARIADIC text[]) RETURNS text AS $$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'); $$ LANGUAGE sql STABLE;
      CREATE OR REPLACE FUNCTION datetime(text) RETURNS text AS $$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'); $$ LANGUAGE sql STABLE;
      CREATE OR REPLACE FUNCTION datetime() RETURNS text AS $$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'); $$ LANGUAGE sql STABLE;
      CREATE OR REPLACE FUNCTION date(VARIADIC text[]) RETURNS text AS $$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD'); $$ LANGUAGE sql STABLE;
      CREATE OR REPLACE FUNCTION date(text) RETURNS text AS $$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD'); $$ LANGUAGE sql STABLE;
      CREATE OR REPLACE FUNCTION date() RETURNS text AS $$ SELECT TO_CHAR(NOW(), 'YYYY-MM-DD'); $$ LANGUAGE sql STABLE;
    `);
  } catch {}

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      manager_id TEXT,
      color TEXT DEFAULT '#3b82f6'
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      role TEXT NOT NULL,
      department_id TEXT NOT NULL,
      employment_type TEXT NOT NULL,
      employee_type TEXT DEFAULT 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)',
      status TEXT NOT NULL,
      salary REAL NOT NULL,
      join_date TEXT NOT NULL,
      manager_id TEXT,
      avatar TEXT,
      location TEXT,
      bio TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      gender TEXT DEFAULT 'ប្រុស (Male)',
      dob TEXT,
      nationality TEXT DEFAULT 'Cambodian',
      marital_status TEXT DEFAULT 'នៅលីវ (Single)',
      national_id TEXT,
      current_address TEXT,
      province_city TEXT,
      district TEXT,
      commune_sangkat TEXT,
      village TEXT,
      contract_type TEXT DEFAULT 'UDC (មិនកំណត់ថិរវេលា)',
      contract_start TEXT,
      contract_end TEXT,
      work_location TEXT,
      salary_currency TEXT DEFAULT 'USD ($)',
      salary_frequency TEXT DEFAULT 'កន្លះខែ (Semi-monthly)',
      bank_name TEXT DEFAULT 'ABA Bank',
      bank_account_name TEXT,
      bank_account_number TEXT,
      nssf_member TEXT DEFAULT 'មាន (Yes)',
      nssf_number TEXT,
      nssf_reg_date TEXT,
      emergency_contact_relationship TEXT,
      emergency_contact_address TEXT,
      doc_national_id TEXT,
      doc_passport TEXT,
      doc_contract TEXT,
      doc_others TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      date TEXT NOT NULL,
      clock_in TEXT,
      clock_out TEXT,
      status TEXT NOT NULL,
      work_hours REAL DEFAULT 0,
      notes TEXT,
      UNIQUE(employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS duty_roster (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      date TEXT NOT NULL,
      shift_type TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      hours REAL DEFAULT 8.0,
      location TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS overtime_requests (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      hours REAL NOT NULL,
      ot_rate_type TEXT NOT NULL,
      multiplier REAL NOT NULL DEFAULT 1.5,
      hourly_rate REAL DEFAULT 0,
      estimated_pay REAL DEFAULT 0,
      reason TEXT NOT NULL,
      project_name TEXT,
      status TEXT NOT NULL DEFAULT 'Pending Manager',
      line_manager_id TEXT,
      line_manager_reviewed_at TEXT,
      line_manager_comments TEXT,
      admin_reviewer_id TEXT,
      admin_reviewed_at TEXT,
      admin_comments TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      leave_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      days_count REAL NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'Pending Manager',
      line_manager_id TEXT,
      line_manager_reviewed_at TEXT,
      line_manager_comments TEXT,
      admin_reviewer_id TEXT,
      admin_reviewed_at TEXT,
      admin_comments TEXT,
      reviewer_id TEXT,
      reviewed_at TEXT,
      reviewer_comments TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leave_balances (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL UNIQUE,
      annual_total REAL DEFAULT 20,
      annual_used REAL DEFAULT 0,
      sick_total REAL DEFAULT 10,
      sick_used REAL DEFAULT 0,
      casual_total REAL DEFAULT 5,
      casual_used REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS payrolls (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      pay_period TEXT NOT NULL,
      payment_date TEXT NOT NULL,
      base_salary REAL NOT NULL,
      allowances REAL DEFAULT 0,
      bonuses REAL DEFAULT 0,
      tax_deduction REAL DEFAULT 0,
      insurance_deduction REAL DEFAULT 0,
      other_deductions REAL DEFAULT 0,
      net_salary REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Paid',
      payment_method TEXT DEFAULT 'Direct Deposit',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS job_postings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      department_id TEXT NOT NULL,
      location TEXT NOT NULL,
      type TEXT NOT NULL,
      experience_level TEXT NOT NULL,
      salary_range TEXT NOT NULL,
      description TEXT,
      requirements TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      posted_date TEXT NOT NULL,
      applicants_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS job_candidates (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      stage TEXT NOT NULL DEFAULT 'Applied',
      rating INTEGER DEFAULT 3,
      applied_date TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      pinned INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS performance_reviews (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      review_period TEXT NOT NULL,
      rating REAL NOT NULL,
      goals_achievement REAL NOT NULL,
      strengths TEXT,
      areas_for_growth TEXT,
      status TEXT NOT NULL DEFAULT 'Completed',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      role TEXT NOT NULL DEFAULT 'Employee',
      status TEXT NOT NULL DEFAULT 'Active',
      employee_id TEXT,
      department_name TEXT,
      avatar TEXT,
      two_factor_enabled INTEGER DEFAULT 0,
      permissions TEXT,
      password TEXT DEFAULT '@9218njo0(TWp<3q"(3{',
      last_login TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS salary_adjustments (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      previous_salary REAL NOT NULL,
      new_salary REAL NOT NULL,
      increase_amount REAL NOT NULL,
      increase_percentage REAL NOT NULL,
      effective_date TEXT NOT NULL,
      adjustment_type TEXT NOT NULL,
      currency TEXT DEFAULT 'USD ($)',
      reason TEXT,
      approved_by TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS approval_requests (
      id TEXT PRIMARY KEY,
      request_number TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      request_type TEXT NOT NULL,
      item_name TEXT NOT NULL,
      item_category TEXT NOT NULL,
      requires_top_management INTEGER NOT NULL DEFAULT 0,
      current_salary REAL DEFAULT 0,
      proposed_salary REAL DEFAULT 0,
      estimated_cost REAL DEFAULT 0,
      quantity INTEGER DEFAULT 1,
      urgency TEXT DEFAULT 'Medium',
      reason TEXT NOT NULL,
      specifications TEXT,
      status TEXT NOT NULL DEFAULT 'Pending Line Manager',
      line_manager_id TEXT,
      line_manager_name TEXT,
      line_manager_status TEXT DEFAULT 'Pending',
      line_manager_reviewed_at TEXT,
      line_manager_comments TEXT,
      hr_reviewer_id TEXT,
      hr_reviewer_name TEXT,
      hr_status TEXT DEFAULT 'Pending',
      hr_reviewed_at TEXT,
      hr_comments TEXT,
      top_management_id TEXT,
      top_management_name TEXT,
      top_management_status TEXT DEFAULT 'Pending',
      top_management_reviewed_at TEXT,
      top_management_comments TEXT,
      rejected_by_stage TEXT,
      rejection_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      role TEXT DEFAULT 'All',
      title TEXT NOT NULL,
      title_km TEXT,
      message TEXT,
      message_km TEXT,
      type TEXT NOT NULL,
      link TEXT NOT NULL DEFAULT '/',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user_role ON notifications(user_id, role, is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

    CREATE TABLE IF NOT EXISTS employee_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      department_id TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
    );

    CREATE TABLE IF NOT EXISTS attendance_status_codes (
      code TEXT PRIMARY KEY,
      name_en TEXT NOT NULL,
      name_km TEXT NOT NULL,
      description TEXT,
      is_paid INTEGER NOT NULL DEFAULT 1,
      attendance_value REAL NOT NULL DEFAULT 1.0,
      payroll_effect TEXT NOT NULL DEFAULT 'full',
      badge_color TEXT DEFAULT '#059669',
      badge_bg TEXT DEFAULT '#ecfdf5',
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS sewing_production_weekly (
      id TEXT PRIMARY KEY,
      week_number INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      week_end TEXT NOT NULL,
      month TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      group_name TEXT NOT NULL DEFAULT 'Sew-L.1',
      mon_qty INTEGER NOT NULL DEFAULT 0,
      tue_qty INTEGER NOT NULL DEFAULT 0,
      wed_qty INTEGER NOT NULL DEFAULT 0,
      thu_qty INTEGER NOT NULL DEFAULT 0,
      fri_qty INTEGER NOT NULL DEFAULT 0,
      sat_qty INTEGER NOT NULL DEFAULT 0,
      total_qty INTEGER NOT NULL DEFAULT 0,
      target_qty INTEGER NOT NULL DEFAULT 1200,
      achievement_pct REAL NOT NULL DEFAULT 0,
      bonus_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Approved',
      notes TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(week_start, employee_id)
    );

    CREATE TABLE IF NOT EXISTS sewing_bonus_rules (
      id TEXT PRIMARY KEY,
      group_name TEXT,
      weekly_target_qty INTEGER NOT NULL DEFAULT 1200,
      base_bonus REAL NOT NULL DEFAULT 5.0,
      tier_1_min_pct REAL NOT NULL DEFAULT 100.0,
      tier_1_bonus REAL NOT NULL DEFAULT 10.0,
      tier_2_min_pct REAL NOT NULL DEFAULT 110.0,
      tier_2_bonus REAL NOT NULL DEFAULT 15.0,
      tier_3_min_pct REAL NOT NULL DEFAULT 120.0,
      tier_3_bonus REAL NOT NULL DEFAULT 20.0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS sewing_daily_target_rules (
      id TEXT PRIMARY KEY,
      rule_name TEXT NOT NULL DEFAULT 'Default Daily Target Matrix',
      daily_target_qty INTEGER NOT NULL DEFAULT 200,
      base_min_pct REAL NOT NULL DEFAULT 90.0,
      base_bonus REAL NOT NULL DEFAULT 0.50,
      tier_1_min_pct REAL NOT NULL DEFAULT 100.0,
      tier_1_bonus REAL NOT NULL DEFAULT 1.50,
      tier_2_min_pct REAL NOT NULL DEFAULT 110.0,
      tier_2_bonus REAL NOT NULL DEFAULT 2.50,
      tier_3_min_pct REAL NOT NULL DEFAULT 120.0,
      tier_3_bonus REAL NOT NULL DEFAULT 3.50,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payroll_periods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      working_days REAL NOT NULL DEFAULT 26,
      working_hours_per_day REAL NOT NULL DEFAULT 8,
      status TEXT NOT NULL DEFAULT 'Draft',
      locked_by TEXT,
      locked_at TEXT,
      approved_by TEXT,
      approved_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_id TEXT,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS it_assets (
      id TEXT PRIMARY KEY,
      asset_tag TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      serial_number TEXT,
      status TEXT NOT NULL DEFAULT 'Available',
      condition TEXT NOT NULL DEFAULT 'Good',
      assigned_to TEXT,
      assigned_date TEXT,
      department_id TEXT,
      location TEXT,
      ip_address TEXT,
      purchase_date TEXT,
      purchase_cost REAL DEFAULT 0,
      warranty_end TEXT,
      specs TEXT,
      notes TEXT,
      windows_operation TEXT,
      m365_account TEXT,
      local_account TEXT,
      device_username TEXT,
      device_password TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS it_asset_logs (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      action TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      employee_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS it_m365_accounts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      license_plan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      assigned_to TEXT,
      assigned_date TEXT,
      mfa_status TEXT NOT NULL DEFAULT 'Enforced',
      mailbox_usage_gb REAL DEFAULT 0,
      mailbox_quota_gb REAL DEFAULT 50,
      onedrive_usage_gb REAL DEFAULT 0,
      onedrive_quota_gb REAL DEFAULT 1024,
      monthly_cost REAL DEFAULT 12.50,
      renewal_date TEXT,
      admin_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, date);
    CREATE INDEX IF NOT EXISTS idx_sewing_emp_week ON sewing_production_weekly(employee_id, week_start);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_it_assets_tag ON it_assets(asset_tag);
    CREATE INDEX IF NOT EXISTS idx_it_assets_assigned ON it_assets(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_it_assets_status ON it_assets(status);
    CREATE INDEX IF NOT EXISTS idx_it_asset_logs_asset ON it_asset_logs(asset_id);
    CREATE INDEX IF NOT EXISTS idx_m365_email ON it_m365_accounts(email);
    CREATE INDEX IF NOT EXISTS idx_m365_assigned ON it_m365_accounts(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_m365_plan ON it_m365_accounts(license_plan);

    CREATE TABLE IF NOT EXISTS position_payments (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      payment_name TEXT NOT NULL,
      payment_type TEXT NOT NULL DEFAULT 'Allowance',
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      payroll_period TEXT NOT NULL,
      effective_date TEXT NOT NULL,
      end_date TEXT,
      taxable BOOLEAN DEFAULT TRUE,
      include_in_nssf BOOLEAN DEFAULT TRUE,
      remarks TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_by TEXT DEFAULT 'Administrator',
      updated_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_position_payments_emp_period ON position_payments(employee_id, payroll_period);
    CREATE INDEX IF NOT EXISTS idx_position_payments_period_status ON position_payments(payroll_period, status);
    CREATE INDEX IF NOT EXISTS idx_position_payments_created ON position_payments(created_at DESC);

    CREATE TABLE IF NOT EXISTS attendance_devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT 'SpeedFace-V5L',
      platform TEXT DEFAULT 'ZAM230',
      serial_number TEXT,
      firmware_version TEXT,
      mac_address TEXT,
      fingerprint_alg TEXT DEFAULT 'ZKFinger VX13.0',
      face_alg TEXT DEFAULT 'ZKFace VX3.6',
      ip_address TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 4370,
      connection_type TEXT DEFAULT 'TCP/IP',
      auth_password TEXT DEFAULT '0',
      location TEXT NOT NULL,
      site_name TEXT DEFAULT 'Head Office',
      department_id TEXT,
      is_enabled INTEGER DEFAULT 1,
      status TEXT DEFAULT 'Offline',
      last_connection TEXT,
      last_successful_connection TEXT,
      last_sync TEXT,
      last_successful_sync TEXT,
      last_error TEXT,
      error_code TEXT,
      last_sync_status TEXT,
      user_count INTEGER DEFAULT 0,
      log_count INTEGER DEFAULT 0,
      fingerprint_count INTEGER DEFAULT 0,
      face_count INTEGER DEFAULT 0,
      device_time TEXT,
      server_time TEXT,
      time_difference_sec INTEGER DEFAULT 0,
      sync_interval_minutes INTEGER DEFAULT 5,
      connection_timeout INTEGER DEFAULT 10,
      retry_attempts INTEGER DEFAULT 3,
      auto_sync INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_device_users (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      device_user_id TEXT NOT NULL,
      employee_id TEXT,
      device_user_name TEXT,
      card_number TEXT,
      privilege TEXT DEFAULT 'User',
      has_fingerprint INTEGER DEFAULT 0,
      has_face INTEGER DEFAULT 0,
      has_card INTEGER DEFAULT 0,
      has_password INTEGER DEFAULT 0,
      biometric_status TEXT DEFAULT 'Enrolled',
      sync_status TEXT DEFAULT 'Needs Mapping',
      match_confidence REAL DEFAULT 0,
      match_method TEXT DEFAULT 'Manual',
      user_photo TEXT,
      last_sync_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(device_id, device_user_id)
    );

    CREATE TABLE IF NOT EXISTS attendance_raw_transactions (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      device_user_id TEXT NOT NULL,
      employee_id TEXT,
      transaction_id TEXT NOT NULL,
      attendance_timestamp TEXT NOT NULL,
      punch_date TEXT NOT NULL,
      punch_time TEXT NOT NULL,
      attendance_type TEXT DEFAULT 'Check-In',
      verification_method TEXT DEFAULT 'Fingerprint',
      device_serial TEXT,
      device_ip TEXT,
      location TEXT,
      raw_payload TEXT,
      raw_data TEXT,
      is_processed INTEGER DEFAULT 0,
      processed_at TEXT,
      attendance_record_id TEXT,
      source TEXT DEFAULT 'ZKTeco Direct',
      created_at TEXT NOT NULL,
      UNIQUE(device_id, transaction_id)
    );

    CREATE TABLE IF NOT EXISTS attendance_sync_jobs (
      id TEXT PRIMARY KEY,
      job_type TEXT NOT NULL,
      device_id TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      started_at TEXT,
      completed_at TEXT,
      records_retrieved INTEGER DEFAULT 0,
      records_created INTEGER DEFAULT 0,
      duplicates INTEGER DEFAULT 0,
      errors INTEGER DEFAULT 0,
      retry_count INTEGER DEFAULT 0,
      error_message TEXT,
      error_code TEXT,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_sync_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      device_id TEXT,
      device_name TEXT,
      operation TEXT NOT NULL,
      result TEXT NOT NULL,
      records_retrieved INTEGER DEFAULT 0,
      records_created INTEGER DEFAULT 0,
      duplicates INTEGER DEFAULT 0,
      errors INTEGER DEFAULT 0,
      duration_sec REAL DEFAULT 0,
      ip_address TEXT,
      user_name TEXT,
      details TEXT,
      error_code TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_corrections (
      id TEXT PRIMARY KEY,
      attendance_id TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      date TEXT NOT NULL,
      field_changed TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT NOT NULL,
      reason TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      changed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_device_commands (
      id TEXT PRIMARY KEY,
      device_id TEXT,
      target_key TEXT NOT NULL,
      command TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at TEXT NOT NULL,
      delivered_at TEXT,
      executed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_zk_dev_cmds_status ON attendance_device_commands(status, target_key);

    CREATE INDEX IF NOT EXISTS idx_zk_devices_status ON attendance_devices(status);
    CREATE INDEX IF NOT EXISTS idx_zk_dev_users_dev ON attendance_device_users(device_id);
    CREATE INDEX IF NOT EXISTS idx_zk_dev_users_emp ON attendance_device_users(employee_id);
    CREATE INDEX IF NOT EXISTS idx_zk_raw_trans_date ON attendance_raw_transactions(punch_date, employee_id);
    CREATE INDEX IF NOT EXISTS idx_zk_raw_trans_proc ON attendance_raw_transactions(is_processed);
    CREATE INDEX IF NOT EXISTS idx_zk_sync_logs_time ON attendance_sync_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_zk_sync_jobs_status ON attendance_sync_jobs(status, job_type);

    -- Hestra Medical Management System Tables
    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      generic_name TEXT,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      dosage TEXT NOT NULL,
      supplier TEXT,
      batch_number TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      quantity_in_stock INTEGER DEFAULT 0,
      min_stock_level INTEGER DEFAULT 10,
      purchase_price REAL DEFAULT 0.0,
      status TEXT DEFAULT 'In Stock',
      storage_location TEXT,
      description TEXT,
      side_effects TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_med_status ON medicines(status);
    CREATE INDEX IF NOT EXISTS idx_med_category ON medicines(category);
    CREATE INDEX IF NOT EXISTS idx_med_expiry ON medicines(expiry_date);

    CREATE TABLE IF NOT EXISTS medicine_stock_transactions (
      id TEXT PRIMARY KEY,
      medicine_id TEXT NOT NULL REFERENCES medicines(id),
      transaction_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      batch_number TEXT,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      unit_cost REAL DEFAULT 0.0,
      total_cost REAL DEFAULT 0.0,
      supplier_or_dest TEXT,
      reference_id TEXT,
      performed_by TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_med_tx_med ON medicine_stock_transactions(medicine_id);
    CREATE INDEX IF NOT EXISTS idx_med_tx_type ON medicine_stock_transactions(transaction_type);
    CREATE INDEX IF NOT EXISTS idx_med_tx_date ON medicine_stock_transactions(created_at DESC);

    CREATE TABLE IF NOT EXISTS employee_medical_records (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES employees(id),
      visit_date TEXT NOT NULL,
      visit_time TEXT,
      symptoms TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      temperature REAL,
      blood_pressure TEXT,
      heart_rate INTEGER,
      respiratory_rate INTEGER,
      weight_kg REAL,
      medicine_prescribed TEXT,
      dosage TEXT,
      frequency TEXT,
      duration TEXT,
      doctor_name TEXT NOT NULL,
      medical_notes TEXT,
      recommended_action TEXT,
      medical_leave_granted INTEGER DEFAULT 0,
      medical_leave_days REAL DEFAULT 0,
      follow_up_date TEXT,
      status TEXT DEFAULT 'Completed',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_medrec_emp ON employee_medical_records(employee_id);
    CREATE INDEX IF NOT EXISTS idx_medrec_date ON employee_medical_records(visit_date DESC);

    CREATE TABLE IF NOT EXISTS medicine_issuances (
      id TEXT PRIMARY KEY,
      medical_record_id TEXT,
      employee_id TEXT NOT NULL REFERENCES employees(id),
      medicine_id TEXT NOT NULL REFERENCES medicines(id),
      quantity_issued INTEGER NOT NULL,
      prescription_instruction TEXT,
      dosage TEXT,
      frequency TEXT,
      duration TEXT,
      issued_by TEXT NOT NULL,
      issued_at TEXT NOT NULL,
      cost_at_issue REAL DEFAULT 0.0,
      total_cost REAL DEFAULT 0.0,
      batch_number TEXT,
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_iss_emp ON medicine_issuances(employee_id);
    CREATE INDEX IF NOT EXISTS idx_iss_med ON medicine_issuances(medicine_id);
    CREATE INDEX IF NOT EXISTS idx_iss_date ON medicine_issuances(issued_at DESC);
  `);

  try {
    const devUserCols = db.prepare("PRAGMA table_info(attendance_device_users)").all() as any[];
    if (!devUserCols.some((c) => c.name === 'user_photo')) {
      db.prepare("ALTER TABLE attendance_device_users ADD COLUMN user_photo TEXT").run();
    }
  } catch {}

  // Seed Default ZKTeco SpeedFace-V5L Devices
  try {
    const dev01 = db.prepare("SELECT id FROM attendance_devices WHERE id = 'zk-01'").get();
    if (!dev01) {
      db.prepare(`
        INSERT INTO attendance_devices (
          id, name, model, platform, serial_number, firmware_version,
          fingerprint_alg, face_alg, ip_address, port, connection_type,
          auth_password, location, site_name, department_id, is_enabled,
          status, user_count, log_count, fingerprint_count, face_count,
          sync_interval_minutes, connection_timeout, retry_attempts, auto_sync,
          created_at, updated_at
        ) VALUES (
          'zk-01', 'ZKTeco-01', 'SpeedFace-V5L', 'ZAM230', 'SF5L2026001', 'Ver 6.60 (ZAM230)',
          'ZKFinger VX13.0', 'ZKFace VX3.6', '192.168.88.201', 8081, 'Push/ADMS',
          '0', 'Main Entrance', 'Main Entrance', 'dept-prod', 1,
          'Offline', 0, 0, 0, 0,
          5, 10, 3, 1,
          TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'), TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
        )
      `).run();
    }

    const dev02 = db.prepare("SELECT id FROM attendance_devices WHERE id = 'zk-02'").get();
    if (!dev02) {
      db.prepare(`
        INSERT INTO attendance_devices (
          id, name, model, platform, serial_number, firmware_version,
          fingerprint_alg, face_alg, ip_address, port, connection_type,
          auth_password, location, site_name, department_id, is_enabled,
          status, user_count, log_count, fingerprint_count, face_count,
          sync_interval_minutes, connection_timeout, retry_attempts, auto_sync,
          created_at, updated_at
        ) VALUES (
          'zk-02', 'ZKTeco-02', 'SpeedFace-V5L', 'ZAM230', 'SF5L2026002', 'Ver 6.60 (ZAM230)',
          'ZKFinger VX13.0', 'ZKFace VX3.6', '192.168.88.202', 8081, 'Push/ADMS',
          '0', 'Secondary Entrance', 'Secondary Entrance', 'dept-prod', 1,
          'Offline', 0, 0, 0, 0,
          5, 10, 3, 1,
          TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'), TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
        )
      `).run();
    }

    // Ensure default devices use Push/ADMS on port 8081
    db.prepare(`
      UPDATE attendance_devices
      SET port = 8081, connection_type = 'Push/ADMS'
      WHERE id IN ('zk-01', 'zk-02') AND (connection_type != 'Push/ADMS' OR port != 8081)
    `).run();
  } catch (err) {
    console.error('Error seeding default ZKTeco devices:', err);
  }

  // Seed default Hestra Medicine & Medical Management data
  try {
    seedInitialMedicalData(db);
  } catch (err) {
    console.error('Error seeding initial medical data:', err);
  }

  // Ensure password and username columns exist if table was created previously
  try {
    const cols = db.prepare("PRAGMA table_info(users)").all() as any[];
    if (!cols.some((c) => c.name === 'password')) {
      db.prepare("ALTER TABLE users ADD COLUMN password TEXT DEFAULT '@9218njo0(TWp<3q\"(3{'").run();
    }
    if (!cols.some((c) => c.name === 'username')) {
      db.prepare("ALTER TABLE users ADD COLUMN username TEXT").run();
    }
    // Automatically set employee first name as username if missing
    db.prepare(`
      UPDATE users 
      SET username = LOWER(
        COALESCE(
          (SELECT first_name FROM employees WHERE employees.id = users.employee_id AND employees.first_name IS NOT NULL AND employees.first_name != ''),
          CASE 
            WHEN INSTR(email, '.') > 0 AND INSTR(email, '.') < INSTR(email, '@') 
              THEN SUBSTR(email, INSTR(email, '.') + 1, INSTR(email, '@') - INSTR(email, '.') - 1)
            WHEN INSTR(email, '@') > 0 
              THEN SUBSTR(email, 1, INSTR(email, '@') - 1)
            ELSE email
          END
        )
      )
      WHERE username IS NULL OR username = ''
    `).run();
  } catch {}

  // Ensure OS, M365 and credential columns exist in it_assets
  try {
    const assetCols = db.prepare("PRAGMA table_info(it_assets)").all() as any[];
    if (!assetCols.some((c) => c.name === 'windows_operation')) {
      db.prepare("ALTER TABLE it_assets ADD COLUMN windows_operation TEXT").run();
    }
    if (!assetCols.some((c) => c.name === 'm365_account')) {
      db.prepare("ALTER TABLE it_assets ADD COLUMN m365_account TEXT").run();
    }
    if (!assetCols.some((c) => c.name === 'local_account')) {
      db.prepare("ALTER TABLE it_assets ADD COLUMN local_account TEXT").run();
    }
    if (!assetCols.some((c) => c.name === 'device_username')) {
      db.prepare("ALTER TABLE it_assets ADD COLUMN device_username TEXT").run();
    }
    if (!assetCols.some((c) => c.name === 'device_password')) {
      db.prepare("ALTER TABLE it_assets ADD COLUMN device_password TEXT").run();
    }
  } catch (err) {
    console.error('Error migrating it_assets columns:', err);
  }

  // Migrate employees and users table if email is NOT NULL to make it optional
  try {
    const empCols = db.prepare("PRAGMA table_info(employees)").all() as any[];
    const emailCol = empCols.find((c) => c.name === 'email');
    if (emailCol && emailCol.notnull === 1) {
      db.prepare("PRAGMA foreign_keys = OFF").run();
      db.prepare(`
        CREATE TABLE employees_migrated (
          id TEXT PRIMARY KEY,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT UNIQUE,
          phone TEXT,
          role TEXT NOT NULL,
          department_id TEXT NOT NULL,
          employment_type TEXT NOT NULL,
          employee_type TEXT DEFAULT 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)',
          status TEXT NOT NULL,
          salary REAL NOT NULL,
          join_date TEXT NOT NULL,
          manager_id TEXT,
          avatar TEXT,
          location TEXT,
          bio TEXT,
          emergency_contact_name TEXT,
          emergency_contact_phone TEXT,
          gender TEXT DEFAULT 'ប្រុស (Male)',
          dob TEXT,
          nationality TEXT DEFAULT 'Cambodian',
          marital_status TEXT DEFAULT 'នៅលីវ (Single)',
          national_id TEXT,
          current_address TEXT,
          province_city TEXT DEFAULT 'រាជធានីភ្នំពេញ (Phnom Penh)',
          district TEXT,
          commune_sangkat TEXT,
          village TEXT,
          contract_type TEXT DEFAULT 'UDC (មិនកំណត់ថិរវេលា)',
          contract_start TEXT,
          contract_end TEXT,
          work_location TEXT DEFAULT 'Head Office',
          salary_currency TEXT DEFAULT 'USD ($)',
          salary_frequency TEXT DEFAULT 'កន្លះខែ (Semi-monthly)',
          bank_name TEXT DEFAULT 'ABA Bank',
          bank_account_name TEXT,
          bank_account_number TEXT,
          nssf_member TEXT DEFAULT 'មាន (Yes)',
          nssf_number TEXT,
          nssf_reg_date TEXT,
          emergency_contact_relationship TEXT,
          emergency_contact_address TEXT,
          doc_national_id TEXT,
          doc_passport TEXT,
          doc_contract TEXT,
          doc_others TEXT,
          created_at TEXT NOT NULL
        )
      `).run();
      db.prepare(`
        INSERT INTO employees_migrated SELECT 
          id, first_name, last_name, email, phone, role, department_id,
          employment_type, employee_type, status, salary, join_date, manager_id, avatar,
          location, bio, emergency_contact_name, emergency_contact_phone,
          gender, dob, nationality, marital_status, national_id,
          current_address, province_city, district, commune_sangkat, village,
          contract_type, contract_start, contract_end, work_location,
          salary_currency, salary_frequency, bank_name, bank_account_name, bank_account_number,
          nssf_member, nssf_number, nssf_reg_date,
          emergency_contact_relationship, emergency_contact_address,
          doc_national_id, doc_passport, doc_contract, doc_others,
          created_at
        FROM employees
      `).run();
      db.prepare("DROP TABLE employees").run();
      db.prepare("ALTER TABLE employees_migrated RENAME TO employees").run();
    }
  } catch {}

  try {
    const userCols = db.prepare("PRAGMA table_info(users)").all() as any[];
    const uEmailCol = userCols.find((c) => c.name === 'email');
    if (uEmailCol && uEmailCol.notnull === 1) {
      db.prepare("PRAGMA foreign_keys = OFF").run();
      db.prepare(`
        CREATE TABLE users_migrated (
          id TEXT PRIMARY KEY,
          username TEXT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          role TEXT NOT NULL DEFAULT 'Employee',
          status TEXT NOT NULL DEFAULT 'Active',
          employee_id TEXT,
          department_name TEXT,
          avatar TEXT,
          two_factor_enabled INTEGER DEFAULT 0,
          permissions TEXT,
          password TEXT DEFAULT '@9218njo0(TWp<3q"(3{',
          last_login TEXT,
          created_at TEXT NOT NULL
        )
      `).run();
      db.prepare(`
        INSERT INTO users_migrated SELECT 
          id, username, name, email, role, status, employee_id, department_name, avatar,
          two_factor_enabled, permissions, password, last_login, created_at
        FROM users
      `).run();
      db.prepare("DROP TABLE users").run();
      db.prepare("ALTER TABLE users_migrated RENAME TO users").run();
    }
  } catch {}

  // Migrate leave_requests to support two-stage approval workflow (Line Manager -> Administrator)
  try {
    db.prepare("ALTER TABLE leave_requests ADD COLUMN line_manager_id TEXT").run();
  } catch {}
  try {
    db.prepare("ALTER TABLE leave_requests ADD COLUMN line_manager_reviewed_at TEXT").run();
  } catch {}
  try {
    db.prepare("ALTER TABLE leave_requests ADD COLUMN line_manager_comments TEXT").run();
  } catch {}
  try {
    db.prepare("ALTER TABLE leave_requests ADD COLUMN admin_reviewer_id TEXT").run();
  } catch {}
  try {
    db.prepare("ALTER TABLE leave_requests ADD COLUMN admin_reviewed_at TEXT").run();
  } catch {}
  try {
    db.prepare("ALTER TABLE leave_requests ADD COLUMN admin_comments TEXT").run();
  } catch {}
  try {
    db.prepare("UPDATE leave_requests SET status = 'Pending Manager' WHERE status = 'Pending'").run();
  } catch {}

  // Migrate employees table to support comprehensive personal, contact, contract, payroll, nssf, emergency, and documents
  try {
    const empCols = db.prepare("PRAGMA table_info(employees)").all() as any[];
    const colNames = new Set(empCols.map((c) => c.name));
    const newEmpCols: [string, string][] = [
      ['gender', "TEXT DEFAULT 'ប្រុស (Male)'"],
      ['dob', 'TEXT'],
      ['nationality', "TEXT DEFAULT 'Cambodian'"],
      ['marital_status', "TEXT DEFAULT 'នៅលីវ (Single)'"],
      ['national_id', 'TEXT'],
      ['current_address', 'TEXT'],
      ['province_city', "TEXT DEFAULT 'រាជធានីភ្នំពេញ (Phnom Penh)'"],
      ['district', 'TEXT'],
      ['commune_sangkat', 'TEXT'],
      ['village', 'TEXT'],
      ['employee_type', "TEXT DEFAULT 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)'"],
      ['contract_type', "TEXT DEFAULT 'UDC (មិនកំណត់ថិរវេលា)'"],
      ['contract_start', 'TEXT'],
      ['contract_end', 'TEXT'],
      ['work_location', "TEXT DEFAULT 'Head Office'"],
      ['salary_currency', "TEXT DEFAULT 'USD ($)'"],
      ['salary_frequency', "TEXT DEFAULT 'កន្លះខែ (Semi-monthly)'"],
      ['bank_name', "TEXT DEFAULT 'ABA Bank'"],
      ['bank_account_name', 'TEXT'],
      ['bank_account_number', 'TEXT'],
      ['nssf_member', "TEXT DEFAULT 'មាន (Yes)'"],
      ['nssf_number', 'TEXT'],
      ['nssf_reg_date', 'TEXT'],
      ['emergency_contact_relationship', 'TEXT'],
      ['emergency_contact_address', 'TEXT'],
      ['doc_national_id', 'TEXT'],
      ['doc_passport', 'TEXT'],
      ['doc_contract', 'TEXT'],
      ['doc_others', 'TEXT'],
      ['transport_allowance', 'REAL DEFAULT 0'],
      ['meal_allowance', 'REAL DEFAULT 0'],
      ['housing_allowance', 'REAL DEFAULT 0'],
      ['attendance_allowance', 'REAL DEFAULT 0'],
      ['skill_allowance', 'REAL DEFAULT 0'],
      ['seniority_bonus', 'REAL DEFAULT 0'],
      ['position_allowance', 'REAL DEFAULT 0'],
      ['sewing_skill_matrix', 'REAL DEFAULT 0'],
      ['labor_type', "TEXT DEFAULT 'Indirect Labour'"],
      ['group_name', 'TEXT'],
      ['group_id', 'TEXT'],
      ['resignation_date', 'TEXT'],
      ['working_period', 'INTEGER DEFAULT 0'],
      ['khmer_name', 'TEXT'],
      ['pay_grade', "TEXT DEFAULT 'Grade 2'"],
      ['last_salary_review', 'TEXT'],
      ['monthly_eval_bonus', 'REAL DEFAULT 0'],
      ['severance_pay', 'REAL DEFAULT 0'],
    ];

    for (const [col, colDef] of newEmpCols) {
      if (!colNames.has(col)) {
        try {
          db.prepare(`ALTER TABLE employees ADD COLUMN ${col} ${colDef}`).run();
        } catch (err) {
          console.error(`Error adding column ${col} to employees:`, err);
        }
      }
    }
  } catch (err) {
    console.error('Error migrating employees table columns:', err);
  }

  // Migrate attendance table columns
  try {
    const attCols = db.prepare("PRAGMA table_info(attendance)").all() as { name: string }[];
    const attColNames = new Set(attCols.map((c) => c.name));
    const newAttCols: [string, string][] = [
      ['code', "TEXT DEFAULT '1'"],
      ['hours', 'REAL DEFAULT 8.0'],
      ['overtime_hours', 'REAL DEFAULT 0.0'],
      ['source', "TEXT DEFAULT 'manual'"],
    ];
    for (const [col, colDef] of newAttCols) {
      if (!attColNames.has(col)) {
        try {
          db.prepare(`ALTER TABLE attendance ADD COLUMN ${col} ${colDef}`).run();
        } catch (err) {
          console.error(`Error adding column ${col} to attendance:`, err);
        }
      }
    }
  } catch (err) {
    console.error('Error migrating attendance table columns:', err);
  }

  // Migrate payrolls table columns for factory breakdown
  try {
    const payCols = db.prepare("PRAGMA table_info(payrolls)").all() as { name: string }[];
    const payColNames = new Set(payCols.map((c) => c.name));
    const newPayCols: [string, string][] = [
      ['working_days', 'REAL DEFAULT 26'],
      ['absent_days', 'REAL DEFAULT 0'],
      ['unpaid_days', 'REAL DEFAULT 0'],
      ['basic_working_salary', 'REAL DEFAULT 0'],
      ['seniority_bonus', 'REAL DEFAULT 0'],
      ['position_allowance', 'REAL DEFAULT 0'],
      ['sewing_skill_matrix', 'REAL DEFAULT 0'],
      ['skill_allowance', 'REAL DEFAULT 0'],
      ['transport_housing', 'REAL DEFAULT 0'],
      ['attendance_allowance', 'REAL DEFAULT 0'],
      ['food_allowance', 'REAL DEFAULT 0'],
      ['overtime_pay', 'REAL DEFAULT 0'],
      ['overtime_food', 'REAL DEFAULT 0'],
      ['achievement_bonus', 'REAL DEFAULT 0'],
      ['monthly_eval_bonus', 'REAL DEFAULT 0'],
      ['annual_leave', 'REAL DEFAULT 0'],
      ['salary_adjustment', 'REAL DEFAULT 0'],
      ['gross_salary', 'REAL DEFAULT 0'],
      ['non_taxable_amount', 'REAL DEFAULT 0'],
      ['taxable_salary_usd', 'REAL DEFAULT 0'],
      ['taxable_salary_khr', 'REAL DEFAULT 0'],
      ['pension_usd', 'REAL DEFAULT 0'],
      ['pension_khr', 'REAL DEFAULT 0'],
      ['dependents_count', 'INTEGER DEFAULT 0'],
      ['taxable_base_khr', 'REAL DEFAULT 0'],
      ['tax_rate', "TEXT DEFAULT '0%'"],
      ['tax_khr', 'REAL DEFAULT 0'],
      ['tax_usd', 'REAL DEFAULT 0'],
      ['after_tax_salary', 'REAL DEFAULT 0'],
      ['first_paid', 'REAL DEFAULT 0'],
      ['target_bonus', 'REAL DEFAULT 0'],
      ['severance_pay', 'REAL DEFAULT 0'],
      ['seniority_payback', 'REAL DEFAULT 0'],
      ['paid_final_salary', 'REAL DEFAULT 0'],
      ['second_paid', 'REAL DEFAULT 0'],
      ['total_paid', 'REAL DEFAULT 0'],
      ['labor_type', "TEXT DEFAULT 'Direct Labour'"],
      ['exchange_rate_khr', 'REAL DEFAULT 4044'],
      ['nssf_rate_khr', 'REAL DEFAULT 4049'],
      ['calculation_trace', 'TEXT'],
      ['period_id', 'TEXT'],
      ['locked_at', 'TEXT'],
    ];

    for (const [col, colDef] of newPayCols) {
      if (!payColNames.has(col)) {
        try {
          db.prepare(`ALTER TABLE payrolls ADD COLUMN ${col} ${colDef}`).run();
        } catch (err) {
          console.error(`Error adding column ${col} to payrolls:`, err);
        }
      }
    }
  } catch (err) {
    console.error('Error migrating payrolls table columns:', err);
  }

  // Initialize users if none exist
  try {
    const userRow = db.prepare("SELECT count(*) as count FROM users").get() as { count: number } | undefined;
    if (!userRow || userRow.count === 0) {
      const insertUser = db.prepare(`
        INSERT INTO users (id, username, name, email, password, role, status, employee_id, department_name, avatar, two_factor_enabled, permissions, last_login, created_at)
        VALUES (@id, @username, @name, @email, @password, @role, @status, @employee_id, @department_name, @avatar, @two_factor_enabled, @permissions, @last_login, @created_at)
      `);

      const defaultUsers = [
        {
          id: 'usr-admin',
          username: 'admin',
          name: 'Administrator',
          email: 'admin@outlook.com',
          password: '@9218njo0(TWp<3q"(3{',
          role: 'Admin',
          status: 'Active',
          employee_id: null,
          department_name: 'ថ្នាក់ដឹកនាំជាន់ខ្ពស់ (Top Management)',
          avatar: '',
          two_factor_enabled: 0,
          permissions: 'all,manage_users,manage_payroll,approve_leaves,system_settings,export_data',
          last_login: null,
          created_at: new Date().toISOString(),
        },
      ];

      for (const u of defaultUsers) {
        insertUser.run(u);
      }
    }
  } catch (err) {
    console.error('Error initializing default users:', err);
  }

  // Ensure system is marked initialized without loading demo data
  const meta = db.prepare("SELECT value FROM system_meta WHERE key = 'initialized'").get() as { value: string } | undefined;
  if (!meta) {
    db.prepare("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('initialized', 'true')").run();
  }

  // Ensure company and overtime settings exist in system_meta
  try {
    const metaCompany = db.prepare("SELECT value FROM system_meta WHERE key = 'company_settings'").get() as { value: string } | undefined;
    if (!metaCompany) {
      db.prepare("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('company_settings', ?)").run(JSON.stringify(DEFAULT_COMPANY_SETTINGS));
      db.prepare("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('company_name', ?)").run(DEFAULT_COMPANY_SETTINGS.name);
    }
    const metaOt = db.prepare("SELECT value FROM system_meta WHERE key = 'overtime_settings'").get() as { value: string } | undefined;
    if (!metaOt) {
      db.prepare("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('overtime_settings', ?)").run(JSON.stringify(DEFAULT_OVERTIME_SETTINGS));
    }
  } catch (err) {
    console.error('Error seeding initial system meta settings:', err);
  }

  // Ensure departments exist if empty
  try {
    const deptCount = db.prepare('SELECT count(*) as count FROM departments').get() as { count: number } | undefined;
    if (!deptCount || deptCount.count === 0) {
      const insertDept = db.prepare(`
        INSERT INTO departments (id, name, description, manager_id, color)
        VALUES (@id, @name, @description, @manager_id, @color)
      `);
      for (const dept of INITIAL_DEPARTMENTS) {
        insertDept.run(dept);
      }
    }
  } catch (err) {
    console.error('Error seeding departments:', err);
  }

  // Seed master attendance codes, groups, sewing rules, and periods
  try {
    seedMasterAttendanceAndPayrollData(db);
  } catch (err) {
    console.error('Error seeding master attendance and payroll data:', err);
  }
}

export function clearAllEmployees(db: PostgresDatabase) {
  db.prepare("UPDATE departments SET manager_id = NULL").run();
  db.prepare("UPDATE users SET employee_id = NULL").run();
  db.prepare("UPDATE it_assets SET assigned_to = NULL").run();
  db.prepare("DELETE FROM attendance").run();
  db.prepare("DELETE FROM duty_roster").run();
  db.prepare("DELETE FROM overtime_requests").run();
  db.prepare("DELETE FROM leave_requests").run();
  db.prepare("DELETE FROM leave_balances").run();
  db.prepare("DELETE FROM payrolls").run();
  db.prepare("DELETE FROM salary_adjustments").run();
  db.prepare("DELETE FROM sewing_production_weekly").run();
  db.prepare("DELETE FROM performance_reviews").run();
  db.prepare("DELETE FROM attendance_raw_transactions").run();
  db.prepare("DELETE FROM attendance_corrections").run();
  db.prepare("DELETE FROM attendance_device_users").run();
  db.prepare("DELETE FROM attendance_device_commands").run();
  db.prepare("DELETE FROM attendance_sync_jobs").run();
  db.prepare("DELETE FROM attendance_sync_logs").run();
  db.prepare("DELETE FROM employee_medical_records").run();
  db.prepare("DELETE FROM medicine_issuances").run();
  db.prepare("DELETE FROM approval_requests").run();
  db.prepare("DELETE FROM employees").run();
}

export function clearAllRecruitment(db: PostgresDatabase) {
  db.prepare("DELETE FROM job_candidates").run();
  db.prepare("DELETE FROM job_postings").run();
}

export function restoreRecruitment(db: PostgresDatabase) {
  clearAllRecruitment(db);
}

export function seedDatabase(db: PostgresDatabase) {
  // Demo auto-seeding is permanently disabled for production.
  // Preserves clean baseline state: default departments, operational groups, status codes, and hardware devices.
  clearAllEmployees(db);
  clearAllRecruitment(db);
  initDatabase(db);
}

export function seedDutyRoster() {
  // Demo auto-seeding removed for production
}

export function seedOvertimeRequests() {
  // Demo auto-seeding removed for production
}

export function getCompanySettings(): CompanySettings {
  const db = getDb();
  try {
    const row = db.prepare('SELECT value FROM system_meta WHERE key = ?').get('company_settings') as { value: string } | undefined;
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      return { ...DEFAULT_COMPANY_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error('Error reading company_settings from system_meta:', err);
  }
  return DEFAULT_COMPANY_SETTINGS;
}

export function updateCompanySettings(settings: Partial<CompanySettings>): CompanySettings {
  const db = getDb();
  const current = getCompanySettings();
  const updated: CompanySettings = {
    ...current,
    ...settings,
  };
  db.prepare(`
    INSERT INTO system_meta (key, value)
    VALUES ('company_settings', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(JSON.stringify(updated));

  if (updated.name) {
    db.prepare(`
      INSERT INTO system_meta (key, value)
      VALUES ('company_name', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(updated.name);
  }

  return updated;
}

export function getOvertimeSettings(): OvertimeSettings {
  const db = getDb();
  try {
    const row = db.prepare('SELECT value FROM system_meta WHERE key = ?').get('overtime_settings') as { value: string } | undefined;
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      const mergedRates: Record<OvertimeRateType, any> = { ...DEFAULT_OVERTIME_SETTINGS.rates };
      if (parsed.rates) {
        for (const [k, v] of Object.entries(parsed.rates)) {
          if (v && mergedRates[k as OvertimeRateType]) {
            mergedRates[k as OvertimeRateType] = {
              ...mergedRates[k as OvertimeRateType],
              ...(v as any),
            };
          }
        }
      }
      return {
        ...DEFAULT_OVERTIME_SETTINGS,
        ...parsed,
        isCustomized: true,
        rates: mergedRates,
      };
    }
  } catch (err) {
    console.error('Error reading overtime_settings from system_meta:', err);
  }
  return DEFAULT_OVERTIME_SETTINGS;
}

export function updateOvertimeSettings(settings: Partial<OvertimeSettings>): OvertimeSettings {
  const db = getDb();
  const current = getOvertimeSettings();
  const mergedRates: Record<OvertimeRateType, any> = { ...current.rates };
  if (settings.rates) {
    for (const [k, v] of Object.entries(settings.rates)) {
      if (v && mergedRates[k as OvertimeRateType]) {
        mergedRates[k as OvertimeRateType] = {
          ...mergedRates[k as OvertimeRateType],
          ...(v as any),
        };
      }
    }
  }
  const updated: OvertimeSettings = {
    ...current,
    ...settings,
    isCustomized: true,
    updated_at: new Date().toISOString(),
    rates: mergedRates,
  };
  db.prepare(`
    INSERT INTO system_meta (key, value)
    VALUES ('overtime_settings', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(JSON.stringify(updated));
  return updated;
}

export function resetOvertimeSettings(): OvertimeSettings {
  const db = getDb();
  db.prepare('DELETE FROM system_meta WHERE key = ?').run('overtime_settings');
  return DEFAULT_OVERTIME_SETTINGS;
}

export function getShiftSettings(): ShiftSettings {
  const db = getDb();
  try {
    const row = db.prepare('SELECT value FROM system_meta WHERE key = ?').get('shift_settings') as { value: string } | undefined;
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      const mergedShifts: Record<string, ShiftDefinition> = { ...DEFAULT_SHIFTS };
      if (parsed.shifts) {
        for (const [k, v] of Object.entries(parsed.shifts)) {
          if (v) {
            mergedShifts[k] = {
              ...(mergedShifts[k] || {}),
              ...(v as any),
            };
          }
        }
      }
      return {
        ...DEFAULT_SHIFT_SETTINGS,
        ...parsed,
        isCustomized: true,
        shifts: mergedShifts,
      };
    }
  } catch (err) {
    console.error('Error reading shift_settings from system_meta:', err);
  }
  return DEFAULT_SHIFT_SETTINGS;
}

export function updateShiftSettings(settings: Partial<ShiftSettings>): ShiftSettings {
  const db = getDb();
  const current = getShiftSettings();
  const mergedShifts: Record<string, ShiftDefinition> = { ...current.shifts };
  if (settings.shifts) {
    for (const [k, v] of Object.entries(settings.shifts)) {
      if (v) {
        mergedShifts[k] = {
          ...(mergedShifts[k] || {}),
          ...(v as any),
        };
      }
    }
  }
  const updated: ShiftSettings = {
    ...current,
    ...settings,
    isCustomized: true,
    updated_at: new Date().toISOString(),
    shifts: mergedShifts,
  };
  db.prepare(`
    INSERT INTO system_meta (key, value)
    VALUES ('shift_settings', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(JSON.stringify(updated));
  return updated;
}

export function resetShiftSettings(): ShiftSettings {
  const db = getDb();
  db.prepare('DELETE FROM system_meta WHERE key = ?').run('shift_settings');
  return DEFAULT_SHIFT_SETTINGS;
}

export function getNotifications(options?: {
  userId?: string | null;
  role?: string;
  limit?: number;
  unreadOnly?: boolean;
}): NotificationItem[] {
  const db = getDb();
  let sql = 'SELECT * FROM notifications WHERE 1=1';
  const params: any[] = [];

  if (options?.role && options.role !== 'All') {
    if (options.userId) {
      sql += " AND (user_id IS NULL OR user_id = ? OR role = 'All' OR role = ?)";
      params.push(options.userId, options.role);
    } else {
      sql += " AND (role = 'All' OR role = ?)";
      params.push(options.role);
    }
  } else if (options?.userId) {
    sql += ' AND (user_id IS NULL OR user_id = ?)';
    params.push(options.userId);
  }

  if (options?.unreadOnly) {
    sql += ' AND is_read = 0';
  }

  sql += ' ORDER BY created_at DESC';

  const limit = options?.limit || 50;
  sql += ' LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    role: r.role,
    title: r.title,
    title_km: r.title_km,
    message: r.message,
    message_km: r.message_km,
    type: r.type,
    link: r.link,
    is_read: Boolean(r.is_read),
    created_at: r.created_at,
  }));
}

export function getUnreadNotificationsCount(options?: {
  userId?: string | null;
  role?: string;
}): number {
  const db = getDb();
  let sql = 'SELECT count(*) as count FROM notifications WHERE is_read = 0';
  const params: any[] = [];

  if (options?.role && options.role !== 'All') {
    if (options.userId) {
      sql += " AND (user_id IS NULL OR user_id = ? OR role = 'All' OR role = ?)";
      params.push(options.userId, options.role);
    } else {
      sql += " AND (role = 'All' OR role = ?)";
      params.push(options.role);
    }
  } else if (options?.userId) {
    sql += ' AND (user_id IS NULL OR user_id = ?)';
    params.push(options.userId);
  }

  const row = db.prepare(sql).get(...params) as { count: number } | undefined;
  return row?.count || 0;
}

export function markNotificationAsRead(id: string, isRead: boolean = true): boolean {
  const db = getDb();
  const res = db.prepare('UPDATE notifications SET is_read = ? WHERE id = ?').run(isRead ? 1 : 0, id);
  return res.changes > 0;
}

export function markAllNotificationsAsRead(options?: {
  userId?: string | null;
  role?: string;
}): number {
  const db = getDb();
  let sql = 'UPDATE notifications SET is_read = 1 WHERE is_read = 0';
  const params: any[] = [];

  if (options?.role && options.role !== 'All') {
    if (options.userId) {
      sql += " AND (user_id IS NULL OR user_id = ? OR role = 'All' OR role = ?)";
      params.push(options.userId, options.role);
    } else {
      sql += " AND (role = 'All' OR role = ?)";
      params.push(options.role);
    }
  } else if (options?.userId) {
    sql += ' AND (user_id IS NULL OR user_id = ?)';
    params.push(options.userId);
  }

  const res = db.prepare(sql).run(...params);
  return res.changes;
}

export function deleteNotification(id: string): boolean {
  const db = getDb();
  const res = db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
  return res.changes > 0;
}

export function clearAllNotifications(options?: {
  userId?: string | null;
  role?: string;
}): number {
  const db = getDb();
  let sql = 'DELETE FROM notifications WHERE 1=1';
  const params: any[] = [];

  if (options?.role && options.role !== 'All') {
    if (options.userId) {
      sql += " AND (user_id IS NULL OR user_id = ? OR role = 'All' OR role = ?)";
      params.push(options.userId, options.role);
    } else {
      sql += " AND (role = 'All' OR role = ?)";
      params.push(options.role);
    }
  } else if (options?.userId) {
    sql += ' AND (user_id IS NULL OR user_id = ?)';
    params.push(options.userId);
  }

  const res = db.prepare(sql).run(...params);
  return res.changes;
}

export function createNotification(data: {
  id?: string;
  user_id?: string | null;
  role?: 'All' | 'Admin' | 'Manager' | 'Employee';
  title: string;
  title_km?: string;
  message?: string;
  message_km?: string;
  type: NotificationType;
  link?: string;
  is_read?: boolean;
  created_at?: string;
}): NotificationItem {
  const db = getDb();
  const id = data.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = data.created_at || new Date().toISOString();
  const role = data.role || 'All';
  const link = data.link || '/';
  const is_read = data.is_read ? 1 : 0;

  db.prepare(`
    INSERT INTO notifications (
      id, user_id, role, title, title_km, message, message_km, type, link, is_read, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `).run(
    id,
    data.user_id || null,
    role,
    data.title,
    data.title_km || null,
    data.message || null,
    data.message_km || null,
    data.type,
    link,
    is_read,
    now
  );

  return {
    id,
    user_id: data.user_id || null,
    role,
    title: data.title,
    title_km: data.title_km,
    message: data.message,
    message_km: data.message_km,
    type: data.type,
    link,
    is_read: Boolean(is_read),
    created_at: now,
  };
}

export function seedInitialNotificationsIfEmpty(_db: PostgresDatabase) {
  // Demo notifications seeding is permanently disabled for production.
  return;
}

export function seedMasterAttendanceAndPayrollData(db: PostgresDatabase) {
  // 1. Seed Attendance Status Codes if empty
  try {
    const codeCount = db.prepare('SELECT count(*) as count FROM attendance_status_codes').get() as { count: number } | undefined;
    if (!codeCount || codeCount.count === 0) {
      const insertCode = db.prepare(`
        INSERT INTO attendance_status_codes (code, name_en, name_km, description, is_paid, attendance_value, payroll_effect, badge_color, badge_bg, is_active)
        VALUES (@code, @name_en, @name_km, @description, @is_paid, @attendance_value, @payroll_effect, @badge_color, @badge_bg, @is_active)
      `);
      const codes = [
        { code: '1', name_en: 'Present / Full Day', name_km: 'វត្តមានពេញ', description: 'បុគ្គលិកបំពេញការងារពេញមួយថ្ងៃ (៨ម៉ោង)', is_paid: 1, attendance_value: 1.0, payroll_effect: 'full', badge_color: '#059669', badge_bg: '#ecfdf5', is_active: 1 },
        { code: '0.5', name_en: 'Half Day', name_km: 'កន្លះថ្ងៃ', description: 'បំពេញការងារកន្លះថ្ងៃ (៤ម៉ោង)', is_paid: 1, attendance_value: 0.5, payroll_effect: 'half', badge_color: '#d97706', badge_bg: '#fef3c7', is_active: 1 },
        { code: 'AB', name_en: 'Absent', name_km: 'អវត្តមានឥតច្បាប់', description: 'អវត្តមានមិនមានការអនុញ្ញាត (កាត់ប្រាក់)', is_paid: 0, attendance_value: 0.0, payroll_effect: 'unpaid', badge_color: '#dc2626', badge_bg: '#fee2e2', is_active: 1 },
        { code: 'AL', name_en: 'Annual Leave', name_km: 'ច្បាប់ប្រចាំឆ្នាំ', description: 'ឈប់សម្រាកប្រចាំឆ្នាំមានប្រាក់ឈ្នួល', is_paid: 1, attendance_value: 1.0, payroll_effect: 'full', badge_color: '#2563eb', badge_bg: '#eff6ff', is_active: 1 },
        { code: 'ML', name_en: 'Maternity Leave', name_km: 'លំហែមាតុភាព', description: 'ច្បាប់ឈប់សម្រាកឆ្លងទន្លេមានប្រាក់ឧបត្ថម្ភ', is_paid: 1, attendance_value: 1.0, payroll_effect: 'full', badge_color: '#db2777', badge_bg: '#fdf2f8', is_active: 1 },
        { code: 'HL', name_en: 'Public Holiday', name_km: 'បុណ្យជាតិ', description: 'ថ្ងៃឈប់បុណ្យជាតិប្រពៃណីមានប្រាក់ឈ្នួល', is_paid: 1, attendance_value: 1.0, payroll_effect: 'full', badge_color: '#7c3aed', badge_bg: '#f5f3ff', is_active: 1 },
        { code: 'SL', name_en: 'Sick Leave', name_km: 'ច្បាប់ឈឺ', description: 'ឈប់សម្រាកដោយមានជំងឺ/វេជ្ជបញ្ជា', is_paid: 1, attendance_value: 1.0, payroll_effect: 'full', badge_color: '#0891b2', badge_bg: '#ecfeff', is_active: 1 },
        { code: 'OL', name_en: 'Other Leave', name_km: 'ច្បាប់ផ្សេងៗ', description: 'ច្បាប់ផ្ទាល់ខ្លួន/ការអនុញ្ញាតពិសេស', is_paid: 0, attendance_value: 0.0, payroll_effect: 'unpaid', badge_color: '#ea580c', badge_bg: '#fff7ed', is_active: 1 },
        { code: 'OFF', name_en: 'Weekly Rest Day', name_km: 'ថ្ងៃសម្រាកសប្តាហ៍', description: 'ថ្ងៃអាទិត្យឈប់សម្រាកប្រចាំសប្តាហ៍', is_paid: 0, attendance_value: 0.0, payroll_effect: 'none', badge_color: '#64748b', badge_bg: '#f8fafc', is_active: 1 },
      ];
      for (const c of codes) {
        insertCode.run(c);
      }
    }
  } catch (err) {
    console.error('Error seeding attendance codes:', err);
  }

  // 2. Seed Employee Groups if empty and not explicitly cleared
  try {
    const metaGroups = db.prepare("SELECT value FROM system_meta WHERE key = 'groups_initialized'").get() as { value: string } | undefined;
    if (!metaGroups) {
      db.prepare("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('groups_initialized', 'true')").run();
      const grpCount = db.prepare('SELECT count(*) as count FROM employee_groups').get() as { count: number } | undefined;
      if (!grpCount || grpCount.count === 0) {
        const insertGrp = db.prepare(`
          INSERT INTO employee_groups (id, name, department_id, description)
          VALUES (@id, @name, @department_id, @description)
        `);
      const groups = [
        { id: 'grp-hr', name: 'Human Resources', department_id: 'dept-hr', description: 'HR Operations & Employee Relations' },
        { id: 'grp-med', name: 'Health & Medical Services', department_id: 'dept-hr', description: 'Factory Clinic & Healthcare Services' },
        { id: 'grp-pat', name: 'Pattern Making', department_id: 'dept-prod', description: 'Pattern Design & Technical Sampling' },
        { id: 'grp-pak', name: 'Packing', department_id: 'dept-prod', description: 'Packaging & Boxing' },
        { id: 'grp-sew1', name: 'Sewing Line 1', department_id: 'dept-prod', description: 'Sewing Production Line 1' },
        { id: 'grp-sew2', name: 'Sewing Line 2', department_id: 'dept-prod', description: 'Sewing Production Line 2' },
        { id: 'grp-cut', name: 'Cutting', department_id: 'dept-prod', description: 'Fabric & Leather Cutting' },
        { id: 'grp-qc', name: 'Quality Control', department_id: 'dept-prod', description: 'Quality Assurance & Inspection' },
        { id: 'grp-clean', name: 'Cleaning Services', department_id: 'dept-fac', description: 'Sanitation & Janitorial Services' },
        { id: 'grp-maint', name: 'Maintenance & Repair', department_id: 'dept-fac', description: 'Machinery Maintenance & Repair' },
      ];
      for (const g of groups) {
        insertGrp.run(g);
      }

      // Reassign factory employees to proper operational groups based on role
      db.prepare("UPDATE employees SET group_name = 'Cut' WHERE role LIKE '%Cutting%'").run();
      db.prepare("UPDATE employees SET group_name = 'QC' WHERE role LIKE '%QC%'").run();
      db.prepare("UPDATE employees SET group_name = 'WH' WHERE role LIKE '%Warehouse%'").run();
      db.prepare("UPDATE employees SET group_name = 'Delivery' WHERE role LIKE '%Delivery%'").run();
      db.prepare("UPDATE employees SET group_name = 'T/O' WHERE role LIKE '%Turnover%'").run();
      db.prepare("UPDATE employees SET group_name = 'Set' WHERE role LIKE '%Setting%' AND role NOT LIKE '%Packing%'").run();
      db.prepare("UPDATE employees SET group_name = 'Pak' WHERE role LIKE '%Packing%'").run();
      db.prepare("UPDATE employees SET group_name = 'Maint' WHERE role LIKE '%Repairman%'").run();
      db.prepare("UPDATE employees SET group_name = 'Pattern' WHERE role LIKE '%Pattern%'").run();
      db.prepare("UPDATE employees SET group_name = 'Office' WHERE role IN ('HR Admin', 'IT Support Officer', 'Recruiter', 'Cleaner')").run();
      db.prepare(`
        UPDATE employees 
        SET group_name = CASE 
          WHEN (abs(hashtext(id)) % 3 = 0) THEN 'Sew-L.1' 
          WHEN (abs(hashtext(id)) % 3 = 1) THEN 'Sew-L.2' 
          ELSE 'Sew-L.3' 
        END 
        WHERE role LIKE '%Sewing%'
      `).run();
      }
    }
  } catch (err) {
    console.error('Error seeding groups:', err);
  }

  // 3. Seed Payroll Periods if empty
  try {
    const periodCount = db.prepare('SELECT count(*) as count FROM payroll_periods').get() as { count: number } | undefined;
    if (!periodCount || periodCount.count === 0) {
      const insertPeriod = db.prepare(`
        INSERT INTO payroll_periods (id, name, start_date, end_date, working_days, working_hours_per_day, status, locked_by, locked_at, approved_by, approved_at, notes, created_at)
        VALUES (@id, @name, @start_date, @end_date, @working_days, @working_hours_per_day, @status, @locked_by, @locked_at, @approved_by, @approved_at, @notes, @created_at)
      `);
      const periods = [
        {
          id: 'period-2026-08',
          name: 'August 2026',
          start_date: '2026-08-01',
          end_date: '2026-08-31',
          working_days: 26,
          working_hours_per_day: 8,
          status: 'Paid',
          locked_by: 'usr-admin',
          locked_at: '2026-08-31 17:00:00',
          approved_by: 'usr-admin',
          approved_at: '2026-08-31 17:00:00',
          notes: 'August 2026 factory payroll finalized and paid',
          created_at: '2026-08-01 08:00:00',
        },
        {
          id: 'period-2026-09',
          name: 'September 2026',
          start_date: '2026-09-01',
          end_date: '2026-09-30',
          working_days: 26,
          working_hours_per_day: 8,
          status: 'Locked',
          locked_by: 'usr-admin',
          locked_at: '2026-09-30 18:00:00',
          approved_by: 'usr-admin',
          approved_at: '2026-09-30 18:00:00',
          notes: 'September 2026 payroll locked after audit review',
          created_at: '2026-09-01 08:00:00',
        },
        {
          id: 'period-2026-10',
          name: 'October 2026',
          start_date: '2026-10-01',
          end_date: '2026-10-31',
          working_days: 26,
          working_hours_per_day: 8,
          status: 'Processing',
          locked_by: null,
          locked_at: null,
          approved_by: null,
          approved_at: null,
          notes: 'Current working payroll cycle',
          created_at: '2026-10-01 08:00:00',
        },
      ];
      for (const p of periods) {
        insertPeriod.run(p);
      }
    }
  } catch (err) {
    console.error('Error seeding payroll periods:', err);
  }

  // 4. Seed Payroll Rules in system_meta if empty
  try {
    const metaRow = db.prepare("SELECT value FROM system_meta WHERE key = 'payroll_rules_config'").get() as { value: string } | undefined;
    if (!metaRow) {
      db.prepare("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('payroll_rules_config', ?)").run(JSON.stringify(DEFAULT_PAYROLL_RULES));
    }
  } catch (err) {
    console.error('Error seeding payroll rules meta:', err);
  }

  // 5. Seed Sewing Bonus Rules if empty
  try {
    const bonusRuleCount = db.prepare('SELECT count(*) as count FROM sewing_bonus_rules').get() as { count: number } | undefined;
    if (!bonusRuleCount || bonusRuleCount.count === 0) {
      db.prepare(`
        INSERT INTO sewing_bonus_rules (id, group_name, weekly_target_qty, base_bonus, tier_1_min_pct, tier_1_bonus, tier_2_min_pct, tier_2_bonus, tier_3_min_pct, tier_3_bonus, is_active)
        VALUES ('sbr-default', 'All Sewing Lines', 1200, 5.0, 100.0, 10.0, 110.0, 15.0, 120.0, 20.0, 1)
      `).run();
    }

    const dailyRuleCount = db.prepare('SELECT count(*) as count FROM sewing_daily_target_rules').get() as { count: number } | undefined;
    if (!dailyRuleCount || dailyRuleCount.count === 0) {
      db.prepare(`
        INSERT INTO sewing_daily_target_rules (
          id, rule_name, daily_target_qty, base_min_pct, base_bonus,
          tier_1_min_pct, tier_1_bonus, tier_2_min_pct, tier_2_bonus,
          tier_3_min_pct, tier_3_bonus, is_active
        ) VALUES (
          'sdtr-default', 'Standard Garment Daily Target Matrix', 200, 90.0, 0.50,
          100.0, 1.50, 110.0, 2.50,
          120.0, 3.50, 1
        )
      `).run();
    }
  } catch (err) {
    console.error('Error seeding sewing bonus rules:', err);
  }

  // 6. Seed October 2026 Attendance records if empty
  try {
    const attCount = db.prepare("SELECT count(*) as count FROM attendance WHERE date >= '2026-10-01' AND date <= '2026-10-31'").get() as { count: number } | undefined;
    if (!attCount || attCount.count === 0) {
      const activeEmps = db.prepare("SELECT id FROM employees WHERE status != 'Terminated'").all() as { id: string }[];
      const insertAtt = db.prepare(`
        INSERT OR REPLACE INTO attendance (id, employee_id, date, clock_in, clock_out, status, work_hours, notes, code, hours, overtime_hours, source)
        VALUES (@id, @employee_id, @date, @clock_in, @clock_out, @status, @work_hours, @notes, @code, @hours, @overtime_hours, @source)
      `);

      const daysInOct = 31;
      const alSet = new Set(['HC004:2026-10-09', 'HC010:2026-10-15', 'HC010:2026-10-16', 'HC025:2026-10-21']);
      const abSet = new Set(['HC015:2026-10-07', 'HC030:2026-10-14']);
      const halfSet = new Set(['HC008:2026-10-12', 'HC022:2026-10-20']);
      const slSet = new Set(['HC012:2026-10-22']);

      const insertMany = db.transaction(() => {
        for (const emp of activeEmps) {
          for (let d = 1; d <= daysInOct; d++) {
            const dayStr = String(d).padStart(2, '0');
            const dateStr = `2026-10-${dayStr}`;
            const dayOfWeek = new Date(2026, 9, d).getDay(); // 0 is Sunday
            const id = `att-${emp.id}-${dateStr}`;
            const key = `${emp.id}:${dateStr}`;

            if (dayOfWeek === 0) {
              insertAtt.run({
                id,
                employee_id: emp.id,
                date: dateStr,
                clock_in: null,
                clock_out: null,
                status: 'Rest Day',
                work_hours: 0,
                notes: 'Sunday Weekly Rest',
                code: 'OFF',
                hours: 0,
                overtime_hours: 0,
                source: 'calendar',
              });
            } else if (alSet.has(key)) {
              insertAtt.run({
                id,
                employee_id: emp.id,
                date: dateStr,
                clock_in: null,
                clock_out: null,
                status: 'On Leave',
                work_hours: 8,
                notes: 'Approved Annual Leave',
                code: 'AL',
                hours: 8,
                overtime_hours: 0,
                source: 'leaves',
              });
            } else if (abSet.has(key)) {
              insertAtt.run({
                id,
                employee_id: emp.id,
                date: dateStr,
                clock_in: null,
                clock_out: null,
                status: 'Absent',
                work_hours: 0,
                notes: 'Unexcused Absence',
                code: 'AB',
                hours: 0,
                overtime_hours: 0,
                source: 'manual',
              });
            } else if (halfSet.has(key)) {
              insertAtt.run({
                id,
                employee_id: emp.id,
                date: dateStr,
                clock_in: '07:30:00',
                clock_out: '11:30:00',
                status: 'Half Day',
                work_hours: 4,
                notes: 'Morning shift only',
                code: '0.5',
                hours: 4,
                overtime_hours: 0,
                source: 'manual',
              });
            } else if (slSet.has(key)) {
              insertAtt.run({
                id,
                employee_id: emp.id,
                date: dateStr,
                clock_in: null,
                clock_out: null,
                status: 'On Leave',
                work_hours: 8,
                notes: 'Medical Sick Leave',
                code: 'SL',
                hours: 8,
                overtime_hours: 0,
                source: 'leaves',
              });
            } else {
              insertAtt.run({
                id,
                employee_id: emp.id,
                date: dateStr,
                clock_in: '07:30:00',
                clock_out: '16:30:00',
                status: 'Present',
                work_hours: 8,
                notes: null,
                code: '1',
                hours: 8,
                overtime_hours: 0,
                source: 'biometric',
              });
            }
          }
        }
      });
      insertMany();
    }
  } catch (err) {
    console.error('Error seeding October attendance:', err);
  }

  // 6.2 Seed August 2026 Attendance records if empty (matching official August payroll dataset)
  try {
    const augAttCount = db.prepare("SELECT count(*) as count FROM attendance WHERE date >= '2026-08-01' AND date <= '2026-08-31'").get() as { count: number } | undefined;
    if (!augAttCount || augAttCount.count === 0) {
      const payRows = db.prepare(`
        SELECT p.employee_id, p.working_days, p.absent_days, p.unpaid_days, p.annual_leave,
               p.attendance_allowance, p.overtime_pay, e.join_date, e.salary
        FROM payrolls p
        JOIN employees e ON e.id = p.employee_id
        WHERE p.pay_period = 'August 2026'
        ORDER BY p.employee_id
      `).all() as Array<{
        employee_id: string;
        working_days: number;
        absent_days: number;
        unpaid_days: number;
        annual_leave: number;
        attendance_allowance: number;
        overtime_pay: number;
        join_date: string;
        salary: number;
      }>;

      if (payRows.length > 0) {
        const nonStandardAssignments: Record<string, {
          OL?: number[];
          AB?: number[];
          AL?: number[];
          HALF?: number[];
          AL_HALF_AND_WORKED?: number[];
          OFF_EXTRA?: number[];
        }> = {
          'HC369': { OL: [1] },
          'HC370': { OL: [1, 3] },
          'HC371': { OL: [1, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20] },
          'HC372': { OL: [1, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20], AB: [21] },
          'HC346': {
            OL: [1, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19],
            AB: [20, 21, 22],
            AL: [24, 25, 26],
            AL_HALF_AND_WORKED: [27],
            OFF_EXTRA: [31],
          },
          'HC357': { AB: [10, 11, 12, 13, 14, 15, 17], AL: [24, 25, 26] },
          'HC214': { AB: [17, 18, 19, 20, 21, 22, 24], HALF: [25] },
          'HC003': { AB: [14], HALF: [21] },
          'HC320': { AB: [12], HALF: [19] },
          'HC326': { AB: [11], HALF: [18] },
          'HC016': { AB: [17, 18, 19, 20], AL_HALF_AND_WORKED: [21] },
          'HC290': { AB: [13, 14], AL: [20, 21] },
          'HC301': { AL: [17, 18], AL_HALF_AND_WORKED: [19] },
          'HC005': { AB: [13, 14] },
          'HC010': { AB: [10, 11, 12, 13] },
          'HC032': { AB: [17, 18, 19, 20, 21] },
          'HC130': { AB: [18, 19, 20] },
          'HC185': { AB: [14, 15] },
          'HC293': { AB: [12, 13, 14] },
          'HC329': { AB: [18, 19] },
          'HC333': { AB: [25, 26] },
          'HC344': { AB: [10, 11, 12, 13, 14] },
          'HC364': { AB: [19, 20, 21] },
          'HC021': { AB: [14] },
          'HC030': { AB: [15] },
          'HC033': { AB: [18] },
          'HC073': { AB: [12] },
          'HC157': { AB: [11] },
          'HC158': { AB: [19] },
          'HC180': { AB: [21] },
          'HC184': { AB: [13] },
          'HC190': { AB: [14] },
          'HC196': { AB: [20] },
          'HC227': { AB: [25] },
          'HC241': { AB: [26] },
          'HC283': { AB: [18] },
          'HC287': { AB: [19] },
          'HC303': { AB: [21] },
          'HC324': { AB: [22] },
          'HC341': { AB: [27] },
        };

        const sundays = new Set([2, 9, 16, 23, 30]);
        const otMap: Record<string, Record<number, number>> = {
          'HC005': { 3: 2, 5: 2, 7: 2, 10: 2, 12: 2, 17: 2, 19: 2, 24: 2, 26: 2, 28: 2, 31: 1 },
          'HC142': { 3: 2, 5: 2, 7: 2, 10: 2, 12: 2, 14: 2, 17: 2, 19: 2, 21: 2, 24: 2, 26: 1 },
          'HC180': Object.fromEntries(Array.from({ length: 31 }, (_, i) => i + 1).filter(d => !sundays.has(d)).map(d => [d, 2])),
          'HC292': { 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 10: 2, 11: 2, 12: 2, 13: 2, 14: 2, 17: 1 },
        };

        const insertAttStmt = db.prepare(`
          INSERT OR REPLACE INTO attendance (id, employee_id, date, clock_in, clock_out, status, work_hours, notes, code, hours, overtime_hours, source)
          VALUES (@id, @employee_id, @date, @clock_in, @clock_out, @status, @work_hours, @notes, @code, @hours, @overtime_hours, @source)
        `);

        const insertManyAug = db.transaction(() => {
          for (const row of payRows) {
            const empId = row.employee_id;
            const cfg = nonStandardAssignments[empId] || {};
            const olDays = new Set(cfg.OL || []);
            const abDays = new Set(cfg.AB || []);
            const alDays = new Set(cfg.AL || []);
            const halfDays = new Set(cfg.HALF || []);
            const alHalfWorked = new Set(cfg.AL_HALF_AND_WORKED || []);
            const offExtra = new Set(cfg.OFF_EXTRA || []);
            const empOtMap = otMap[empId] || {};

            for (let d = 1; d <= 31; d++) {
              const dayStr = String(d).padStart(2, '0');
              const dateStr = `2026-08-${dayStr}`;
              const attId = `att-${empId}-${dateStr}`;
              const otHours = empOtMap[d] || 0.0;

              if (sundays.has(d)) {
                insertAttStmt.run({
                  id: attId, employee_id: empId, date: dateStr, clock_in: null, clock_out: null,
                  status: 'Rest Day', work_hours: 0, notes: 'Sunday Weekly Rest', code: 'OFF', hours: 0, overtime_hours: 0, source: 'calendar',
                });
              } else if (offExtra.has(d)) {
                insertAttStmt.run({
                  id: attId, employee_id: empId, date: dateStr, clock_in: null, clock_out: null,
                  status: 'Rest Day', work_hours: 0, notes: 'Scheduled Rest Day', code: 'OFF', hours: 0, overtime_hours: 0, source: 'calendar',
                });
              } else if (olDays.has(d)) {
                insertAttStmt.run({
                  id: attId, employee_id: empId, date: dateStr, clock_in: null, clock_out: null,
                  status: 'Unpaid Leave', work_hours: 0, notes: 'Unpaid Leave / Before Employment', code: 'OL', hours: 0, overtime_hours: 0, source: 'calendar',
                });
              } else if (abDays.has(d)) {
                insertAttStmt.run({
                  id: attId, employee_id: empId, date: dateStr, clock_in: null, clock_out: null,
                  status: 'Absent', work_hours: 0, notes: 'Unexcused Absence', code: 'AB', hours: 0, overtime_hours: 0, source: 'manual',
                });
              } else if (alDays.has(d)) {
                insertAttStmt.run({
                  id: attId, employee_id: empId, date: dateStr, clock_in: null, clock_out: null,
                  status: 'On Leave', work_hours: 8, notes: 'Approved Annual Leave', code: 'AL', hours: 8, overtime_hours: 0, source: 'leaves',
                });
              } else if (alHalfWorked.has(d)) {
                insertAttStmt.run({
                  id: attId, employee_id: empId, date: dateStr, clock_in: '07:30:00', clock_out: '11:30:00',
                  status: 'On Leave', work_hours: 4, notes: 'Half-day Annual Leave (0.5 AL + 0.5 Present)', code: 'AL', hours: 4, overtime_hours: otHours, source: 'leaves',
                });
              } else if (halfDays.has(d)) {
                insertAttStmt.run({
                  id: attId, employee_id: empId, date: dateStr, clock_in: '07:30:00', clock_out: '11:30:00',
                  status: 'Half Day', work_hours: 4, notes: 'Morning shift only (4 hrs)', code: '0.5', hours: 4, overtime_hours: otHours, source: 'manual',
                });
              } else {
                insertAttStmt.run({
                  id: attId, employee_id: empId, date: dateStr, clock_in: '07:30:00', clock_out: '16:30:00',
                  status: 'Present', work_hours: 8, notes: null, code: '1', hours: 8, overtime_hours: otHours, source: 'biometric',
                });
              }
            }
          }
        });
        insertManyAug();
      }
    }
  } catch (err) {
    console.error('Error seeding August attendance:', err);
  }
}

export function getPayrollRules(): PayrollRulesConfig {
  const db = getDb();
  const row = db.prepare("SELECT value FROM system_meta WHERE key = 'payroll_rules_config'").get() as { value: string } | undefined;
  if (row && row.value) {
    try {
      return { ...DEFAULT_PAYROLL_RULES, ...JSON.parse(row.value) };
    } catch {}
  }
  return DEFAULT_PAYROLL_RULES;
}

export function savePayrollRules(rules: PayrollRulesConfig): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO system_meta (key, value) VALUES ('payroll_rules_config', ?)").run(JSON.stringify(rules));
}

export function getAttendanceStatusCodes(): AttendanceStatusCode[] {
  const db = getDb();
  return db.prepare("SELECT * FROM attendance_status_codes ORDER BY is_active DESC, code").all() as AttendanceStatusCode[];
}

export function saveAttendanceStatusCode(code: AttendanceStatusCode): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO attendance_status_codes (code, name_en, name_km, description, is_paid, attendance_value, payroll_effect, badge_color, badge_bg, is_active)
    VALUES (@code, @name_en, @name_km, @description, @is_paid, @attendance_value, @payroll_effect, @badge_color, @badge_bg, @is_active)
    ON CONFLICT(code) DO UPDATE SET
      name_en = excluded.name_en,
      name_km = excluded.name_km,
      description = excluded.description,
      is_paid = excluded.is_paid,
      attendance_value = excluded.attendance_value,
      payroll_effect = excluded.payroll_effect,
      badge_color = excluded.badge_color,
      badge_bg = excluded.badge_bg,
      is_active = excluded.is_active
  `).run(code);
}

export function getEmployeeGroups(departmentId?: string): EmployeeGroup[] {
  const db = getDb();
  let sql = `
    SELECT 
      eg.*,
      d.name as department_name,
      COUNT(CASE WHEN e.status != 'Terminated' THEN e.id END) as employee_count
    FROM employee_groups eg
    LEFT JOIN departments d ON d.id = eg.department_id
    LEFT JOIN employees e ON (e.group_id = eg.id OR e.group_name = eg.name)
  `;
  const params: any[] = [];
  if (departmentId) {
    sql += ` WHERE eg.department_id = ? `;
    params.push(departmentId);
  }
  sql += ` GROUP BY eg.id, eg.name, eg.department_id, eg.description, eg.created_at, d.name ORDER BY eg.name ASC`;
  return db.prepare(sql).all(...params) as EmployeeGroup[];
}

export function getEmployeeGroupById(id: string): EmployeeGroup | null {
  const db = getDb();
  const sql = `
    SELECT 
      eg.*,
      d.name as department_name,
      COUNT(CASE WHEN e.status != 'Terminated' THEN e.id END) as employee_count
    FROM employee_groups eg
    LEFT JOIN departments d ON d.id = eg.department_id
    LEFT JOIN employees e ON (e.group_id = eg.id OR e.group_name = eg.name)
    WHERE eg.id = ?
    GROUP BY eg.id, eg.name, eg.department_id, eg.description, eg.created_at, d.name
  `;
  const row = db.prepare(sql).get(id) as EmployeeGroup | undefined;
  return row || null;
}

export function saveEmployeeGroup(group: Partial<EmployeeGroup>): EmployeeGroup {
  const db = getDb();
  const id = group.id || `grp-${Date.now()}`;
  const existing = db.prepare('SELECT * FROM employee_groups WHERE id = ?').get(id) as EmployeeGroup | undefined;

  db.prepare(`
    INSERT INTO employee_groups (id, name, department_id, description)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      department_id = excluded.department_id,
      description = excluded.description
  `).run(id, group.name, group.department_id || null, group.description || null);

  // If group name changed, synchronize employee records
  if (existing && group.name && existing.name !== group.name) {
    try {
      db.prepare(`
        UPDATE employees 
        SET group_name = ? 
        WHERE group_id = ? OR group_name = ?
      `).run(group.name, id, existing.name);
    } catch (err) {
      console.error('Error synchronizing employees group_name:', err);
    }
  }

  const result = getEmployeeGroupById(id);
  return result || {
    id,
    name: group.name!,
    department_id: group.department_id,
    description: group.description,
  };
}

export function deleteEmployeeGroup(id: string): boolean {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM employee_groups WHERE id = ?').get(id) as EmployeeGroup | undefined;
  if (!existing) return false;

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE employees 
      SET group_id = NULL, group_name = NULL 
      WHERE group_id = ? OR group_name = ?
    `).run(id, existing.name);

    db.prepare('DELETE FROM employee_groups WHERE id = ?').run(id);
  });
  tx();
  return true;
}

export function assignEmployeeGroup(employeeId: string, groupId: string | null): void {
  const db = getDb();
  if (!groupId) {
    db.prepare('UPDATE employees SET group_id = NULL, group_name = NULL WHERE id = ?').run(employeeId);
    return;
  }
  const group = db.prepare('SELECT * FROM employee_groups WHERE id = ?').get(groupId) as EmployeeGroup | undefined;
  if (!group) return;
  db.prepare('UPDATE employees SET group_id = ?, group_name = ? WHERE id = ?').run(group.id, group.name, employeeId);
}


export function getPayrollPeriods(): PayrollPeriod[] {
  const db = getDb();
  return db.prepare("SELECT * FROM payroll_periods ORDER BY start_date DESC").all() as PayrollPeriod[];
}

export function getPayrollPeriod(id: string): PayrollPeriod | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM payroll_periods WHERE id = ? OR name = ?").get(id, id) as PayrollPeriod | undefined;
  return row || null;
}

export function savePayrollPeriod(period: Partial<PayrollPeriod>): void {
  const db = getDb();
  const id = period.id || `period-${period.start_date?.substring(0, 7)}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO payroll_periods (id, name, start_date, end_date, working_days, working_hours_per_day, status, locked_by, locked_at, approved_by, approved_at, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      working_days = excluded.working_days,
      working_hours_per_day = excluded.working_hours_per_day,
      status = excluded.status,
      locked_by = excluded.locked_by,
      locked_at = excluded.locked_at,
      approved_by = excluded.approved_by,
      approved_at = excluded.approved_at,
      notes = excluded.notes
  `).run(
    id,
    period.name,
    period.start_date,
    period.end_date,
    period.working_days ?? 26,
    period.working_hours_per_day ?? 8,
    period.status || 'Draft',
    period.locked_by || null,
    period.locked_at || null,
    period.approved_by || null,
    period.approved_at || null,
    period.notes || null,
    now
  );
}

export function getAuditLogs(limit = 100): AuditLogEntry[] {
  const db = getDb();
  return db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?").all(limit) as AuditLogEntry[];
}

export function logAudit(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): void {
  const db = getDb();
  const id = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, action, module, record_id, old_value, new_value, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'))
  `).run(
    id,
    entry.user_id || 'system',
    entry.user_name || 'System Admin',
    entry.action,
    entry.module,
    entry.record_id || null,
    entry.old_value || null,
    entry.new_value || null,
    entry.ip_address || null
  );
}

export function resetDatabase() {
  const connStr = process.env.DATABASE_URL || 'postgresql://hrm_user:hrm_password@127.0.0.1:5432/hrm_db';

  // Backup current db
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupPath = path.join(backupDir, `safety_before_reset_${timestamp}.sql`);
  try {
    execSync(`pg_dump "${connStr}" -f "${backupPath}"`, { stdio: 'pipe' });
  } catch (err) {
    console.warn('Error creating backup before reset:', err);
  }

  // Re-create public schema in PostgreSQL
  try {
    execSync(`psql "${connStr}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO hrm_user; GRANT ALL ON SCHEMA public TO public;"`, { stdio: 'pipe' });
  } catch (err) {
    console.warn('Error resetting schema:', err);
  }

  const db = getDb();
  initDatabase(db);

  const tables = db.prepare("SELECT tablename as name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename").all() as any[];
  const tableCounts: Record<string, number> = {};
  for (const t of tables) {
    try {
      const row = db.prepare(`SELECT count(*) as count FROM "${t.name}"`).get() as { count: number };
      tableCounts[t.name] = row ? row.count : 0;
    } catch {}
  }

  return { success: true, tableCounts };
}

export interface BackupResult {
  backupPath: string;
  fileName: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
}

export async function backupDatabase(customDestPath?: string): Promise<BackupResult> {
  const db = getDb();

  const backupDir = path.join(process.cwd(), 'data', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const fileName = `hestrahrm_backup_${timestamp}.sql`;
  const destPath = customDestPath || path.join(backupDir, fileName);

  await db.backup(destPath);

  const stats = fs.statSync(/*turbopackIgnore: true*/ destPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  const sizeFormatted = stats.size >= 1024 * 1024 
    ? `${sizeMb} MB` 
    : `${(stats.size / 1024).toFixed(1)} KB`;

  logAudit({
    action: 'BACKUP',
    module: 'Database',
    record_id: fileName,
    new_value: `Created PostgreSQL backup: ${fileName} (${sizeFormatted})`,
  });

  return {
    backupPath: destPath,
    fileName,
    size: stats.size,
    sizeFormatted,
    createdAt: now.toISOString(),
  };
}

export function sanitizeDatabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return 'PostgreSQL (hrm_db)';
  try {
    const parsed = new URL(rawUrl);
    if (parsed.username || parsed.password) {
      parsed.username = '***';
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return rawUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  }
}

export function getDatabaseDiagnostics(): DatabaseStats {
  const db = getDb();
  const dbDir = path.join(process.cwd(), 'data');
  const backupDir = path.join(dbDir, 'backups');

  let dbSize = 0;
  try {
    const sizeRow = db.prepare("SELECT pg_database_size(current_database()) as size").get() as { size: number } | undefined;
    if (sizeRow && sizeRow.size) {
      dbSize = Number(sizeRow.size);
    }
  } catch {
    if (fs.existsSync(DB_PATH)) {
      try {
        dbSize = fs.statSync(DB_PATH).size;
      } catch {}
    }
  }

  const walSize = 0;

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const tables = db.prepare("SELECT tablename as name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename").all() as any[];
  const tableStats: { name: string; rowCount: number }[] = [];
  let totalRecords = 0;

  for (const t of tables) {
    try {
      const row = db.prepare(`SELECT count(*) as count FROM "${t.name}"`).get() as { count: number };
      const rowCount = row ? row.count : 0;
      tableStats.push({ name: t.name, rowCount });
      totalRecords += rowCount;
    } catch {
      tableStats.push({ name: t.name, rowCount: 0 });
    }
  }

  const journalMode = 'PostgreSQL';

  const backups: DatabaseBackupItem[] = [];

  // 1. Check data/backups/
  if (fs.existsSync(backupDir)) {
    try {
      const files = fs.readdirSync(backupDir);
      for (const f of files) {
        if (f.endsWith('.sqlite') || f.endsWith('.db') || f.endsWith('.sql')) {
          const fullPath = path.join(backupDir, f);
          try {
            const st = fs.statSync(fullPath);
            backups.push({
              fileName: f,
              path: fullPath,
              size: st.size,
              sizeFormatted: formatBytes(st.size),
              createdAt: st.mtime.toISOString(),
              type: 'manual',
            });
          } catch {}
        }
      }
    } catch {}
  }

  // 2. Check data/ for safety backups (hr.db.bak.*)
  if (fs.existsSync(dbDir)) {
    try {
      const files = fs.readdirSync(dbDir);
      for (const f of files) {
        if (f.startsWith('hr.db.bak.') || f.endsWith('.sql')) {
          const fullPath = path.join(dbDir, f);
          try {
            const st = fs.statSync(fullPath);
            backups.push({
              fileName: f,
              path: fullPath,
              size: st.size,
              sizeFormatted: formatBytes(st.size),
              createdAt: st.mtime.toISOString(),
              type: f.startsWith('hr.db.bak.') ? 'safety' : 'seed',
            });
          } catch {}
        }
      }
    } catch {}
  }

  backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    fileSize: dbSize,
    fileSizeFormatted: formatBytes(dbSize),
    walSize,
    walSizeFormatted: formatBytes(walSize),
    totalTables: tableStats.length,
    totalRecords,
    journalMode,
    tables: tableStats,
    backups,
    engine: 'PostgreSQL 18',
    databasePath: sanitizeDatabaseUrl(process.env.DATABASE_URL || 'postgresql://hrm_user:hrm_password@127.0.0.1:5432/hrm_db'),
  };
}

export function validateBackupFile(filePath: string): { valid: boolean; type: 'sqlite' | 'sql'; error?: string; tableCount?: number } {
  if (!fs.existsSync(filePath)) {
    return { valid: false, type: 'sql', error: 'File does not exist' };
  }
  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    return { valid: false, type: 'sql', error: 'File is empty (0 bytes)' };
  }

  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(100);
  const bytesRead = fs.readSync(fd, buffer, 0, Math.min(100, stats.size), 0);
  fs.closeSync(fd);

  const headerStr = buffer.subarray(0, 16).toString('utf8');
  if (headerStr.startsWith('SQLite format 3')) {
    let testDb: any = null;
    try {
      testDb = new SQLite(filePath, { readonly: true, timeout: 5000 });
      const integrity = testDb.pragma('integrity_check') as any[];
      const isIntegrityOk = integrity && integrity.length > 0 && integrity[0].integrity_check === 'ok';
      if (!isIntegrityOk) {
        testDb.close();
        return { valid: false, type: 'sqlite', error: 'SQLite integrity check failed. The database file may be corrupted.' };
      }

      const countRow = testDb.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get() as { count: number };
      const tableCount = countRow ? countRow.count : 0;
      testDb.close();

      return { valid: true, type: 'sqlite', tableCount };
    } catch (err: any) {
      if (testDb) {
        try { testDb.close(); } catch {}
      }
      return { valid: false, type: 'sqlite', error: `Corrupt or invalid SQLite database: ${err.message}` };
    }
  }

  const textHeader = buffer.subarray(0, bytesRead).toString('utf8');
  if (
    filePath.endsWith('.sql') ||
    textHeader.includes('PRAGMA') ||
    textHeader.includes('CREATE TABLE') ||
    textHeader.includes('INSERT INTO') ||
    textHeader.includes('PostgreSQL database dump') ||
    textHeader.includes('SET statement_timeout') ||
    textHeader.includes('BEGIN')
  ) {
    return { valid: true, type: 'sql' };
  }

  return { valid: false, type: 'sql', error: 'The provided file is neither a valid database backup nor a SQL script.' };
}

export function restoreDatabase(sourceFilePath: string, originalFileName?: string): RestoreResult {
  const validation = validateBackupFile(sourceFilePath);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid database backup file');
  }

  const connStr = process.env.DATABASE_URL || 'postgresql://hrm_user:hrm_password@127.0.0.1:5432/hrm_db';

  // 1. Safety snapshot of current database
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const safetyBackupPath = path.join(backupDir, `safety_before_restore_${timestamp}.sql`);
  try {
    execSync(`pg_dump "${connStr}" -f "${safetyBackupPath}"`, { stdio: 'pipe' });
  } catch (err) {
    console.warn('Safety dump warning before restore:', err);
  }

  // 2. Perform restore based on file type
  if (validation.type === 'sqlite') {
    // Legacy SQLite backup: use migrate-sqlite-to-postgres.js
    const migrateScript = path.join(process.cwd(), 'scripts', 'migrate-sqlite-to-postgres.js');
    execSync(`node "${migrateScript}" "${sourceFilePath}"`, { stdio: 'inherit' });
  } else {
    // SQL file (PostgreSQL dump or generic SQL)
    execSync(`psql "${connStr}" -f "${sourceFilePath}"`, { stdio: 'inherit' });
  }

  const db = getDb();
  initDatabase(db);

  // 3. Gather restored stats
  const tables = db.prepare("SELECT tablename as name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename").all() as any[];
  const tableCounts: Record<string, number> = {};
  let totalRecords = 0;
  for (const t of tables) {
    try {
      const row = db.prepare(`SELECT count(*) as count FROM "${t.name}"`).get() as { count: number };
      const c = row ? row.count : 0;
      tableCounts[t.name] = c;
      totalRecords += c;
    } catch {
      tableCounts[t.name] = 0;
    }
  }

  const recordName = originalFileName || path.basename(sourceFilePath);
  logAudit({
    action: 'RESTORE',
    module: 'Database',
    record_id: recordName,
    new_value: `Restored database from ${recordName}: ${tables.length} tables, ${totalRecords} records`,
  });

  return {
    success: true,
    tableCounts,
    totalTables: tables.length,
    totalRecords,
    sourceFile: recordName,
  };
}

// ==========================================
// 12. IT Inventory & Asset Management
// ==========================================

export function seedITAssetsIfEmpty(_db: PostgresDatabase) {
  // Demo IT assets auto-seeding is permanently disabled for production.
  return;
}

export function getITAssets(options?: {
  search?: string;
  category?: string;
  status?: string;
  department?: string;
  assigned_to?: string;
}): { assets: ITAsset[]; summary: any } {
  const db = getDb();
  let sql = `
    SELECT 
      a.*,
      a.windows_operation as os_version,
      a.device_username as username,
      a.device_password as password,
      e.first_name || ' ' || e.last_name as assigned_employee_name,
      e.khmer_name as assigned_khmer_name,
      e.role as assigned_role,
      e.avatar as assigned_avatar,
      ed.name as assigned_department,
      d.name as department_name
    FROM it_assets a
    LEFT JOIN employees e ON e.id = a.assigned_to
    LEFT JOIN departments ed ON ed.id = e.department_id
    LEFT JOIN departments d ON d.id = a.department_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options?.category && options.category !== 'all') {
    sql += ' AND a.category = ?';
    params.push(options.category);
  }

  if (options?.status && options.status !== 'all') {
    sql += ' AND a.status = ?';
    params.push(options.status);
  }

  if (options?.department && options.department !== 'all') {
    sql += ' AND (a.department_id = ? OR e.department_id = ?)';
    params.push(options.department, options.department);
  }

  if (options?.assigned_to) {
    sql += ' AND a.assigned_to = ?';
    params.push(options.assigned_to);
  }

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    sql += ` AND (
      a.asset_tag LIKE ? OR
      a.name LIKE ? OR
      a.brand LIKE ? OR
      a.model LIKE ? OR
      a.serial_number LIKE ? OR
      a.location LIKE ? OR
      a.ip_address LIKE ? OR
      a.windows_operation LIKE ? OR
      a.m365_account LIKE ? OR
      a.device_username LIKE ? OR
      a.local_account LIKE ? OR
      e.first_name LIKE ? OR
      e.last_name LIKE ? OR
      e.khmer_name LIKE ? OR
      e.id LIKE ?
    )`;
    for (let i = 0; i < 15; i++) params.push(term);
  }

  sql += ' ORDER BY a.created_at DESC';

  const rows = db.prepare(sql).all(...params) as any[];

  // Calculate overall statistics across all assets
  const allRows = db.prepare(`SELECT status, category, purchase_cost FROM it_assets`).all() as any[];
  const totalAssets = allRows.length;
  const totalValue = allRows.reduce((sum, r) => sum + (Number(r.purchase_cost) || 0), 0);
  const inUseCount = allRows.filter((r) => r.status === 'In Use').length;
  const availableCount = allRows.filter((r) => r.status === 'Available').length;
  const maintenanceCount = allRows.filter((r) => r.status === 'Maintenance' || r.status === 'Damaged').length;
  const biometricCount = allRows.filter((r) => r.category === 'Biometric & Clocks').length;

  const categoryCounts: Record<string, number> = {};
  allRows.forEach((r) => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });

  return {
    assets: rows,
    summary: {
      total_assets: totalAssets,
      total_value: Math.round(totalValue * 100) / 100,
      in_use: inUseCount,
      available: availableCount,
      maintenance: maintenanceCount,
      biometric_count: biometricCount,
      category_counts: categoryCounts,
    },
  };
}

export function getITAssetById(id: string): ITAsset | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT 
      a.*,
      a.windows_operation as os_version,
      a.device_username as username,
      a.device_password as password,
      e.first_name || ' ' || e.last_name as assigned_employee_name,
      e.khmer_name as assigned_khmer_name,
      e.role as assigned_role,
      e.avatar as assigned_avatar,
      ed.name as assigned_department,
      d.name as department_name
    FROM it_assets a
    LEFT JOIN employees e ON e.id = a.assigned_to
    LEFT JOIN departments ed ON ed.id = e.department_id
    LEFT JOIN departments d ON d.id = a.department_id
    WHERE a.id = ? OR a.asset_tag = ?
  `).get(id, id) as any;
  return row || null;
}

export function createITAsset(asset: Partial<ITAsset>, createdBy: string = 'Administrator'): ITAsset {
  const db = getDb();
  const id = asset.id || `ast-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  // Auto-generate asset tag if missing
  let tag = asset.asset_tag;
  if (!tag) {
    const prefix = asset.category === 'Biometric & Clocks' ? 'IT-FPT'
      : asset.category === 'Laptops & Computers' ? 'IT-LPT'
      : asset.category === 'Barcode Scanners' ? 'IT-SCN'
      : asset.category === 'Printers & Imaging' ? 'IT-PRN'
      : asset.category === 'Monitors & Displays' ? 'IT-MON'
      : asset.category === 'Network & Servers' ? 'IT-NET'
      : asset.category === 'Mobile & Tablets' ? 'IT-TAB'
      : asset.category === 'Software & Cloud Licenses' ? 'IT-M365'
      : 'IT-AST';
    const countRow = db.prepare(`SELECT count(*) as count FROM it_assets WHERE asset_tag LIKE ?`).get(`${prefix}%`) as { count: number };
    const num = (countRow.count + 1).toString().padStart(3, '0');
    tag = `${prefix}-${num}`;
  }

  const initialStatus = asset.assigned_to ? 'In Use' : (asset.status || 'Available');
  const assignedDate = asset.assigned_to ? (asset.assigned_date || now) : null;
  const windowsOp = asset.windows_operation || asset.os_version || null;
  const m365Acc = asset.m365_account || null;
  const localAcc = asset.local_account || null;
  const devUser = asset.device_username || asset.username || null;
  const devPass = asset.device_password || asset.password || null;

  db.prepare(`
    INSERT INTO it_assets (
      id, asset_tag, name, category, brand, model, serial_number,
      status, condition, assigned_to, assigned_date, department_id,
      location, ip_address, purchase_date, purchase_cost, warranty_end,
      specs, notes, windows_operation, m365_account, local_account,
      device_username, device_password, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `).run(
    id,
    tag,
    asset.name,
    asset.category || 'Laptops & Computers',
    asset.brand || 'Generic',
    asset.model || 'Standard',
    asset.serial_number || null,
    initialStatus,
    asset.condition || 'Good',
    asset.assigned_to || null,
    assignedDate,
    asset.department_id || null,
    asset.location || null,
    asset.ip_address || null,
    asset.purchase_date || null,
    Number(asset.purchase_cost) || 0,
    asset.warranty_end || null,
    asset.specs || null,
    asset.notes || null,
    windowsOp,
    m365Acc,
    localAcc,
    devUser,
    devPass,
    now,
    now
  );

  // Write log
  db.prepare(`
    INSERT INTO it_asset_logs (id, asset_id, action, performed_by, employee_id, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    `log-${Date.now()}`,
    id,
    'Created',
    createdBy,
    asset.assigned_to || null,
    `New asset registered (${tag} - ${asset.name})`,
    now
  );

  logAudit({
    action: 'CREATE',
    module: 'IT Inventory',
    record_id: tag,
    new_value: `Created asset ${tag} (${asset.name}) in category ${asset.category}`,
  });

  return getITAssetById(id)!;
}

export function updateITAsset(id: string, updates: Partial<ITAsset>, updatedBy: string = 'Administrator'): ITAsset | null {
  const db = getDb();
  const existing = getITAssetById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const status = updates.status !== undefined ? updates.status : existing.status;
  const condition = updates.condition !== undefined ? updates.condition : existing.condition;
  const assignedTo = updates.assigned_to !== undefined ? updates.assigned_to : existing.assigned_to;
  const assignedDate = updates.assigned_to ? (updates.assigned_date || existing.assigned_date || now) : (updates.assigned_to === null ? null : existing.assigned_date);
  const windowsOp = updates.windows_operation !== undefined ? updates.windows_operation : (updates.os_version !== undefined ? updates.os_version : existing.windows_operation);
  const m365Acc = updates.m365_account !== undefined ? updates.m365_account : existing.m365_account;
  const localAcc = updates.local_account !== undefined ? updates.local_account : existing.local_account;
  const devUser = updates.device_username !== undefined ? updates.device_username : (updates.username !== undefined ? updates.username : existing.device_username);
  const devPass = updates.device_password !== undefined ? updates.device_password : (updates.password !== undefined ? updates.password : existing.device_password);

  db.prepare(`
    UPDATE it_assets SET
      asset_tag = COALESCE(?, asset_tag),
      name = COALESCE(?, name),
      category = COALESCE(?, category),
      brand = COALESCE(?, brand),
      model = COALESCE(?, model),
      serial_number = COALESCE(?, serial_number),
      status = ?,
      condition = ?,
      assigned_to = ?,
      assigned_date = ?,
      department_id = COALESCE(?, department_id),
      location = COALESCE(?, location),
      ip_address = ?,
      purchase_date = COALESCE(?, purchase_date),
      purchase_cost = COALESCE(?, purchase_cost),
      warranty_end = COALESCE(?, warranty_end),
      specs = COALESCE(?, specs),
      notes = COALESCE(?, notes),
      windows_operation = ?,
      m365_account = ?,
      local_account = ?,
      device_username = ?,
      device_password = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    updates.asset_tag,
    updates.name,
    updates.category,
    updates.brand,
    updates.model,
    updates.serial_number,
    status,
    condition,
    assignedTo,
    assignedDate,
    updates.department_id,
    updates.location,
    updates.ip_address !== undefined ? updates.ip_address : existing.ip_address,
    updates.purchase_date,
    updates.purchase_cost !== undefined ? Number(updates.purchase_cost) : existing.purchase_cost,
    updates.warranty_end,
    updates.specs,
    updates.notes,
    windowsOp,
    m365Acc,
    localAcc,
    devUser,
    devPass,
    now,
    existing.id
  );

  // If status changed, record log
  if (updates.status && updates.status !== existing.status) {
    db.prepare(`
      INSERT INTO it_asset_logs (id, asset_id, action, performed_by, employee_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}`,
      existing.id,
      'Status Changed',
      updatedBy,
      assignedTo,
      `Status changed from ${existing.status} to ${updates.status}`,
      now
    );
  }

  // If assignment changed, record log
  if (updates.assigned_to !== undefined && updates.assigned_to !== existing.assigned_to) {
    const action = updates.assigned_to ? 'Assigned' : 'Returned';
    const notes = updates.assigned_to
      ? `Assigned to employee ${updates.assigned_to}`
      : 'Returned to IT inventory warehouse';
    db.prepare(`
      INSERT INTO it_asset_logs (id, asset_id, action, performed_by, employee_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      existing.id,
      action,
      updatedBy,
      updates.assigned_to || existing.assigned_to,
      notes,
      now
    );
  }

  logAudit({
    action: 'UPDATE',
    module: 'IT Inventory',
    record_id: existing.asset_tag,
    old_value: JSON.stringify(existing),
    new_value: JSON.stringify(updates),
  });

  return getITAssetById(existing.id);
}

export function deleteITAsset(id: string, deletedBy: string = 'Administrator'): boolean {
  const db = getDb();
  const existing = getITAssetById(id);
  if (!existing) return false;

  db.prepare(`DELETE FROM it_asset_logs WHERE asset_id = ?`).run(existing.id);
  const res = db.prepare(`DELETE FROM it_assets WHERE id = ?`).run(existing.id);

  logAudit({
    action: 'DELETE',
    module: 'IT Inventory',
    record_id: existing.asset_tag,
    old_value: `Deleted asset ${existing.asset_tag} (${existing.name}) by ${deletedBy}`,
  });

  return res.changes > 0;
}

export function assignITAsset(
  assetId: string,
  employeeId: string | null,
  performedBy: string = 'IT Administrator',
  notes?: string
): ITAsset | null {
  const db = getDb();
  const asset = getITAssetById(assetId);
  if (!asset) return null;

  const now = new Date().toISOString();

  if (employeeId) {
    // Assigning to employee
    const emp = db.prepare(`SELECT first_name, last_name, khmer_name FROM employees WHERE id = ?`).get(employeeId) as any;
    const empName = emp ? `${emp.first_name} ${emp.last_name}${emp.khmer_name ? ` (${emp.khmer_name})` : ''}` : employeeId;

    db.prepare(`
      UPDATE it_assets SET
        assigned_to = ?,
        assigned_date = ?,
        status = 'In Use',
        updated_at = ?
      WHERE id = ?
    `).run(employeeId, now, now, asset.id);

    db.prepare(`
      INSERT INTO it_asset_logs (id, asset_id, action, performed_by, employee_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}`,
      asset.id,
      'Assigned',
      performedBy,
      employeeId,
      notes || `Equipment checked out & assigned to ${empName}.`,
      now
    );

    logAudit({
      action: 'ASSIGN',
      module: 'IT Inventory',
      record_id: asset.asset_tag,
      new_value: `Assigned ${asset.asset_tag} to ${empName}`,
    });
  } else {
    // Returning to stock
    const prevEmp = asset.assigned_to;
    db.prepare(`
      UPDATE it_assets SET
        assigned_to = NULL,
        assigned_date = NULL,
        status = 'Available',
        updated_at = ?
      WHERE id = ?
    `).run(now, asset.id);

    db.prepare(`
      INSERT INTO it_asset_logs (id, asset_id, action, performed_by, employee_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}`,
      asset.id,
      'Returned',
      performedBy,
      prevEmp,
      notes || `Equipment returned from previous user to IT stock.`,
      now
    );

    logAudit({
      action: 'RETURN',
      module: 'IT Inventory',
      record_id: asset.asset_tag,
      new_value: `Returned ${asset.asset_tag} to IT stock`,
    });
  }

  return getITAssetById(asset.id);
}

export function getITAssetLogs(assetId?: string): ITAssetLog[] {
  const db = getDb();
  let sql = `
    SELECT 
      l.*,
      a.asset_tag,
      a.name as asset_name,
      e.first_name || ' ' || e.last_name as employee_name
    FROM it_asset_logs l
    LEFT JOIN it_assets a ON a.id = l.asset_id
    LEFT JOIN employees e ON e.id = l.employee_id
  `;
  const params: any[] = [];
  if (assetId) {
    sql += ` WHERE l.asset_id = ? OR a.asset_tag = ?`;
    params.push(assetId, assetId);
  }
  sql += ` ORDER BY l.created_at DESC LIMIT 100`;

  return db.prepare(sql).all(...params) as any[];
}

// ==========================================
// 13. Microsoft 365 Cloud Accounts & Licenses
// ==========================================

export function seedM365AccountsIfEmpty(_db: PostgresDatabase) {
  // Demo M365 accounts auto-seeding is permanently disabled for production.
  return;
}

export function getM365Accounts(options?: {
  search?: string;
  plan?: string;
  status?: string;
  department?: string;
}): { accounts: M365Account[]; overview: M365Overview } {
  const db = getDb();
  let sql = `
    SELECT 
      m.*,
      e.first_name || ' ' || e.last_name as assigned_employee_name,
      e.khmer_name as assigned_khmer_name,
      e.role as assigned_role,
      e.avatar as assigned_avatar,
      ed.name as assigned_department
    FROM it_m365_accounts m
    LEFT JOIN employees e ON e.id = m.assigned_to
    LEFT JOIN departments ed ON ed.id = e.department_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options?.plan && options.plan !== 'all') {
    sql += ' AND m.license_plan = ?';
    params.push(options.plan);
  }

  if (options?.status && options.status !== 'all') {
    sql += ' AND m.status = ?';
    params.push(options.status);
  }

  if (options?.department && options.department !== 'all') {
    sql += ' AND ed.name = ?';
    params.push(options.department);
  }

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    sql += ` AND (
      m.email LIKE ? OR
      m.display_name LIKE ? OR
      m.license_plan LIKE ? OR
      m.admin_notes LIKE ? OR
      e.first_name LIKE ? OR
      e.last_name LIKE ? OR
      e.khmer_name LIKE ? OR
      e.id LIKE ?
    )`;
    for (let i = 0; i < 8; i++) params.push(term);
  }

  sql += ' ORDER BY m.created_at DESC';

  const rows = db.prepare(sql).all(...params) as M365Account[];

  // Compute overview across all accounts
  const allAccounts = db.prepare(`SELECT * FROM it_m365_accounts`).all() as M365Account[];
  const totalLicenses = allAccounts.length;
  const assignedCount = allAccounts.filter((a) => a.assigned_to && a.status === 'Active').length;
  const availableCount = allAccounts.filter((a) => !a.assigned_to || a.status === 'Available').length;
  const suspendedCount = allAccounts.filter((a) => a.status === 'Suspended').length;
  const mfaEnforcedCount = allAccounts.filter((a) => a.mfa_status === 'Enforced').length;
  const mfaEnforcedRate = totalLicenses > 0 ? Math.round((mfaEnforcedCount / totalLicenses) * 100) : 0;
  const totalMonthlySpend = allAccounts.reduce((sum, a) => sum + (Number(a.monthly_cost) || 0), 0);
  const totalAnnualSpend = Math.round(totalMonthlySpend * 12 * 100) / 100;

  const planBreakdown: Record<string, { total: number; assigned: number; available: number }> = {};
  for (const a of allAccounts) {
    if (!planBreakdown[a.license_plan]) {
      planBreakdown[a.license_plan] = { total: 0, assigned: 0, available: 0 };
    }
    planBreakdown[a.license_plan].total += 1;
    if (a.assigned_to && a.status === 'Active') {
      planBreakdown[a.license_plan].assigned += 1;
    } else {
      planBreakdown[a.license_plan].available += 1;
    }
  }

  return {
    accounts: rows,
    overview: {
      totalLicenses,
      assignedCount,
      availableCount,
      suspendedCount,
      mfaEnforcedCount,
      mfaEnforcedRate,
      totalMonthlySpend: Math.round(totalMonthlySpend * 100) / 100,
      totalAnnualSpend,
      planBreakdown,
    },
  };
}

export function getM365AccountById(id: string): M365Account | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT 
      m.*,
      e.first_name || ' ' || e.last_name as assigned_employee_name,
      e.khmer_name as assigned_khmer_name,
      e.role as assigned_role,
      e.avatar as assigned_avatar,
      ed.name as assigned_department
    FROM it_m365_accounts m
    LEFT JOIN employees e ON e.id = m.assigned_to
    LEFT JOIN departments ed ON ed.id = e.department_id
    WHERE m.id = ? OR m.email = ?
  `).get(id, id) as any;
  return row || null;
}

export function createM365Account(account: Partial<M365Account>, createdBy: string = 'Administrator'): M365Account {
  const db = getDb();
  const id = account.id || `m365-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  // Normalize email
  const email = (account.email || '').trim().toLowerCase();
  const displayName = account.display_name?.trim() || email.split('@')[0] || 'M365 User';
  const plan = account.license_plan || 'Microsoft 365 Business Standard';
  const status = account.assigned_to ? 'Active' : (account.status || 'Available');
  const assignedDate = account.assigned_to ? (account.assigned_date || now) : null;
  const mfaStatus = account.mfa_status || 'Enforced';
  const monthlyCost = account.monthly_cost !== undefined ? Number(account.monthly_cost) : (
    plan.includes('Premium') ? 22.00 :
    plan.includes('Standard') ? 12.50 :
    plan.includes('Basic') ? 6.00 :
    plan.includes('E3') ? 23.00 :
    plan.includes('E5') ? 38.00 :
    plan.includes('Exchange') ? 4.00 : 12.50
  );

  db.prepare(`
    INSERT INTO it_m365_accounts (
      id, email, display_name, license_plan, status, assigned_to, assigned_date,
      mfa_status, mailbox_usage_gb, mailbox_quota_gb, onedrive_usage_gb, onedrive_quota_gb,
      monthly_cost, renewal_date, admin_notes, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `).run(
    id,
    email,
    displayName,
    plan,
    status,
    account.assigned_to || null,
    assignedDate,
    mfaStatus,
    Number(account.mailbox_usage_gb) || 0,
    Number(account.mailbox_quota_gb) || 50,
    Number(account.onedrive_usage_gb) || 0,
    Number(account.onedrive_quota_gb) || (plan.includes('Exchange') ? 0 : 1024),
    monthlyCost,
    account.renewal_date || null,
    account.admin_notes || null,
    now,
    now
  );

  // Sync to it_assets
  const countRow = db.prepare(`SELECT count(*) as count FROM it_assets WHERE asset_tag LIKE 'IT-M365-%'`).get() as { count: number };
  const assetTag = `IT-M365-${(countRow.count + 1).toString().padStart(3, '0')}`;
  const assetId = `ast-m365-${id}`;

  db.prepare(`
    INSERT OR REPLACE INTO it_assets (
      id, asset_tag, name, category, brand, model, serial_number,
      status, condition, assigned_to, assigned_date, department_id,
      location, ip_address, purchase_date, purchase_cost, warranty_end,
      specs, notes, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `).run(
    assetId,
    assetTag,
    `M365: ${email}`,
    'Software & Cloud Licenses',
    'Microsoft',
    plan,
    email,
    status === 'Active' ? 'In Use' : status,
    'Good',
    account.assigned_to || null,
    assignedDate,
    null,
    'Microsoft Cloud (Asia Pacific Tenant)',
    null,
    now.split('T')[0],
    monthlyCost,
    account.renewal_date || null,
    `Plan: ${plan} | MFA: ${mfaStatus} | Mailbox: ${account.mailbox_quota_gb || 50}GB`,
    account.admin_notes || 'Microsoft 365 cloud subscription.',
    now,
    now
  );

  // Log
  db.prepare(`
    INSERT INTO it_asset_logs (id, asset_id, action, performed_by, employee_id, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    `log-${Date.now()}`,
    assetId,
    account.assigned_to ? 'Assigned' : 'Created',
    createdBy,
    account.assigned_to || null,
    `Microsoft 365 account registered (${email} - ${plan})`,
    now
  );

  logAudit({
    action: 'CREATE',
    module: 'IT Inventory',
    record_id: email,
    new_value: `Created M365 account ${email} (${plan}) assigned to ${account.assigned_to || 'License Pool'}`,
  });

  return getM365AccountById(id)!;
}

export function updateM365Account(id: string, updates: Partial<M365Account>, updatedBy: string = 'Administrator'): M365Account | null {
  const db = getDb();
  const existing = getM365AccountById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const email = updates.email ? updates.email.trim().toLowerCase() : existing.email;
  const displayName = updates.display_name !== undefined ? updates.display_name.trim() : existing.display_name;
  const plan = updates.license_plan || existing.license_plan;
  const status = updates.status || existing.status;
  const assignedTo = updates.assigned_to !== undefined ? updates.assigned_to : existing.assigned_to;
  const assignedDate = updates.assigned_to ? (updates.assigned_date || existing.assigned_date || now) : (updates.assigned_to === null ? null : existing.assigned_date);
  const mfaStatus = updates.mfa_status || existing.mfa_status;
  const mailboxUsage = updates.mailbox_usage_gb !== undefined ? Number(updates.mailbox_usage_gb) : existing.mailbox_usage_gb;
  const mailboxQuota = updates.mailbox_quota_gb !== undefined ? Number(updates.mailbox_quota_gb) : existing.mailbox_quota_gb;
  const onedriveUsage = updates.onedrive_usage_gb !== undefined ? Number(updates.onedrive_usage_gb) : existing.onedrive_usage_gb;
  const onedriveQuota = updates.onedrive_quota_gb !== undefined ? Number(updates.onedrive_quota_gb) : existing.onedrive_quota_gb;
  const monthlyCost = updates.monthly_cost !== undefined ? Number(updates.monthly_cost) : existing.monthly_cost;
  const renewalDate = updates.renewal_date !== undefined ? updates.renewal_date : existing.renewal_date;
  const notes = updates.admin_notes !== undefined ? updates.admin_notes : existing.admin_notes;

  db.prepare(`
    UPDATE it_m365_accounts SET
      email = ?,
      display_name = ?,
      license_plan = ?,
      status = ?,
      assigned_to = ?,
      assigned_date = ?,
      mfa_status = ?,
      mailbox_usage_gb = ?,
      mailbox_quota_gb = ?,
      onedrive_usage_gb = ?,
      onedrive_quota_gb = ?,
      monthly_cost = ?,
      renewal_date = ?,
      admin_notes = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    email,
    displayName,
    plan,
    status,
    assignedTo,
    assignedDate,
    mfaStatus,
    mailboxUsage,
    mailboxQuota,
    onedriveUsage,
    onedriveQuota,
    monthlyCost,
    renewalDate,
    notes,
    now,
    existing.id
  );

  // Sync to it_assets if matching record exists
  const assetId = `ast-m365-${existing.id}`;
  db.prepare(`
    UPDATE it_assets SET
      name = ?,
      model = ?,
      serial_number = ?,
      status = ?,
      assigned_to = ?,
      assigned_date = ?,
      purchase_cost = ?,
      warranty_end = ?,
      specs = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ? OR serial_number = ?
  `).run(
    `M365: ${email}`,
    plan,
    email,
    status === 'Active' ? 'In Use' : status,
    assignedTo,
    assignedDate,
    monthlyCost,
    renewalDate || null,
    `Plan: ${plan} | MFA: ${mfaStatus} | Mailbox: ${mailboxQuota}GB`,
    notes || null,
    now,
    assetId,
    existing.email
  );

  // Log status or assignment changes
  if (updates.status && updates.status !== existing.status) {
    db.prepare(`
      INSERT INTO it_asset_logs (id, asset_id, action, performed_by, employee_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}`,
      assetId,
      'Status Changed',
      updatedBy,
      assignedTo,
      `M365 Account ${email} status changed from ${existing.status} to ${updates.status}`,
      now
    );
  }

  logAudit({
    action: 'UPDATE',
    module: 'IT Inventory',
    record_id: email,
    old_value: JSON.stringify(existing),
    new_value: JSON.stringify(updates),
  });

  return getM365AccountById(existing.id);
}

export function assignM365Account(
  accountId: string,
  employeeId: string | null,
  performedBy: string = 'IT Administrator',
  notes?: string
): M365Account | null {
  const db = getDb();
  const acc = getM365AccountById(accountId);
  if (!acc) return null;

  const now = new Date().toISOString();
  const assetId = `ast-m365-${acc.id}`;

  if (employeeId) {
    const emp = db.prepare(`SELECT first_name, last_name, khmer_name FROM employees WHERE id = ?`).get(employeeId) as any;
    const empName = emp ? `${emp.first_name} ${emp.last_name}${emp.khmer_name ? ` (${emp.khmer_name})` : ''}` : employeeId;

    db.prepare(`
      UPDATE it_m365_accounts SET
        assigned_to = ?,
        assigned_date = ?,
        status = 'Active',
        updated_at = ?
      WHERE id = ?
    `).run(employeeId, now, now, acc.id);

    db.prepare(`
      UPDATE it_assets SET
        assigned_to = ?,
        assigned_date = ?,
        status = 'In Use',
        updated_at = ?
      WHERE id = ? OR serial_number = ?
    `).run(employeeId, now, now, assetId, acc.email);

    db.prepare(`
      INSERT INTO it_asset_logs (id, asset_id, action, performed_by, employee_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}`,
      assetId,
      'Assigned',
      performedBy,
      employeeId,
      notes || `M365 cloud license (${acc.license_plan}) assigned to ${empName}.`,
      now
    );

    logAudit({
      action: 'ASSIGN',
      module: 'IT Inventory',
      record_id: acc.email,
      new_value: `Assigned M365 license ${acc.email} to ${empName}`,
    });
  } else {
    const prevEmp = acc.assigned_to;
    db.prepare(`
      UPDATE it_m365_accounts SET
        assigned_to = NULL,
        assigned_date = NULL,
        status = 'Available',
        updated_at = ?
      WHERE id = ?
    `).run(now, acc.id);

    db.prepare(`
      UPDATE it_assets SET
        assigned_to = NULL,
        assigned_date = NULL,
        status = 'Available',
        updated_at = ?
      WHERE id = ? OR serial_number = ?
    `).run(now, assetId, acc.email);

    db.prepare(`
      INSERT INTO it_asset_logs (id, asset_id, action, performed_by, employee_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}`,
      assetId,
      'Returned',
      performedBy,
      prevEmp,
      notes || `M365 license revoked/returned back to available license pool.`,
      now
    );

    logAudit({
      action: 'RETURN',
      module: 'IT Inventory',
      record_id: acc.email,
      new_value: `Revoked M365 license ${acc.email} to pool`,
    });
  }

  return getM365AccountById(acc.id);
}

export function deleteM365Account(id: string, deletedBy: string = 'Administrator'): boolean {
  const db = getDb();
  const acc = getM365AccountById(id);
  if (!acc) return false;

  const assetId = `ast-m365-${acc.id}`;
  db.prepare(`DELETE FROM it_asset_logs WHERE asset_id = ?`).run(assetId);
  db.prepare(`DELETE FROM it_assets WHERE id = ? OR serial_number = ?`).run(assetId, acc.email);
  const res = db.prepare(`DELETE FROM it_m365_accounts WHERE id = ?`).run(acc.id);

  logAudit({
    action: 'DELETE',
    module: 'IT Inventory',
    record_id: acc.email,
    old_value: `Deleted M365 account ${acc.email} (${acc.license_plan}) by ${deletedBy}`,
  });

  return res.changes > 0;
}

// ==========================================
// ZKTeco Attendance Integration Helpers
// ==========================================

export function refreshZKTecoDeviceLiveness(db: any = getDb()): void {
  try {
    const thresholdIso = new Date(Date.now() - 120000).toISOString(); // 2-minute active window
    // Mark Push/ADMS devices offline if no recent push received
    db.prepare(`
      UPDATE attendance_devices
      SET status = 'Offline'
      WHERE connection_type = 'Push/ADMS'
        AND status = 'Online'
        AND (last_connection IS NULL OR last_connection < ?)
    `).run(thresholdIso);

    // Mark Push/ADMS devices online if an active push was received in the last 2 minutes
    db.prepare(`
      UPDATE attendance_devices
      SET status = 'Online'
      WHERE connection_type = 'Push/ADMS'
        AND status != 'Online'
        AND last_connection >= ?
    `).run(thresholdIso);
  } catch (err) {
    console.error('Error refreshing ZKTeco device liveness:', err);
  }
}

export function getZKTecoDevices(): ZKTecoDevice[] {
  const db = getDb();
  refreshZKTecoDeviceLiveness(db);
  return db.prepare(`
    SELECT 
      d.*,
      dept.name as department_name,
      (SELECT COUNT(*) FROM attendance_device_users u WHERE u.device_id = d.id AND u.sync_status = 'Mapped') as mapped_users_count
    FROM attendance_devices d
    LEFT JOIN departments dept ON dept.id = d.department_id
    ORDER BY d.created_at ASC
  `).all() as ZKTecoDevice[];
}

export function getZKTecoDeviceById(id: string): ZKTecoDevice | null {
  const db = getDb();
  refreshZKTecoDeviceLiveness(db);
  const row = db.prepare(`
    SELECT 
      d.*,
      dept.name as department_name,
      (SELECT COUNT(*) FROM attendance_device_users u WHERE u.device_id = d.id AND u.sync_status = 'Mapped') as mapped_users_count
    FROM attendance_devices d
    LEFT JOIN departments dept ON dept.id = d.department_id
    WHERE d.id = ?
  `).get(id) as ZKTecoDevice | undefined;
  return row || null;
}

export function createZKTecoDevice(data: Partial<ZKTecoDevice>): ZKTecoDevice {
  const db = getDb();
  const id = data.id || `zk-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO attendance_devices (
      id, name, model, platform, serial_number, firmware_version, mac_address,
      fingerprint_alg, face_alg, ip_address, port, connection_type, auth_password,
      location, site_name, department_id, is_enabled, status,
      sync_interval_minutes, connection_timeout, retry_attempts, auto_sync,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?
    )
  `).run(
    id,
    data.name || 'New ZKTeco Device',
    data.model || 'SpeedFace-V5L',
    data.platform || 'ZAM230',
    data.serial_number || '',
    data.firmware_version || '',
    data.mac_address || '',
    data.fingerprint_alg || 'ZKFinger VX13.0',
    data.face_alg || 'ZKFace VX3.6',
    data.ip_address || '192.168.88.201',
    Number(data.port) || 8081,
    data.connection_type || 'Push/ADMS',
    data.auth_password || '0',
    data.location || 'Entrance',
    data.site_name || 'Head Office',
    data.department_id || null,
    data.is_enabled !== undefined ? (data.is_enabled ? 1 : 0) : 1,
    data.status || 'Online',
    Number(data.sync_interval_minutes) || 5,
    Number(data.connection_timeout) || 10,
    Number(data.retry_attempts) || 3,
    data.auto_sync !== undefined ? (data.auto_sync ? 1 : 0) : 1,
    now,
    now
  );

  logAudit({
    action: 'CREATE',
    module: 'ZKTeco Devices',
    record_id: id,
    new_value: `Created ZKTeco device ${data.name} (${data.ip_address}:${data.port || 4370})`,
  });

  return getZKTecoDeviceById(id)!;
}

export function updateZKTecoDevice(id: string, updates: Partial<ZKTecoDevice>): ZKTecoDevice | null {
  const db = getDb();
  const existing = getZKTecoDeviceById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated = { ...existing, ...updates, updated_at: now };

  db.prepare(`
    UPDATE attendance_devices SET
      name = ?,
      model = ?,
      platform = ?,
      serial_number = ?,
      firmware_version = ?,
      mac_address = ?,
      fingerprint_alg = ?,
      face_alg = ?,
      ip_address = ?,
      port = ?,
      connection_type = ?,
      auth_password = ?,
      location = ?,
      site_name = ?,
      department_id = ?,
      is_enabled = ?,
      status = ?,
      last_connection = ?,
      last_successful_connection = ?,
      last_sync = ?,
      last_successful_sync = ?,
      last_error = ?,
      error_code = ?,
      last_sync_status = ?,
      user_count = ?,
      log_count = ?,
      fingerprint_count = ?,
      face_count = ?,
      device_time = ?,
      server_time = ?,
      time_difference_sec = ?,
      sync_interval_minutes = ?,
      connection_timeout = ?,
      retry_attempts = ?,
      auto_sync = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    updated.name,
    updated.model,
    updated.platform || 'ZAM230',
    updated.serial_number,
    updated.firmware_version,
    updated.mac_address || null,
    updated.fingerprint_alg || 'ZKFinger VX13.0',
    updated.face_alg || 'ZKFace VX3.6',
    updated.ip_address,
    Number(updated.port),
    updated.connection_type,
    updated.auth_password,
    updated.location,
    updated.site_name || 'Head Office',
    updated.department_id || null,
    updated.is_enabled ? 1 : 0,
    updated.status,
    updated.last_connection || null,
    updated.last_successful_connection || null,
    updated.last_sync || null,
    updated.last_successful_sync || null,
    updated.last_error || null,
    updated.error_code || null,
    updated.last_sync_status || null,
    Number(updated.user_count) || 0,
    Number(updated.log_count) || 0,
    Number(updated.fingerprint_count) || 0,
    Number(updated.face_count) || 0,
    updated.device_time || null,
    updated.server_time || null,
    Number(updated.time_difference_sec) || 0,
    Number(updated.sync_interval_minutes) || 5,
    Number(updated.connection_timeout) || 10,
    Number(updated.retry_attempts) || 3,
    updated.auto_sync ? 1 : 0,
    now,
    id
  );

  return getZKTecoDeviceById(id);
}

export function deleteZKTecoDevice(id: string): boolean {
  const db = getDb();
  const existing = getZKTecoDeviceById(id);
  if (!existing) return false;

  db.prepare(`DELETE FROM attendance_device_users WHERE device_id = ?`).run(id);
  db.prepare(`DELETE FROM attendance_sync_logs WHERE device_id = ?`).run(id);
  const res = db.prepare(`DELETE FROM attendance_devices WHERE id = ?`).run(id);

  logAudit({
    action: 'DELETE',
    module: 'ZKTeco Devices',
    record_id: id,
    old_value: `Deleted ZKTeco device ${existing.name} (${existing.ip_address})`,
  });

  return res.changes > 0;
}

export function getZKTecoDeviceUsers(options?: {
  deviceId?: string;
  search?: string;
  syncStatus?: string;
  biometric?: string;
}): ZKTecoDeviceUser[] {
  const db = getDb();
  let sql = `
    SELECT 
      u.*,
      d.name as device_name,
      COALESCE(e.first_name || ' ' || e.last_name, '') as employee_name,
      e.khmer_name as khmer_name,
      e.role as employee_role,
      e.avatar as employee_avatar,
      u.user_photo as user_photo,
      dept.name as department_name
    FROM attendance_device_users u
    JOIN attendance_devices d ON d.id = u.device_id
    LEFT JOIN employees e ON e.id = u.employee_id
    LEFT JOIN departments dept ON dept.id = e.department_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options?.deviceId && options.deviceId !== 'all') {
    sql += ` AND u.device_id = ?`;
    params.push(options.deviceId);
  }

  if (options?.syncStatus && options.syncStatus !== 'all') {
    sql += ` AND u.sync_status = ?`;
    params.push(options.syncStatus);
  }

  if (options?.biometric && options.biometric !== 'all') {
    if (options.biometric === 'face') {
      sql += ` AND u.has_face = 1`;
    } else if (options.biometric === 'fingerprint') {
      sql += ` AND u.has_fingerprint = 1`;
    } else if (options.biometric === 'card') {
      sql += ` AND (u.has_card = 1 OR (u.card_number IS NOT NULL AND u.card_number != ''))`;
    }
  }

  if (options?.search) {
    const q = `%${options.search}%`;
    sql += ` AND (u.device_user_id LIKE ? OR u.device_user_name LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.khmer_name LIKE ? OR e.id LIKE ? OR u.card_number LIKE ?)`;
    params.push(q, q, q, q, q, q, q);
  }

  sql += ` ORDER BY u.device_id ASC, LPAD(u.device_user_id, 10, '0') ASC`;

  return db.prepare(sql).all(...params) as ZKTecoDeviceUser[];
}

export function recalculateDeviceUserCounts(deviceId: string): void {
  const db = getDb();
  try {
    const counts = db.prepare(`
      SELECT 
        COUNT(*) as user_count,
        COALESCE(SUM(CASE WHEN has_fingerprint = 1 THEN 1 ELSE 0 END), 0) as fingerprint_count,
        COALESCE(SUM(CASE WHEN has_face = 1 THEN 1 ELSE 0 END), 0) as face_count
      FROM attendance_device_users
      WHERE device_id = ?
    `).get(deviceId) as any;

    db.prepare(`
      UPDATE attendance_devices
      SET 
        user_count = ?,
        fingerprint_count = ?,
        face_count = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      Number(counts?.user_count) || 0,
      Number(counts?.fingerprint_count) || 0,
      Number(counts?.face_count) || 0,
      new Date().toISOString(),
      deviceId
    );
  } catch (err) {
    console.error(`Error recalculating device counts for ${deviceId}:`, err);
  }
}

export function upsertZKTecoDeviceUser(user: Partial<ZKTecoDeviceUser>): void {
  const db = getDb();
  const id = user.id || `usr-${user.device_id}-${user.device_user_id}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO attendance_device_users (
      id, device_id, device_user_id, employee_id, device_user_name,
      card_number, privilege, has_fingerprint, has_face, has_card,
      has_password, biometric_status, sync_status, match_confidence,
      match_method, user_photo, last_sync_at, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
    ON CONFLICT(device_id, device_user_id) DO UPDATE SET
      employee_id = COALESCE(excluded.employee_id, attendance_device_users.employee_id),
      device_user_name = excluded.device_user_name,
      card_number = excluded.card_number,
      privilege = excluded.privilege,
      has_fingerprint = excluded.has_fingerprint,
      has_face = excluded.has_face,
      has_card = excluded.has_card,
      has_password = excluded.has_password,
      biometric_status = excluded.biometric_status,
      user_photo = COALESCE(excluded.user_photo, attendance_device_users.user_photo),
      sync_status = CASE 
        WHEN attendance_device_users.sync_status = 'Mapped' AND excluded.employee_id IS NULL THEN 'Mapped'
        ELSE excluded.sync_status
      END,
      match_confidence = CASE 
        WHEN attendance_device_users.sync_status = 'Mapped' AND excluded.employee_id IS NULL THEN attendance_device_users.match_confidence
        ELSE excluded.match_confidence
      END,
      match_method = CASE 
        WHEN attendance_device_users.sync_status = 'Mapped' AND excluded.employee_id IS NULL THEN attendance_device_users.match_method
        ELSE excluded.match_method
      END,
      last_sync_at = excluded.last_sync_at,
      updated_at = excluded.updated_at
  `).run(
    id,
    user.device_id,
    user.device_user_id,
    user.employee_id || null,
    user.device_user_name || null,
    user.card_number || null,
    user.privilege || 'User',
    user.has_fingerprint ? 1 : 0,
    user.has_face ? 1 : 0,
    user.has_card ? 1 : 0,
    user.has_password ? 1 : 0,
    user.biometric_status || 'Enrolled',
    user.sync_status || 'Needs Mapping',
    user.match_confidence !== undefined ? user.match_confidence : 0,
    user.match_method || 'Manual',
    user.user_photo || null,
    user.last_sync_at || now,
    now,
    now
  );

  if (user.device_id) {
    recalculateDeviceUserCounts(user.device_id);
  }
}

export function updateZKTecoDeviceUser(
  id: string,
  updates: Partial<ZKTecoDeviceUser>
): boolean {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM attendance_device_users WHERE id = ?`).get(id) as any;
  if (!existing) return false;

  const now = new Date().toISOString();
  const res = db.prepare(`
    UPDATE attendance_device_users
    SET 
      device_user_name = COALESCE(?, device_user_name),
      card_number = ?,
      privilege = COALESCE(?, privilege),
      has_fingerprint = COALESCE(?, has_fingerprint),
      has_face = COALESCE(?, has_face),
      has_card = COALESCE(?, has_card),
      has_password = COALESCE(?, has_password),
      biometric_status = COALESCE(?, biometric_status),
      sync_status = COALESCE(?, sync_status),
      user_photo = COALESCE(?, user_photo),
      employee_id = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    updates.device_user_name !== undefined ? updates.device_user_name : existing.device_user_name,
    updates.card_number !== undefined ? updates.card_number : existing.card_number,
    updates.privilege !== undefined ? updates.privilege : existing.privilege,
    updates.has_fingerprint !== undefined ? (updates.has_fingerprint ? 1 : 0) : existing.has_fingerprint,
    updates.has_face !== undefined ? (updates.has_face ? 1 : 0) : existing.has_face,
    updates.has_card !== undefined ? (updates.has_card ? 1 : 0) : existing.has_card,
    updates.has_password !== undefined ? (updates.has_password ? 1 : 0) : existing.has_password,
    updates.biometric_status !== undefined ? updates.biometric_status : existing.biometric_status,
    updates.sync_status !== undefined ? updates.sync_status : existing.sync_status,
    updates.user_photo !== undefined ? updates.user_photo : existing.user_photo,
    updates.employee_id !== undefined ? updates.employee_id : existing.employee_id,
    now,
    id
  );

  recalculateDeviceUserCounts(existing.device_id);
  return res.changes > 0;
}

export function deleteZKTecoDeviceUser(id: string): boolean {
  const db = getDb();
  const user = db.prepare(`SELECT device_id, device_user_id FROM attendance_device_users WHERE id = ?`).get(id) as any;
  if (!user) return false;

  const res = db.prepare(`DELETE FROM attendance_device_users WHERE id = ?`).run(id);

  // Queue delete command for the hardware terminal
  try {
    const device = getZKTecoDeviceById(user.device_id);
    if (device) {
      const targetKey = device.serial_number || device.ip_address || device.id;
      queueDeviceCommand(targetKey, `DATA DELETE USERINFO PIN=${user.device_user_id}`, device.id);
    }
  } catch (err) {
    console.error('Error queuing delete command on terminal:', err);
  }

  recalculateDeviceUserCounts(user.device_id);
  return res.changes > 0;
}

export function mapZKTecoUser(
  recordId: string,
  employeeId: string,
  matchMethod: string = 'Manual',
  confidence: number = 1.0
): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const res = db.prepare(`
    UPDATE attendance_device_users SET
      employee_id = ?,
      sync_status = 'Mapped',
      match_method = ?,
      match_confidence = ?,
      updated_at = ?
    WHERE id = ?
  `).run(employeeId, matchMethod, confidence, now, recordId);

  // Also link any unprocessed raw transactions for this device_user_id
  const userRec = db.prepare(`SELECT device_id, device_user_id FROM attendance_device_users WHERE id = ?`).get(recordId) as any;
  if (userRec) {
    db.prepare(`
      UPDATE attendance_raw_transactions SET
        employee_id = ?
      WHERE device_id = ? AND device_user_id = ? AND (employee_id IS NULL OR employee_id = '')
    `).run(employeeId, userRec.device_id, userRec.device_user_id);
  }

  return res.changes > 0;
}

export function unmapZKTecoUser(recordId: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const res = db.prepare(`
    UPDATE attendance_device_users SET
      employee_id = NULL,
      sync_status = 'Needs Mapping',
      match_method = 'Manual',
      match_confidence = 0,
      updated_at = ?
    WHERE id = ?
  `).run(now, recordId);

  return res.changes > 0;
}

export function insertRawTransactions(transactions: Partial<ZKTecoRawTransaction>[]): {
  retrieved: number;
  newCount: number;
  duplicates: number;
} {
  const db = getDb();
  let newCount = 0;
  let duplicates = 0;
  const now = new Date().toISOString();

  for (const t of transactions) {
    if (!t.device_id || !t.transaction_id || !t.device_user_id || !t.attendance_timestamp) continue;
    const id = t.id || `raw-${t.device_id}-${t.transaction_id}`;

    // Lookup employee mapping if not provided
    let empId = t.employee_id || null;
    if (!empId) {
      const mapped = db.prepare(`
        SELECT employee_id FROM attendance_device_users
        WHERE device_id = ? AND device_user_id = ? AND sync_status = 'Mapped'
      `).get(t.device_id, t.device_user_id) as any;
      if (mapped?.employee_id) {
        empId = mapped.employee_id;
      }
    }

    try {
      const res = db.prepare(`
        INSERT INTO attendance_raw_transactions (
          id, device_id, device_user_id, employee_id, transaction_id,
          attendance_timestamp, punch_date, punch_time, attendance_type,
          verification_method, device_serial, device_ip, location,
          raw_payload, raw_data, is_processed, processed_at,
          attendance_record_id, source, created_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?
        )
        ON CONFLICT(device_id, transaction_id) DO NOTHING
      `).run(
        id,
        t.device_id,
        t.device_user_id,
        empId,
        t.transaction_id,
        t.attendance_timestamp,
        t.punch_date || t.attendance_timestamp.slice(0, 10),
        t.punch_time || t.attendance_timestamp.slice(11, 19),
        t.attendance_type || 'Check-In',
        t.verification_method || 'Fingerprint',
        t.device_serial || null,
        t.device_ip || null,
        t.location || null,
        t.raw_payload || null,
        t.raw_data || null,
        t.is_processed ? 1 : 0,
        t.processed_at || null,
        t.attendance_record_id || null,
        t.source || 'ZKTeco Direct',
        now
      );

      if (res.changes > 0) {
        newCount++;
      } else {
        duplicates++;
      }
    } catch {
      duplicates++;
    }
  }

  return {
    retrieved: transactions.length,
    newCount,
    duplicates,
  };
}

export function getRawTransactions(options?: {
  deviceId?: string;
  date?: string;
  employeeId?: string;
  isProcessed?: number;
  limit?: number;
}): ZKTecoRawTransaction[] {
  const db = getDb();
  let sql = `
    SELECT 
      t.*,
      d.name as device_name,
      COALESCE(e.first_name || ' ' || e.last_name, '') as employee_name,
      e.khmer_name as khmer_name,
      e.role as employee_role,
      e.avatar as employee_avatar,
      dept.name as department_name
    FROM attendance_raw_transactions t
    JOIN attendance_devices d ON d.id = t.device_id
    LEFT JOIN employees e ON e.id = t.employee_id
    LEFT JOIN departments dept ON dept.id = e.department_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options?.deviceId) {
    sql += ` AND t.device_id = ?`;
    params.push(options.deviceId);
  }

  if (options?.date) {
    sql += ` AND t.punch_date = ?`;
    params.push(options.date);
  }

  if (options?.employeeId) {
    sql += ` AND t.employee_id = ?`;
    params.push(options.employeeId);
  }

  if (options?.isProcessed !== undefined) {
    sql += ` AND t.is_processed = ?`;
    params.push(options.isProcessed ? 1 : 0);
  }

  sql += ` ORDER BY t.attendance_timestamp DESC, t.id DESC`;

  if (options?.limit) {
    sql += ` LIMIT ?`;
    params.push(options.limit);
  } else {
    sql += ` LIMIT 1000`;
  }

  return db.prepare(sql).all(...params) as ZKTecoRawTransaction[];
}

export function createZKTecoSyncLog(log: Partial<ZKTecoSyncLog>): ZKTecoSyncLog {
  const db = getDb();
  const id = log.id || `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO attendance_sync_logs (
      id, timestamp, device_id, device_name, operation, result,
      records_retrieved, records_created, duplicates, errors,
      duration_sec, ip_address, user_name, details, error_code, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `).run(
    id,
    log.timestamp || now,
    log.device_id || null,
    log.device_name || null,
    log.operation || 'Sync',
    log.result || 'SUCCESS',
    Number(log.records_retrieved) || 0,
    Number(log.records_created) || 0,
    Number(log.duplicates) || 0,
    Number(log.errors) || 0,
    Number(log.duration_sec) || 0,
    log.ip_address || null,
    log.user_name || null,
    log.details || null,
    log.error_code || null,
    now
  );

  return db.prepare(`SELECT * FROM attendance_sync_logs WHERE id = ?`).get(id) as ZKTecoSyncLog;
}

export function getZKTecoSyncLogs(options?: { deviceId?: string; limit?: number }): ZKTecoSyncLog[] {
  const db = getDb();
  let sql = `SELECT * FROM attendance_sync_logs WHERE 1=1`;
  const params: any[] = [];

  if (options?.deviceId) {
    sql += ` AND device_id = ?`;
    params.push(options.deviceId);
  }

  sql += ` ORDER BY created_at DESC`;

  if (options?.limit) {
    sql += ` LIMIT ?`;
    params.push(options.limit);
  } else {
    sql += ` LIMIT 100`;
  }

  return db.prepare(sql).all(...params) as ZKTecoSyncLog[];
}

export function getZKTecoDashboardStats(): ZKTecoDashboardStats {
  const db = getDb();
  refreshZKTecoDeviceLiveness(db);
  const today = new Date().toISOString().slice(0, 10);

  const devCounts = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Online' THEN 1 ELSE 0 END) as online,
      SUM(CASE WHEN status != 'Online' THEN 1 ELSE 0 END) as offline
    FROM attendance_devices
  `).get() as any;

  const userCounts = db.prepare(`
    SELECT 
      SUM(CASE WHEN sync_status = 'Mapped' THEN 1 ELSE 0 END) as mapped,
      SUM(CASE WHEN sync_status != 'Mapped' THEN 1 ELSE 0 END) as unmapped
    FROM attendance_device_users
  `).get() as any;

  const rawLogsCount = db.prepare(`SELECT COUNT(*) as total FROM attendance_raw_transactions`).get() as any;

  const todayPunches = db.prepare(`
    SELECT COUNT(*) as total FROM attendance_raw_transactions WHERE punch_date = ?
  `).get(today) as any;

  const lastLog = db.prepare(`
    SELECT timestamp FROM attendance_sync_logs ORDER BY created_at DESC LIMIT 1
  `).get() as any;

  const todayErrors = db.prepare(`
    SELECT COUNT(*) as total FROM attendance_sync_logs 
    WHERE result = 'FAILED' AND timestamp LIKE ?
  `).get(`${today}%`) as any;

  return {
    total_devices: Number(devCounts?.total) || 0,
    online_devices: Number(devCounts?.online) || 0,
    offline_devices: Number(devCounts?.offline) || 0,
    total_mapped_users: Number(userCounts?.mapped) || 0,
    unmapped_users: Number(userCounts?.unmapped) || 0,
    total_raw_logs: Number(rawLogsCount?.total) || 0,
    today_punches: Number(todayPunches?.total) || 0,
    last_sync: lastLog?.timestamp || null,
    sync_errors_today: Number(todayErrors?.total) || 0,
  };
}

export function createAttendanceCorrection(correction: Partial<AttendanceCorrection>): AttendanceCorrection {
  const db = getDb();
  const id = correction.id || `corr-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO attendance_corrections (
      id, attendance_id, employee_id, date, field_changed,
      old_value, new_value, reason, changed_by, changed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    correction.attendance_id,
    correction.employee_id,
    correction.date,
    correction.field_changed,
    correction.old_value || null,
    correction.new_value,
    correction.reason,
    correction.changed_by || 'HR Administrator',
    now
  );

  // Update attendance table accordingly without changing raw transactions
  if (correction.attendance_id && correction.field_changed) {
    if (correction.field_changed === 'clock_in') {
      db.prepare(`UPDATE attendance SET clock_in = ?, notes = notes || ' | Manual correction: ' || ? WHERE id = ?`)
        .run(correction.new_value, correction.reason, correction.attendance_id);
    } else if (correction.field_changed === 'clock_out') {
      db.prepare(`UPDATE attendance SET clock_out = ?, notes = notes || ' | Manual correction: ' || ? WHERE id = ?`)
        .run(correction.new_value, correction.reason, correction.attendance_id);
    } else if (correction.field_changed === 'status') {
      db.prepare(`UPDATE attendance SET status = ?, notes = notes || ' | Manual correction: ' || ? WHERE id = ?`)
        .run(correction.new_value, correction.reason, correction.attendance_id);
    }
  }

  logAudit({
    action: 'CORRECT_ATTENDANCE',
    module: 'Attendance',
    record_id: correction.attendance_id,
    old_value: correction.old_value,
    new_value: `${correction.field_changed} changed to ${correction.new_value}. Reason: ${correction.reason}`,
  });

  return db.prepare(`SELECT * FROM attendance_corrections WHERE id = ?`).get(id) as AttendanceCorrection;
}

export function getAttendanceCorrections(date?: string, employeeId?: string): AttendanceCorrection[] {
  const db = getDb();
  let sql = `
    SELECT 
      c.*,
      COALESCE(e.first_name || ' ' || e.last_name, '') as employee_name,
      e.khmer_name as khmer_name
    FROM attendance_corrections c
    LEFT JOIN employees e ON e.id = c.employee_id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (date) {
    sql += ` AND c.date = ?`;
    params.push(date);
  }
  if (employeeId) {
    sql += ` AND c.employee_id = ?`;
    params.push(employeeId);
  }
  sql += ` ORDER BY c.changed_at DESC`;
  return db.prepare(sql).all(...params) as AttendanceCorrection[];
}

// ==========================================
// ZKTeco Terminal Command Queue Helpers
// ==========================================

export function queueDeviceCommand(targetKey: string, command: string, deviceId?: string): string {
  const db = getDb();
  const id = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO attendance_device_commands (id, device_id, target_key, command, status, created_at)
    VALUES (?, ?, ?, ?, 'PENDING', ?)
  `).run(id, deviceId || null, targetKey.toLowerCase(), command, now);
  console.log(`[ADMS DB] Queued command ${id} for target "${targetKey}": ${command}`);
  return id;
}

export function getPendingDeviceCommands(targetKeys: string[]): { id: string; command: string }[] {
  const db = getDb();
  const normalized = targetKeys.map((k) => (k || '').toLowerCase()).filter(Boolean);
  if (normalized.length === 0) return [];
  const placeholders = normalized.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT id, command FROM attendance_device_commands
    WHERE status = 'PENDING' AND target_key IN (${placeholders})
    ORDER BY created_at ASC LIMIT 20
  `).all(...normalized) as { id: string; command: string }[];
  return rows;
}

export function markDeviceCommandDelivered(ids: string[]): void {
  if (!ids || ids.length === 0) return;
  const db = getDb();
  const now = new Date().toISOString();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`
    UPDATE attendance_device_commands
    SET status = 'DELIVERED', delivered_at = ?
    WHERE id IN (${placeholders})
  `).run(now, ...ids);
}

export function markDeviceCommandExecuted(id: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE attendance_device_commands
    SET status = 'EXECUTED', executed_at = ?
    WHERE id = ?
  `).run(now, id);
}

// ==========================================
// Medicine & Medical Management Exports
// ==========================================

export function getMedicines(filter?: { status?: string; category?: string; search?: string }) {
  return getMedicinesInternal(getDb(), filter);
}

export function getMedicineById(id: string) {
  return getMedicineByIdInternal(getDb(), id);
}

export function saveMedicine(data: Partial<Medicine>, performedBy?: string) {
  return saveMedicineInternal(getDb(), data, performedBy);
}

export function deleteMedicine(id: string) {
  return deleteMedicineInternal(getDb(), id);
}

export function recordStockTransaction(data: {
  medicine_id: string;
  transaction_type: StockTransactionType;
  quantity: number;
  batch_number?: string;
  unit_cost?: number;
  supplier_or_dest?: string;
  reference_id?: string;
  performed_by: string;
  notes?: string;
}) {
  return recordStockTransactionInternal(getDb(), data);
}

export function getMedicineStockTransactions(medicineId?: string, limit?: number) {
  return getMedicineStockTransactionsInternal(getDb(), medicineId, limit);
}

export function issueMedicine(data: {
  medical_record_id?: string;
  employee_id: string;
  medicine_id: string;
  quantity_issued: number;
  prescription_instruction?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  issued_by: string;
  notes?: string;
}) {
  return issueMedicineInternal(getDb(), data);
}

export function getMedicineIssuances(filter?: {
  employeeId?: string;
  medicineId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return getMedicineIssuancesInternal(getDb(), filter);
}

export function getEmployeeMedicalRecords(filter?: {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  departmentId?: string;
}) {
  return getEmployeeMedicalRecordsInternal(getDb(), filter);
}

export function getMedicalRecordById(id: string) {
  return getMedicalRecordByIdInternal(getDb(), id);
}

export function saveMedicalRecord(
  data: Partial<EmployeeMedicalRecord>,
  medicinesToIssue?: Array<{
    medicine_id: string;
    quantity: number;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instruction?: string;
  }>
) {
  return saveMedicalRecordInternal(getDb(), data, medicinesToIssue);
}

export function deleteMedicalRecord(id: string) {
  return deleteMedicalRecordInternal(getDb(), id);
}

export function getMedicalDashboardStats() {
  return getMedicalDashboardStatsInternal(getDb());
}

export function getMedicalReportsData() {
  return getMedicalReportsDataInternal(getDb());
}

export { getMedicalAccess, computeMedicineStatus };


