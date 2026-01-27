// Nepal Labour Act 2074 & Finance Act 2082/83 Calculations

// =====================
// LEAVE CALCULATIONS (Labour Act 2074)
// =====================

// Home Leave: 1 day per 20 working days, max accrual 90 days
export const HOME_LEAVE_MAX_ACCRUAL = 90;
export const HOME_LEAVE_DAYS_PER_20_WORKING = 1;

export function calculateHomeLeaveAccrual(workingDays: number): number {
  return Math.floor(workingDays / 20);
}

// Sick Leave: 12 days/year proportionate, max accrual 45 days
export const SICK_LEAVE_ANNUAL = 12;
export const SICK_LEAVE_MAX_ACCRUAL = 45;

export function calculateSickLeaveAccrual(monthsWorked: number): number {
  // Proportionate for employees who haven't finished 1 year
  return Math.min(SICK_LEAVE_ANNUAL, monthsWorked);
}

// Public holidays: 13 days (14 for women including International Women's Day)
export function getPublicHolidayEntitlement(gender: string): number {
  return gender === 'female' ? 14 : 13;
}

// Maternity: 14 weeks (60 days fully paid)
export const MATERNITY_LEAVE_WEEKS = 14;
export const MATERNITY_PAID_DAYS = 60;

// Paternity: 15 days fully paid
export const PATERNITY_LEAVE_DAYS = 15;

// Mourning: 13 days fully paid
export const MOURNING_LEAVE_DAYS = 13;

// Default probation period: 6 months
export const DEFAULT_PROBATION_MONTHS = 6;

// Calculate encashment if exceeds limit
export function calculateLeaveEncashment(
  currentBalance: number,
  maxLimit: number,
  dailyRate: number
): { encashDays: number; encashAmount: number } {
  if (currentBalance <= maxLimit) {
    return { encashDays: 0, encashAmount: 0 };
  }
  const encashDays = currentBalance - maxLimit;
  return { encashDays, encashAmount: encashDays * dailyRate };
}

// Calculate carry forward (respects max limits)
export function calculateCarryForward(
  balance: number,
  maxLimit: number
): number {
  return Math.min(balance, maxLimit);
}

// =====================
// PAYROLL CALCULATIONS (Finance Act 2082/83)
// =====================

// SSF Contributions
export const SSF_EMPLOYEE_RATE = 0.11; // 11%
export const SSF_EMPLOYER_RATE = 0.20; // 20%
export const SSF_TOTAL_RATE = 0.31; // 31% total

export function calculateSSFContributions(basicSalary: number) {
  const employeeContribution = Math.round(basicSalary * SSF_EMPLOYEE_RATE * 100) / 100;
  const employerContribution = Math.round(basicSalary * SSF_EMPLOYER_RATE * 100) / 100;
  return {
    employeeContribution,
    employerContribution,
    totalContribution: employeeContribution + employerContribution,
  };
}

// Tax Slabs FY 2082/83
export interface TaxSlab {
  min: number;
  max: number | null;
  rate: number;
}

export const TAX_SLABS_SINGLE: TaxSlab[] = [
  { min: 0, max: 500000, rate: 0.01 },        // 1% social security tax
  { min: 500001, max: 700000, rate: 0.10 },   // 10%
  { min: 700001, max: 1000000, rate: 0.20 },  // 20%
  { min: 1000001, max: 2000000, rate: 0.30 }, // 30%
  { min: 2000001, max: null, rate: 0.36 },    // 36%
];

export const TAX_SLABS_MARRIED: TaxSlab[] = [
  { min: 0, max: 600000, rate: 0.01 },        // 1% social security tax
  { min: 600001, max: 800000, rate: 0.10 },   // 10%
  { min: 800001, max: 1100000, rate: 0.20 },  // 20%
  { min: 1100001, max: 2000000, rate: 0.30 }, // 30%
  { min: 2000001, max: null, rate: 0.36 },    // 36%
];

// Calculate income tax (waive 1% if SSF is deducted)
export function calculateIncomeTax(
  annualIncome: number,
  maritalStatus: 'single' | 'married',
  hasSSF: boolean
): { tax: number; breakdown: { slab: TaxSlab; taxableAmount: number; taxAmount: number }[] } {
  const slabs = maritalStatus === 'single' ? TAX_SLABS_SINGLE : TAX_SLABS_MARRIED;
  let tax = 0;
  let remainingIncome = annualIncome;
  const breakdown: { slab: TaxSlab; taxableAmount: number; taxAmount: number }[] = [];

  for (const slab of slabs) {
    if (remainingIncome <= 0) break;

    // Skip 1% social security tax slab if SSF is deducted
    if (slab.rate === 0.01 && hasSSF) {
      const slabMax = slab.max ?? Infinity;
      const taxableInThisSlab = Math.min(remainingIncome, slabMax - slab.min + 1);
      remainingIncome -= taxableInThisSlab;
      breakdown.push({ slab, taxableAmount: taxableInThisSlab, taxAmount: 0 });
      continue;
    }

    const slabMax = slab.max ?? Infinity;
    const slabRange = slabMax - slab.min + 1;
    const taxableInThisSlab = Math.min(remainingIncome, slabRange);
    const taxForSlab = Math.round(taxableInThisSlab * slab.rate * 100) / 100;
    
    tax += taxForSlab;
    remainingIncome -= taxableInThisSlab;
    
    breakdown.push({ slab, taxableAmount: taxableInThisSlab, taxAmount: taxForSlab });
  }

  return { tax: Math.round(tax * 100) / 100, breakdown };
}

// Monthly working hours (26 days * 8 hours)
export const MONTHLY_WORKING_HOURS = 208;
export const DAILY_WORKING_HOURS = 8;
export const WEEKLY_WORKING_HOURS = 48;

// Overtime: 1.5x hourly rate for >8 hrs/day or >48 hrs/week
export const OVERTIME_MULTIPLIER = 1.5;

export function calculateOvertime(
  basicSalary: number,
  overtimeHours: number
): number {
  const hourlyRate = basicSalary / MONTHLY_WORKING_HOURS;
  return Math.round(overtimeHours * hourlyRate * OVERTIME_MULTIPLIER * 100) / 100;
}

export function calculateHourlyRate(basicSalary: number): number {
  return Math.round((basicSalary / MONTHLY_WORKING_HOURS) * 100) / 100;
}

// Festival Allowance (Dashain Bonus): 1 month basic salary
export function calculateFestivalAllowance(basicSalary: number): number {
  return basicSalary;
}

// Calculate daily rate for leave encashment
export function calculateDailyRate(basicSalary: number): number {
  return Math.round((basicSalary / 26) * 100) / 100; // 26 working days per month
}

// Calculate gross salary
export function calculateGrossSalary(
  basicSalary: number,
  dearnessAllowance: number = 0,
  overtimeAmount: number = 0,
  festivalAllowance: number = 0,
  otherAllowances: number = 0
): number {
  return basicSalary + dearnessAllowance + overtimeAmount + festivalAllowance + otherAllowances;
}

// Calculate net salary
export function calculateNetSalary(
  grossSalary: number,
  ssfEmployeeContribution: number,
  incomeTax: number,
  otherDeductions: number = 0
): number {
  return grossSalary - ssfEmployeeContribution - incomeTax - otherDeductions;
}

// Employment types as per Labour Act 2074
export const EMPLOYMENT_TYPES = [
  { value: 'regular', label: 'Regular' },
  { value: 'work_based', label: 'Work-based' },
  { value: 'time_bound', label: 'Time-bound' },
  { value: 'casual', label: 'Casual' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'task_based', label: 'Task-based' },
] as const;

// Salary types
export const SALARY_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'daily', label: 'Daily' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'per_task', label: 'Per Task' },
] as const;

export type SalaryType = 'monthly' | 'daily' | 'hourly' | 'per_task';
export type EmploymentType = 'regular' | 'work_based' | 'time_bound' | 'casual' | 'part_time' | 'task_based';

// Mapping from employment type to salary type
export const EMPLOYMENT_TO_SALARY_MAP: Record<EmploymentType, SalaryType> = {
  regular: 'monthly',
  time_bound: 'monthly',
  work_based: 'daily',
  casual: 'hourly',
  part_time: 'hourly',
  task_based: 'per_task',
};

// Get salary type for employment type
export function getSalaryTypeForEmployment(employmentType: EmploymentType): SalaryType {
  return EMPLOYMENT_TO_SALARY_MAP[employmentType] || 'monthly';
}

// Calculate monthly equivalent from daily rate (26 working days)
export function calculateMonthlyFromDaily(dailyRate: number): number {
  return Math.round(dailyRate * 26 * 100) / 100;
}

// Calculate monthly equivalent from hourly rate (208 hours = 26 days x 8 hours)
export function calculateMonthlyFromHourly(hourlyRate: number): number {
  return Math.round(hourlyRate * 208 * 100) / 100;
}

// Calculate original rate from monthly salary based on salary type
export function calculateRateFromMonthly(monthlySalary: number, salaryType: SalaryType): number {
  switch (salaryType) {
    case 'daily':
      return Math.round((monthlySalary / 26) * 100) / 100;
    case 'hourly':
      return Math.round((monthlySalary / 208) * 100) / 100;
    default:
      return monthlySalary;
  }
}

// Get salary type label
export function getSalaryTypeLabel(salaryType: SalaryType): string {
  return SALARY_TYPES.find(t => t.value === salaryType)?.label || 'Monthly';
}

// Calculate monthly equivalent from task rate (rate x tasks per month)
export function calculateMonthlyFromTask(taskRate: number, tasksPerMonth: number): number {
  return Math.round(taskRate * tasksPerMonth * 100) / 100;
}

// Leave types
export const LEAVE_TYPES = [
  { value: 'home', label: 'Home Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'mourning', label: 'Mourning Leave' },
  { value: 'public_holiday', label: 'Public Holiday' },
] as const;

// Get current Nepal fiscal year (starts mid-July)
export function getCurrentFiscalYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  // Nepal fiscal year starts mid-July (around Shrawan)
  // Convert to BS year (AD year + 56/57)
  const bsYear = year + 57;
  
  if (month >= 7) {
    return `${bsYear}/${(bsYear + 1).toString().slice(-2)}`;
  }
  return `${bsYear - 1}/${bsYear.toString().slice(-2)}`;
}

// Calculate probation end date (default 6 months)
export function calculateProbationEndDate(dateOfJoin: Date, monthsOfProbation: number = DEFAULT_PROBATION_MONTHS): Date {
  const endDate = new Date(dateOfJoin);
  endDate.setMonth(endDate.getMonth() + monthsOfProbation);
  return endDate;
}

// Check if employee is on probation
export function isOnProbation(probationEndDate: Date | null): boolean {
  if (!probationEndDate) return false;
  return new Date() < new Date(probationEndDate);
}
