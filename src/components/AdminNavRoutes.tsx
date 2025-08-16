import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Wrench, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Mail,
  UserCog 
} from 'lucide-react';

const AdminNavRoutes = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/users', label: 'User Management', icon: Users },
    { path: '/admin/tools', label: 'Tool Requests', icon: Wrench },
    { path: '/admin/articles', label: 'Article Management', icon: FileText },
    { path: '/admin/newsletter', label: 'Newsletter', icon: Mail },
    { path: '/admin/reports', label: 'Reports', icon: MessageSquare },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/roles', label: 'Role Management', icon: UserCog },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path, item.exact);
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default AdminNavRoutes;