import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserPlus, Bell, Star, Circle, UserMinus, ChevronDown, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type FollowStatus = 'following' | 'notify' | 'favorite' | 'normal' | null;

interface FollowStatusDropdownProps {
  userId: string;
  currentStatus: FollowStatus;
  onStatusChange: (newStatus: FollowStatus) => void;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

const statusConfig = {
  following: {
    label: 'Follow',
    icon: UserPlus,
    description: 'Standard following',
    color: 'text-primary',
  },
  notify: {
    label: 'Notify For Updates',
    icon: Bell,
    description: 'Get notified for all content',
    color: 'text-yellow-600',
  },
  favorite: {
    label: 'Favorite',
    icon: Star,
    description: 'Prioritized in newsfeed',
    color: 'text-amber-500',
  },
  normal: {
    label: 'Normal',
    icon: Circle,
    description: 'Normal frequency',
    color: 'text-muted-foreground',
  },
};

export function FollowStatusDropdown({
  userId,
  currentStatus,
  onStatusChange,
  disabled = false,
  size = 'default',
}: FollowStatusDropdownProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = async (newStatus: FollowStatus) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('common.loginRequired', 'Please log in to follow users'));
        return;
      }

      if (newStatus === null) {
        // Unfollow - delete the follow record
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
        toast.success(t('follow.unfollowed', 'Unfollowed successfully'));
      } else if (currentStatus === null) {
        // New follow - insert record
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId,
            follow_status: newStatus,
          });

        if (error) throw error;
        toast.success(t('follow.followed', 'Now following'));
      } else {
        // Update existing follow status
        const { error } = await supabase
          .from('follows')
          .update({ follow_status: newStatus })
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
        
        const statusLabels: Record<string, string> = {
          following: t('follow.statusFollowing', 'Following'),
          notify: t('follow.statusNotify', 'Notifications enabled'),
          favorite: t('follow.statusFavorite', 'Added to favorites'),
          normal: t('follow.statusNormal', 'Set to normal'),
        };
        toast.success(statusLabels[newStatus]);
      }

      onStatusChange(newStatus);
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error(t('common.error', 'Something went wrong'));
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  // Get available options (exclude current status)
  const availableOptions = Object.entries(statusConfig).filter(
    ([key]) => key !== currentStatus
  );

  // Current status display
  const currentConfig = currentStatus ? statusConfig[currentStatus] : null;
  const CurrentIcon = currentConfig?.icon || UserPlus;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={currentStatus ? 'outline' : 'default'}
          size={size}
          disabled={disabled || loading}
          className={`gap-1 ${currentStatus ? 'border-primary/50' : ''}`}
        >
          {loading ? (
            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <>
              <CurrentIcon className={`h-4 w-4 ${currentConfig?.color || ''}`} />
              <span className="hidden sm:inline">
                {currentConfig?.label || t('follow.follow', 'Follow')}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {availableOptions.map(([key, config]) => {
          const Icon = config.icon;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => handleStatusChange(key as FollowStatus)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Icon className={`h-4 w-4 ${config.color}`} />
              <div className="flex flex-col">
                <span className="font-medium">{config.label}</span>
                <span className="text-xs text-muted-foreground">{config.description}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
        
        {currentStatus && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleStatusChange(null)}
              className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <UserMinus className="h-4 w-4" />
              <span>{t('follow.unfollow', 'Unfollow')}</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
