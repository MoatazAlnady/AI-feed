import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Video, Users, MessageCircle, Send, Radio, StopCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LiveVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoLive?: (streamId: string) => void;
}

const LiveVideoModal: React.FC<LiveVideoModalProps> = ({
  isOpen,
  onClose,
  onGoLive
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [status, setStatus] = useState<'setup' | 'preview' | 'live' | 'ended'>('setup');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [messages, setMessages] = useState<Array<{ id: string; author: string; content: string }>>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'live') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
        // Simulate viewer count changes
        setViewerCount(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus('preview');
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access to go live',
        variant: 'destructive'
      });
    }
  };

  const goLive = () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please add a title for your live video',
        variant: 'destructive'
      });
      return;
    }

    // In a real implementation, this would connect to a streaming service
    const streamId = `live-${Date.now()}`;
    setStatus('live');
    setViewerCount(1);
    
    toast({
      title: "You're now live!",
      description: 'Your followers have been notified'
    });

    onGoLive?.(streamId);
  };

  const endStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStatus('ended');
    
    toast({
      title: 'Stream ended',
      description: `You were live for ${formatDuration(duration)}`
    });
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onClose();
    setStatus('setup');
    setTitle('');
    setDescription('');
    setDuration(0);
    setViewerCount(0);
    setMessages([]);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      author: user?.user_metadata?.full_name || 'You',
      content: newMessage
    }]);
    setNewMessage('');
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Radio className={`h-5 w-5 ${status === 'live' ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
            <span className="font-semibold text-foreground">
              {status === 'setup' && 'Go Live'}
              {status === 'preview' && 'Preview'}
              {status === 'live' && 'LIVE'}
              {status === 'ended' && 'Stream Ended'}
            </span>
            {status === 'live' && (
              <span className="text-sm text-muted-foreground">
                {formatDuration(duration)}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Video Section */}
          <div className="flex-1 p-4">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              
              {status === 'live' && (
                <>
                  {/* Live indicator */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-500 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-white text-sm font-medium">LIVE</span>
                  </div>
                  
                  {/* Viewer count */}
                  <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/50 px-3 py-1 rounded-full">
                    <Users className="h-4 w-4 text-white" />
                    <span className="text-white text-sm">{viewerCount}</span>
                  </div>
                </>
              )}

              {status === 'setup' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Set up your live video</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Preview Feature Banner */}
            {status === 'setup' && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <strong>Preview Feature:</strong> Live streaming is currently in preview mode. 
                Your video will be shown locally but not broadcast to viewers yet.
              </div>
            )}

            {/* Setup Form */}
            {(status === 'setup' || status === 'preview') && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's your live about?"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description (optional)</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add more details..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="mt-4 flex space-x-3">
              {status === 'setup' && (
                <Button onClick={startPreview} className="flex-1 bg-gradient-primary">
                  <Video className="h-4 w-4 mr-2" />
                  Start Preview
                </Button>
              )}
              
              {status === 'preview' && (
                <>
                  <Button variant="outline" onClick={() => { 
                    if (streamRef.current) {
                      streamRef.current.getTracks().forEach(track => track.stop());
                    }
                    setStatus('setup');
                  }} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={goLive} className="flex-1 bg-red-500 hover:bg-red-600">
                    <Radio className="h-4 w-4 mr-2" />
                    Go Live
                  </Button>
                </>
              )}
              
              {status === 'live' && (
                <>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button onClick={endStream} className="flex-1 bg-red-500 hover:bg-red-600">
                    <StopCircle className="h-4 w-4 mr-2" />
                    End Stream
                  </Button>
                </>
              )}
              
              {status === 'ended' && (
                <Button onClick={handleClose} className="flex-1">
                  Close
                </Button>
              )}
            </div>
          </div>

          {/* Chat Section (only during live) */}
          {status === 'live' && (
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border flex flex-col">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium text-foreground flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Live Chat</span>
                </h3>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto max-h-64 lg:max-h-none space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">
                    No messages yet
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span className="font-medium text-foreground">{msg.author}: </span>
                      <span className="text-muted-foreground">{msg.content}</span>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 border-t border-border">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Say something..."
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button size="icon" onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveVideoModal;
