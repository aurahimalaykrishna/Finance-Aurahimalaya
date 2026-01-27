import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMyEmployee } from '@/hooks/useMyEmployee';
import { PortalDashboard } from '@/components/portal/PortalDashboard';
import { PortalAttendance } from '@/components/portal/PortalAttendance';
import { PortalLeave } from '@/components/portal/PortalLeave';
import { PortalPayslips } from '@/components/portal/PortalPayslips';
import { PortalHolidays } from '@/components/portal/PortalHolidays';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, UserX } from 'lucide-react';

export default function EmployeePortal() {
  const { myEmployee, isLoading, isEmployee } = useMyEmployee();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isEmployee || !myEmployee) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UserX className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Employee Portal Access Required</h2>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have an active employee profile linked to your account. 
              Please contact your administrator to set up your employee profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Portal</h1>
        <p className="text-muted-foreground">
          Welcome back, {myEmployee.full_name}
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <PortalDashboard employee={myEmployee} />
        </TabsContent>

        <TabsContent value="attendance">
          <PortalAttendance employee={myEmployee} />
        </TabsContent>

        <TabsContent value="leave">
          <PortalLeave employee={myEmployee} />
        </TabsContent>

        <TabsContent value="payslips">
          <PortalPayslips employee={myEmployee} />
        </TabsContent>

        <TabsContent value="holidays">
          <PortalHolidays employee={myEmployee} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
