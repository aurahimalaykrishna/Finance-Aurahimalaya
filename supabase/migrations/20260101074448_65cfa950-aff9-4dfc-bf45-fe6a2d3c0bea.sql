-- Create transaction_notes table
CREATE TABLE public.transaction_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on transaction_notes
ALTER TABLE public.transaction_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for transaction_notes
CREATE POLICY "Users can view own transaction notes"
  ON public.transaction_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transaction notes"
  ON public.transaction_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transaction notes"
  ON public.transaction_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transaction notes"
  ON public.transaction_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Create transaction_receipts table
CREATE TABLE public.transaction_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on transaction_receipts
ALTER TABLE public.transaction_receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies for transaction_receipts
CREATE POLICY "Users can view own transaction receipts"
  ON public.transaction_receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transaction receipts"
  ON public.transaction_receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transaction receipts"
  ON public.transaction_receipts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transaction receipts"
  ON public.transaction_receipts FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at on transaction_notes
CREATE TRIGGER update_transaction_notes_updated_at
  BEFORE UPDATE ON public.transaction_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create receipts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true);

-- Storage policies for receipts bucket
CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);