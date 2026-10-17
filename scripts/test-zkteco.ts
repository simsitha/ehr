/**
 * scripts/test-zkteco.ts
 * Comprehensive automated test suite for ZKTeco SpeedFace-V5L Integration
 * Tests:
 * 1. Database seed and device configuration
 * 2. Network connectivity probe and proper offline error codes (no fake data)
 * 3. User Auto-Mapping Engine (5-tier matching)
 * 4. Multi-device punch pairing across ZKTeco-01 & ZKTeco-02
 * 5. Shift, grace period (Late) and Overtime calculations
 * 6. Duplicate transaction protection
 * 7. Manual HR correction audit trail (preserving immutable raw logs)
 */

import fs from 'fs';
import path from 'path';
import { getDb, getZKTecoDevices, insertRawTransactions, createAttendanceCorrection, getAttendanceCorrections } from '../src/lib/db';
import { ZKTecoSpeedFaceAdapter } from '../src/lib/zkteco/speedface-adapter';
import { UserMappingEngine, EmployeeMatchCandidate } from '../src/lib/zkteco/mapping-engine';
import { AttendanceProcessor } from '../src/lib/zkteco/attendance-processor';
import { startAdmsServer, stopAdmsServer } from '../src/lib/zkteco/adms-server';
import { ZKTecoSyncService } from '../src/lib/zkteco/sync-service';
import { ZKTecoReportService } from '../src/lib/zkteco/report-service';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `- ${detail}` : ''}`);
    failCount++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('  HESTRA HRM — ZKTeco SpeedFace-V5L Integration Test');
  console.log('====================================================\n');

  const db = getDb();

  // ----------------------------------------------------
  // Test 1: Device Configuration & Seed
  // ----------------------------------------------------
  console.log('TEST 1: Seeded Device Configuration');
  const devices = getZKTecoDevices();
  assert(devices.length >= 2, 'Devices seeded in database', `Found ${devices.length} devices`);
  
  const dev1 = devices.find(d => d.ip_address === '192.168.88.201');
  const dev2 = devices.find(d => d.ip_address === '192.168.88.202');

  assert(!!dev1, 'Device 01 (192.168.88.201) exists');
  assert(dev1?.model === 'SpeedFace-V5L' && dev1?.platform === 'ZAM230', 'Device 01 model SpeedFace-V5L, platform ZAM230');
  assert((dev1?.port === 8081 || dev1?.port === 4370) && dev1?.location === 'Main Entrance', 'Device 01 port 8081 or 4370, Main Entrance');

  assert(!!dev2, 'Device 02 (192.168.88.202) exists');
  assert((dev2?.port === 8081 || dev2?.port === 4370) && dev2?.location === 'Secondary Entrance', 'Device 02 port 8081 or 4370, Secondary Entrance');
  console.log('');

  // ----------------------------------------------------
  // Test 2: Network Connectivity Probe & Error Reporting (No Fake Data)
  // ----------------------------------------------------
  console.log('TEST 2: Network Diagnostics & Offline Error Handling');
  const adapter = new ZKTecoSpeedFaceAdapter({
    host: '192.168.88.201',
    port: 4370,
    timeoutMs: 1000,
    retryAttempts: 1,
    deviceName: 'ZKTeco-01',
  });

  const probeResult = await adapter.probeTcpPort(1000);
  console.log(`  [Probe Info] Host reachable: ${probeResult.reachable}, Code: ${probeResult.code || 'CONNECTED'}, Latency: ${probeResult.latencyMs}ms`);

  const testResult = await adapter.testConnection();
  if (!probeResult.reachable) {
    assert(!testResult.success, 'Connection test properly reports failure when host is unreachable');
    assert(
      testResult.errorCode === 'DEVICE_OFFLINE' ||
      testResult.errorCode === 'CONNECTION_TIMEOUT' ||
      testResult.errorCode === 'CONNECTION_REFUSED',
      `Error code is standardized: ${testResult.errorCode}`
    );
    assert(
      Array.isArray(testResult.suggestions) && testResult.suggestions.length > 0,
      'Section 31 diagnostic guidance provided'
    );
    assert(!testResult.info, 'Strict rule: No fake device information is fabricated when offline');
  } else {
    assert(testResult.success, 'Device reached and initialized successfully');
  }
  console.log('');

  // ----------------------------------------------------
  // Test 3: User Auto-Mapping Engine (5-Tier Matching)
  // ----------------------------------------------------
  console.log('TEST 3: User Auto-Mapping Engine (5-Tier Matching)');
  const testEmployees: EmployeeMatchCandidate[] = [
    { id: 'EMP-2026-160', first_name: 'admin', last_name: 'Sarath Te', khmer_name: 'សារ៉ាត់' },
    { id: 'HC003', first_name: 'Sophea', last_name: 'Chan' },
    { id: 'EMP-00042', first_name: 'Dara', last_name: 'Vann' },
  ];

  // Tier 1: Exact Employee ID
  const match1 = UserMappingEngine.matchDeviceUser({ device_user_id: 'EMP-2026-160' }, testEmployees);
  assert(match1.matched && match1.employeeId === 'EMP-2026-160', 'Tier 1: Matches exact Employee ID (EMP-2026-160)');
  assert(match1.confidence === 1.0 && match1.matchMethod === 'Employee ID', 'Tier 1 confidence is 1.0');

  // Tier 2: Numeric Employee Code extraction ('3' -> 'HC003', '160' -> 'EMP-2026-160')
  const match2 = UserMappingEngine.matchDeviceUser({ device_user_id: '3' }, testEmployees);
  assert(match2.matched && match2.employeeId === 'HC003', 'Tier 2: Matches numeric code 3 -> HC003');
  assert(match2.confidence >= 0.90 && match2.matchMethod === 'Employee Code', 'Tier 2 confidence >= 0.90');

  const match2b = UserMappingEngine.matchDeviceUser({ device_user_id: '160' }, testEmployees);
  assert(match2b.matched && match2b.employeeId === 'EMP-2026-160', 'Tier 2: Matches numeric code 160 -> EMP-2026-160');

  // Tier 5: Exact Name Match
  const match3 = UserMappingEngine.matchDeviceUser({ device_user_id: '9999', device_user_name: 'Dara Vann' }, testEmployees);
  assert(match3.matched && match3.employeeId === 'EMP-00042', 'Tier 5: Matches exact name "Dara Vann" -> EMP-00042');
  assert(match3.confidence >= 0.80 && match3.matchMethod === 'Exact Employee Name', 'Name match confidence >= 0.80');

  // Ambiguous / Unmatched
  const matchFail = UserMappingEngine.matchDeviceUser({ device_user_id: '8888', device_user_name: 'Unknown Visitor' }, testEmployees);
  assert(!matchFail.matched && matchFail.status === 'Needs Mapping', 'Uncertain user flagged as "Needs Mapping"');
  console.log('');

  // ----------------------------------------------------
  // Test 4: Duplicate Transaction Protection
  // ----------------------------------------------------
  console.log('TEST 4: Duplicate Transaction Protection');
  const testDevId = dev1?.id || 'zk-01';
  const testTransId = `tx-test-${Date.now()}`;
  const testEmployeeId = 'EMP-2026-160';
  const testDate = '2026-11-15';

  const txBatch1 = [{
    device_id: testDevId,
    device_user_id: '160',
    employee_id: testEmployeeId,
    transaction_id: testTransId,
    attendance_timestamp: `${testDate}T07:20:00.000Z`,
    punch_date: testDate,
    punch_time: '07:20:00',
    attendance_type: 'Check-In' as const,
    verification_method: 'Fingerprint' as const,
    device_serial: 'SF5L2026001',
    device_ip: '192.168.88.201',
    location: 'Main Entrance',
  }];

  const res1 = insertRawTransactions(txBatch1);
  assert(res1.newCount === 1, 'First insertion of raw transaction accepted (newCount = 1)');

  // Re-insert identical transaction
  const resDup = insertRawTransactions(txBatch1);
  assert(resDup.newCount === 0 && resDup.duplicates === 1, 'Duplicate transaction correctly rejected (duplicates = 1, newCount = 0)');
  console.log('');

  // ----------------------------------------------------
  // Test 5: Multi-Device Pairing & Attendance Engine Calculation
  // ----------------------------------------------------
  console.log('TEST 5: Multi-Device Pairing Across Terminals');
  // Add a second punch from Device 02 (Secondary Entrance) for checkout at 18:45:00
  const testDev2Id = dev2?.id || 'zk-02';
  const testTransId2 = `tx-test-out-${Date.now()}`;

  const txBatch2 = [{
    device_id: testDev2Id,
    device_user_id: '160',
    employee_id: testEmployeeId,
    transaction_id: testTransId2,
    attendance_timestamp: `${testDate}T18:45:00.000Z`,
    punch_date: testDate,
    punch_time: '18:45:00',
    attendance_type: 'Check-Out' as const,
    verification_method: 'Face' as const,
    device_serial: 'SF5L2026002',
    device_ip: '192.168.88.202',
    location: 'Secondary Entrance',
  }];

  insertRawTransactions(txBatch2);

  // Process the punches through AttendanceProcessor
  const processResult = AttendanceProcessor.processRawTransactions({
    date: testDate,
    employeeId: testEmployeeId,
    gracePeriodMinutes: 10,
  });

  assert(processResult.processedRawCount >= 2, `Processed punches for day: ${processResult.processedRawCount}`);
  assert(processResult.errors === 0, 'Zero errors during processing');

  // Inspect the generated row in attendance table
  const attRecord = db.prepare(`SELECT * FROM attendance WHERE employee_id = ? AND date = ?`).get(testEmployeeId, testDate) as any;
  assert(!!attRecord, 'Attendance record created/updated in official attendance table');
  assert(attRecord?.clock_in === '07:20:00', `Clock In is earliest punch (07:20:00) vs actual (${attRecord?.clock_in})`);
  assert(attRecord?.clock_out === '18:45:00', `Clock Out is latest punch from secondary device (18:45:00) vs actual (${attRecord?.clock_out})`);
  assert(attRecord?.status === 'Present', `Status is 'Present' (07:20 is before 07:30 + 10m grace period)`);
  assert(attRecord?.work_hours >= 8.0, `Work hours properly calculated (${attRecord?.work_hours} hrs, lunch break accounted for)`);
  assert(attRecord?.overtime_hours > 0, `Overtime properly calculated (${attRecord?.overtime_hours} hrs past 16:30)`);
  assert(attRecord?.source === 'ZKTeco Direct', `Source tagged as 'ZKTeco Direct'`);
  assert(attRecord?.notes?.includes('Main Entrance') && attRecord?.notes?.includes('Secondary Entrance'), 'Notes audit trail records both physical entrances used');
  assert(attRecord?.notes?.includes('Fingerprint') && attRecord?.notes?.includes('Face'), 'Notes audit trail records both verification methods used');
  console.log('');

  // ----------------------------------------------------
  // Test 6: Grace Period & Late Arrival Calculation
  // ----------------------------------------------------
  console.log('TEST 6: Grace Period & Late Arrival Calculation');
  const lateDate = '2026-11-16';
  const lateTx = [{
    device_id: testDevId,
    device_user_id: '160',
    employee_id: testEmployeeId,
    transaction_id: `tx-late-${Date.now()}`,
    attendance_timestamp: `${lateDate}T07:55:00.000Z`,
    punch_date: lateDate,
    punch_time: '07:55:00', // Past 07:30 + 10 min grace period = 07:40
    attendance_type: 'Check-In' as const,
    verification_method: 'Face' as const,
    device_serial: 'SF5L2026001',
    device_ip: '192.168.88.201',
    location: 'Main Entrance',
  }];

  insertRawTransactions(lateTx);
  AttendanceProcessor.processRawTransactions({
    date: lateDate,
    employeeId: testEmployeeId,
    gracePeriodMinutes: 10,
  });

  const lateRecord = db.prepare(`SELECT * FROM attendance WHERE employee_id = ? AND date = ?`).get(testEmployeeId, lateDate) as any;
  assert(lateRecord?.status === 'Late', `Punched at 07:55:00 correctly categorized as 'Late' (grace period: 10 min)`);
  console.log('');

  // ----------------------------------------------------
  // Test 7: Manual HR Correction & Immutable Raw Log Preservation
  // ----------------------------------------------------
  console.log('TEST 7: Manual Attendance Correction & Audit Preservation');
  // Check the raw log before correction
  const rawBefore = db.prepare(`SELECT * FROM attendance_raw_transactions WHERE transaction_id = ?`).get(testTransId) as any;
  assert(!!rawBefore, 'Raw transaction exists before correction');

  // Perform manual correction
  const correctionResult = createAttendanceCorrection({
    attendance_id: attRecord.id,
    employee_id: testEmployeeId,
    date: testDate,
    field_changed: 'clock_in',
    old_value: attRecord.clock_in,
    new_value: '08:00:00',
    reason: 'Employee arrived early at 08:00 for security briefing before badge scan',
    changed_by: 'HR Admin (Sarath Te)',
  });

  assert(!!correctionResult?.id, 'Manual correction recorded in database');

  // Verify raw transaction was NOT altered
  const rawAfter = db.prepare(`SELECT * FROM attendance_raw_transactions WHERE transaction_id = ?`).get(testTransId) as any;
  assert(
    rawAfter.punch_time === rawBefore.punch_time && rawAfter.attendance_timestamp === rawBefore.attendance_timestamp,
    'Raw transaction is IMMUTABLE: original punch time remains intact for compliance & audit'
  );

  // Verify correction audit log
  const corrections = getAttendanceCorrections(testDate, testEmployeeId);
  const matchedCorrection = corrections.find(c => c.id === correctionResult.id);
  assert(!!matchedCorrection, 'Correction audit record retrieved');
  assert(
    Boolean(matchedCorrection?.reason?.includes('security briefing') && matchedCorrection?.new_value === '08:00:00'),
    'Audit record details match HR reason and adjusted timestamps'
  );
  console.log('');

  // ----------------------------------------------------
  // Test 8: ZKTeco ADMS Push Protocol (Handshake & Real-Time Push)
  // ----------------------------------------------------
  console.log('TEST 8: ZKTeco ADMS Push Protocol Ingestion');
  const testAdmsPort = 8089;
  startAdmsServer(testAdmsPort, '127.0.0.1');

  try {
    // 8.1: Handshake GET /iclock/cdata
    const hsRes = await fetch(`http://127.0.0.1:${testAdmsPort}/iclock/cdata?SN=SF5L2026001&options=all`);
    const hsText = await hsRes.text();
    assert(hsRes.status === 200, 'ADMS Handshake responds with HTTP 200');
    assert(hsText.includes('GET OPTION FROM: SF5L2026001'), 'ADMS Handshake includes GET OPTION FROM');
    assert(hsText.includes('TimeZone=7'), 'ADMS Handshake sets TimeZone=7 (Phnom Penh)');

    // 8.2: Heartbeat & Command Polling GET /iclock/getrequest
    const hbRes = await fetch(`http://127.0.0.1:${testAdmsPort}/iclock/getrequest?SN=SF5L2026001`);
    const hbText = await hbRes.text();
    assert(hbRes.status === 200, 'ADMS Heartbeat polling responds with HTTP 200');
    assert(hbText.trim() === 'OK' || hbText.startsWith('C:'), 'ADMS Heartbeat response is OK or delivers commands');

    // 8.3: Health Diagnostics endpoint GET /health
    const healthRes = await fetch(`http://127.0.0.1:${testAdmsPort}/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, 'ADMS Health endpoint responds with HTTP 200');
    assert(healthJson.status === 'online', 'ADMS Receiver status is online');
    assert(typeof healthJson.server_ip === 'string' && healthJson.server_ip.length > 0, 'ADMS Receiver reports server IP');

    // 8.4: Photo File Endpoint GET/POST /iclock/fdata
    const fdataGetRes = await fetch(`http://127.0.0.1:${testAdmsPort}/iclock/fdata?SN=SF5L2026001&PIN=003`);
    assert(fdataGetRes.status === 200 || fdataGetRes.status === 404, 'ADMS /iclock/fdata GET responds with HTTP 200 or 404');

    const dummyJpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]),
      Buffer.alloc(200, 0x55),
    ]);
    const fdataPostRes = await fetch(`http://127.0.0.1:${testAdmsPort}/iclock/fdata?SN=SF5L2026001&PIN=003&table=USERPIC`, {
      method: 'POST',
      body: dummyJpeg,
    });
    assert(fdataPostRes.status === 200, 'ADMS /iclock/fdata POST receives photo data and responds HTTP 200');
  } finally {
    await stopAdmsServer();
  }
  console.log('');

  // ----------------------------------------------------
  // Test 9: Enrolled User Photo Synchronization
  // ----------------------------------------------------
  console.log('TEST 9: Enrolled User Photo Synchronization');
  const photoSync = await ZKTecoSyncService.syncUserPhotos('zk-01', 'Test Admin');
  assert(photoSync.success === true, 'syncUserPhotos returns success');
  assert(photoSync.totalUsers > 0, `syncUserPhotos processes enrolled users (${photoSync.totalUsers} total)`);
  assert(photoSync.updatedCount >= 0, `syncUserPhotos records updated photos count (${photoSync.updatedCount})`);

  const userWithPhoto = db.prepare(`
    SELECT user_photo FROM attendance_device_users 
    WHERE device_id = 'zk-01' AND user_photo IS NOT NULL AND user_photo != ''
  `).get() as any;
  assert(Boolean(userWithPhoto?.user_photo), 'Database stores non-empty user_photo path for enrolled user');
  console.log('');

  // ----------------------------------------------------
  // Test 10: Authentic ZKTeco Attendance Reports Suite
  // ----------------------------------------------------
  console.log('TEST 10: Authentic ZKTeco Attendance Reports Suite');

  // 10.1 Daily Report
  const daily = ZKTecoReportService.getDailyReport({ date: '2026-10-16' });
  assert(daily.records.length === 140, 'Daily report returns all 140 active staff members', `Got ${daily.records.length}`);
  assert(daily.summary.total_scheduled === 140, 'Daily summary tracks 140 scheduled staff');
  assert(daily.summary.present_count > 100, `Daily summary records high attendance (${daily.summary.present_count} present)`);
  assert(daily.summary.total_work_hours > 0, `Daily summary calculates total work hours (${daily.summary.total_work_hours}h)`);
  const firstDaily = daily.records[0];
  assert(Boolean(firstDaily.pin && firstDaily.shift_name && firstDaily.timetable_in && firstDaily.terminal_name), 'Daily row has authentic ZKTeco fields (PIN, shift, timetable, terminal)');

  // 10.2 Weekly Report
  const weekly = ZKTecoReportService.getWeeklyReport({ weekStart: '2026-10-12', weekEnd: '2026-10-18' });
  assert(weekly.days_header.length === 7, 'Weekly report generates exact 7-day Mon-Sun header');
  assert(weekly.days_header[6].is_sunday === true, 'Weekly report correctly designates Sunday as rest day');
  assert(weekly.records.length === 140, 'Weekly report includes all 140 employees in matrix');
  assert(weekly.summary.attendance_rate > 90, `Weekly summary computes high attendance rate (${weekly.summary.attendance_rate}%)`);
  const firstWeekly = weekly.records[0];
  assert(Object.keys(firstWeekly.days).length === 7, 'Weekly row has days dictionary for all 7 days');

  // 10.3 Monthly Report
  const monthly = ZKTecoReportService.getMonthlyReport({ year: 2026, month: 10 });
  assert(monthly.days_in_month === 31, 'Monthly report handles 31 days in October 2026');
  assert(monthly.days_header.length === 31, 'Monthly header has 31 day columns');
  assert(monthly.records.length === 140, 'Monthly report contains all 140 staff');
  assert(monthly.summary.scheduled_working_days === 27, 'October 2026 has 27 working days excluding 4 Sundays');
  const firstMonthly = monthly.records[0];
  assert(Boolean(firstMonthly.days['1'] && firstMonthly.days['1'].code), 'Monthly matrix days contain ZKTeco symbols (✓, L, E, A, OFF)');

  // 10.4 Summary Report
  const summary = ZKTecoReportService.getSummaryReport({ startDate: '2026-10-01', endDate: '2026-10-16' });
  assert(summary.kpis.total_headcount === 140, 'Summary report tracks 140 total staff headcount');
  assert(summary.kpis.attendance_rate > 90, `Summary report calculates executive attendance rate (${summary.kpis.attendance_rate}%)`);
  assert(summary.kpis.total_biometric_punches > 1000, `Summary tracks total biometric punches (${summary.kpis.total_biometric_punches})`);
  assert(summary.department_breakdown.length > 0, `Summary includes departmental breakdown (${summary.department_breakdown.length} depts)`);
  assert(summary.modality_breakdown.face.percent > 80, `Summary modality breakdown shows Face recognition as dominant (${summary.modality_breakdown.face.percent}%)`);
  assert(summary.exceptions.top_late.length <= 5 && summary.exceptions.top_ot.length <= 5, 'Summary produces top 5 exception rankings');

  // 10.5 Department Filtering
  const deptFiltered = ZKTecoReportService.getDailyReport({ date: '2026-10-16', departmentId: 'dept-prod' });
  assert(deptFiltered.records.length === 133, `Department filter isolates Production department (${deptFiltered.records.length} staff)`);
  console.log('');

  db.prepare(`DELETE FROM attendance_raw_transactions WHERE transaction_id IN (?, ?, ?)`).run(testTransId, testTransId2, lateTx[0].transaction_id);
  db.prepare(`DELETE FROM attendance_corrections WHERE id = ?`).run(correctionResult.id);
  db.prepare(`DELETE FROM attendance WHERE employee_id = ? AND date IN (?, ?)`).run(testEmployeeId, testDate, lateDate);
  db.prepare(`DELETE FROM attendance_device_users WHERE device_id = 'zk-02' AND device_user_id = '003'`).run();
  db.prepare(`DELETE FROM attendance_device_commands WHERE target_key = 'SF5L2026001'`).run();
  db.prepare(`DELETE FROM attendance_sync_logs WHERE device_id IN ('zk-02', 'all')`).run();
  db.prepare(`DELETE FROM audit_logs WHERE record_id LIKE '%EMP-2026-160%'`).run();
  const testPhotoPath = path.join(process.cwd(), 'public', 'avatars', 'zkteco_zk-02_003.jpg');
  if (fs.existsSync(testPhotoPath)) {
    try { fs.unlinkSync(testPhotoPath); } catch {}
  }

  console.log('====================================================');
  console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('====================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
