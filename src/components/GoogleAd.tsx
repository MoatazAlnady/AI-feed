import { useEffect, useRef } from 'react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface GoogleAdProps {
  adSlot?: string; // Ad unit ID from Google AdSense
  adFormat?: 'display' | 'in-feed' | 'in-article' | 'auto';
  style?: React.CSSProperties;
  className?: string;
  contentId?: string; // For tracking ad impressions per content
  creatorId?: string; // For attributing ad revenue to creators (70% creator / 30% platform)
}

/**
 * GoogleAd Component - Revenue Attribution Model:
 * 
 * REVENUE SPLIT:
 * - When creatorId IS provided: 70% goes to creator, 30% to platform
 * - When creatorId is NOT provided: 100% goes to platform
 * 
 * USE CASES:
 * - Public feeds (NewsFeed, Blog listing, Tools listing): NO creatorId = 100% platform revenue
 * - Creator content (articles, posts, videos): WITH creatorId = 70% creator / 30% platform
 */
export default function GoogleAd({
  adSlot = '5984946702', // Default ad unit ID
  adFormat = 'auto',
  style,
  className = '',
  contentId,
  creatorId,
}: GoogleAdProps) {
  const { isPremium } = usePremiumStatus();
  const adRef = useRef<HTMLModElement>(null);
  const adPushed = useRef(false);

  useEffect(() => {
    // Don't show ads to premium users
    if (isPremium) return;

    // Don't push the same ad twice
    if (adPushed.current) return;

    try {
      // Push the ad
      if (window.adsbygoogle && adRef.current) {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        adPushed.current = true;

        // REVENUE ATTRIBUTION:
        // Only track creator revenue when creatorId is provided
        // If no creatorId, 100% of revenue goes to platform (no tracking needed)
        if (contentId && creatorId) {
          trackAdImpression(contentId, creatorId);
        }
        // No else needed - when creatorId is absent, platform gets 100% automatically
      }
    } catch (error) {
      console.error('Error loading Google Ad:', error);
    }
  }, [isPremium, contentId, creatorId]);

  // Track ad impression for creator revenue (70% creator / 30% platform split)
  const trackAdImpression = async (contentId: string, creatorId: string) => {
    try {
      // This would call an edge function to track the impression for creator revenue
      // Revenue split: 70% to creator, 30% to platform
      console.log('Ad impression tracked for creator revenue split:', { 
        contentId, 
        creatorId, 
        adFormat,
        creatorShare: '70%',
        platformShare: '30%'
      });
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  };

  // Don't render anything for premium users
  if (isPremium) {
    return null;
  }

  // If no ad slot is configured yet, show a placeholder
  if (!adSlot) {
    return (
      <div 
        className={`bg-muted/50 border border-dashed border-border rounded-lg p-4 text-center ${className}`}
        style={style}
      >
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Ad Space</span>
          <p className="mt-1">Configure ad unit in Google AdSense</p>
        </div>
      </div>
    );
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle block ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client="ca-pub-7465170984350038"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive="true"
    />
  );
}

// In-Feed Ad component for use in feeds/lists
export function InFeedAd({ contentId, creatorId }: { contentId?: string; creatorId?: string }) {
  return (
    <div className="my-4">
      <GoogleAd
        adFormat="in-feed"
        contentId={contentId}
        creatorId={creatorId}
        className="min-h-[100px]"
      />
    </div>
  );
}

// In-Article Ad component for use within article content
export function InArticleAd({ contentId, creatorId }: { contentId?: string; creatorId?: string }) {
  return (
    <div className="my-6">
      <GoogleAd
        adFormat="in-article"
        contentId={contentId}
        creatorId={creatorId}
        className="min-h-[100px]"
      />
    </div>
  );
}

// Display Ad component for sidebars/banners
export function DisplayAd({ 
  contentId, 
  creatorId,
  className = '',
}: { 
  contentId?: string; 
  creatorId?: string;
  className?: string;
}) {
  return (
    <GoogleAd
      adFormat="display"
      contentId={contentId}
      creatorId={creatorId}
      className={`min-h-[250px] ${className}`}
    />
  );
}
