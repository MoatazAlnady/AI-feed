import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronDown, 
  Check, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  MessageSquare,
  Crown,
  Shield,
  Briefcase
} from 'lucide-react';

// Enhanced Select with proper background and high z-index
export const EnhancedSelect = ({ 
  value, 
  onValueChange, 
  placeholder, 
  options, 
  disabled = false 
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  disabled?: boolean;
}) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full bg-background border-border hover:bg-muted/50 transition-colors">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-background border-border shadow-lg z-50">
        {options.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="hover:bg-muted focus:bg-muted cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {option.icon}
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Enhanced User Dropdown Menu
export const UserDropdownMenu = ({ 
  user, 
  onLogout 
}: {
  user: any;
  onLogout: () => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.profile_photo} />
            <AvatarFallback>
              {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 bg-background border-border shadow-lg z-50" 
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {user?.user_metadata?.account_type === 'admin' && (
                <Badge variant="secondary" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
              {user?.user_metadata?.account_type === 'employer' && (
                <Badge variant="secondary" className="text-xs">
                  <Briefcase className="h-3 w-3 mr-1" />
                  Employer
                </Badge>
              )}
              {user?.user_metadata?.verified && (
                <Badge variant="default" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="hover:bg-muted cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-muted cursor-pointer">
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>Messages</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-muted cursor-pointer">
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-muted cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="hover:bg-muted cursor-pointer text-red-600 dark:text-red-400"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Enhanced Notification Dropdown
export const NotificationDropdown = ({ 
  notifications = [] 
}: {
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    read: boolean;
    timestamp: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>;
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 bg-background border-border shadow-lg z-50" 
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id}
                className={`flex flex-col items-start p-3 hover:bg-muted cursor-pointer ${
                  !notification.read ? 'bg-muted/50' : ''
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{notification.title}</span>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Enhanced Actions Dropdown
export const ActionsDropdown = ({ 
  actions 
}: {
  actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
  }>;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="bg-background border-border shadow-lg z-50" 
        align="end"
        forceMount
      >
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            className={`hover:bg-muted cursor-pointer ${
              action.variant === 'destructive' 
                ? 'text-red-600 dark:text-red-400' 
                : ''
            }`}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon}
            <span className="ml-2">{action.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Searchable Select Component
export const SearchableSelect = ({
  value,
  onValueChange,
  placeholder,
  options,
  searchPlaceholder = "Search...",
  disabled = false
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string; description?: string }[];
  searchPlaceholder?: string;
  disabled?: boolean;
}) => {
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase()) ||
    option.description?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between bg-background hover:bg-muted/50"
          disabled={disabled}
        >
          <span>{selectedOption?.label || placeholder}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 bg-background border-border shadow-lg z-50" 
        align="start"
        forceMount
      >
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-48 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              No options found
            </div>
          ) : (
            filteredOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                className="hover:bg-muted cursor-pointer"
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    )}
                  </div>
                  {value === option.value && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default {
  EnhancedSelect,
  UserDropdownMenu,
  NotificationDropdown,
  ActionsDropdown,
  SearchableSelect
};