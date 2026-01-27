import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, RefreshCw, Calendar } from 'lucide-react';
import { useCompanyLeaveTypes, CompanyLeaveType, LeaveTypeInsert } from '@/hooks/useCompanyLeaveTypes';
import { LeaveTypeCard } from './LeaveTypeCard';
import { LeaveTypeDialog } from './LeaveTypeDialog';

interface CompanyHRSettingsProps {
  companyId: string;
}

export function CompanyHRSettings({ companyId }: CompanyHRSettingsProps) {
  const {
    leaveTypes,
    isLoading,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    initializeDefaults,
  } = useCompanyLeaveTypes(companyId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<CompanyLeaveType | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState<CompanyLeaveType | null>(null);

  const handleCreate = () => {
    setEditingLeaveType(null);
    setDialogOpen(true);
  };

  const handleEdit = (leaveType: CompanyLeaveType) => {
    setEditingLeaveType(leaveType);
    setDialogOpen(true);
  };

  const handleDeleteClick = (leaveType: CompanyLeaveType) => {
    setLeaveTypeToDelete(leaveType);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (leaveTypeToDelete) {
      deleteLeaveType.mutate(leaveTypeToDelete.id);
    }
    setDeleteConfirmOpen(false);
    setLeaveTypeToDelete(null);
  };

  const handleSave = (data: LeaveTypeInsert) => {
    if (editingLeaveType) {
      updateLeaveType.mutate(
        { id: editingLeaveType.id, data },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createLeaveType.mutate(data, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleInitializeDefaults = () => {
    initializeDefaults.mutate(companyId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">Loading HR settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leave Types Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Types Configuration
              </CardTitle>
              <CardDescription>
                Configure leave types and entitlements for your company
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {leaveTypes.length === 0 && (
                <Button
                  variant="outline"
                  onClick={handleInitializeDefaults}
                  disabled={initializeDefaults.isPending}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${initializeDefaults.isPending ? 'animate-spin' : ''}`} />
                  Initialize Defaults
                </Button>
              )}
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Leave Type
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leaveTypes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No leave types configured</p>
              <p className="text-sm">
                Click "Initialize Defaults" to set up standard Nepal Labour Act leave types,
                or add custom leave types manually.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaveTypes.map((leaveType) => (
                <LeaveTypeCard
                  key={leaveType.id}
                  leaveType={leaveType}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Type Dialog */}
      <LeaveTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={companyId}
        leaveType={editingLeaveType}
        onSave={handleSave}
        isPending={createLeaveType.isPending || updateLeaveType.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Leave Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{leaveTypeToDelete?.name}"? This action cannot be undone.
              Existing leave requests and balances using this type may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
