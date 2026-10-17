import { PostgresDatabase } from './pg-adapter';
import {
  Medicine,
  MedicineCategory,
  MedicineStatus,
  MedicineStockTransaction,
  StockTransactionType,
  EmployeeMedicalRecord,
  MedicineIssuance,
  MedicalDashboardStats,
} from './types';

// Role-based Access Control configuration for Medical Module
export function getMedicalAccess(role: string) {
  const normalized = (role || 'Employee').trim();
  switch (normalized) {
    case 'Admin':
    case 'HR Admin':
      return {
        roleTitle: 'HR Admin',
        canManageMedicine: true,
        canManageRecords: true,
        canIssueMedicine: true,
        canControlStock: true,
        canViewReports: true,
        canViewCosts: true,
        canViewConfidentialNotes: true,
        canViewAllEmployees: true,
        canGrantMedicalLeave: true,
        isEmployeeOnly: false,
        isNoMedicalAccess: false,
        summaryOnly: false,
      };
    case 'Medical Officer':
      return {
        roleTitle: 'Medical Officer',
        canManageMedicine: true,
        canManageRecords: true,
        canIssueMedicine: true,
        canControlStock: true,
        canViewReports: true,
        canViewCosts: true,
        canViewConfidentialNotes: true,
        canViewAllEmployees: true,
        canGrantMedicalLeave: true,
        isEmployeeOnly: false,
        isNoMedicalAccess: false,
        summaryOnly: false,
      };
    case 'HR Officer':
      return {
        roleTitle: 'HR Officer',
        canManageMedicine: false,
        canManageRecords: true,
        canIssueMedicine: false,
        canControlStock: false,
        canViewReports: true,
        canViewCosts: false,
        canViewConfidentialNotes: false, // General diagnoses and medical leave info only
        canViewAllEmployees: true,
        canGrantMedicalLeave: false,
        isEmployeeOnly: false,
        isNoMedicalAccess: false,
        summaryOnly: false,
      };
    case 'Manager':
      return {
        roleTitle: 'Manager',
        canManageMedicine: false,
        canManageRecords: false,
        canIssueMedicine: false,
        canControlStock: false,
        canViewReports: true, // Summary / aggregated department analytics
        canViewCosts: false,
        canViewConfidentialNotes: false,
        canViewAllEmployees: false,
        canGrantMedicalLeave: false,
        isEmployeeOnly: false,
        isNoMedicalAccess: false,
        summaryOnly: true, // Limited / summary information
      };
    case 'IT Support':
      return {
        roleTitle: 'IT Support',
        canManageMedicine: false,
        canManageRecords: false,
        canIssueMedicine: false,
        canControlStock: false,
        canViewReports: false,
        canViewCosts: false,
        canViewConfidentialNotes: false,
        canViewAllEmployees: false,
        canGrantMedicalLeave: false,
        isEmployeeOnly: false,
        isNoMedicalAccess: true, // System administration, no medical details
        summaryOnly: false,
      };
    case 'Employee':
    default:
      return {
        roleTitle: 'Employee',
        canManageMedicine: false,
        canManageRecords: false,
        canIssueMedicine: false,
        canControlStock: false,
        canViewReports: false,
        canViewCosts: false,
        canViewConfidentialNotes: false,
        canViewAllEmployees: false,
        canGrantMedicalLeave: false,
        isEmployeeOnly: true, // Own medical records only
        isNoMedicalAccess: false,
        summaryOnly: false,
      };
  }
}

// Compute dynamic medicine status based on current stock and expiry date
export function computeMedicineStatus(qty: number, minLevel: number, expiryDateStr: string): MedicineStatus {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (expiryDateStr && expiryDateStr < todayStr) {
    return 'Expired';
  }
  if (expiryDateStr) {
    const exp = new Date(expiryDateStr);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 30 && diffDays >= 0) {
      return 'Expiring Soon';
    }
  }
  if (qty <= 0) {
    return 'Out of Stock';
  }
  if (qty <= minLevel) {
    return 'Low Stock';
  }
  return 'In Stock';
}

// Seed Initial Medicines, Transactions, and Medical Records (Demo data seeding disabled)
export function seedInitialMedicalData(_db: PostgresDatabase) {
  // Demo medical data has been removed. Automatic demo seeding is disabled.
  return;
}

// -------------------------------------------------------------
// Medicines Operations
// -------------------------------------------------------------

export function getMedicines(db: PostgresDatabase, filter?: { status?: string; category?: string; search?: string }): Medicine[] {
  let sql = 'SELECT * FROM medicines WHERE 1=1';
  const params: any[] = [];

  if (filter?.category && filter.category !== 'all') {
    sql += ' AND category = ?';
    params.push(filter.category);
  }

  if (filter?.search) {
    sql += ' AND (LOWER(name) LIKE ? OR LOWER(generic_name) LIKE ? OR LOWER(batch_number) LIKE ? OR LOWER(supplier) LIKE ?)';
    const term = `%${filter.search.toLowerCase()}%`;
    params.push(term, term, term, term);
  }

  sql += ' ORDER BY name ASC';

  const items = db.prepare(sql).all(...params) as Medicine[];

  // Dynamically recalculate and verify status
  return items.map((med) => {
    const computed = computeMedicineStatus(med.quantity_in_stock, med.min_stock_level, med.expiry_date);
    if (computed !== med.status) {
      try {
        db.prepare('UPDATE medicines SET status = ?, updated_at = ? WHERE id = ?').run(
          computed,
          new Date().toISOString(),
          med.id
        );
      } catch {}
      return { ...med, status: computed };
    }
    return med;
  }).filter((med) => {
    if (filter?.status && filter.status !== 'all') {
      return med.status === filter.status;
    }
    return true;
  });
}

export function getMedicineById(db: PostgresDatabase, id: string): Medicine | undefined {
  const item = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id) as Medicine | undefined;
  if (item) {
    const computed = computeMedicineStatus(item.quantity_in_stock, item.min_stock_level, item.expiry_date);
    if (computed !== item.status) {
      db.prepare('UPDATE medicines SET status = ?, updated_at = ? WHERE id = ?').run(
        computed,
        new Date().toISOString(),
        item.id
      );
      item.status = computed;
    }
  }
  return item;
}

export function saveMedicine(db: PostgresDatabase, data: Partial<Medicine>, performedBy = 'HR Admin'): Medicine {
  const now = new Date().toISOString();
  const qty = Number(data.quantity_in_stock ?? 0);
  const minStock = Number(data.min_stock_level ?? 10);
  const expiryDate = data.expiry_date || '';
  const status = computeMedicineStatus(qty, minStock, expiryDate);

  if (data.id) {
    const existing = db.prepare('SELECT * FROM medicines WHERE id = ?').get(data.id) as Medicine | undefined;
    if (existing) {
      db.prepare(`
        UPDATE medicines SET
          name = ?, generic_name = ?, category = ?, unit = ?, dosage = ?,
          supplier = ?, batch_number = ?, expiry_date = ?, quantity_in_stock = ?,
          min_stock_level = ?, purchase_price = ?, status = ?, storage_location = ?,
          description = ?, side_effects = ?, updated_at = ?
        WHERE id = ?
      `).run(
        data.name ?? existing.name,
        data.generic_name ?? existing.generic_name,
        data.category ?? existing.category,
        data.unit ?? existing.unit,
        data.dosage ?? existing.dosage,
        data.supplier ?? existing.supplier,
        data.batch_number ?? existing.batch_number,
        expiryDate || existing.expiry_date,
        qty,
        minStock,
        Number(data.purchase_price ?? existing.purchase_price),
        status,
        data.storage_location ?? existing.storage_location,
        data.description ?? existing.description,
        data.side_effects ?? existing.side_effects,
        now,
        data.id
      );

      // If stock quantity manually adjusted
      if (qty !== existing.quantity_in_stock) {
        const diff = qty - existing.quantity_in_stock;
        db.prepare(`
          INSERT INTO medicine_stock_transactions (
            id, medicine_id, transaction_type, quantity, batch_number,
            previous_stock, new_stock, unit_cost, total_cost,
            supplier_or_dest, reference_id, performed_by, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `stk-adj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          data.id,
          'Adjustment',
          Math.abs(diff),
          data.batch_number || existing.batch_number,
          existing.quantity_in_stock,
          qty,
          Number(data.purchase_price ?? existing.purchase_price),
          Math.abs(diff) * Number(data.purchase_price ?? existing.purchase_price),
          'Inventory Reconciliation',
          `ADJ-${data.id}`,
          performedBy,
          `Direct stock edit adjustment (${diff > 0 ? '+' : ''}${diff})`,
          now
        );
      }

      return getMedicineById(db, data.id)!;
    }
  }

  // Create new medicine
  const newId = `med-${Date.now().toString().slice(-6)}`;
  db.prepare(`
    INSERT INTO medicines (
      id, name, generic_name, category, unit, dosage, supplier,
      batch_number, expiry_date, quantity_in_stock, min_stock_level,
      purchase_price, status, storage_location, description, side_effects,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newId,
    data.name || 'New Medicine',
    data.generic_name || '',
    data.category || 'Analgesics & Antipyretics',
    data.unit || 'Tablets',
    data.dosage || '500mg',
    data.supplier || '',
    data.batch_number || `BATCH-${new Date().getFullYear()}-01`,
    expiryDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    qty,
    minStock,
    Number(data.purchase_price || 0),
    status,
    data.storage_location || 'Cabinet A1',
    data.description || '',
    data.side_effects || '',
    now,
    now
  );

  // Record initial stock transaction
  if (qty > 0) {
    db.prepare(`
      INSERT INTO medicine_stock_transactions (
        id, medicine_id, transaction_type, quantity, batch_number,
        previous_stock, new_stock, unit_cost, total_cost,
        supplier_or_dest, reference_id, performed_by, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `stk-in-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      newId,
      'Stock-in',
      qty,
      data.batch_number || `BATCH-${new Date().getFullYear()}-01`,
      0,
      qty,
      Number(data.purchase_price || 0),
      qty * Number(data.purchase_price || 0),
      data.supplier || 'Initial Intake',
      `PO-INIT-${newId}`,
      performedBy,
      'New medicine SKU intake into pharmacy stock',
      now
    );
  }

  return getMedicineById(db, newId)!;
}

export function deleteMedicine(db: PostgresDatabase, id: string): boolean {
  // Check if any issuances exist
  const issuances = db.prepare('SELECT COUNT(*) as count FROM medicine_issuances WHERE medicine_id = ?').get(id) as any;
  if (issuances && issuances.count > 0) {
    // If historical issuances exist, do not hard-delete; zero stock and mark Out of Stock
    db.prepare("UPDATE medicines SET quantity_in_stock = 0, status = 'Out of Stock', updated_at = ? WHERE id = ?").run(
      new Date().toISOString(),
      id
    );
    return true;
  }

  db.prepare('DELETE FROM medicine_stock_transactions WHERE medicine_id = ?').run(id);
  const result = db.prepare('DELETE FROM medicines WHERE id = ?').run(id);
  return result.changes > 0;
}

// -------------------------------------------------------------
// Stock Control Operations
// -------------------------------------------------------------

export function recordStockTransaction(
  db: PostgresDatabase,
  data: {
    medicine_id: string;
    transaction_type: StockTransactionType;
    quantity: number;
    batch_number?: string;
    unit_cost?: number;
    supplier_or_dest?: string;
    reference_id?: string;
    performed_by: string;
    notes?: string;
  }
): MedicineStockTransaction {
  const medicine = getMedicineById(db, data.medicine_id);
  if (!medicine) {
    throw new Error(`Medicine with ID ${data.medicine_id} not found.`);
  }

  const prevStock = medicine.quantity_in_stock;
  const qty = Math.max(0, Math.floor(data.quantity));
  let newStock = prevStock;

  switch (data.transaction_type) {
    case 'Stock-in':
    case 'Return':
      newStock = prevStock + qty;
      break;
    case 'Stock-out':
    case 'Expired Disposal':
    case 'Issue Deduction':
      if (qty > prevStock) {
        throw new Error(`Insufficient stock. Current stock is ${prevStock}, requested ${qty}.`);
      }
      newStock = prevStock - qty;
      break;
    case 'Adjustment':
      // Adjustment value can be target or delta. Here we treat quantity as the new balance if notes indicate or delta.
      newStock = qty;
      break;
  }

  const now = new Date().toISOString();
  const unitCost = data.unit_cost !== undefined ? data.unit_cost : medicine.purchase_price;
  const totalCost = qty * unitCost;
  const newStatus = computeMedicineStatus(newStock, medicine.min_stock_level, medicine.expiry_date);

  // Update Medicine
  db.prepare(`
    UPDATE medicines
    SET quantity_in_stock = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(newStock, newStatus, now, medicine.id);

  const txId = `stk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  db.prepare(`
    INSERT INTO medicine_stock_transactions (
      id, medicine_id, transaction_type, quantity, batch_number,
      previous_stock, new_stock, unit_cost, total_cost,
      supplier_or_dest, reference_id, performed_by, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    txId,
    medicine.id,
    data.transaction_type,
    qty,
    data.batch_number || medicine.batch_number,
    prevStock,
    newStock,
    unitCost,
    totalCost,
    data.supplier_or_dest || (data.transaction_type === 'Expired Disposal' ? 'Safe Medical Waste Disposal' : medicine.supplier),
    data.reference_id || `TX-${txId}`,
    data.performed_by,
    data.notes || '',
    now
  );

  return db.prepare(`
    SELECT t.*, m.name as medicine_name, m.generic_name as generic_name
    FROM medicine_stock_transactions t
    JOIN medicines m ON m.id = t.medicine_id
    WHERE t.id = ?
  `).get(txId) as MedicineStockTransaction;
}

export function getMedicineStockTransactions(
  db: PostgresDatabase,
  medicineId?: string,
  limit = 100
): MedicineStockTransaction[] {
  let sql = `
    SELECT t.*, m.name as medicine_name, m.generic_name as generic_name, m.unit as unit
    FROM medicine_stock_transactions t
    LEFT JOIN medicines m ON m.id = t.medicine_id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (medicineId) {
    sql += ' AND t.medicine_id = ?';
    params.push(medicineId);
  }
  sql += ' ORDER BY t.created_at DESC LIMIT ?';
  params.push(limit);

  return db.prepare(sql).all(...params) as MedicineStockTransaction[];
}

// -------------------------------------------------------------
// Medicine Issuing Operations (Auto Stock Deduction)
// -------------------------------------------------------------

export function issueMedicine(
  db: PostgresDatabase,
  data: {
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
  }
): MedicineIssuance {
  const medicine = getMedicineById(db, data.medicine_id);
  if (!medicine) {
    throw new Error('Selected medicine was not found.');
  }

  const qty = Math.max(1, Math.floor(data.quantity_issued));
  if (medicine.quantity_in_stock < qty) {
    throw new Error(
      `Cannot issue ${qty} ${medicine.unit}. Only ${medicine.quantity_in_stock} ${medicine.unit} available in stock.`
    );
  }

  const now = new Date().toISOString();
  const prevStock = medicine.quantity_in_stock;
  const newStock = prevStock - qty;
  const newStatus = computeMedicineStatus(newStock, medicine.min_stock_level, medicine.expiry_date);
  const costAtIssue = medicine.purchase_price;
  const totalCost = qty * costAtIssue;

  // 1. Automatically deduct stock
  db.prepare(`
    UPDATE medicines
    SET quantity_in_stock = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(newStock, newStatus, now, medicine.id);

  const issuanceId = `iss-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // 2. Insert Issuance Record
  db.prepare(`
    INSERT INTO medicine_issuances (
      id, medical_record_id, employee_id, medicine_id, quantity_issued,
      prescription_instruction, dosage, frequency, duration, issued_by,
      issued_at, cost_at_issue, total_cost, batch_number, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    issuanceId,
    data.medical_record_id || null,
    data.employee_id,
    medicine.id,
    qty,
    data.prescription_instruction || `${medicine.dosage} as prescribed`,
    data.dosage || medicine.dosage,
    data.frequency || 'As directed',
    data.duration || 'As directed',
    data.issued_by,
    now,
    costAtIssue,
    totalCost,
    medicine.batch_number,
    data.notes || ''
  );

  // 3. Log Stock Control Transaction
  db.prepare(`
    INSERT INTO medicine_stock_transactions (
      id, medicine_id, transaction_type, quantity, batch_number,
      previous_stock, new_stock, unit_cost, total_cost,
      supplier_or_dest, reference_id, performed_by, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `stk-deduct-${issuanceId}`,
    medicine.id,
    'Issue Deduction',
    qty,
    medicine.batch_number,
    prevStock,
    newStock,
    costAtIssue,
    totalCost,
    `Employee: ${data.employee_id}`,
    data.medical_record_id || issuanceId,
    data.issued_by,
    `Automated stock deduction upon medicine issuing: ${data.prescription_instruction || ''}`,
    now
  );

  return db.prepare(`
    SELECT i.*, 
      m.name as medicine_name, m.generic_name as generic_name, m.unit as unit,
      e.first_name || ' ' || e.last_name as employee_name,
      e.khmer_name as khmer_name,
      e.avatar as employee_avatar,
      d.name as department_name
    FROM medicine_issuances i
    JOIN medicines m ON m.id = i.medicine_id
    JOIN employees e ON e.id = i.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE i.id = ?
  `).get(issuanceId) as MedicineIssuance;
}

export function getMedicineIssuances(
  db: PostgresDatabase,
  filter?: { employeeId?: string; medicineId?: string; startDate?: string; endDate?: string }
): MedicineIssuance[] {
  let sql = `
    SELECT i.*, 
      m.name as medicine_name, m.generic_name as generic_name, m.unit as unit,
      e.first_name || ' ' || e.last_name as employee_name,
      e.khmer_name as khmer_name,
      e.avatar as employee_avatar,
      d.name as department_name
    FROM medicine_issuances i
    LEFT JOIN medicines m ON m.id = i.medicine_id
    LEFT JOIN employees e ON e.id = i.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filter?.employeeId) {
    sql += ' AND i.employee_id = ?';
    params.push(filter.employeeId);
  }
  if (filter?.medicineId) {
    sql += ' AND i.medicine_id = ?';
    params.push(filter.medicineId);
  }
  if (filter?.startDate) {
    sql += ' AND i.issued_at >= ?';
    params.push(filter.startDate);
  }
  if (filter?.endDate) {
    sql += ' AND i.issued_at <= ?';
    params.push(filter.endDate);
  }

  sql += ' ORDER BY i.issued_at DESC LIMIT 200';

  return db.prepare(sql).all(...params) as MedicineIssuance[];
}

// -------------------------------------------------------------
// Employee Medical Records Operations
// -------------------------------------------------------------

export function getEmployeeMedicalRecords(
  db: PostgresDatabase,
  filter?: { employeeId?: string; startDate?: string; endDate?: string; search?: string; departmentId?: string }
): EmployeeMedicalRecord[] {
  let sql = `
    SELECT r.*,
      e.first_name || ' ' || e.last_name as employee_name,
      e.khmer_name as khmer_name,
      e.role as employee_role,
      e.avatar as employee_avatar,
      d.name as department_name
    FROM employee_medical_records r
    JOIN employees e ON e.id = r.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filter?.employeeId) {
    sql += ' AND r.employee_id = ?';
    params.push(filter.employeeId);
  }
  if (filter?.departmentId && filter.departmentId !== 'all') {
    sql += ' AND e.department_id = ?';
    params.push(filter.departmentId);
  }
  if (filter?.startDate) {
    sql += ' AND r.visit_date >= ?';
    params.push(filter.startDate);
  }
  if (filter?.endDate) {
    sql += ' AND r.visit_date <= ?';
    params.push(filter.endDate);
  }
  if (filter?.search) {
    sql += ' AND (LOWER(r.symptoms) LIKE ? OR LOWER(r.diagnosis) LIKE ? OR LOWER(r.doctor_name) LIKE ? OR LOWER(e.first_name) LIKE ? OR LOWER(e.last_name) LIKE ?)';
    const term = `%${filter.search.toLowerCase()}%`;
    params.push(term, term, term, term, term);
  }

  sql += ' ORDER BY r.visit_date DESC, r.created_at DESC LIMIT 200';

  return db.prepare(sql).all(...params) as EmployeeMedicalRecord[];
}

export function getMedicalRecordById(db: PostgresDatabase, id: string): (EmployeeMedicalRecord & { issuances?: MedicineIssuance[] }) | undefined {
  const record = db.prepare(`
    SELECT r.*,
      e.first_name || ' ' || e.last_name as employee_name,
      e.khmer_name as khmer_name,
      e.role as employee_role,
      e.avatar as employee_avatar,
      d.name as department_name
    FROM employee_medical_records r
    JOIN employees e ON e.id = r.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE r.id = ?
  `).get(id) as EmployeeMedicalRecord | undefined;

  if (!record) return undefined;

  const issuances = db.prepare(`
    SELECT i.*, 
      m.name as medicine_name, m.generic_name as generic_name, m.unit as unit
    FROM medicine_issuances i
    JOIN medicines m ON m.id = i.medicine_id
    WHERE i.medical_record_id = ?
    ORDER BY i.issued_at ASC
  `).all(id) as MedicineIssuance[];

  return { ...record, issuances };
}

export function saveMedicalRecord(
  db: PostgresDatabase,
  data: Partial<EmployeeMedicalRecord>,
  medicinesToIssue?: Array<{
    medicine_id: string;
    quantity: number;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instruction?: string;
  }>
): EmployeeMedicalRecord {
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  const visitDate = data.visit_date || today;

  let recordId = data.id;

  if (recordId) {
    // Update
    db.prepare(`
      UPDATE employee_medical_records SET
        employee_id = ?, visit_date = ?, visit_time = ?, symptoms = ?,
        diagnosis = ?, temperature = ?, blood_pressure = ?, heart_rate = ?,
        respiratory_rate = ?, weight_kg = ?, medicine_prescribed = ?,
        dosage = ?, frequency = ?, duration = ?, doctor_name = ?,
        medical_notes = ?, recommended_action = ?, medical_leave_granted = ?,
        medical_leave_days = ?, follow_up_date = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.employee_id,
      visitDate,
      data.visit_time || '10:00 AM',
      data.symptoms || '',
      data.diagnosis || '',
      data.temperature || null,
      data.blood_pressure || null,
      data.heart_rate || null,
      data.respiratory_rate || null,
      data.weight_kg || null,
      data.medicine_prescribed || '',
      data.dosage || '',
      data.frequency || '',
      data.duration || '',
      data.doctor_name || 'Dr. Chea Sokhom (Chief Medical Officer)',
      data.medical_notes || '',
      data.recommended_action || '',
      data.medical_leave_granted ? 1 : 0,
      Number(data.medical_leave_days || 0),
      data.follow_up_date || null,
      data.status || 'Completed',
      now,
      recordId
    );
  } else {
    // Insert new
    recordId = `medrec-${Date.now().toString().slice(-6)}`;
    db.prepare(`
      INSERT INTO employee_medical_records (
        id, employee_id, visit_date, visit_time, symptoms, diagnosis,
        temperature, blood_pressure, heart_rate, respiratory_rate, weight_kg,
        medicine_prescribed, dosage, frequency, duration, doctor_name,
        medical_notes, recommended_action, medical_leave_granted, medical_leave_days,
        follow_up_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      recordId,
      data.employee_id,
      visitDate,
      data.visit_time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      data.symptoms || '',
      data.diagnosis || '',
      data.temperature || null,
      data.blood_pressure || null,
      data.heart_rate || null,
      data.respiratory_rate || null,
      data.weight_kg || null,
      data.medicine_prescribed || '',
      data.dosage || '',
      data.frequency || '',
      data.duration || '',
      data.doctor_name || 'Dr. Chea Sokhom (Chief Medical Officer)',
      data.medical_notes || '',
      data.recommended_action || '',
      data.medical_leave_granted ? 1 : 0,
      Number(data.medical_leave_days || 0),
      data.follow_up_date || null,
      data.status || 'Completed',
      now,
      now
    );
  }

  // Auto-issue medicines if specified
  if (medicinesToIssue && medicinesToIssue.length > 0 && data.employee_id) {
    for (const item of medicinesToIssue) {
      try {
        issueMedicine(db, {
          medical_record_id: recordId,
          employee_id: data.employee_id,
          medicine_id: item.medicine_id,
          quantity_issued: item.quantity,
          prescription_instruction: item.instruction || `${item.dosage || ''} ${item.frequency || ''} for ${item.duration || ''}`.trim(),
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          issued_by: data.doctor_name || 'Dr. Chea Sokhom',
        });
      } catch (err) {
        console.error('[Medical DB] Auto-issue failed for item:', item, err);
      }
    }
  }

  // Medical Leave Integration: If medical leave is granted, synchronize with leave_requests table
  if (data.medical_leave_granted && Number(data.medical_leave_days) > 0 && data.employee_id) {
    try {
      const leaveDays = Number(data.medical_leave_days);
      const leaveId = `leave-med-${recordId}`;
      const existingLeave = db.prepare('SELECT id FROM leave_requests WHERE id = ?').get(leaveId);
      if (!existingLeave) {
        const emp = db.prepare('SELECT first_name, last_name, role FROM employees WHERE id = ?').get(data.employee_id) as any;
        const empName = emp ? `${emp.first_name} ${emp.last_name}` : 'Staff Employee';
        
        // Calculate end date based on days
        const endDateObj = new Date(visitDate);
        endDateObj.setDate(endDateObj.getDate() + Math.max(0, Math.ceil(leaveDays) - 1));
        const endDateStr = endDateObj.toISOString().split('T')[0];

        db.prepare(`
          INSERT INTO leave_requests (
            id, employee_id, employee_name, employee_role,
            leave_type, start_date, end_date, days, reason, status,
            applied_on, reviewer_comments
          ) VALUES (?, ?, ?, ?, 'Sick', ?, ?, ?, ?, 'Approved', ?, ?)
        `).run(
          leaveId,
          data.employee_id,
          empName,
          emp?.role || 'Employee',
          visitDate,
          endDateStr,
          leaveDays,
          `Medical Leave granted by clinic: ${data.diagnosis} (${data.recommended_action || ''})`,
          visitDate,
          `Approved by Medical Officer ${data.doctor_name || 'Dr. Chea Sokhom'} (Clinic Visit ID: ${recordId})`
        );

        // Update sick leave balance
        db.prepare(`
          UPDATE leave_balances
          SET sick_used = sick_used + ?
          WHERE employee_id = ?
        `).run(leaveDays, data.employee_id);
      }
    } catch (err) {
      console.error('[Medical DB] Failed to sync medical leave with leave_requests:', err);
    }
  }

  return getMedicalRecordById(db, recordId)!;
}

export function deleteMedicalRecord(db: PostgresDatabase, id: string): boolean {
  const result = db.prepare('DELETE FROM employee_medical_records WHERE id = ?').run(id);
  return result.changes > 0;
}

// -------------------------------------------------------------
// Dashboard & Reports Analytics
// -------------------------------------------------------------

export function getMedicalDashboardStats(db: PostgresDatabase): MedicalDashboardStats {
  const medicines = getMedicines(db);
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const totalMedicines = medicines.length;
  let totalStockUnits = 0;
  let totalInventoryValue = 0;
  let lowStockCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;

  for (const m of medicines) {
    totalStockUnits += m.quantity_in_stock;
    totalInventoryValue += m.quantity_in_stock * m.purchase_price;
    if (m.status === 'Low Stock' || m.status === 'Out of Stock') lowStockCount++;
    if (m.status === 'Expiring Soon') expiringCount++;
    if (m.status === 'Expired') expiredCount++;
  }

  // Monthly stats
  const visitsMonthRow = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(medical_leave_days), 0) as leave_days
    FROM employee_medical_records
    WHERE visit_date LIKE ?
  `).get(`${currentMonthStr}%`) as any;

  const totalVisitsMonth = Number(visitsMonthRow?.count || 0);
  const totalSickLeaveDaysMonth = Number(visitsMonthRow?.leave_days || 0);

  const issuedMonthRow = db.prepare(`
    SELECT COALESCE(SUM(quantity_issued), 0) as total_qty, COALESCE(SUM(total_cost), 0) as total_cost
    FROM medicine_issuances
    WHERE issued_at LIKE ?
  `).get(`${currentMonthStr}%`) as any;

  const totalIssuedMonth = Number(issuedMonthRow?.total_qty || 0);
  const medicalCostMonth = Number(issuedMonthRow?.total_cost || 0);

  return {
    totalMedicines,
    totalStockUnits,
    totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
    lowStockCount,
    expiringCount,
    expiredCount,
    totalVisitsMonth,
    totalIssuedMonth,
    medicalCostMonth: Number(medicalCostMonth.toFixed(2)),
    totalSickLeaveDaysMonth,
  };
}

export function getMedicalReportsData(db: PostgresDatabase) {
  const stats = getMedicalDashboardStats(db);
  const medicines = getMedicines(db);

  // 1. Low stock medicines
  const lowStockMedicines = medicines.filter(
    (m) => m.quantity_in_stock <= m.min_stock_level || m.status === 'Low Stock' || m.status === 'Out of Stock'
  );

  // 2. Expiring & Expired medicines
  const expiringMedicines = medicines.filter((m) => m.status === 'Expiring Soon');
  const expiredMedicines = medicines.filter((m) => m.status === 'Expired');

  // 3. Medicine usage by month (past 6 months)
  const monthlyUsage: Array<{ month: string; monthName: string; units: number; cost: number }> = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const row = db.prepare(`
      SELECT COALESCE(SUM(quantity_issued), 0) as units, COALESCE(SUM(total_cost), 0) as cost
      FROM medicine_issuances
      WHERE issued_at LIKE ?
    `).get(`${key}%`) as any;

    monthlyUsage.push({
      month: key,
      monthName,
      units: Number(row?.units || 0),
      cost: Number(Number(row?.cost || 0).toFixed(2)),
    });
  }

  // 4. Employee medical visits by department
  const visitsByDepartment = db.prepare(`
    SELECT 
      COALESCE(d.name, 'Unassigned') as department_name,
      COUNT(r.id) as visit_count,
      COALESCE(SUM(r.medical_leave_days), 0) as medical_leave_days
    FROM employee_medical_records r
    JOIN employees e ON e.id = r.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    GROUP BY d.name
    ORDER BY visit_count DESC
  `).all() as Array<{ department_name: string; visit_count: number; medical_leave_days: number }>;

  // 5. Medical cost by department (sum of issued medicine costs by employee department)
  const costByDepartment = db.prepare(`
    SELECT 
      COALESCE(d.name, 'Unassigned') as department_name,
      COUNT(i.id) as prescriptions_count,
      COALESCE(SUM(i.total_cost), 0) as total_medical_cost
    FROM medicine_issuances i
    JOIN employees e ON e.id = i.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    GROUP BY d.name
    ORDER BY total_medical_cost DESC
  `).all() as Array<{ department_name: string; prescriptions_count: number; total_medical_cost: number }>;

  // 6. Medicine consumption trends (Top 10 dispensed medicines)
  const consumptionTrends = db.prepare(`
    SELECT 
      m.id,
      m.name,
      m.generic_name,
      m.category,
      m.unit,
      m.quantity_in_stock,
      COALESCE(SUM(i.quantity_issued), 0) as total_issued,
      COALESCE(SUM(i.total_cost), 0) as total_expense
    FROM medicines m
    LEFT JOIN medicine_issuances i ON i.medicine_id = m.id
    GROUP BY m.id, m.name, m.generic_name, m.category, m.unit, m.quantity_in_stock
    ORDER BY total_issued DESC
    LIMIT 10
  `).all() as Array<{
    id: string;
    name: string;
    generic_name: string;
    category: string;
    unit: string;
    quantity_in_stock: number;
    total_issued: number;
    total_expense: number;
  }>;

  // 7. Top Diagnoses in clinic
  const topDiagnoses = db.prepare(`
    SELECT diagnosis, COUNT(*) as count
    FROM employee_medical_records
    GROUP BY diagnosis
    ORDER BY count DESC
    LIMIT 6
  `).all() as Array<{ diagnosis: string; count: number }>;

  return {
    stats,
    lowStockMedicines,
    expiringMedicines,
    expiredMedicines,
    monthlyUsage,
    visitsByDepartment,
    costByDepartment,
    consumptionTrends,
    topDiagnoses,
  };
}
