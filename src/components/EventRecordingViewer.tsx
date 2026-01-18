import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  FileText, 
  Video, 
  BookOpen,
  Copy,
  Check,
  Loader2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface EventRecordingViewerProps {
  recordingUrl: string;
  transcript: string;
  summary: string;
  transcriptLanguage?: string;
  durationSeconds?: number;
  eventTitle: string;
  status: string;
}

const EventRecordingViewer: React.FC<EventRecordingViewerProps> = ({
  recordingUrl,
  transcript,
  summary,
  transcriptLanguage,
  durationSeconds,
  eventTitle,
  status
}) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('video');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      toast.success('Transcript copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy transcript');
    }
  };

  const downloadTranscript = (format: 'txt' | 'md') => {
    const content = format === 'md' 
      ? `# ${eventTitle}\n\n## Transcript\n\n${transcript}\n\n## Summary\n\n${summary}`
      : `${eventTitle}\n\nTranscript:\n\n${transcript}\n\nSummary:\n\n${summary}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventTitle.replace(/[^a-z0-9]/gi, '-')}-transcript.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Transcript downloaded as ${format.toUpperCase()}`);
  };

  // Parse timestamp from transcript line and seek to that time
  const handleTranscriptClick = (line: string) => {
    const match = line.match(/\[(\d{2}):(\d{2})\]/);
    if (match && videoRef.current) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const time = mins * 60 + secs;
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        videoRef.current.play();
      }
      setActiveTab('video');
    }
  };

  if (status !== 'ready') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <h3 className="text-lg font-semibold mb-2">Processing Recording</h3>
          <p className="text-muted-foreground text-center">
            {status === 'uploading' && 'Uploading recording...'}
            {status === 'processing' && 'Processing video...'}
            {status === 'transcribing' && 'Generating transcript...'}
            {status === 'summarizing' && 'Creating summary...'}
            {status === 'failed' && 'Processing failed. Please try again.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video
            </TabsTrigger>
            <TabsTrigger value="transcript" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Summary
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyTranscript}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Copy</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadTranscript('txt')}>
              <Download className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">TXT</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadTranscript('md')}>
              <Download className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">MD</span>
            </Button>
          </div>
        </div>

        <TabsContent value="video" className="mt-0">
          <Card>
            <CardContent className="p-0">
              {/* Video Player */}
              <div className="relative bg-black rounded-t-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={recordingUrl}
                  className="w-full aspect-video"
                  playsInline
                />
              </div>

              {/* Video Controls */}
              <div className="p-4 space-y-3">
                {/* Progress Bar */}
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />

                {/* Time and Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlay}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {transcriptLanguage && (
                    <span className="text-xs text-muted-foreground uppercase">
                      {transcriptLanguage}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcript" className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Full Transcript
                </CardTitle>
                {transcriptLanguage && (
                  <span className="text-xs bg-muted px-2 py-1 rounded uppercase">
                    {transcriptLanguage}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {transcript.split('\n\n').map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-sm leading-relaxed cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                      onClick={() => handleTranscriptClick(paragraph)}
                    >
                      {paragraph.startsWith('[') ? (
                        <>
                          <span className="text-primary font-mono text-xs">
                            {paragraph.match(/\[\d{2}:\d{2}\]/)?.[0]}
                          </span>
                          <span className="ml-2">
                            {paragraph.replace(/\[\d{2}:\d{2}\]\s*/, '')}
                          </span>
                        </>
                      ) : (
                        paragraph
                      )}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {summary.split('\n').map((line, index) => {
                    if (line.startsWith('## ')) {
                      return (
                        <h2 key={index} className="text-lg font-semibold mt-4 mb-2">
                          {line.replace('## ', '')}
                        </h2>
                      );
                    }
                    if (line.startsWith('### ')) {
                      return (
                        <h3 key={index} className="text-base font-medium mt-3 mb-1">
                          {line.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return (
                        <h3 key={index} className="text-base font-semibold mt-4 mb-2">
                          {line.replace(/\*\*/g, '')}
                        </h3>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <li key={index} className="ml-4">
                          {line.replace('- ', '')}
                        </li>
                      );
                    }
                    if (line.trim() === '') {
                      return <br key={index} />;
                    }
                    return (
                      <p key={index} className="mb-2">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventRecordingViewer;
