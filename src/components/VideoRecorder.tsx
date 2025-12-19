import React, { useState, useRef, useCallback } from 'react';
import { Video, Square, Play, X, Upload, Loader2, Camera, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface VideoRecorderProps {
  onVideoRecorded: (url: string) => void;
  onCancel: () => void;
  maxDurationSeconds?: number;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({
  onVideoRecorded,
  onCancel,
  maxDurationSeconds = 60
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [status, setStatus] = useState<'idle' | 'previewing' | 'recording' | 'recorded' | 'uploading'>('idle');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus('previewing');
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access to record videos',
        variant: 'destructive'
      });
    }
  }, [facingMode, toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const switchCamera = useCallback(async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    // Camera will restart via useEffect or user action
  }, [stopCamera]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
      setStatus('recorded');
      stopCamera();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    setStatus('recording');
    setDuration(0);

    // Duration timer
    const interval = setInterval(() => {
      setDuration(prev => {
        if (prev >= maxDurationSeconds - 1) {
          stopRecording();
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    // Store interval for cleanup
    (mediaRecorderRef.current as any).durationInterval = interval;
  }, [maxDurationSeconds, stopCamera]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      const interval = (mediaRecorderRef.current as any).durationInterval;
      if (interval) clearInterval(interval);
    }
  }, []);

  const retake = useCallback(() => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    setStatus('idle');
  }, []);

  const uploadVideo = async () => {
    if (!recordedBlob || !user) return;

    setStatus('uploading');

    try {
      const fileName = `${user.id}/${Date.now()}.webm`;
      
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .upload(`videos/${fileName}`, recordedBlob, {
          contentType: 'video/webm',
          cacheControl: '3600'
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(`videos/${fileName}`);

      onVideoRecorded(urlData.publicUrl);
      
      toast({
        title: 'Video uploaded',
        description: 'Your recorded video has been uploaded'
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload video. Please try again.',
        variant: 'destructive'
      });
      setStatus('recorded');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-xl bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground flex items-center space-x-2">
          <Camera className="h-5 w-5 text-primary" />
          <span>Record Video</span>
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          autoPlay
          muted={status !== 'recorded'}
          playsInline
          controls={status === 'recorded'}
          src={recordedUrl || undefined}
          className="w-full h-full object-cover"
        />

        {/* Recording indicator */}
        {status === 'recording' && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/50 px-3 py-1 rounded-full">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">
              {formatDuration(duration)} / {formatDuration(maxDurationSeconds)}
            </span>
          </div>
        )}

        {/* Camera switch button */}
        {(status === 'previewing' || status === 'recording') && (
          <Button
            variant="ghost"
            size="icon"
            onClick={switchCamera}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex space-x-2">
        {status === 'idle' && (
          <Button onClick={startCamera} className="flex-1 bg-gradient-primary">
            <Camera className="h-4 w-4 mr-2" />
            Start Camera
          </Button>
        )}

        {status === 'previewing' && (
          <>
            <Button variant="outline" onClick={() => { stopCamera(); setStatus('idle'); }} className="flex-1">
              Cancel
            </Button>
            <Button onClick={startRecording} className="flex-1 bg-red-500 hover:bg-red-600">
              <Video className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          </>
        )}

        {status === 'recording' && (
          <Button onClick={stopRecording} className="flex-1 bg-red-500 hover:bg-red-600">
            <Square className="h-4 w-4 mr-2" />
            Stop Recording
          </Button>
        )}

        {status === 'recorded' && (
          <>
            <Button variant="outline" onClick={retake} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake
            </Button>
            <Button onClick={uploadVideo} className="flex-1 bg-gradient-primary">
              <Upload className="h-4 w-4 mr-2" />
              Use Video
            </Button>
          </>
        )}

        {status === 'uploading' && (
          <Button disabled className="flex-1">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Maximum recording time: {maxDurationSeconds} seconds
      </p>
    </div>
  );
};

export default VideoRecorder;
