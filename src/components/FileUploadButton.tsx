
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface FileUploadButtonProps {
  onUploadSuccess: (url: string) => void;
  uploadType: 'logo' | 'signature';
  accept?: string;
  disabled?: boolean;
}

const FileUploadButton = ({ 
  onUploadSuccess, 
  uploadType, 
  accept = "image/*",
  disabled = false 
}: FileUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadLogo, uploadSignature, uploading } = useFileUpload();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let downloadURL: string;
      if (uploadType === 'logo') {
        downloadURL = await uploadLogo(file);
      } else {
        downloadURL = await uploadSignature(file);
      }
      
      onUploadSuccess(downloadURL);
    } catch (error) {
      console.error('Upload failed:', error);
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={disabled || uploading}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
      </Button>
    </>
  );
};

export default FileUploadButton;
