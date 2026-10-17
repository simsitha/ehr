/**
 * src/lib/zkteco/mapping-engine.ts
 * Employee Auto-Mapping Engine for ZKTeco Biometric Users
 * Implements strict hierarchical matching:
 * 1. Employee ID
 * 2. Employee Code (numeric extracts, prefix normalization)
 * 3. ZKTeco User ID
 * 4. Card Number
 * 5. Exact Employee Name (English & Khmer)
 */

import { getDb } from '@/lib/db';
import { ZKTecoDeviceUser } from '@/lib/types';

export interface EmployeeMatchCandidate {
  id: string;
  first_name: string;
  last_name: string;
  khmer_name?: string;
  national_id?: string;
  phone?: string;
  email?: string;
  card_number?: string;
}

export interface MatchResult {
  matched: boolean;
  employeeId?: string;
  employeeName?: string;
  confidence: number;
  matchMethod: 'Employee ID' | 'Employee Code' | 'ZKTeco User ID' | 'Card Number' | 'Exact Employee Name' | 'None';
  status: 'Mapped' | 'Needs Mapping';
}

/**
 * Normalizes strings by trimming, lowercasing, and removing punctuation/spaces
 */
function normalize(str?: string | null): string {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/[\s\-_.]+/g, '');
}

/**
 * Extracts pure integer numbers from a code/ID (e.g. 'HC003' -> '3', 'EMP-2026-160' -> '160')
 */
function extractNumericCode(str?: string | null): string {
  if (!str) return '';
  // If string contains trailing digits
  const match = str.match(/(\d+)$/);
  if (match) {
    return parseInt(match[1], 10).toString();
  }
  // Remove non-digits
  const onlyDigits = str.replace(/\D/g, '');
  if (onlyDigits.length > 0) {
    return parseInt(onlyDigits, 10).toString();
  }
  return '';
}

export class UserMappingEngine {
  /**
   * Matches a single device user against the list of Hestra employees
   */
  public static matchDeviceUser(
    deviceUser: {
      device_user_id: string;
      device_user_name?: string | null;
      card_number?: string | null;
    },
    employees: EmployeeMatchCandidate[]
  ): MatchResult {
    const rawDevUserId = (deviceUser.device_user_id || '').trim();
    const normDevUserId = normalize(rawDevUserId);
    const numericDevUserId = extractNumericCode(rawDevUserId);
    const rawCard = (deviceUser.card_number || '').trim();
    const rawDevName = (deviceUser.device_user_name || '').trim();
    const normDevName = normalize(rawDevName);

    // 1. Employee ID Exact Match (Confidence: 1.0)
    for (const emp of employees) {
      if (emp.id && normalize(emp.id) === normDevUserId) {
        return {
          matched: true,
          employeeId: emp.id,
          employeeName: `${emp.first_name} ${emp.last_name}`,
          confidence: 1.0,
          matchMethod: 'Employee ID',
          status: 'Mapped',
        };
      }
    }

    // 2. Employee Code Match (e.g. '3' matches 'HC003', '160' matches 'EMP-2026-160') (Confidence: 0.95)
    if (numericDevUserId.length > 0) {
      const candidates: EmployeeMatchCandidate[] = [];
      for (const emp of employees) {
        const empNumCode = extractNumericCode(emp.id);
        if (empNumCode && empNumCode === numericDevUserId) {
          candidates.push(emp);
        }
      }

      if (candidates.length === 1) {
        const emp = candidates[0];
        return {
          matched: true,
          employeeId: emp.id,
          employeeName: `${emp.first_name} ${emp.last_name}`,
          confidence: 0.95,
          matchMethod: 'Employee Code',
          status: 'Mapped',
        };
      }
    }

    // 3. ZKTeco User ID matches Employee national_id or other identifier (Confidence: 0.90)
    if (normDevUserId.length > 0) {
      for (const emp of employees) {
        if (emp.national_id && normalize(emp.national_id) === normDevUserId) {
          return {
            matched: true,
            employeeId: emp.id,
            employeeName: `${emp.first_name} ${emp.last_name}`,
            confidence: 0.9,
            matchMethod: 'ZKTeco User ID',
            status: 'Mapped',
          };
        }
      }
    }

    // 4. Card Number Match (Confidence: 0.95)
    if (rawCard && rawCard !== '0' && rawCard !== '') {
      for (const emp of employees) {
        if (emp.card_number && normalize(emp.card_number) === normalize(rawCard)) {
          return {
            matched: true,
            employeeId: emp.id,
            employeeName: `${emp.first_name} ${emp.last_name}`,
            confidence: 0.95,
            matchMethod: 'Card Number',
            status: 'Mapped',
          };
        }
      }
    }

    // 5. Exact Employee Name Match (Confidence: 0.85)
    if (normDevName && normDevName.length >= 3 && !/^user\d+$/i.test(normDevName)) {
      const nameMatches: EmployeeMatchCandidate[] = [];
      for (const emp of employees) {
        const firstLast = normalize(`${emp.first_name}${emp.last_name}`);
        const lastFirst = normalize(`${emp.last_name}${emp.first_name}`);
        const khmer = normalize(emp.khmer_name);

        if (
          normDevName === firstLast ||
          normDevName === lastFirst ||
          (khmer && normDevName === khmer)
        ) {
          nameMatches.push(emp);
        }
      }

      if (nameMatches.length === 1) {
        const emp = nameMatches[0];
        return {
          matched: true,
          employeeId: emp.id,
          employeeName: `${emp.first_name} ${emp.last_name}`,
          confidence: 0.85,
          matchMethod: 'Exact Employee Name',
          status: 'Mapped',
        };
      }
    }

    // Uncertain or no match -> Needs Manual Mapping
    return {
      matched: false,
      confidence: 0,
      matchMethod: 'None',
      status: 'Needs Mapping',
    };
  }

  /**
   * Run auto-matching for all unmapped or 'Needs Mapping' users in the database
   */
  public static runAutoMatching(deviceId?: string): {
    totalEvaluated: number;
    newlyMapped: number;
    remainsUnmapped: number;
  } {
    const db = getDb();
    const employees = db.prepare(`
      SELECT id, first_name, last_name, khmer_name, national_id, phone, email
      FROM employees
    `).all() as EmployeeMatchCandidate[];

    let sql = `
      SELECT id, device_id, device_user_id, device_user_name, card_number, sync_status
      FROM attendance_device_users
      WHERE sync_status != 'Mapped' OR employee_id IS NULL
    `;
    const params: any[] = [];
    if (deviceId) {
      sql += ` AND device_id = ?`;
      params.push(deviceId);
    }

    const unmappedUsers = db.prepare(sql).all(...params) as ZKTecoDeviceUser[];
    let newlyMapped = 0;
    let remainsUnmapped = 0;
    const now = new Date().toISOString();

    for (const u of unmappedUsers) {
      const match = this.matchDeviceUser(
        {
          device_user_id: u.device_user_id,
          device_user_name: u.device_user_name,
          card_number: u.card_number,
        },
        employees
      );

      if (match.matched && match.employeeId && match.confidence >= 0.85) {
        db.prepare(`
          UPDATE attendance_device_users SET
            employee_id = ?,
            sync_status = 'Mapped',
            match_method = ?,
            match_confidence = ?,
            updated_at = ?
          WHERE id = ?
        `).run(match.employeeId, match.matchMethod, match.confidence, now, u.id);

        // Also update any raw transactions for this user
        db.prepare(`
          UPDATE attendance_raw_transactions SET
            employee_id = ?
          WHERE device_id = ? AND device_user_id = ? AND (employee_id IS NULL OR employee_id = '')
        `).run(match.employeeId, u.device_id, u.device_user_id);

        newlyMapped++;
      } else {
        db.prepare(`
          UPDATE attendance_device_users SET
            sync_status = 'Needs Mapping',
            match_method = 'None',
            match_confidence = 0,
            updated_at = ?
          WHERE id = ?
        `).run(now, u.id);
        remainsUnmapped++;
      }
    }

    return {
      totalEvaluated: unmappedUsers.length,
      newlyMapped,
      remainsUnmapped,
    };
  }
}
