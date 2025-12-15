import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users2, Search, Lock, Globe, Trash2, Eye } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  is_private: boolean;
  member_count: number;
  created_at: string;
  cover_image: string;
}

const GroupsManagement: React.FC = () => {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      setGroups(groups.filter(g => g.id !== groupId));
      toast({
        title: "Success",
        description: "Group deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive"
      });
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-2xl font-bold">Groups Management</h2>
          <p className="text-muted-foreground">Manage community groups</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {groups.length} Total Groups
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/40 relative">
              {group.cover_image && (
                <img src={group.cover_image} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute top-2 right-2">
                {group.is_private ? (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" /> Private
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-background gap-1">
                    <Globe className="h-3 w-3" /> Public
                  </Badge>
                )}
              </div>
            </div>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold line-clamp-1">{group.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {group.description || 'No description'}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users2 className="h-4 w-4" />
                  {group.member_count} members
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(group.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Created {new Date(group.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No groups found
        </div>
      )}
    </div>
  );
};

export default GroupsManagement;