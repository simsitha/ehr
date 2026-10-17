import {
  calculateAttendanceBonus,
  computeQualifyingAttendanceDays,
  roundToDecimals,
  DEFAULT_BONUS_RULES,
  DEFAULT_ATTENDANCE_BONUS_POLICY,
} from '../src/lib/attendanceBonusEngine';
import {
  calculatePeriodAttendanceBonuses,
  getAttendanceBonusSummary,
  getAttendanceBonusCalculations,
  submitAttendanceBonusForReview,
  approveAttendanceBonus,
  postAttendanceBonusToPayroll,
  getAttendanceBonusAuditLogs,
} from '../src/lib/attendanceBonusDb';
import { getDb } from '../src/lib/db';

async function runTestSuite() {
  console.log('================================================================');
  console.log('   HESTRA HRM: ATTENDANCE BONUS CALCULATION MODULE TEST SUITE   ');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✓ PASS: ${testName}`);
    } else {
      console.error(`✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    }
  }

  // -------------------------------------------------------------
  // PART 1: 10 SPECIFIC TEST CASES FROM SECTION 11 OF SPECIFICATION
  // -------------------------------------------------------------
  console.log('--- 1. Section 11 Threshold & Amount Tests ---');
  const section11Tests = [
    { name: 'Full attendance (26 days)', days: 26, expected: 20.0 },
    { name: 'Exact top threshold (25 days)', days: 25, expected: 20.0 },
    { name: 'Below top threshold (24.99 days)', days: 24.99, expected: 15.0 },
    { name: 'Exact second threshold (24.5 days)', days: 24.5, expected: 15.0 },
    { name: 'Below second threshold (24.49 days)', days: 24.49, expected: 10.0 },
    { name: 'Exact third threshold (24 days)', days: 24, expected: 10.0 },
    { name: 'Below third threshold (23.99 days)', days: 23.99, expected: 5.0 },
    { name: 'Exact minimum threshold (23 days)', days: 23, expected: 5.0 },
    { name: 'Below minimum threshold (22.99 days)', days: 22.99, expected: 0.0 },
    { name: 'Zero attendance (0 days)', days: 0, expected: 0.0 },
  ];

  for (const tc of section11Tests) {
    const res = calculateAttendanceBonus(tc.days, DEFAULT_BONUS_RULES);
    assert(
      res.bonusAmount === tc.expected,
      tc.name,
      `Days: ${tc.days}, Expected: $${tc.expected}, Got: $${res.bonusAmount}`
    );
  }

  // -------------------------------------------------------------
  // PART 2: HALF-DAY AND LEAVE POLICY EVALUATION
  // -------------------------------------------------------------
  console.log('\n--- 2. Leave Policy and Half-Day Attendance Calculation ---');
  {
    // Test default policy: leaves not counted, half-days count as 0.5
    const resDefault = computeQualifyingAttendanceDays({
      presentDays: 24,
      halfDays: 2, // 2 * 0.5 = 1.0 day
      annualLeaveDays: 1,
      sickLeaveDays: 1,
      policy: DEFAULT_ATTENDANCE_BONUS_POLICY,
    });
    // Expected: 24 + (2 * 0.5) = 25.0 days
    assert(
      resDefault.qualifyingDays === 25.0,
      'Half-day calculation (24 present + 2 half-days = 25.0 days)',
      `Got: ${resDefault.qualifyingDays}`
    );
    const bonus = calculateAttendanceBonus(resDefault.qualifyingDays);
    assert(bonus.bonusAmount === 20.0, '25.0 qualifying days qualifies for Tier 1 ($20.00)');

    // Test with approved leave inclusion enabled
    const resWithAl = computeQualifyingAttendanceDays({
      presentDays: 23.5,
      halfDays: 1, // 0.5
      annualLeaveDays: 1.0,
      policy: { ...DEFAULT_ATTENDANCE_BONUS_POLICY, count_annual_leave: true },
    });
    // Expected: 23.5 + 0.5 + 1.0 = 25.0 days
    assert(
      resWithAl.qualifyingDays === 25.0,
      'Configured leave inclusion (23.5 + 0.5 half + 1.0 AL = 25.0 days)',
      `Got: ${resWithAl.qualifyingDays}`
    );
  }

  // -------------------------------------------------------------
  // PART 3: WORKFLOW - CALCULATION, REVIEW, APPROVAL, PAYROLL POSTING
  // -------------------------------------------------------------
  console.log('\n--- 3. Monthly Workflow & Payroll Integration ---');
  const periodId = 'period-2026-10';

  // 1. Calculate
  const calcResult = calculatePeriodAttendanceBonuses(periodId, 'Test Administrator', {
    forceRecalculate: true,
  });
  assert(
    calcResult.calculations.length > 0,
    `Calculate attendance bonuses for ${calcResult.calculations.length} employees`,
    `Count: ${calcResult.calculations.length}`
  );
  assert(
    calcResult.summary.eligible_employees > 0,
    `Eligible employees identified (${calcResult.summary.eligible_employees} staff)`,
    `Eligible: ${calcResult.summary.eligible_employees}`
  );

  // 2. Submit for Review
  const reviewResult = submitAttendanceBonusForReview(
    periodId,
    'HR Reviewer',
    'Submitted for monthly verification'
  );
  assert(reviewResult.success, 'Submit calculations for HR review');

  // Verify status moved to Reviewed
  const summaryAfterReview = getAttendanceBonusSummary(periodId);
  assert(
    summaryAfterReview.reviewed_count > 0,
    `Calculations moved to Reviewed status (${summaryAfterReview.reviewed_count} records)`
  );

  // 3. Approve
  const approveResult = approveAttendanceBonus(
    periodId,
    'HR Manager',
    undefined,
    'Approved all compliant records'
  );
  assert(approveResult.success, 'Approve calculations by HR Manager');

  const summaryAfterApprove = getAttendanceBonusSummary(periodId);
  assert(
    summaryAfterApprove.approved_count > 0,
    `Calculations moved to Approved status (${summaryAfterApprove.approved_count} records)`
  );

  // 4. Post to Payroll
  const postResult = postAttendanceBonusToPayroll(periodId, 'Payroll Officer');
  assert(
    postResult.success,
    `Post approved bonuses to payroll (${postResult.count} records, $${postResult.totalAmountUsd.toFixed(2)} USD)`
  );

  // 5. Verify database payrolls table received attendance_allowance
  const db = getDb();
  const sampleCalc = calcResult.calculations.find((c) => c.bonus_amount === 20.0);
  if (sampleCalc) {
    const payRow = db
      .prepare('SELECT attendance_allowance, bonuses, gross_salary FROM payrolls WHERE employee_id = ?')
      .get(sampleCalc.employee_id) as any;
    assert(
      payRow && payRow.attendance_allowance === 20.0,
      `Payroll record verified for ${sampleCalc.employee_id}: attendance_allowance = $${payRow?.attendance_allowance}`,
      `Got: ${payRow?.attendance_allowance}`
    );
  }

  // 6. Verify audit logs
  const auditLogs = getAttendanceBonusAuditLogs(periodId);
  assert(
    auditLogs.length >= 4,
    `Audit logs comprehensively recorded (${auditLogs.length} audit entries)`
  );

  console.log('\n================================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite runtime error:', err);
  process.exit(1);
});
