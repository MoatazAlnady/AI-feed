import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard,
  Users,
  Wrench,
  FileText,
  Briefcase,
  CreditCard,
  Mail,
  Settings,
  TrendingUp,
  MessageSquare,
  Globe,
  Home,
  ChevronDown,
  ChevronRight,
  Eye,
  Zap,
  Flag,
  Shield
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
  const [openSections, setOpenSections] = React.useState<string[]>(['landing']);

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'landing',
      label: 'Landing Page',
      icon: Home,
      children: [
        { id: 'hero', label: 'Hero Section', icon: Eye },
        { id: 'trending', label: 'Trending Tools', icon: TrendingUp },
        { id: 'newsletter-modal', label: 'Newsletter Modal', icon: Mail }
      ]
    },
    {
      id: 'community',
      label: 'Community',
      icon: MessageSquare,
      children: [
        { id: 'posts', label: 'Posts', icon: FileText },
        { id: 'moderation', label: 'Moderation', icon: Eye },
        { id: 'reports', label: 'Reports', icon: Flag }
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
        { id: 'tool-requests', label: 'Tool Edit Requests', icon: Wrench },
        { id: 'featured', label: 'Featured Tools', icon: Zap }
      ]
    },
    {
      id: 'jobs',
      label: 'Jobs Board',
      icon: Briefcase,
      children: [
        { id: 'job-management', label: 'Job Management', icon: Briefcase },
        { id: 'employers', label: 'Employers', icon: Users }
      ]
    },
    {
      id: 'pricing',
      label: 'Pricing & Plans',
      icon: CreditCard
    },
    {
      id: 'newsletters',
      label: 'Newsletters',
      icon: Mail
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
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      children: [
        { id: 'roles-permissions', label: 'Roles & Permissions', icon: Shield },
        { id: 'site-config', label: 'Site Configuration', icon: Globe },
        { id: 'system', label: 'System Settings', icon: Settings }
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
                  "w-full justify-start h-10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
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
              "w-full justify-start h-10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
              level > 0 && "pl-8",
              isActive && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
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
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Manage your platform</p>
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