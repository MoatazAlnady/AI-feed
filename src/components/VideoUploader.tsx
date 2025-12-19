import React, { useState, useRef } from 'react';
import { Upload, X, Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface VideoUploaderProps {
  onVideoUploaded: (url: string) => void;
  onCancel: () => void;
  maxSizeMB?: number;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideoUploaded,
  onCancel,
  maxSizeMB = 100
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a video file (MP4, WebM, etc.)',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${maxSizeMB}MB`,
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    setProgress(0);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .upload(`videos/${fileName}`, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(`videos/${fileName}`);

      setProgress(100);
      onVideoUploaded(urlData.publicUrl);

      toast({
        title: 'Video uploaded',
        description: 'Your video has been uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload video. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-xl bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground flex items-center space-x-2">
          <Video className="h-5 w-5 text-primary" />
          <span>Upload Video</span>
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
        >
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-foreground font-medium">Click to select a video</p>
          <p className="text-xs text-muted-foreground mt-1">
            MP4, WebM, or MOV up to {maxSizeMB}MB
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {preview && (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video
                src={preview}
                controls
                className="w-full max-h-64 object-contain"
              />
              {!uploading && (
                <button
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground truncate flex-1 mr-4">
              {selectedFile.name}
            </span>
            <span className="text-muted-foreground">
              {(selectedFile.size / (1024 * 1024)).toFixed(1)}MB
            </span>
          </div>

          {uploading && (
            <Progress value={progress} className="h-2" />
          )}

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={uploading}
              className="flex-1"
            >
              Remove
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 bg-gradient-primary"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Video'
              )}
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default VideoUploader;
