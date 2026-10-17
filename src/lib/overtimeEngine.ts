import { calculateHourlyRate, calculateOvertimeAmount } from './payrollRules';

/**
 * Calculates duration in hours between two HH:MM time strings.
 * Accurately handles cross-midnight overnight shifts (e.g., 20:00 to 04:00 = 8h).
 */
export function calculateOvertimeDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;

  const [startH, startM] = startTime.split(':').map((v) => parseInt(v, 10) || 0);
  const [endH, endM] = endTime.split(':').map((v) => parseInt(v, 10) || 0);

  const startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  // Handle overnight crossover
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const durationMinutes = Math.max(0, endMinutes - startMinutes);
  return Math.round((durationMinutes / 60) * 100) / 100;
}

/**
 * Computes overtime hourly rate and total overtime earnings
 */
export function computeEmployeeOvertimePay(
  basicSalary: number,
  hours: number,
  multiplier = 1.5,
  workingDays = 26,
  hoursPerDay = 8
): {
  hourlyRate: number;
  multiplier: number;
  hours: number;
  totalPay: number;
} {
  const hourlyRate = calculateHourlyRate(basicSalary, workingDays, hoursPerDay);
  const totalPay = calculateOvertimeAmount(hourlyRate, multiplier, hours);
  return {
    hourlyRate,
    multiplier,
    hours,
    totalPay,
  };
}
