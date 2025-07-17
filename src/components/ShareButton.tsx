import React, { useState } from "react";
import { Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";

interface ShareButtonProps {
  contentType: "post" | "article" | "job" | "tool" | "event";
  contentId: string;
  shareCount?: number;
  onShareCountUpdate?: (newCount: number) => void;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  contentType,
  contentId,
  shareCount = 0,
  onShareCountUpdate,
  className = ""
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSharing(true);
    try {
      const { error } = await supabase
        .from("shares")
        .insert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
        });

      if (error && !error.message.includes("duplicate")) {
        throw error;
      }

      // Update local count optimistically
      if (onShareCountUpdate) {
        onShareCountUpdate(shareCount + 1);
      }

      toast({
        title: "Shared successfully!",
        description: "Content has been shared.",
      });
    } catch (error) {
      console.error("Error sharing content:", error);
      toast({
        title: "Error sharing content",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        disabled={isSharing}
        className={`flex items-center gap-1 text-muted-foreground hover:text-foreground ${className}`}
      >
        <Share className="h-4 w-4" />
        <span className="text-sm">{shareCount}</span>
      </Button>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};