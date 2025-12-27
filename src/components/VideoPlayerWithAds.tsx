import { useState, useRef, useEffect } from 'react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface VideoPlayerWithAdsProps {
  src: string;
  poster?: string;
  contentId?: string;
  creatorId?: string;
  autoPlay?: boolean;
  className?: string;
}

export default function VideoPlayerWithAds({
  src,
  poster,
  contentId,
  creatorId,
  autoPlay = false,
  className = '',
}: VideoPlayerWithAdsProps) {
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  
  // Ad states
  const [showingAd, setShowingAd] = useState(false);
  const [adSkippable, setAdSkippable] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [prerollShown, setPrerollShown] = useState(false);
  const [midrollShown, setMidrollShown] = useState(false);

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying && !showingAd) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      container?.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isPlaying, showingAd]);

  // Handle pre-roll ad
  const showPrerollAd = () => {
    if (isPremium || prerollShown) return false;
    
    setShowingAd(true);
    setAdCountdown(5);
    setAdSkippable(false);
    setPrerollShown(true);

    // Countdown for skip button
    const interval = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setAdSkippable(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Track ad impression
    if (contentId && creatorId) {
      trackVideoAdImpression('preroll');
    }

    // Auto-skip after 15 seconds (simulating ad completion)
    setTimeout(() => {
      if (showingAd) {
        handleSkipAd();
      }
    }, 15000);

    return true;
  };

  // Handle mid-roll ad (for videos > 5 minutes, shown at 50%)
  const checkMidrollAd = () => {
    if (isPremium || midrollShown || duration < 300) return;
    
    const halfwayPoint = duration / 2;
    const currentTime = videoRef.current?.currentTime || 0;
    
    if (currentTime >= halfwayPoint && currentTime < halfwayPoint + 1) {
      setShowingAd(true);
      setAdCountdown(5);
      setAdSkippable(false);
      setMidrollShown(true);

      videoRef.current?.pause();

      const interval = setInterval(() => {
        setAdCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setAdSkippable(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      if (contentId && creatorId) {
        trackVideoAdImpression('midroll');
      }

      setTimeout(() => {
        if (showingAd) {
          handleSkipAd();
        }
      }, 15000);
    }
  };

  const trackVideoAdImpression = async (adType: 'preroll' | 'midroll' | 'postroll') => {
    try {
      console.log('Video ad impression tracked:', { contentId, creatorId, adType });
      // Future: Call edge function to track impression and calculate creator revenue
    } catch (error) {
      console.error('Error tracking video ad impression:', error);
    }
  };

  const handleSkipAd = () => {
    setShowingAd(false);
    setAdSkippable(false);
    setAdCountdown(5);
    
    // Resume video
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (!prerollShown && !isPremium) {
      const showedAd = showPrerollAd();
      if (showedAd) return;
    }

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const videoDuration = videoRef.current.duration;
    
    setProgress((currentTime / videoDuration) * 100);
    checkMidrollAd();
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    const seekTime = (value[0] / 100) * duration;
    videoRef.current.currentTime = seekTime;
    setProgress(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    const newVolume = value[0] / 100;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (premiumLoading) {
    return (
      <div className={`aspect-video bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative aspect-video bg-black rounded-lg overflow-hidden group ${className}`}
      onClick={showingAd ? undefined : handlePlayPause}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="w-full h-full object-contain"
        playsInline
      />

      {/* Ad Overlay */}
      {showingAd && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20">
          <div className="text-center mb-4">
            <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded mb-4 inline-block">
              AD
            </div>
            <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg p-8">
              <p className="text-white text-lg mb-2">Advertisement</p>
              <p className="text-muted-foreground text-sm">
                This ad supports the creator
              </p>
            </div>
          </div>
          
          {adSkippable ? (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleSkipAd();
              }}
              className="flex items-center gap-2"
            >
              <SkipForward className="h-4 w-4" />
              Skip Ad
            </Button>
          ) : (
            <div className="text-white text-sm">
              Skip in {adCountdown}s
            </div>
          )}
        </div>
      )}

      {/* Play Button Overlay (when paused) */}
      {!isPlaying && !showingAd && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <button
            onClick={handlePlayPause}
            className="w-16 h-16 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-all"
          >
            <Play className="h-8 w-8 text-primary-foreground ml-1" />
          </button>
        </div>
      )}

      {/* Controls */}
      {showControls && !showingAd && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity">
          {/* Progress Bar */}
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="mb-4 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button onClick={handlePlayPause} className="text-white hover:text-primary transition-colors">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  className="w-20"
                />
              </div>

              {/* Time */}
              <span className="text-white text-sm">
                {formatTime((progress / 100) * duration)} / {formatTime(duration)}
              </span>
            </div>

            {/* Fullscreen */}
            <button onClick={handleFullscreen} className="text-white hover:text-primary transition-colors">
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Premium Badge (no ads) */}
      {isPremium && (
        <div className="absolute top-4 right-4 bg-yellow-500/90 text-black text-xs font-bold px-2 py-1 rounded">
          AD-FREE
        </div>
      )}
    </div>
  );
}
