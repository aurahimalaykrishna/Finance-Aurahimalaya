import { useState, useMemo } from 'react';
import { format, differenceInMonths, differenceInYears } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Employee } from '@/hooks/useEmployees';
import { useEmployeeLeaves } from '@/hooks/useEmployeeLeaves';
import { useTeamUsers } from '@/hooks/useTeamUsers';
import { LeaveBalanceCard } from './LeaveBalanceCard';
import { AttendancePanel } from './AttendancePanel';
import { AttendanceCalendar } from './AttendanceCalendar';
import { AttendanceDialog } from './AttendanceDialog';
import { AttendanceLog } from '@/hooks/useAttendance';
import {
  EMPLOYMENT_TYPES,
  isOnProbation,
  calculateSSFContributions,
  calculateIncomeTax,
  getSalaryTypeLabel,
  SALARY_TYPES,
} from '@/lib/nepal-hr-calculations';
import {
  User,
  Calendar,
  Briefcase,
  CreditCard,
  FileText,
  Clock,
  Link2,
  Link2Off,
  Mail,
} from 'lucide-react';

interface EmployeeProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

export function EmployeeProfile({
  open,
  onOpenChange,
  employee,
}: EmployeeProfileProps) {
  const { leaveBalance, fiscalYear, calculateAvailableLeave } = useEmployeeLeaves(employee?.id);
  const { users } = useTeamUsers();
  const [attendanceDialogState, setAttendanceDialogState] = useState<{
    open: boolean;
    date: Date;
    record?: AttendanceLog;
  }>({ open: false, date: new Date() });

  // Get linked user email
  const linkedUserEmail = useMemo(() => {
    if (!employee?.user_id) return null;
    const linkedUser = users.find(u => u.id === employee.user_id);
    return linkedUser?.email || null;
  }, [employee?.user_id, users]);

  if (!employee) return null;

  const joinDate = new Date(employee.date_of_join);
  const yearsOfService = differenceInYears(new Date(), joinDate);
  const monthsOfService = differenceInMonths(new Date(), joinDate) % 12;
  const onProbation = isOnProbation(employee.probation_end_date ? new Date(employee.probation_end_date) : null);

  const hasSSF = !!employee.ssf_number;
  const ssfContributions = hasSSF ? calculateSSFContributions(employee.basic_salary) : null;
  const annualIncome = (employee.basic_salary + (employee.dearness_allowance || 0)) * 12;
  const { tax: annualTax, breakdown } = calculateIncomeTax(annualIncome, employee.marital_status, hasSSF);
  const monthlyTax = annualTax / 12;

  const availableLeave = calculateAvailableLeave(leaveBalance, employee.gender);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-xl">{employee.full_name}</div>
              <div className="text-sm font-normal text-muted-foreground">
                {employee.designation || 'No designation'} • {employee.department || 'No department'}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mt-2">
          {employee.is_active ? (
            <Badge className="bg-green-500/10 text-green-500">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
          {onProbation && (
            <Badge variant="outline" className="text-yellow-500 border-yellow-500">
              On Probation (until {format(new Date(employee.probation_end_date!), 'MMM d, yyyy')})
            </Badge>
          )}
          <Badge variant="outline">
            {EMPLOYMENT_TYPES.find(t => t.value === employee.employment_type)?.label}
          </Badge>
        </div>

        <Tabs defaultValue="personal" className="mt-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="leaves">Leaves</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Date of Birth</div>
                  <div className="font-medium">{format(new Date(employee.date_of_birth), 'MMMM d, yyyy')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Gender</div>
                  <div className="font-medium capitalize">{employee.gender}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Marital Status</div>
                  <div className="font-medium capitalize">{employee.marital_status}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Citizenship Number</div>
                  <div className="font-medium">{employee.citizenship_number}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">PAN Number</div>
                  <div className="font-medium">{employee.pan_number || '-'}</div>
                </div>
                {employee.citizenship_document_url && (
                  <div>
                    <div className="text-sm text-muted-foreground">Citizenship Document</div>
                    <a 
                      href={employee.citizenship_document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </a>
                  </div>
                )}
                
                {/* Linked Account Section */}
                <div className="col-span-2 mt-4">
                  <Separator className="my-4" />
                  <div className="text-sm text-muted-foreground mb-2">Linked User Account</div>
                  {linkedUserEmail ? (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <Link2 className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="font-medium text-green-600 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          {linkedUserEmail}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Has access to Employee Portal for self-service
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Link2Off className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-muted-foreground">No account linked</div>
                        <div className="text-xs text-muted-foreground">
                          Edit employee to link a user account for portal access
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Employee Code</div>
                  <div className="font-medium">{employee.employee_code || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Employment Type</div>
                  <div className="font-medium">
                    {EMPLOYMENT_TYPES.find(t => t.value === employee.employment_type)?.label}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date of Joining</div>
                  <div className="font-medium">{format(joinDate, 'MMMM d, yyyy')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Years of Service</div>
                  <div className="font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {yearsOfService > 0 ? `${yearsOfService} year${yearsOfService > 1 ? 's' : ''}` : ''}
                    {monthsOfService > 0 ? ` ${monthsOfService} month${monthsOfService > 1 ? 's' : ''}` : ''}
                    {yearsOfService === 0 && monthsOfService === 0 ? 'Less than a month' : ''}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Probation End Date</div>
                  <div className="font-medium">
                    {employee.probation_end_date 
                      ? format(new Date(employee.probation_end_date), 'MMMM d, yyyy')
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Department</div>
                  <div className="font-medium">{employee.department || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Designation</div>
                  <div className="font-medium">{employee.designation || '-'}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Salary Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Salary Type</div>
                  <Badge variant="outline" className="mt-1">
                    {getSalaryTypeLabel(employee.salary_type || 'monthly')}
                  </Badge>
                </div>
                
                {employee.salary_type === 'daily' && employee.hourly_rate > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground">Daily Rate</div>
                    <div className="font-medium">{formatCurrency(employee.hourly_rate)}/day</div>
                  </div>
                )}
                
                {employee.salary_type === 'hourly' && employee.hourly_rate > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground">Hourly Rate</div>
                    <div className="font-medium">{formatCurrency(employee.hourly_rate)}/hour</div>
                  </div>
                )}

                {employee.salary_type === 'per_task' && employee.hourly_rate > 0 && (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Per-Task Rate</div>
                      <div className="font-medium">{formatCurrency(employee.hourly_rate)}/task</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Estimated Tasks/Month</div>
                      <div className="font-medium">{employee.estimated_tasks_per_month || 0} tasks</div>
                    </div>
                  </>
                )}

                <div>
                  <div className="text-sm text-muted-foreground">
                    {employee.salary_type === 'monthly' ? 'Basic Salary' : 'Monthly Equivalent'}
                  </div>
                  <div className="font-medium text-lg">{formatCurrency(employee.basic_salary)}</div>
                  {employee.salary_type !== 'monthly' && employee.hourly_rate > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {employee.salary_type === 'daily' 
                        ? `${formatCurrency(employee.hourly_rate)} × 26 days`
                        : employee.salary_type === 'hourly'
                        ? `${formatCurrency(employee.hourly_rate)} × 208 hours`
                        : `${formatCurrency(employee.hourly_rate)} × ${employee.estimated_tasks_per_month || 0} tasks`}
                    </p>
                  )}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Dearness Allowance</div>
                  <div className="font-medium">{formatCurrency(employee.dearness_allowance || 0)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Gross Monthly</div>
                  <div className="font-medium">
                    {formatCurrency(employee.basic_salary + (employee.dearness_allowance || 0))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">SSF Contributions (31% Total)</CardTitle>
              </CardHeader>
              <CardContent>
                {hasSSF ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">SSF Number</div>
                      <div className="font-medium">{employee.ssf_number}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Employee (11%)</div>
                      <div className="font-medium">{formatCurrency(ssfContributions!.employeeContribution)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Employer (20%)</div>
                      <div className="font-medium">{formatCurrency(ssfContributions!.employerContribution)}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No SSF registered. 1% Social Security Tax applies.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tax Calculation (FY 2082/83)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Annual Income</div>
                      <div className="font-medium">{formatCurrency(annualIncome)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tax Status</div>
                      <div className="font-medium capitalize">{employee.marital_status}</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Tax Breakdown</div>
                    {breakdown.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(item.slab.min)} - {item.slab.max ? formatCurrency(item.slab.max) : 'Above'} 
                          ({(item.slab.rate * 100).toFixed(0)}%)
                          {item.slab.rate === 0.01 && hasSSF && ' - Waived'}
                        </span>
                        <span>{formatCurrency(item.taxAmount)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Annual Tax</div>
                      <div className="font-medium text-lg">{formatCurrency(annualTax)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Monthly Tax</div>
                      <div className="font-medium text-lg">{formatCurrency(monthlyTax)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="mt-4 space-y-4">
            <AttendancePanel
              employeeId={employee.id}
              employeeName={employee.full_name}
            />
            <AttendanceCalendar
              employeeId={employee.id}
              onDayClick={(date, record) => {
                setAttendanceDialogState({ open: true, date, record });
              }}
            />
          </TabsContent>

          <TabsContent value="leaves" className="mt-4">
            {availableLeave ? (
              <LeaveBalanceCard 
                fiscalYear={fiscalYear} 
                availableLeave={availableLeave}
                gender={employee.gender}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No leave balance record found for fiscal year {fiscalYear}.
                  Initialize leave balance to track leaves.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Attendance Edit Dialog */}
        <AttendanceDialog
          open={attendanceDialogState.open}
          onOpenChange={(open) => setAttendanceDialogState(prev => ({ ...prev, open }))}
          employeeId={employee.id}
          employeeName={employee.full_name}
          date={attendanceDialogState.date}
          existingRecord={attendanceDialogState.record}
        />
      </DialogContent>
    </Dialog>
  );
}
