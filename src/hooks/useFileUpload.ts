
import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const uploadFile = async (file: File, path: string): Promise<string> => {
    if (!currentUser?.companyId) {
      throw new Error('User company ID not found');
    }

    setUploading(true);
    try {
      // Create a reference to the file location
      const fileRef = ref(storage, `companies/${currentUser.companyId}/${path}/${file.name}`);
      
      // Upload the file
      await uploadBytes(fileRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(fileRef);
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const uploadLogo = (file: File) => uploadFile(file, 'logos');
  const uploadSignature = (file: File) => uploadFile(file, 'signatures');

  return {
    uploadFile,
    uploadLogo,
    uploadSignature,
    uploading
  };
};
