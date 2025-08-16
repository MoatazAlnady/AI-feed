import React, { useState } from 'react';
import { Edit, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ToolActionButtonsProps {
  tool: {
    id: string;
    name: string;
    website: string;
    user_id?: string;
  };
  onDelete?: () => void;
  className?: string;
}

const ToolActionButtons: React.FC<ToolActionButtonsProps> = ({ 
  tool, 
  onDelete,
  className = '' 
}) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!isAdmin) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', tool.id);

      if (error) throw error;

      toast({
        title: "Tool deleted",
        description: `${tool.name} has been successfully deleted.`,
      });

      onDelete?.();
    } catch (error) {
      console.error('Error deleting tool:', error);
      toast({
        title: "Error",
        description: "Failed to delete the tool. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const isOwner = user?.id === tool.user_id;
  const canEdit = isAdmin || isOwner;
  const canDelete = isAdmin;

  return (
    <>
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* External Link */}
        <a
          href={tool.website}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 border rounded-lg transition-colors bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Visit Website"
        >
          <ExternalLink className="h-4 w-4" />
        </a>

        {/* Edit Button - Show for tool owners and admins */}
        {canEdit && (
          <Link
            to={`/tools/${tool.id}/edit`}
            className="p-2 border rounded-lg transition-colors bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Edit Tool"
          >
            <Edit className="h-4 w-4" />
          </Link>
        )}

        {/* Delete Button - Show for admins only */}
        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            className="p-2 h-auto w-auto border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={() => setShowDeleteDialog(true)}
            title="Delete Tool"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tool</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{tool.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ToolActionButtons;