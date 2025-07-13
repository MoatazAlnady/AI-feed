import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Bell, Search } from "lucide-react";

export const Header = () => {
  return (
    <header className="border-b bg-background px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary">AI Nexus Platform</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};