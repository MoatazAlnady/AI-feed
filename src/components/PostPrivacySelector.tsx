import React, { useState, useEffect } from 'react';
import { Globe, Users, Lock, ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface Group {
  id: string;
  name: string;
}

interface PostPrivacySelectorProps {
  visibility: 'public' | 'connections' | 'groups';
  selectedGroups: string[];
  onVisibilityChange: (visibility: 'public' | 'connections' | 'groups') => void;
  onGroupsChange: (groups: string[]) => void;
  showMakeDefault?: boolean;
  onMakeDefault?: () => void;
  className?: string;
}

const PostPrivacySelector: React.FC<PostPrivacySelectorProps> = ({
  visibility,
  selectedGroups,
  onVisibilityChange,
  onGroupsChange,
  showMakeDefault = false,
  onMakeDefault,
  className = ''
}) => {
  const { user } = useAuth();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  const fetchUserGroups = async () => {
    if (!user) return;

    try {
      // Fetch groups where user is a member
      const { data: memberGroups, error: memberError } = await supabase
        .from('group_members')
        .select('group_id, groups(id, name)')
        .eq('user_id', user.id);

      // Also fetch groups user created
      const { data: createdGroups, error: createdError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('creator_id', user.id);

      const allGroups: Group[] = [];
      
      if (memberGroups) {
        memberGroups.forEach((item: any) => {
          if (item.groups) {
            allGroups.push({ id: item.groups.id, name: item.groups.name });
          }
        });
      }

      if (createdGroups) {
        createdGroups.forEach((group: any) => {
          if (!allGroups.find(g => g.id === group.id)) {
            allGroups.push({ id: group.id, name: group.name });
          }
        });
      }

      setUserGroups(allGroups);
    } catch (error) {
      console.error('Error fetching user groups:', error);
    }
  };

  const visibilityOptions = [
    {
      value: 'public' as const,
      label: 'Public',
      description: 'Anyone can see this post',
      icon: Globe
    },
    {
      value: 'connections' as const,
      label: 'Connections',
      description: 'Only your connections can see',
      icon: Users
    },
    {
      value: 'groups' as const,
      label: 'Specific Groups',
      description: 'Only selected groups can see',
      icon: Lock
    }
  ];

  const currentOption = visibilityOptions.find(opt => opt.value === visibility);
  const Icon = currentOption?.icon || Globe;

  const handleGroupToggle = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
      onGroupsChange(selectedGroups.filter(id => id !== groupId));
    } else {
      onGroupsChange([...selectedGroups, groupId]);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Post Visibility</label>
        {showMakeDefault && onMakeDefault && (
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            onClick={onMakeDefault}
            className="text-xs text-primary hover:text-primary/80"
          >
            Make this my default
          </Button>
        )}
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            <div className="flex items-center space-x-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span>{currentOption?.label}</span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandList>
              <CommandGroup>
                {visibilityOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onVisibilityChange(option.value);
                      if (option.value !== 'groups') {
                        setIsOpen(false);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <option.icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                      {visibility === option.value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Group Selection */}
      {visibility === 'groups' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Select Groups</label>
          {userGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You're not a member of any groups yet.
            </p>
          ) : (
            <Popover open={groupsOpen} onOpenChange={setGroupsOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span>
                    {selectedGroups.length === 0
                      ? 'Select groups...'
                      : `${selectedGroups.length} group${selectedGroups.length > 1 ? 's' : ''} selected`}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search groups..." />
                  <CommandList>
                    <CommandEmpty>No groups found.</CommandEmpty>
                    <CommandGroup>
                      {userGroups.map((group) => (
                        <CommandItem
                          key={group.id}
                          value={group.name}
                          onSelect={() => handleGroupToggle(group.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={selectedGroups.includes(group.id)}
                              className="pointer-events-none"
                            />
                            <span>{group.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </div>
  );
};

export default PostPrivacySelector;
