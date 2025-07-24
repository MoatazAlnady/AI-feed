import React, { useState } from 'react';
import { 
  MessageSquare, Image, Video, Code, BarChart3, Music, FileText, 
  Brain, Zap, Gamepad2, Camera, Globe, Wrench, Cpu, Lightbulb,
  Smartphone, Monitor, Headphones, Mic, Edit, Search, Shield,
  Database, Cloud, Workflow, Settings, PieChart, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface IconSelectorProps {
  value: string;
  onChange: (icon: string) => void;
  className?: string;
}

const AVAILABLE_ICONS = [
  { name: 'MessageSquare', component: MessageSquare, label: 'Chat' },
  { name: 'Image', component: Image, label: 'Image' },
  { name: 'Video', component: Video, label: 'Video' },
  { name: 'Code', component: Code, label: 'Code' },
  { name: 'BarChart3', component: BarChart3, label: 'Analytics' },
  { name: 'Music', component: Music, label: 'Music' },
  { name: 'FileText', component: FileText, label: 'Text' },
  { name: 'Brain', component: Brain, label: 'Brain' },
  { name: 'Zap', component: Zap, label: 'Lightning' },
  { name: 'Gamepad2', component: Gamepad2, label: 'Gaming' },
  { name: 'Camera', component: Camera, label: 'Camera' },
  { name: 'Globe', component: Globe, label: 'Web' },
  { name: 'Wrench', component: Wrench, label: 'Tools' },
  { name: 'Cpu', component: Cpu, label: 'Processor' },
  { name: 'Lightbulb', component: Lightbulb, label: 'Ideas' },
  { name: 'Smartphone', component: Smartphone, label: 'Mobile' },
  { name: 'Monitor', component: Monitor, label: 'Desktop' },
  { name: 'Headphones', component: Headphones, label: 'Audio' },
  { name: 'Mic', component: Mic, label: 'Microphone' },
  { name: 'Edit', component: Edit, label: 'Edit' },
  { name: 'Search', component: Search, label: 'Search' },
  { name: 'Shield', component: Shield, label: 'Security' },
  { name: 'Database', component: Database, label: 'Database' },
  { name: 'Cloud', component: Cloud, label: 'Cloud' },
  { name: 'Workflow', component: Workflow, label: 'Workflow' },
  { name: 'Settings', component: Settings, label: 'Settings' },
  { name: 'PieChart', component: PieChart, label: 'Chart' },
  { name: 'TrendingUp', component: TrendingUp, label: 'Trending' }
];

const IconSelector: React.FC<IconSelectorProps> = ({ value, onChange, className }) => {
  const [open, setOpen] = useState(false);

  const selectedIcon = AVAILABLE_ICONS.find(icon => icon.name === value) || AVAILABLE_ICONS[0];
  const SelectedIconComponent = selectedIcon.component;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <SelectedIconComponent className="h-4 w-4" />
            {selectedIcon.label}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="grid grid-cols-6 gap-2">
          {AVAILABLE_ICONS.map((icon) => {
            const IconComponent = icon.component;
            return (
              <button
                key={icon.name}
                className={cn(
                  "relative h-10 w-10 rounded-lg border-2 border-gray-200 hover:border-primary transition-all flex items-center justify-center",
                  value === icon.name && "border-primary bg-primary/10"
                )}
                onClick={() => {
                  onChange(icon.name);
                  setOpen(false);
                }}
                title={icon.label}
              >
                <IconComponent className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default IconSelector;