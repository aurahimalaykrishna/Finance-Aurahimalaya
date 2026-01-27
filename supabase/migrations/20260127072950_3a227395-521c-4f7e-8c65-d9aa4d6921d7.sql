-- Function to add employee role when linked
CREATE OR REPLACE FUNCTION public.handle_employee_user_link()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if user_id changed and new value is not null
  IF NEW.user_id IS DISTINCT FROM OLD.user_id AND NEW.user_id IS NOT NULL THEN
    -- Check if user already has a role
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id
    ) THEN
      -- Insert employee role
      INSERT INTO public.user_roles (user_id, role, granted_by)
      VALUES (NEW.user_id, 'employee', auth.uid());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on employee updates
CREATE TRIGGER on_employee_user_link
  AFTER INSERT OR UPDATE OF user_id ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_employee_user_link();