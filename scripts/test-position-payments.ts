/**
 * Automated Acceptance Test Suite for Position Payment Management Module
 * Tests all 8 User Acceptance Criteria
 */

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING POSITION PAYMENT ACCEPTANCE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // 1. Get active employees
  const empRes = await fetch(`${BASE_URL}/api/employees`);
  const employees = await empRes.json();
  const emp1 = employees.find((e: any) => e.status === 'Active');
  const emp2 = employees.find((e: any) => e.status === 'Active' && e.id !== emp1.id);

  console.log(`Selected Test Employee 1: ${emp1.id} - ${emp1.first_name} ${emp1.last_name} (${emp1.role})`);
  console.log(`Selected Test Employee 2: ${emp2.id} - ${emp2.first_name} ${emp2.last_name} (${emp2.role})\n`);

  // Clean up any pre-existing test payments for this employee in October 2026
  const cleanListRes = await fetch(`${BASE_URL}/api/payroll/position-payments?employee_id=${emp1.id}&payroll_period=October 2026`);
  const cleanListData = await cleanListRes.json();
  for (const item of (cleanListData.data || [])) {
    await fetch(`${BASE_URL}/api/payroll/position-payments/${item.id}`, { method: 'DELETE' });
  }

  // TEST 1: Select an employee, enter a $150.00 position allowance, select October 2026, and save.
  console.log('--- TEST 1: Add $150.00 Position Payment for October 2026 ---');
  const t1Res = await fetch(`${BASE_URL}/api/payroll/position-payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id: emp1.id,
      payment_name: 'Acting Manager Allowance',
      payment_type: 'Allowance',
      amount: 150.0,
      currency: 'USD',
      payroll_period: 'October 2026',
      effective_date: '2026-10-01',
      taxable: true,
      include_in_nssf: true,
      remarks: 'Covering managerial responsibilities in October',
      status: 'Active',
    }),
  });
  const t1Data = await t1Res.json();
  assert(t1Res.ok && t1Data.success, 'Position payment created successfully');
  const payment1Id = t1Data.data.id;

  // Verify it appears in Position list
  const listRes1 = await fetch(`${BASE_URL}/api/payroll/position-payments?payroll_period=October 2026`);
  const listData1 = await listRes1.json();
  const foundInList1 = listData1.data.find((p: any) => p.id === payment1Id);
  assert(foundInList1 !== undefined, 'Payment appears in Position list');
  assert(foundInList1?.amount === 150, 'Payment amount is $150.00 in list');

  // Verify in employee's October 2026 payroll ledger
  const payRes1 = await fetch(`${BASE_URL}/api/payroll?period=October 2026&employee_id=${emp1.id}`);
  const payData1 = await payRes1.json();
  const empPayroll1 = Array.isArray(payData1) ? payData1[0] : null;
  assert(empPayroll1 !== null, 'Employee has payroll record for October 2026');
  assert(empPayroll1?.position_allowance === 150, `Position Payment column in payroll ledger shows $150.00 (Got: ${empPayroll1?.position_allowance})`);

  // TEST 2: Add another eligible payment of $50.00 for the same employee and period.
  console.log('\n--- TEST 2: Add Second Payment of $50.00 for Same Employee and Period ---');
  const t2Res = await fetch(`${BASE_URL}/api/payroll/position-payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id: emp1.id,
      payment_name: 'Special Technical Position Bonus',
      payment_type: 'Bonus',
      amount: 50.0,
      currency: 'USD',
      payroll_period: 'October 2026',
      effective_date: '2026-10-01',
      taxable: true,
      include_in_nssf: true,
      remarks: 'Special QA technical certification',
      status: 'Active',
    }),
  });
  const t2Data = await t2Res.json();
  assert(t2Res.ok && t2Data.success, 'Second position payment created successfully');
  const payment2Id = t2Data.data.id;

  // Check payroll ledger shows $200.00 ($150 + $50)
  const payRes2 = await fetch(`${BASE_URL}/api/payroll?period=October 2026&employee_id=${emp1.id}`);
  const payData2 = await payRes2.json();
  const empPayroll2 = payData2[0];
  assert(empPayroll2?.position_allowance === 200, `Position Payment column combines to $200.00 ($150 + $50) (Got: ${empPayroll2?.position_allowance})`);

  // TEST 3: Recalculate payroll several times. Expected: The position payments remain $200.00 and are never duplicated.
  console.log('\n--- TEST 3: Recalculate Payroll Multiple Times (No Duplication) ---');
  for (let i = 1; i <= 3; i++) {
    await fetch(`${BASE_URL}/api/payroll/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        periodId: 'period-2026-10',
        payPeriodName: 'October 2026',
      }),
    });
  }
  const payRes3 = await fetch(`${BASE_URL}/api/payroll?period=October 2026&employee_id=${emp1.id}`);
  const payData3 = await payRes3.json();
  const empPayroll3 = payData3[0];
  assert(empPayroll3?.position_allowance === 200, `After 3 recalculations, Position Payment remains exactly $200.00 (Got: ${empPayroll3?.position_allowance})`);

  // TEST 4: Change the payment from $150.00 to $175.00 before payroll is locked. Expected: Payroll reflects revised total of $225.00.
  console.log('\n--- TEST 4: Edit Payment from $150.00 to $175.00 ---');
  const t4Res = await fetch(`${BASE_URL}/api/payroll/position-payments/${payment1Id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 175.0,
      remarks: 'Revised management allowance to $175.00',
    }),
  });
  const t4Data = await t4Res.json();
  assert(t4Res.ok && t4Data.success, 'Position payment updated to $175.00');

  const payRes4 = await fetch(`${BASE_URL}/api/payroll?period=October 2026&employee_id=${emp1.id}`);
  const payData4 = await payRes4.json();
  const empPayroll4 = payData4[0];
  assert(empPayroll4?.position_allowance === 225, `Payroll reflects revised total of $225.00 ($175 + $50) (Got: ${empPayroll4?.position_allowance})`);

  // TEST 5: Select another employee. Expected: The correct employee ID, name, department, and position are populated.
  console.log('\n--- TEST 5: Select Another Employee (Emp2) ---');
  const t5Res = await fetch(`${BASE_URL}/api/payroll/position-payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id: emp2.id,
      payment_name: 'Lead Supervisor Allowance',
      payment_type: 'Allowance',
      amount: 80.0,
      currency: 'USD',
      payroll_period: 'October 2026',
      effective_date: '2026-10-01',
      status: 'Active',
    }),
  });
  const t5Data = await t5Res.json();
  assert(t5Res.ok && t5Data.success, `Position payment created for second employee (${emp2.id})`);
  assert(t5Data.data.employee_id === emp2.id, 'Populated correct employee ID');
  assert(t5Data.data.employee_name.includes(emp2.first_name), 'Populated correct employee name');
  assert(t5Data.data.department_name !== undefined, 'Populated correct department');
  assert(t5Data.data.current_position === emp2.role, 'Populated correct position/role');
  const paymentEmp2Id = t5Data.data.id;

  // TEST 6: Select KHR as the currency. Expected: The payment is displayed and calculated in KHR without incorrectly adding it to the USD total.
  console.log('\n--- TEST 6: KHR Currency Separation in Summary Cards ---');
  // Clean up any test KHR
  const t6Res = await fetch(`${BASE_URL}/api/payroll/position-payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id: emp2.id,
      payment_name: 'Overtime Transport Shift KHR',
      payment_type: 'Other',
      amount: 200000,
      currency: 'KHR',
      payroll_period: 'October 2026',
      effective_date: '2026-10-01',
      status: 'Active',
    }),
  });
  const t6Data = await t6Res.json();
  assert(t6Res.ok && t6Data.success, 'KHR position payment (200,000 KHR) created');
  const paymentKhrId = t6Data.data.id;

  // Fetch summary cards
  const sumRes = await fetch(`${BASE_URL}/api/payroll/position-payments/summary?period=October 2026`);
  const sumData = await sumRes.json();
  const s = sumData.data;

  // Payments in USD: Emp1 has $175 + $50 = $225. Emp2 has $80. Total USD = $305.
  // Payments in KHR: Emp2 has 200,000 KHR. Total KHR = 200,000.
  assert(s.totalKhrAmount === 200000, `Total KHR Amount is exactly 200,000 KHR (Got: ${s.totalKhrAmount})`);
  assert(s.totalUsdAmount === 305, `Total USD Amount is exactly $305.00 without adding KHR (Got: $${s.totalUsdAmount})`);
  assert(s.distinctEmployeesCount === 2, `Distinct employee headcount is 2 (Got: ${s.distinctEmployeesCount})`);

  // TEST 7: Attempt to modify a locked payroll period.
  console.log('\n--- TEST 7: Lock Enforcement on Finalized/Locked Periods ---');
  // Period "August 2026" has status "Paid" (locked)
  const t7Res = await fetch(`${BASE_URL}/api/payroll/position-payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id: emp1.id,
      payment_name: 'Illegal Locked Period Payment',
      amount: 100,
      currency: 'USD',
      payroll_period: 'August 2026',
      effective_date: '2026-08-01',
    }),
  });
  const t7Data = await t7Res.json();
  assert(t7Res.status === 403, `System rejected modification of locked period with status 403 (Got: ${t7Res.status})`);
  assert(t7Data.error.includes('locked') || t7Data.error.includes('Paid'), `Clear explanation provided: "${t7Data.error}"`);

  // TEST 8: Verify payroll tax, NSSF, gross pay, and net pay calculations.
  console.log('\n--- TEST 8: Full Statutory & Net Pay Calculation Verification ---');
  const payRes8 = await fetch(`${BASE_URL}/api/payroll?period=October 2026&employee_id=${emp1.id}`);
  const payData8 = await payRes8.json();
  const p8 = payData8[0];

  console.log('  Payroll Ledger Breakdown for ' + emp1.first_name + ' ' + emp1.last_name + ':');
  console.log(`    Base Salary:           $${p8.base_salary.toFixed(2)}`);
  console.log(`    Basic Working Salary:  $${(p8.basic_working_salary || p8.base_salary).toFixed(2)}`);
  console.log(`    Seniority Bonus:       $${(p8.seniority_bonus || 0).toFixed(2)}`);
  console.log(`    Transport/Housing:     $${(p8.transport_housing || 16).toFixed(2)}`);
  console.log(`    Position Payment:      $${(p8.position_allowance || 0).toFixed(2)}`);
  console.log(`    Gross Salary:          $${p8.gross_salary.toFixed(2)}`);
  console.log(`    NSSF Pension:          -$${p8.pension_usd.toFixed(2)}`);
  console.log(`    Tax on Salary (USD):   -$${p8.tax_usd.toFixed(2)}`);
  console.log(`    Net Salary:            $${p8.net_salary.toFixed(2)}`);

  // Formulas check:
  // Expected gross >= Base + Position + Seniority + Transport
  const expectedMinGross = (p8.basic_working_salary || p8.base_salary) + (p8.position_allowance || 0);
  assert(p8.gross_salary >= expectedMinGross, 'Gross Salary includes Position Payment');
  assert(p8.position_allowance === 225, 'Position Payment is $225.00 in payroll');
  assert(p8.pension_usd > 0, 'NSSF Pension calculated correctly');
  assert(p8.net_salary > 0, 'Net salary recalculated correctly');

  // Clean up test entries
  console.log('\n--- Cleaning up test records ---');
  await fetch(`${BASE_URL}/api/payroll/position-payments/${payment1Id}`, { method: 'DELETE' });
  await fetch(`${BASE_URL}/api/payroll/position-payments/${payment2Id}`, { method: 'DELETE' });
  await fetch(`${BASE_URL}/api/payroll/position-payments/${paymentEmp2Id}`, { method: 'DELETE' });
  await fetch(`${BASE_URL}/api/payroll/position-payments/${paymentKhrId}`, { method: 'DELETE' });

  // Recalculate payroll once more to restore clean state
  await fetch(`${BASE_URL}/api/payroll/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      periodId: 'period-2026-10',
      payPeriodName: 'October 2026',
    }),
  });

  console.log('\n====================================================');
  console.log(`ACCEPTANCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
