import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Search, Trash2, Eye, Heart, Share2, Image, Video, Link } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  user_id: string;
  likes: number;
  shares: number;
  view_count: number;
  image_url: string | null;
  video_url: string | null;
  link_url: string | null;
  created_at: string;
  user_profiles?: {
    full_name: string;
    profile_photo: string;
  };
}

const PostsModeration: React.FC = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Fetch user profiles separately
      const userIds = [...new Set((data || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, profile_photo')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      setPosts((data || []).map(post => ({
        ...post,
        user_profiles: profileMap.get(post.user_id)
      })));
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter(p => p.id !== postId));
      toast({
        title: "Success",
        description: "Post deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive"
      });
    }
  };

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.user_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Posts Moderation</h2>
          <p className="text-muted-foreground">Review and moderate user posts</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {posts.length} Posts
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts by content or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={post.user_profiles?.profile_photo} />
                  <AvatarFallback>
                    {post.user_profiles?.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">
                        {post.user_profiles?.full_name || 'Unknown User'}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {new Date(post.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.image_url && <Image className="h-4 w-4 text-muted-foreground" />}
                      {post.video_url && <Video className="h-4 w-4 text-muted-foreground" />}
                      {post.link_url && <Link className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3 line-clamp-3">{post.content}</p>
                  
                  {post.image_url && (
                    <img 
                      src={post.image_url} 
                      alt="" 
                      className="max-h-48 rounded-lg mb-3 object-cover"
                    />
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" /> {post.likes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" /> Comments
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="h-4 w-4" /> {post.shares || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" /> {post.view_count || 0}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No posts found
        </div>
      )}
    </div>
  );
};

export default PostsModeration;