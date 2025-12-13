import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  { to: "/", icon: Home, labelKey: "nav.home" },
  { to: "/tools", icon: Wrench, labelKey: "nav.tools" },
  { to: "/talent", icon: Users, labelKey: "dashboard.talentPool" },
  { to: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { to: "/admin", icon: Shield, labelKey: "nav.admin" },
  { to: "/messages", icon: MessageCircle, labelKey: "nav.messages" },
  { to: "/auth", icon: LogIn, labelKey: "nav.signIn" },
];

export const MainNavigation = () => {
  const { t } = useTranslation();
  
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
              {t(item.labelKey)}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};