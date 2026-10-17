/**
 * src/lib/zkteco/deployment-service.ts
 * Service to Deploy and Provision all ZKTeco Enrolled Users into HESTRA HRM Employees.
 */

import fs from 'fs';
import path from 'path';
import { getDb, recalculateDeviceUserCounts, createZKTecoSyncLog, logAudit } from '@/lib/db';
import { ZKTecoDeviceUser } from '@/lib/types';
import { UserMappingEngine } from './mapping-engine';

export interface DeploymentResult {
  success: boolean;
  totalEnrolled: number;
  existingMapped: number;
  newlyCreatedEmployees: number;
  photosAttached: number;
  message: string;
}

export class ZKTecoDeploymentService {
  /**
   * Deploys all enrolled users from a ZKTeco biometric terminal into official HESTRA HRM employee profiles.
   */
  public static async deployEnrolledUsersToEmployees(
    deviceId: string = 'zk-01',
    adminUser: string = 'HR Administrator'
  ): Promise<DeploymentResult> {
    const db = getDb();
    const nowIso = new Date().toISOString();

    // 1. Retrieve all enrolled users for target device
    const deviceUsers = db.prepare(`
      SELECT * FROM attendance_device_users 
      WHERE device_id = ? 
      ORDER BY 
        CASE WHEN device_user_id ~ '^[0-9]+$' THEN CAST(device_user_id AS INTEGER) ELSE 999999 END ASC,
        device_user_id ASC
    `).all(deviceId) as ZKTecoDeviceUser[];

    if (deviceUsers.length === 0) {
      return {
        success: false,
        totalEnrolled: 0,
        existingMapped: 0,
        newlyCreatedEmployees: 0,
        photosAttached: 0,
        message: `No enrolled users found on device ${deviceId}. Please sync device users first.`,
      };
    }

    // 2. Load existing employees
    let employees = db.prepare(`
      SELECT id, first_name, last_name, khmer_name, avatar 
      FROM employees
    `).all() as any[];

    // Management / Known Executive Profiles
    const knownManagementProfiles: Record<string, {
      id: string;
      firstName: string;
      lastName: string;
      role: string;
      departmentId: string;
      salary: number;
    }> = {
      '1000': { id: 'EMP-2026-007', firstName: 'Phorn', lastName: 'Sorann', role: 'Production Manager', departmentId: 'dept-prod', salary: 1600 },
      '1001': { id: 'EMP-2026-003', firstName: 'Sarath', lastName: 'Te', role: 'HR Manager', departmentId: 'dept-hr', salary: 1500 },
      '2026160': { id: 'EMP-2026-003', firstName: 'Sarath', lastName: 'Te', role: 'HR Manager', departmentId: 'dept-hr', salary: 1500 },
      '1002': { id: 'EMP-2026-002', firstName: 'Hamamoto', lastName: 'Tomoyuki', role: 'General Manager', departmentId: 'dept-gm', salary: 3500 },
      '1003': { id: 'EMP-2026-005', firstName: 'Dara', lastName: 'Met', role: 'Finance & Accounting Manager', departmentId: 'dept-fin', salary: 1800 },
      '1008': { id: 'EMP-2026-807', firstName: 'Keochenda', lastName: 'Bou', role: 'Factory Physician / Doctor', departmentId: 'dept-hr', salary: 1100 },
      '1009': { id: 'EMP-2026-006', firstName: 'Sophath', lastName: 'Phon', role: 'Procurement Manager', departmentId: 'dept-proc', salary: 1400 },
      '1012': { id: 'EMP-2026-008', firstName: 'Khemara', lastName: 'Chan', role: 'Logistics Manager', departmentId: 'dept-log', salary: 1300 },
      '1014': { id: 'EMP-2026-004', firstName: 'Sitha', lastName: 'Sim', role: 'Senior IT Officer', departmentId: 'dept-it', salary: 1200 },
      '2026387': { id: 'EMP-2026-004', firstName: 'Sitha', lastName: 'Sim', role: 'Senior IT Officer', departmentId: 'dept-it', salary: 1200 },
    };

    let existingMappedCount = 0;
    let newlyCreatedCount = 0;
    let photosAttachedCount = 0;

    for (const u of deviceUsers) {
      const pin = u.device_user_id.trim();
      const rawName = (u.device_user_name || '').trim();

      // Check photo on disk
      const photoWebPath = `/avatars/zkteco_${u.device_id}_${pin}.jpg`;
      const photoDiskPath = path.join(process.cwd(), 'public', 'avatars', `zkteco_${u.device_id}_${pin}.jpg`);
      let effectivePhoto = u.user_photo || (fs.existsSync(photoDiskPath) ? photoWebPath : null);

      // If this is a leading-zero variant like '003', also check if '3' has a photo
      if (!effectivePhoto && /^\d+$/.test(pin)) {
        const normPin = parseInt(pin, 10).toString();
        const normDiskPath = path.join(process.cwd(), 'public', 'avatars', `zkteco_${u.device_id}_${normPin}.jpg`);
        if (fs.existsSync(normDiskPath)) {
          effectivePhoto = `/avatars/zkteco_${u.device_id}_${normPin}.jpg`;
        }
      }

      if (effectivePhoto) {
        photosAttachedCount++;
      }

      // Check if this pin is one of the known executives
      let targetEmpId = knownManagementProfiles[pin]?.id || null;

      // If not explicit override, check existing employees by exact name
      if (!targetEmpId && rawName && !/^user\s*\d+$/i.test(rawName)) {
        const normRawName = rawName.toLowerCase().replace(/[\s\-_.]+/g, '');
        const matchedByName = employees.find((e) => {
          const fl = `${e.first_name}${e.last_name}`.toLowerCase().replace(/[\s\-_.]+/g, '');
          const lf = `${e.last_name}${e.first_name}`.toLowerCase().replace(/[\s\-_.]+/g, '');
          return normRawName === fl || normRawName === lf;
        });
        if (matchedByName) {
          targetEmpId = matchedByName.id;
        }
      }

      if (targetEmpId) {
        // Check if employee record already exists in database
        const existingEmp = db.prepare(`SELECT id, avatar FROM employees WHERE id = ?`).get(targetEmpId) as any;

        if (!existingEmp) {
          const prof = knownManagementProfiles[pin] || {
            id: targetEmpId,
            firstName: rawName.split(/\s+/)[0] || 'Executive',
            lastName: rawName.split(/\s+/).slice(1).join(' ') || '',
            role: 'Executive / Manager',
            departmentId: 'dept-gm',
            salary: 1500,
          };

          db.prepare(`
            INSERT INTO employees (
              id, first_name, last_name, email, role, department_id,
              employment_type, employee_type, status, salary, join_date,
              location, work_location, salary_currency, salary_frequency,
              bank_name, contract_type, contract_start, avatar,
              created_at, transport_allowance, meal_allowance, housing_allowance,
              attendance_allowance, skill_allowance, seniority_bonus, position_allowance,
              sewing_skill_matrix, labor_type, working_period, monthly_eval_bonus, severance_pay
            ) VALUES (
              ?, ?, ?, ?, ?, ?,
              'ពេញម៉ោង (Full-Time)', 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)', 'Active', ?, '2026-01-01',
              'Phnom Penh', 'Head Office', 'USD ($)', 'កន្លះខែ (Semi-monthly)',
              'ABA Bank', 'UDC (មិនកំណត់ថិរវេលា)', '2026-01-01', ?,
              ?, 0, 0, 0,
              10, 0, 0, 0,
              0, 'Indirect Labour', 0, 0, 0
            )
          `).run(
            prof.id,
            prof.firstName,
            prof.lastName,
            `${prof.id.toLowerCase()}@hestra.com.kh`,
            prof.role,
            prof.departmentId,
            prof.salary,
            effectivePhoto || '',
            nowIso
          );

          newlyCreatedCount++;
        } else {
          if (effectivePhoto && (!existingEmp.avatar || existingEmp.avatar === '')) {
            db.prepare(`UPDATE employees SET avatar = ? WHERE id = ?`).run(effectivePhoto, targetEmpId);
          }
          existingMappedCount++;
        }

        const finalPhoto = effectivePhoto || u.user_photo || null;
        const hasFaceVal = finalPhoto ? 1 : (u.has_face || 0);

        db.prepare(`
          UPDATE attendance_device_users 
          SET employee_id = ?,
              sync_status = 'Mapped',
              match_confidence = 1.0,
              match_method = 'Executive / Management Match',
              user_photo = ?,
              has_face = ?,
              updated_at = ?
          WHERE id = ?
        `).run(targetEmpId, finalPhoto, hasFaceVal, nowIso, u.id);

        db.prepare(`
          UPDATE attendance_raw_transactions 
          SET employee_id = ?
          WHERE device_id = ? AND device_user_id = ? AND (employee_id IS NULL OR employee_id = '')
        `).run(targetEmpId, u.device_id, u.device_user_id);

        continue;
      }

      // Calculate uniform Employee ID for non-executive staff
      // Format: EMP-0003, EMP-0371, etc. using normalized numeric PIN
      const normPin = /^\d+$/.test(pin) ? parseInt(pin, 10).toString() : pin;
      const generatedEmpId = /^\d+$/.test(normPin) ? `EMP-${normPin.padStart(4, '0')}` : normPin;

      const finalPhoto = effectivePhoto || u.user_photo || null;
      const hasFaceVal = finalPhoto ? 1 : (u.has_face || 0);

      // Check if employee record already exists in database
      const existingEmp = db.prepare(`SELECT id, avatar FROM employees WHERE id = ?`).get(generatedEmpId) as any;

      if (existingEmp) {
        // Employee record already exists, just link and update photo if needed
        db.prepare(`
          UPDATE attendance_device_users 
          SET employee_id = ?,
              sync_status = 'Mapped',
              match_confidence = 1.0,
              match_method = 'ZKTeco Direct Deployment',
              user_photo = ?,
              has_face = ?,
              updated_at = ?
          WHERE id = ?
        `).run(generatedEmpId, finalPhoto, hasFaceVal, nowIso, u.id);

        if (effectivePhoto && (!existingEmp.avatar || existingEmp.avatar === '')) {
          db.prepare(`UPDATE employees SET avatar = ? WHERE id = ?`).run(effectivePhoto, generatedEmpId);
        }

        existingMappedCount++;
      } else {
        // Create new employee profile in Hestra HRM
        let firstName = '';
        let lastName = '';

        if (rawName && !/^user\s*\d+$/i.test(rawName)) {
          const parts = rawName.split(/\s+/);
          firstName = parts[0] || 'Staff';
          lastName = parts.slice(1).join(' ') || '';
        } else {
          firstName = 'Staff';
          lastName = pin;
        }

        const isAdmin = u.privilege === 'Admin' || u.privilege === 'SuperAdmin';
        const role = isAdmin ? 'HR Administrator' : 'Sewing Operator';
        const departmentId = isAdmin ? 'dept-hr' : 'dept-prod';

        db.prepare(`
          INSERT INTO employees (
            id, first_name, last_name, email, role, department_id,
            employment_type, employee_type, status, salary, join_date,
            location, work_location, salary_currency, salary_frequency,
            bank_name, contract_type, contract_start, avatar,
            created_at, transport_allowance, meal_allowance, housing_allowance,
            attendance_allowance, skill_allowance, seniority_bonus, position_allowance,
            sewing_skill_matrix, labor_type, working_period, monthly_eval_bonus, severance_pay
          ) VALUES (
            ?, ?, ?, ?, ?, ?,
            'ពេញម៉ោង (Full-Time)', 'បុគ្គលិកពេញសិទ្ធិ (Regular / Permanent)', 'Active', 260, '2026-01-01',
            'Phnom Penh', 'Head Office', 'USD ($)', 'កន្លះខែ (Semi-monthly)',
            'ABA Bank', 'UDC (មិនកំណត់ថិរវេលា)', '2026-01-01', ?,
            ?, 0, 0, 0,
            10, 0, 0, 0,
            0, 'Direct Labour', 0, 0, 0
          )
        `).run(
          generatedEmpId,
          firstName,
          lastName,
          `${generatedEmpId.toLowerCase()}@hestra.com.kh`,
          role,
          departmentId,
          effectivePhoto || '',
          nowIso
        );

        // Link in device users
        db.prepare(`
          UPDATE attendance_device_users 
          SET employee_id = ?,
              sync_status = 'Mapped',
              match_confidence = 1.0,
              match_method = 'ZKTeco Direct Deployment',
              user_photo = ?,
              has_face = ?,
              updated_at = ?
          WHERE id = ?
        `).run(generatedEmpId, finalPhoto, hasFaceVal, nowIso, u.id);

        newlyCreatedCount++;
      }

      // Also ensure any existing attendance transactions for this PIN are mapped
      db.prepare(`
        UPDATE attendance_raw_transactions 
        SET employee_id = ?
        WHERE device_id = ? AND device_user_id = ? AND (employee_id IS NULL OR employee_id = '')
      `).run(targetEmpId || generatedEmpId, u.device_id, u.device_user_id);
    }

    // Refresh device counts
    recalculateDeviceUserCounts(deviceId);

    // Audit and sync history logging
    createZKTecoSyncLog({
      device_id: deviceId,
      device_name: 'ZKTeco-01',
      operation: 'Deploy Enrolled Users to HRM',
      result: 'SUCCESS',
      records_retrieved: deviceUsers.length,
      records_created: newlyCreatedCount,
      duplicates: existingMappedCount,
      errors: 0,
      duration_sec: 0.5,
      user_name: adminUser,
      details: `Deployed all ${deviceUsers.length} enrolled users from ZKTeco biometric terminal into HRM employees (${newlyCreatedCount} new staff profiles created, ${existingMappedCount} existing executive/staff mapped, ${photosAttachedCount} biometric camera photos attached).`,
    });

    logAudit({
      user_id: adminUser,
      user_name: adminUser,
      action: 'DEPLOY_ZKTECO_USERS',
      module: 'Attendance Integration',
      record_id: deviceId,
      new_value: JSON.stringify({
        deviceId,
        totalEnrolled: deviceUsers.length,
        newEmployees: newlyCreatedCount,
        existingMapped: existingMappedCount,
        photosAttached: photosAttachedCount,
      }),
    });

    return {
      success: true,
      totalEnrolled: deviceUsers.length,
      existingMapped: existingMappedCount,
      newlyCreatedEmployees: newlyCreatedCount,
      photosAttached: photosAttachedCount,
      message: `Successfully deployed all ${deviceUsers.length} enrolled users from ZKTeco into HRM employees! (${newlyCreatedCount} new employee profiles created, ${existingMappedCount} existing profiles mapped, ${photosAttachedCount} biometric face photos linked).`,
    };
  }
}
