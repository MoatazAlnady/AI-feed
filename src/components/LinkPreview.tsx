import React, { useState, useEffect } from 'react';
import { ExternalLink, Globe, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LinkMetadata {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  favicon: string;
}

interface LinkPreviewProps {
  url: string;
  metadata?: LinkMetadata | null;
  onMetadataFetched?: (metadata: LinkMetadata) => void;
  className?: string;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ 
  url, 
  metadata: existingMetadata,
  onMetadataFetched,
  className = '' 
}) => {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(existingMetadata || null);
  const [loading, setLoading] = useState(!existingMetadata);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (existingMetadata) {
      setMetadata(existingMetadata);
      setLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      if (!url) return;
      
      setLoading(true);
      setError(false);

      try {
        const { data, error: fetchError } = await supabase.functions.invoke('fetch-link-metadata', {
          body: { url }
        });

        if (fetchError) throw fetchError;

        if (data && !data.error) {
          setMetadata(data);
          onMetadataFetched?.(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching link metadata:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [url, existingMetadata]);

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getDomain = (urlString: string) => {
    try {
      return new URL(urlString).hostname.replace('www.', '');
    } catch {
      return urlString;
    }
  };

  if (loading) {
    return (
      <div className={`border border-border rounded-xl p-4 bg-muted/50 animate-pulse ${className}`}>
        <div className="flex items-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading preview...</span>
        </div>
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center space-x-2 text-primary hover:underline ${className}`}
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm truncate">{getDomain(url)}</span>
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`border border-border rounded-xl overflow-hidden bg-card hover:bg-muted/50 transition-colors cursor-pointer group ${className}`}
    >
      {metadata.image && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={metadata.image}
            alt={metadata.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          {metadata.favicon && (
            <img
              src={metadata.favicon}
              alt=""
              className="w-4 h-4"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {metadata.siteName || getDomain(url)}
          </span>
        </div>
        <h4 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {metadata.title}
        </h4>
        {metadata.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {metadata.description}
          </p>
        )}
        <div className="flex items-center space-x-1 mt-2 text-xs text-muted-foreground">
          <ExternalLink className="h-3 w-3" />
          <span>{getDomain(url)}</span>
        </div>
      </div>
    </div>
  );
};

export default LinkPreview;
