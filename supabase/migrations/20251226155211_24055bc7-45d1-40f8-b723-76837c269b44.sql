-- Add explicit deny policies for UPDATE and DELETE on audit_logs
-- These policies ensure no one can modify or delete audit log entries

-- Deny all UPDATE operations on audit_logs
CREATE POLICY "No one can update audit logs"
ON public.audit_logs
FOR UPDATE
USING (false);

-- Deny all DELETE operations on audit_logs
CREATE POLICY "No one can delete audit logs"
ON public.audit_logs
FOR DELETE
USING (false);