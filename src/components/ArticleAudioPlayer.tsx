import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Loader2, Headphones, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ArticleAudioPlayerProps {
  articleId: string;
  audioUrl: string | null;
  contentHash: string | null;
  currentContent: string;
  articleTitle: string;
}

const ArticleAudioPlayer: React.FC<ArticleAudioPlayerProps> = ({
  articleId,
  audioUrl,
  contentHash,
  currentContent,
  articleTitle
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actualAudioUrl, setActualAudioUrl] = useState<string | null>(audioUrl);
  const [needsRegeneration, setNeedsRegeneration] = useState(false);

  // Calculate content hash on client side to check if regeneration needed
  useEffect(() => {
    const checkContentChange = async () => {
      if (!contentHash || !currentContent) {
        setNeedsRegeneration(!audioUrl);
        return;
      }

      // Simple hash comparison - strip HTML for comparison
      const cleanContent = currentContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000);

      const encoder = new TextEncoder();
      const data = encoder.encode(cleanContent);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const currentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      setNeedsRegeneration(currentHash !== contentHash);
    };

    checkContentChange();
  }, [contentHash, currentContent, audioUrl]);

  useEffect(() => {
    setActualAudioUrl(audioUrl);
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [actualAudioUrl]);

  const generateAudio = async (regenerate = false) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-article-audio', {
        body: { article_id: articleId, regenerate }
      });

      if (error) throw error;
      
      if (data?.audio_url) {
        setActualAudioUrl(data.audio_url);
        setNeedsRegeneration(false);
        toast.success('Audio generated successfully');
      }
    } catch (error: any) {
      console.error('Error generating audio:', error);
      toast.error('Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handlePlaybackRateChange = (rate: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newRate = parseFloat(rate);
    audio.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadAudio = () => {
    if (!actualAudioUrl) return;
    
    const link = document.createElement('a');
    link.href = actualAudioUrl;
    link.download = `${articleTitle.replace(/[^a-z0-9]/gi, '_')}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If no audio and not generating, show generate button
  if (!actualAudioUrl && !isGenerating) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Headphones className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Listen to this article</p>
              <p className="text-sm text-muted-foreground">Generate audio narration</p>
            </div>
          </div>
          <Button onClick={() => generateAudio(false)} disabled={isGenerating}>
            <Headphones className="h-4 w-4 mr-2" />
            Generate Audio
          </Button>
        </div>
      </div>
    );
  }

  // If generating, show loading state
  if (isGenerating) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
          <div>
            <p className="font-medium text-foreground">Generating audio...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 rounded-lg p-4 border border-border">
      <audio ref={audioRef} src={actualAudioUrl || undefined} preload="metadata" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-primary/10 rounded-full">
          <Headphones className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-foreground">Listen to Article</p>
            {needsRegeneration && (
              <Badge variant="outline" className="text-xs gap-1">
                <RefreshCw className="h-3 w-3" />
                Update Available
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        {/* Progress */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8">
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-16"
          />
        </div>

        {/* Speed */}
        <Select value={playbackRate.toString()} onValueChange={handlePlaybackRateChange}>
          <SelectTrigger className="w-16 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.75">0.75x</SelectItem>
            <SelectItem value="1">1x</SelectItem>
            <SelectItem value="1.25">1.25x</SelectItem>
            <SelectItem value="1.5">1.5x</SelectItem>
            <SelectItem value="2">2x</SelectItem>
          </SelectContent>
        </Select>

        {/* Download */}
        <Button variant="ghost" size="icon" onClick={downloadAudio} className="h-8 w-8">
          <Download className="h-4 w-4" />
        </Button>

        {/* Regenerate if needed */}
        {needsRegeneration && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateAudio(true)}
            disabled={isGenerating}
            className="gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Update
          </Button>
        )}
      </div>
    </div>
  );
};

export default ArticleAudioPlayer;