import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Employee, CreateEmployeeData } from '@/hooks/useEmployees';
import { 
  EMPLOYMENT_TYPES, 
  DEFAULT_PROBATION_MONTHS,
  getSalaryTypeForEmployment,
  calculateMonthlyFromDaily,
  calculateMonthlyFromHourly,
  getSalaryTypeLabel,
  EmploymentType,
  SalaryType
} from '@/lib/nepal-hr-calculations';
import { EmployeeDocumentUpload } from './EmployeeDocumentUpload';

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSave: (data: CreateEmployeeData) => void;
  isLoading?: boolean;
}

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
  onSave,
  isLoading,
}: EmployeeDialogProps) {
  const [formData, setFormData] = useState<CreateEmployeeData>({
    full_name: '',
    date_of_birth: '',
    gender: 'male',
    citizenship_number: '',
    citizenship_document_url: null,
    pan_number: '',
    marital_status: 'single',
    employee_code: '',
    employment_type: 'regular',
    date_of_join: new Date().toISOString().split('T')[0],
    probation_months: DEFAULT_PROBATION_MONTHS,
    department: '',
    designation: '',
    ssf_number: '',
    basic_salary: 0,
    dearness_allowance: 0,
    salary_type: 'monthly',
    hourly_rate: 0,
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        full_name: employee.full_name,
        date_of_birth: employee.date_of_birth,
        gender: employee.gender,
        citizenship_number: employee.citizenship_number,
        citizenship_document_url: employee.citizenship_document_url,
        pan_number: employee.pan_number || '',
        marital_status: employee.marital_status,
        employee_code: employee.employee_code || '',
        employment_type: employee.employment_type,
        date_of_join: employee.date_of_join,
        probation_months: DEFAULT_PROBATION_MONTHS,
        department: employee.department || '',
        designation: employee.designation || '',
        ssf_number: employee.ssf_number || '',
        basic_salary: employee.basic_salary,
        dearness_allowance: employee.dearness_allowance,
        salary_type: employee.salary_type || getSalaryTypeForEmployment(employee.employment_type),
        hourly_rate: employee.hourly_rate || 0,
      });
    } else {
      setFormData({
        full_name: '',
        date_of_birth: '',
        gender: 'male',
        citizenship_number: '',
        citizenship_document_url: null,
        pan_number: '',
        marital_status: 'single',
        employee_code: '',
        employment_type: 'regular',
        date_of_join: new Date().toISOString().split('T')[0],
        probation_months: DEFAULT_PROBATION_MONTHS,
        department: '',
        designation: '',
        ssf_number: '',
        basic_salary: 0,
        dearness_allowance: 0,
        salary_type: 'monthly',
        hourly_rate: 0,
      });
    }
  }, [employee, open]);

  // Auto-update salary type when employment type changes
  const handleEmploymentTypeChange = (value: EmploymentType) => {
    const newSalaryType = getSalaryTypeForEmployment(value);
    setFormData(prev => ({ 
      ...prev, 
      employment_type: value,
      salary_type: newSalaryType,
      // Reset rates when changing employment type
      hourly_rate: 0,
      basic_salary: prev.salary_type === 'monthly' ? prev.basic_salary : 0
    }));
  };

  // Calculate monthly equivalent for display
  const monthlyEquivalent = useMemo(() => {
    const salaryType = formData.salary_type || 'monthly';
    const rate = formData.hourly_rate || 0;
    
    if (salaryType === 'monthly') {
      return formData.basic_salary;
    } else if (salaryType === 'daily') {
      return calculateMonthlyFromDaily(rate);
    } else if (salaryType === 'hourly') {
      return calculateMonthlyFromHourly(rate);
    }
    return 0;
  }, [formData.salary_type, formData.hourly_rate, formData.basic_salary]);

  const salaryType = formData.salary_type || 'monthly';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = <K extends keyof CreateEmployeeData>(
    field: K,
    value: CreateEmployeeData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? 'Edit Employee' : 'Create Employee'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => updateField('date_of_birth', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => updateField('gender', value as 'male' | 'female' | 'other')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="citizenship_number">Citizenship Number *</Label>
                  <Input
                    id="citizenship_number"
                    value={formData.citizenship_number}
                    onChange={(e) => updateField('citizenship_number', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="pan_number">PAN Number</Label>
                  <Input
                    id="pan_number"
                    value={formData.pan_number || ''}
                    onChange={(e) => updateField('pan_number', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="marital_status">Marital Status *</Label>
                  <Select
                    value={formData.marital_status}
                    onValueChange={(value) => updateField('marital_status', value as 'single' | 'married')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Citizenship Document</Label>
                  <EmployeeDocumentUpload
                    currentUrl={formData.citizenship_document_url}
                    onUpload={(url) => updateField('citizenship_document_url', url)}
                    onRemove={() => updateField('citizenship_document_url', null)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="employment" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee_code">Employee Code</Label>
                  <Input
                    id="employee_code"
                    value={formData.employee_code || ''}
                    onChange={(e) => updateField('employee_code', e.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                </div>

                <div>
                  <Label htmlFor="employment_type">Employment Type *</Label>
                  <Select
                    value={formData.employment_type}
                    onValueChange={(value) => handleEmploymentTypeChange(value as EmploymentType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Salary type: {getSalaryTypeLabel(getSalaryTypeForEmployment(formData.employment_type))}
                  </p>
                </div>

                <div>
                  <Label htmlFor="date_of_join">Date of Joining *</Label>
                  <Input
                    id="date_of_join"
                    type="date"
                    value={formData.date_of_join}
                    onChange={(e) => updateField('date_of_join', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="probation_months">Probation Period (Months)</Label>
                  <Input
                    id="probation_months"
                    type="number"
                    min="0"
                    max="12"
                    value={formData.probation_months}
                    onChange={(e) => updateField('probation_months', parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Default: 6 months as per Labour Act 2074
                  </p>
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department || ''}
                    onChange={(e) => updateField('department', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={formData.designation || ''}
                    onChange={(e) => updateField('designation', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ssf_number">SSF Number</Label>
                  <Input
                    id="ssf_number"
                    value={formData.ssf_number || ''}
                    onChange={(e) => updateField('ssf_number', e.target.value)}
                    placeholder="Social Security Fund Number"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Employee: 11% | Employer: 20% contribution
                  </p>
                </div>

                <div>
                  <Label>Salary Type</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Badge variant="secondary" className="text-sm">
                      {getSalaryTypeLabel(salaryType)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      (Based on {EMPLOYMENT_TYPES.find(t => t.value === formData.employment_type)?.label} employment)
                    </span>
                  </div>
                </div>

                {salaryType === 'monthly' ? (
                  <div>
                    <Label htmlFor="basic_salary">Basic Salary (NPR) *</Label>
                    <Input
                      id="basic_salary"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.basic_salary}
                      onChange={(e) => updateField('basic_salary', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                ) : salaryType === 'daily' ? (
                  <div>
                    <Label htmlFor="daily_rate">Daily Rate (NPR) *</Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.hourly_rate || ''}
                      onChange={(e) => updateField('hourly_rate', parseFloat(e.target.value) || 0)}
                      placeholder="Enter daily rate"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Monthly = Daily rate × 26 working days
                    </p>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="hourly_rate">Hourly Rate (NPR) *</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.hourly_rate || ''}
                      onChange={(e) => updateField('hourly_rate', parseFloat(e.target.value) || 0)}
                      placeholder="Enter hourly rate"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Monthly = Hourly rate × 208 hours (26 days × 8 hrs)
                    </p>
                  </div>
                )}

                {salaryType !== 'monthly' && (
                  <div>
                    <Label>Monthly Equivalent</Label>
                    <div className="h-10 flex items-center">
                      <span className="text-lg font-semibold text-primary">
                        NPR {monthlyEquivalent.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {salaryType === 'daily' 
                        ? `${formData.hourly_rate || 0} × 26 days`
                        : `${formData.hourly_rate || 0} × 208 hours`}
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="dearness_allowance">Dearness Allowance (NPR)</Label>
                  <Input
                    id="dearness_allowance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.dearness_allowance}
                    onChange={(e) => updateField('dearness_allowance', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <h4 className="font-medium mb-2">Tax Information (FY 2082/83)</h4>
                <p className="text-sm text-muted-foreground">
                  Tax will be calculated based on marital status ({formData.marital_status}).
                  {formData.ssf_number ? 
                    ' 1% Social Security Tax is waived as SSF is deducted.' :
                    ' 1% Social Security Tax applies on first slab.'
                  }
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : employee ? 'Update Employee' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
