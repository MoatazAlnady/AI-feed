import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, File, X } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File, type: 'image' | 'file') => void;
  accept?: string;
  maxSize?: number; // in MB
  title?: string;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onFileSelect,
  accept = "image/*,application/pdf,.doc,.docx,.txt",
  maxSize = 10,
  title = "Upload File"
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize}MB`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    const isImage = file.type.startsWith('image/');
    onFileSelect(file, isImage ? 'image' : 'file');
    onClose();
    setSelectedFile(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragOver
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Maximum file size: {maxSize}MB
            </p>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
          />

          {/* File Type Icons */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Image className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium text-sm">Images</p>
                <p className="text-xs text-gray-500">JPG, PNG, GIF, WebP</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <File className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium text-sm">Documents</p>
                <p className="text-xs text-gray-500">PDF, DOC, TXT</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadModal;