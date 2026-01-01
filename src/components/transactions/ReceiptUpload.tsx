import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useTransactionReceipts, TransactionReceipt } from '@/hooks/useTransactionReceipts';
import { Upload, X, FileText, Image as ImageIcon, Loader2, Trash2, ExternalLink, Paperclip } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ReceiptUploadProps {
  transactionId: string;
}

export function ReceiptUpload({ transactionId }: ReceiptUploadProps) {
  const { receipts, isLoading, uploadReceipt, deleteReceipt } = useTransactionReceipts(transactionId);
  const [isDragging, setIsDragging] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<TransactionReceipt | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (isValidFile(file)) {
        await uploadReceipt.mutateAsync({ transactionId, file });
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (isValidFile(file)) {
        await uploadReceipt.mutateAsync({ transactionId, file });
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isValidFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB max
  };

  const isImage = (fileType: string | null) => {
    return fileType?.startsWith('image/');
  };

  const handleDelete = async (receipt: TransactionReceipt) => {
    await deleteReceipt.mutateAsync(receipt);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Paperclip className="h-4 w-4" />
        <span>Receipts ({receipts.length})</span>
      </div>

      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag & drop files here or
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadReceipt.isPending}
        >
          {uploadReceipt.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Browse Files
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          JPG, PNG, WEBP, PDF (max 10MB)
        </p>
      </div>

      {/* Receipts grid */}
      {receipts.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="relative group aspect-square rounded-lg border overflow-hidden bg-muted"
            >
              {isImage(receipt.file_type) ? (
                <img
                  src={receipt.file_url}
                  alt={receipt.file_name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setViewingReceipt(receipt)}
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2"
                  onClick={() => setViewingReceipt(receipt)}
                >
                  <FileText className="h-8 w-8 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground text-center truncate w-full">
                    {receipt.file_name}
                  </span>
                </div>
              )}
              
              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => window.open(receipt.file_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  onClick={() => handleDelete(receipt)}
                  disabled={deleteReceipt.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Receipt viewer dialog */}
      <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>{viewingReceipt?.file_name}</DialogTitle>
          {viewingReceipt && (
            <div className="mt-2">
              {isImage(viewingReceipt.file_type) ? (
                <img
                  src={viewingReceipt.file_url}
                  alt={viewingReceipt.file_name}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <iframe
                  src={viewingReceipt.file_url}
                  className="w-full h-[70vh]"
                  title={viewingReceipt.file_name}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
