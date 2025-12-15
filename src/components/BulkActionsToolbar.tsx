import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FolderPlus,
  MessageSquare,
  UserPlus,
  X,
  CheckSquare,
} from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onSelectAll: (selected: boolean) => void;
  onSaveToProject: () => void;
  onBulkMessage: () => void;
  onBulkConnect: () => void;
  onClearSelection: () => void;
}

const BulkActionsToolbar = ({
  selectedCount,
  totalCount,
  allSelected,
  onSelectAll,
  onSaveToProject,
  onBulkMessage,
  onBulkConnect,
  onClearSelection,
}: BulkActionsToolbarProps) => {
  const { t } = useTranslation();

  if (selectedCount === 0) {
    return (
      <div className="flex items-center gap-3 p-3 bg-card rounded-lg border mb-4">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          id="select-all"
        />
        <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
          {t('bulkActions.selectAll', 'Select all')} ({totalCount})
        </label>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-primary/5 border-primary/20 border rounded-lg mb-4">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          id="select-all-active"
        />
        <span className="text-sm font-medium">
          {t('bulkActions.selected', '{{count}} selected', { count: selectedCount })}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSaveToProject}
          className="gap-2"
        >
          <FolderPlus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('bulkActions.saveAll', 'Save All')}</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onBulkMessage}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">{t('bulkActions.bulkMessage', 'Bulk Message')}</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onBulkConnect}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('bulkActions.connectAll', 'Connect All')}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="gap-2 text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">{t('bulkActions.clear', 'Clear')}</span>
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
