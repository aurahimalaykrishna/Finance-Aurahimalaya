import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useEmployees, Employee, CreateEmployeeData } from '@/hooks/useEmployees';
import { usePayroll } from '@/hooks/usePayroll';
import { useAllLeaveRequests } from '@/hooks/useAllLeaveRequests';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { EmployeeDashboard } from '@/components/employees/EmployeeDashboard';
import { EmployeeDialog } from '@/components/employees/EmployeeDialog';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeeProfile } from '@/components/employees/EmployeeProfile';
import { AttendanceManagement } from '@/components/employees/AttendanceManagement';
import { HolidayManagement } from '@/components/holidays/HolidayManagement';
import { LeaveRequestsQueue } from '@/components/leave/LeaveRequestsQueue';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Users, Calendar, Clock, CalendarDays, FileText } from 'lucide-react';

export default function Employees() {
  const { selectedCompany } = useCompanyContext();
  const {
    employees,
    activeEmployees,
    employeesOnProbation,
    isLoading,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    terminateEmployee,
    reactivateEmployee,
  } = useEmployees();
  const { payrollRuns } = usePayroll();
  const { pendingCount } = useAllLeaveRequests(selectedCompany?.id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [terminateConfirmId, setTerminateConfirmId] = useState<string | null>(null);

  const handleSave = async (data: CreateEmployeeData) => {
    if (editingEmployee) {
      await updateEmployee.mutateAsync({ id: editingEmployee.id, data });
    } else {
      await createEmployee.mutateAsync(data);
    }
    setDialogOpen(false);
    setEditingEmployee(null);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteEmployee.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleTerminate = async () => {
    if (terminateConfirmId) {
      await terminateEmployee.mutateAsync({
        id: terminateConfirmId,
        terminationDate: new Date().toISOString().split('T')[0],
      });
      setTerminateConfirmId(null);
    }
  };

  const handleReactivate = async (id: string) => {
    await reactivateEmployee.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading employees...</div>
      </div>
    );
  }

  const latestPayroll = payrollRuns[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground">
            Manage employees for {selectedCompany?.name || 'your company'}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <EmployeeDashboard
        employees={employees}
        activeEmployees={activeEmployees}
        employeesOnProbation={employeesOnProbation}
        latestPayroll={latestPayroll}
      />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Employees ({employees.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            Active ({activeEmployees.length})
          </TabsTrigger>
          <TabsTrigger value="probation" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            On Probation ({employeesOnProbation.length})
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="leave-requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Leave Requests
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="holidays" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Holidays
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <EmployeeList
            employees={employees}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteConfirmId(id)}
            onTerminate={(id) => setTerminateConfirmId(id)}
            onReactivate={handleReactivate}
            onView={(emp) => setViewingEmployee(emp)}
          />
        </TabsContent>

        <TabsContent value="active">
          <EmployeeList
            employees={activeEmployees}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteConfirmId(id)}
            onTerminate={(id) => setTerminateConfirmId(id)}
            onReactivate={handleReactivate}
            onView={(emp) => setViewingEmployee(emp)}
          />
        </TabsContent>

        <TabsContent value="probation">
          <EmployeeList
            employees={employeesOnProbation}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteConfirmId(id)}
            onTerminate={(id) => setTerminateConfirmId(id)}
            onReactivate={handleReactivate}
            onView={(emp) => setViewingEmployee(emp)}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceManagement />
        </TabsContent>

        <TabsContent value="leave-requests">
          <LeaveRequestsQueue />
        </TabsContent>

        <TabsContent value="holidays">
          <HolidayManagement />
        </TabsContent>
      </Tabs>

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingEmployee(null);
        }}
        employee={editingEmployee}
        onSave={handleSave}
        isLoading={createEmployee.isPending || updateEmployee.isPending}
      />

      <EmployeeProfile
        open={!!viewingEmployee}
        onOpenChange={(open) => !open && setViewingEmployee(null)}
        employee={viewingEmployee}
      />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee? This action cannot be undone.
              All related data including leave balances and payslips will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!terminateConfirmId} onOpenChange={() => setTerminateConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to terminate this employee? They will be marked as inactive
              but their records will be preserved. You can reactivate them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminate}
              className="bg-yellow-600 text-white hover:bg-yellow-700"
            >
              Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
