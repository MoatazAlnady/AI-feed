import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquare, 
  Plus, 
  Pin, 
  Clock, 
  User, 
  ChevronRight, 
  ArrowLeft,
  Tag,
  BarChart3,
  Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface DiscussionTag {
  id: string;
  name: string;
  color: string;
}

interface Discussion {
  id: string;
  group_id: string;
  title: string;
  subtitle?: string | null;
  content: string | null;
  author_id: string;
  is_pinned: boolean;
  reply_count: number;
  poll_options?: any | null;
  media_urls?: string[] | null;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    profile_photo: string | null;
  };
  tags?: DiscussionTag[];
}

interface Reply {
  id: string;
  discussion_id: string;
  author_id: string;
  content: string;
  parent_reply_id: string | null;
  likes_count: number;
  created_at: string;
  author?: {
    full_name: string;
    profile_photo: string | null;
  };
}

interface GroupDiscussionsEnhancedProps {
  groupId: string;
  groupName: string;
  isMember: boolean;
  canDiscuss: boolean;
  allowPublicDiscussions?: boolean;
}

const GroupDiscussionsEnhanced: React.FC<GroupDiscussionsEnhancedProps> = ({
  groupId,
  groupName,
  isMember,
  canDiscuss,
  allowPublicDiscussions = false
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [allTags, setAllTags] = useState<DiscussionTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [submitting, setSubmitting] = useState(false);

  // New discussion form
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    selectedTags: [] as string[],
    hasPoll: false,
    pollOptions: ['', ''],
    isPublic: false
  });

  useEffect(() => {
    fetchDiscussions();
    fetchTags();
  }, [groupId]);

  useEffect(() => {
    if (selectedDiscussion) {
      fetchReplies(selectedDiscussion.id);
    }
  }, [selectedDiscussion]);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('discussion_tags')
        .select('*')
        .order('name');

      if (!error && data) {
        setAllTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchDiscussions = async () => {
    try {
      let query = supabase
        .from('group_discussions')
        .select('*')
        .eq('group_id', groupId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Fetch author info and tags for each discussion
      const discussionsWithDetails = await Promise.all(
        (data || []).map(async (discussion) => {
          // Get author
          const { data: authorData } = await supabase
            .from('user_profiles')
            .select('full_name, profile_photo')
            .eq('id', discussion.author_id)
            .single();

          // Get tags
          const { data: tagLinks } = await supabase
            .from('group_discussion_tags')
            .select('tag_id')
            .eq('discussion_id', discussion.id);

          let tags: DiscussionTag[] = [];
          if (tagLinks && tagLinks.length > 0) {
            const tagIds = tagLinks.map(t => t.tag_id);
            const { data: tagData } = await supabase
              .from('discussion_tags')
              .select('*')
              .in('id', tagIds);
            tags = tagData || [];
          }

          return { ...discussion, author: authorData, tags };
        })
      );

      setDiscussions(discussionsWithDetails);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (discussionId: string) => {
    try {
      const { data, error } = await supabase
        .from('discussion_replies')
        .select('*')
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch author info for each reply
      const repliesWithAuthors = await Promise.all(
        (data || []).map(async (reply) => {
          const { data: authorData } = await supabase
            .from('user_profiles')
            .select('full_name, profile_photo')
            .eq('id', reply.author_id)
            .single();
          return { ...reply, author: authorData };
        })
      );

      setReplies(repliesWithAuthors);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const createDiscussion = async () => {
    if (!user || !formData.title.trim()) return;

    setSubmitting(true);
    try {
      // Create discussion
      const { data: newDiscussion, error } = await supabase
        .from('group_discussions')
        .insert({
          group_id: groupId,
          title: formData.title.trim(),
          subtitle: formData.subtitle.trim() || null,
          content: formData.content.trim() || null,
          author_id: user.id,
          is_public: allowPublicDiscussions ? formData.isPublic : false,
          poll_options: formData.hasPoll 
            ? formData.pollOptions.filter(o => o.trim()).map((option, idx) => ({
                id: idx,
                text: option.trim(),
                votes: 0
              }))
            : null
        })
        .select()
        .single();

      if (error) throw error;

      // Add tags
      if (formData.selectedTags.length > 0 && newDiscussion) {
        await supabase
          .from('group_discussion_tags')
          .insert(
            formData.selectedTags.map(tagId => ({
              discussion_id: newDiscussion.id,
              tag_id: tagId
            }))
          );
      }

      toast.success('Discussion created!');
      setShowNewDiscussion(false);
      setFormData({
        title: '',
        subtitle: '',
        content: '',
        selectedTags: [],
        hasPoll: false,
        pollOptions: ['', ''],
        isPublic: false
      });
      fetchDiscussions();
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast.error('Failed to create discussion');
    } finally {
      setSubmitting(false);
    }
  };

  const postReply = async () => {
    if (!user || !selectedDiscussion || !newReply.trim()) return;

    try {
      const { error } = await supabase
        .from('discussion_replies')
        .insert({
          discussion_id: selectedDiscussion.id,
          author_id: user.id,
          content: newReply.trim(),
        });

      if (error) throw error;

      setNewReply('');
      fetchReplies(selectedDiscussion.id);
      
      // Update reply count
      await supabase
        .from('group_discussions')
        .update({ reply_count: (selectedDiscussion.reply_count || 0) + 1 })
        .eq('id', selectedDiscussion.id);
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    }
  };

  const filteredDiscussions = selectedTag === 'all'
    ? discussions
    : discussions.filter(d => d.tags?.some(t => t.id === selectedTag));

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Discussion detail view
  if (selectedDiscussion) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedDiscussion(null)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back', 'Back')}
        </Button>

        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={selectedDiscussion.author?.profile_photo || undefined} />
              <AvatarFallback>
                {(selectedDiscussion.author?.full_name || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {selectedDiscussion.tags && selectedDiscussion.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedDiscussion.tags.map(tag => (
                    <Badge 
                      key={tag.id} 
                      variant="secondary"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
              <h3 className="text-lg font-semibold text-foreground">{selectedDiscussion.title}</h3>
              {selectedDiscussion.subtitle && (
                <p className="text-sm text-muted-foreground">{selectedDiscussion.subtitle}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {selectedDiscussion.author?.full_name || 'Unknown'} ·{' '}
                {formatDistanceToNow(new Date(selectedDiscussion.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          {selectedDiscussion.content && (
            <p className="text-foreground mb-4 whitespace-pre-wrap">{selectedDiscussion.content}</p>
          )}

          {/* Poll display */}
          {selectedDiscussion.poll_options && selectedDiscussion.poll_options.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Poll</span>
              </div>
              <div className="space-y-2">
                {selectedDiscussion.poll_options.map((option: any, idx: number) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    {option.text}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Replies */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">
            {t('groups.replies', 'Replies')} ({replies.length})
          </h4>

          {replies.map((reply) => (
            <div key={reply.id} className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={reply.author?.profile_photo || undefined} />
                  <AvatarFallback>
                    {(reply.author?.full_name || 'U').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {reply.author?.full_name || 'Unknown'} ·{' '}
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </p>
                  <p className="text-foreground mt-1">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}

          {user && isMember && (
            <div className="flex gap-2">
              <Input
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder={t('groups.writeReply', 'Write a reply...')}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && postReply()}
              />
              <Button onClick={postReply} disabled={!newReply.trim()}>
                {t('common.send', 'Send')}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Discussions list view
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">
            {t('groups.discussions', 'Discussions')}
          </h3>
          
          {/* Tag filter */}
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-40">
              <Tag className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag.id} value={tag.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canDiscuss && (
          <Dialog open={showNewDiscussion} onOpenChange={setShowNewDiscussion}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t('groups.startDiscussion', 'Start Discussion')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('groups.newDiscussion', 'New Discussion')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">{t('common.title', 'Title')} *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Discussion headline"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">{t('groups.subtitle', 'Subtitle')}</label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Brief description (optional)"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">{t('common.content', 'Content')}</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="What would you like to discuss?"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">{t('groups.tags', 'Tags')}</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allTags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant={formData.selectedTags.includes(tag.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        style={formData.selectedTags.includes(tag.id) 
                          ? { backgroundColor: tag.color, borderColor: tag.color }
                          : {}
                        }
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            selectedTags: prev.selectedTags.includes(tag.id)
                              ? prev.selectedTags.filter(t => t !== tag.id)
                              : [...prev.selectedTags, tag.id]
                          }));
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.hasPoll}
                    onChange={(e) => setFormData(prev => ({ ...prev, hasPoll: e.target.checked }))}
                    className="rounded"
                  />
                  <label className="text-sm font-medium">Add a poll</label>
                </div>

                {formData.hasPoll && (
                  <div className="space-y-2">
                    {formData.pollOptions.map((option, idx) => (
                      <Input
                        key={idx}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.pollOptions];
                          newOptions[idx] = e.target.value;
                          setFormData(prev => ({ ...prev, pollOptions: newOptions }));
                        }}
                        placeholder={`Option ${idx + 1}`}
                      />
                    ))}
                    {formData.pollOptions.length < 6 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          pollOptions: [...prev.pollOptions, '']
                        }))}
                      >
                        Add Option
                      </Button>
                    )}
                  </div>
                )}

                {/* Public Discussion Toggle (Silver Feature) */}
                {allowPublicDiscussions && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="rounded"
                    />
                    <div>
                      <label className="text-sm font-medium">{t('groups.makePublic', 'Make this discussion public')}</label>
                      <p className="text-xs text-muted-foreground">
                        {t('groups.publicDiscussionDesc', 'This discussion will appear in the Community Discussions tab for everyone to see')}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={createDiscussion}
                  disabled={!formData.title.trim() || submitting}
                  className="w-full"
                >
                  {submitting ? t('common.creating', 'Creating...') : t('common.create', 'Create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Discussions List */}
      {filteredDiscussions.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">
            {t('groups.noDiscussions', 'No discussions yet')}
          </h4>
          <p className="text-muted-foreground">
            {canDiscuss 
              ? t('groups.beFirstToStart', 'Be the first to start a discussion!')
              : t('groups.joinToDiscuss', 'Join the group to start discussions')
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDiscussions.map((discussion) => (
            <div
              key={discussion.id}
              onClick={() => setSelectedDiscussion(discussion)}
              className="bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={discussion.author?.profile_photo || undefined} />
                    <AvatarFallback>
                      {(discussion.author?.full_name || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    {/* Tags */}
                    {discussion.tags && discussion.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {discussion.tags.map(tag => (
                          <Badge 
                            key={tag.id} 
                            variant="secondary"
                            className="text-xs"
                            style={{ backgroundColor: tag.color + '20', color: tag.color }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      {discussion.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                      {discussion.poll_options && <BarChart3 className="h-4 w-4 text-primary" />}
                      <h4 className="font-medium text-foreground truncate">{discussion.title}</h4>
                    </div>
                    
                    {discussion.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">{discussion.subtitle}</p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {discussion.author?.full_name || 'Unknown'} ·{' '}
                      <Clock className="h-3 w-3 inline" />{' '}
                      {formatDistanceToNow(new Date(discussion.updated_at), { addSuffix: true })}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {discussion.reply_count || 0} {t('groups.replies', 'replies')}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupDiscussionsEnhanced;
