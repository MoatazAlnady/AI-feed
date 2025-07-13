import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Wrench, 
  Users, 
  LayoutDashboard, 
  Shield, 
  MessageCircle,
  LogIn 
} from "lucide-react";

const navigationItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/tools", icon: Wrench, label: "AI Tools" },
  { to: "/talent", icon: Users, label: "Talent Pool" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin", icon: Shield, label: "Admin" },
  { to: "/messages", icon: MessageCircle, label: "Messages" },
  { to: "/auth", icon: LogIn, label: "Sign In" },
];

export const MainNavigation = () => {
  return (
    <nav className="w-64 border-r bg-card p-4">
      <div className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};