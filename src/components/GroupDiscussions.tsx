import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Plus, Pin, Clock, User, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Discussion {
  id: string;
  group_id: string;
  title: string;
  content: string | null;
  author_id: string;
  is_pinned: boolean;
  reply_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    profile_photo: string | null;
  };
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

interface GroupDiscussionsProps {
  groupId: string;
  groupName: string;
  onBack?: () => void;
}

const GroupDiscussions: React.FC<GroupDiscussionsProps> = ({ groupId, groupName, onBack }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [creatingDiscussion, setCreatingDiscussion] = useState(false);

  useEffect(() => {
    fetchDiscussions();
  }, [groupId]);

  useEffect(() => {
    if (selectedDiscussion) {
      fetchReplies(selectedDiscussion.id);
    }
  }, [selectedDiscussion]);

  const fetchDiscussions = async () => {
    try {
      const { data, error } = await supabase
        .from('group_discussions')
        .select('*')
        .eq('group_id', groupId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Fetch author info for each discussion
      const discussionsWithAuthors = await Promise.all(
        (data || []).map(async (discussion) => {
          const { data: authorData } = await supabase
            .from('user_profiles')
            .select('full_name, profile_photo')
            .eq('id', discussion.author_id)
            .single();
          return { ...discussion, author: authorData };
        })
      );

      setDiscussions(discussionsWithAuthors);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast.error('Failed to load discussions');
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
    if (!user || !newDiscussionTitle.trim()) return;

    setCreatingDiscussion(true);
    try {
      const { error } = await supabase
        .from('group_discussions')
        .insert({
          group_id: groupId,
          title: newDiscussionTitle.trim(),
          content: newDiscussionContent.trim() || null,
          author_id: user.id,
        });

      if (error) throw error;

      toast.success('Discussion created!');
      setNewDiscussionTitle('');
      setNewDiscussionContent('');
      setShowNewDiscussion(false);
      fetchDiscussions();
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast.error('Failed to create discussion');
    } finally {
      setCreatingDiscussion(false);
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
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            {selectedDiscussion.author?.profile_photo ? (
              <img
                src={selectedDiscussion.author.profile_photo}
                alt=""
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-foreground">{selectedDiscussion.title}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedDiscussion.author?.full_name || 'Unknown'} ·{' '}
                {formatDistanceToNow(new Date(selectedDiscussion.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {selectedDiscussion.content && (
            <p className="text-foreground mb-4">{selectedDiscussion.content}</p>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-foreground">
            {t('groups.replies', 'Replies')} ({replies.length})
          </h4>

          {replies.map((reply) => (
            <div key={reply.id} className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                {reply.author?.profile_photo ? (
                  <img src={reply.author.profile_photo} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
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

          {user && (
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h3 className="text-xl font-semibold text-foreground">
            {groupName} - {t('groups.discussions', 'Discussions')}
          </h3>
        </div>
        
        <Dialog open={showNewDiscussion} onOpenChange={setShowNewDiscussion}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('groups.startDiscussion', 'Start Discussion')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('groups.newDiscussion', 'New Discussion')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder={t('groups.discussionTitle', 'Discussion title')}
                value={newDiscussionTitle}
                onChange={(e) => setNewDiscussionTitle(e.target.value)}
              />
              <Textarea
                placeholder={t('groups.discussionContent', 'What would you like to discuss? (optional)')}
                value={newDiscussionContent}
                onChange={(e) => setNewDiscussionContent(e.target.value)}
                rows={4}
              />
              <Button
                onClick={createDiscussion}
                disabled={!newDiscussionTitle.trim() || creatingDiscussion}
                className="w-full"
              >
                {creatingDiscussion ? t('common.creating', 'Creating...') : t('common.create', 'Create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {discussions.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">
            {t('groups.noDiscussions', 'No discussions yet')}
          </h4>
          <p className="text-muted-foreground">
            {t('groups.beFirstToStart', 'Be the first to start a discussion!')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {discussions.map((discussion) => (
            <div
              key={discussion.id}
              onClick={() => setSelectedDiscussion(discussion)}
              className="bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {discussion.author?.profile_photo ? (
                    <img
                      src={discussion.author.profile_photo}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {discussion.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                      <h4 className="font-medium text-foreground truncate">{discussion.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {discussion.author?.full_name || 'Unknown'} ·{' '}
                      <Clock className="h-3 w-3 inline" />{' '}
                      {formatDistanceToNow(new Date(discussion.updated_at), { addSuffix: true })}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {discussion.reply_count} {t('groups.replies', 'replies')}
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

export default GroupDiscussions;
