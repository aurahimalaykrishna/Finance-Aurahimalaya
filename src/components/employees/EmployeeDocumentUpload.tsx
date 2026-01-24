import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, Loader2 } from 'lucide-react';

interface EmployeeDocumentUploadProps {
  currentUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

export function EmployeeDocumentUpload({
  currentUrl,
  onUpload,
  onRemove,
}: EmployeeDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, GIF, or PDF file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `citizenship/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      toast({ title: 'Document uploaded successfully' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentUrl) return;

    try {
      // Extract file path from URL
      const url = new URL(currentUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-2).join('/');

      await supabase.storage
        .from('employee-documents')
        .remove([filePath]);

      onRemove();
      toast({ title: 'Document removed' });
    } catch (error) {
      console.error('Remove error:', error);
      // Still call onRemove to update the form
      onRemove();
    }
  };

  if (currentUrl) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <span className="flex-1 text-sm truncate">Document uploaded</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          View
        </a>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.pdf"
        onChange={handleUpload}
        disabled={isUploading}
        className="hidden"
        id="citizenship-upload"
      />
      <label
        htmlFor="citizenship-upload"
        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Click to upload citizenship document
            </span>
          </>
        )}
      </label>
      <p className="text-xs text-muted-foreground mt-1">
        Accepted formats: JPG, PNG, GIF, PDF (max 5MB)
      </p>
    </div>
  );
}
