import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard,
  Users,
  Wrench,
  FileText,
  CreditCard,
  Mail,
  Settings,
  ChevronDown,
  ChevronRight,
  Flag,
  Shield,
  Briefcase,
  Building,
  MessageSquare,
  BarChart3,
  ClipboardList,
  Tag,
  Globe,
  Users2,
  Headphones,
  Ticket
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  children?: MenuItem[];
}

const AdminSidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const [openSections, setOpenSections] = React.useState<string[]>(['users', 'tools', 'content', 'jobs-talent', 'community', 'settings']);

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      children: [
        { id: 'user-list', label: 'All Users', icon: Users },
        { id: 'role-assignment', label: 'Role Assignment', icon: Shield }
      ]
    },
    {
      id: 'tools',
      label: 'Tools Directory',
      icon: Wrench,
      children: [
        { id: 'categories', label: 'Categories', icon: FileText },
        { id: 'sub-categories', label: 'Sub-Categories', icon: FileText },
        { id: 'pending-tools', label: 'Pending Tools', icon: Wrench },
        { id: 'tool-requests', label: 'Tool Edit Requests', icon: Wrench }
      ]
    },
    {
      id: 'content',
      label: 'Content Management',
      icon: FileText,
      children: [
        { id: 'articles', label: 'Articles', icon: FileText },
        { id: 'site-content', label: 'Site Content', icon: Globe },
        { id: 'interests', label: 'Interests', icon: Tag }
      ]
    },
    {
      id: 'jobs-talent',
      label: 'Jobs & Talent',
      icon: Briefcase,
      children: [
        { id: 'jobs', label: 'Jobs Management', icon: Briefcase },
        { id: 'organizations', label: 'Organizations', icon: Building }
      ]
    },
    {
      id: 'community',
      label: 'Community',
      icon: Users2,
      children: [
        { id: 'groups', label: 'Groups', icon: Users2 },
        { id: 'posts-moderation', label: 'Posts Moderation', icon: MessageSquare }
      ]
    },
    {
      id: 'reports',
      label: 'Content Reports',
      icon: Flag
    },
    {
      id: 'support-tickets',
      label: 'Support Tickets',
      icon: Headphones
    },
    {
      id: 'pricing',
      label: 'Pricing & Plans',
      icon: CreditCard
    },
    {
      id: 'promo-codes',
      label: 'Promo Codes',
      icon: Ticket
    },
    {
      id: 'newsletters',
      label: 'Newsletters',
      icon: Mail
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3
    },
    {
      id: 'audit-log',
      label: 'Audit Log',
      icon: ClipboardList
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      children: [
        { id: 'roles-permissions', label: 'Roles & Permissions', icon: Shield },
        { id: 'dropdown-lists', label: 'Dropdown Lists', icon: ClipboardList }
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isActive = activeSection === item.id;
    const isOpen = openSections.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        {hasChildren ? (
          <Collapsible open={isOpen} onOpenChange={() => toggleSection(item.id)}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-10 text-foreground hover:bg-muted",
                  level > 0 && "pl-8",
                  isActive && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                )}
              >
                <item.icon className="h-4 w-4 mr-3" />
                <span className="flex-1 text-left">{item.label}</span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-10 text-foreground hover:bg-muted",
              level > 0 && "pl-8",
              isActive && "bg-primary/10 text-primary"
            )}
            onClick={() => onSectionChange(item.id)}
          >
            <item.icon className="h-4 w-4 mr-3" />
            {item.label}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 border-r border-border bg-card">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
        <p className="text-sm text-muted-foreground">Manage your platform</p>
      </div>
      <ScrollArea className="h-[calc(100vh-120px)] px-3">
        <div className="space-y-1 py-4">
          {menuItems.map(item => renderMenuItem(item))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AdminSidebar;