import React, { useState } from 'react';
import { Edit, Trash2, ExternalLink, TrendingUp, Lock } from 'lucide-react';
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
  onPromote?: () => void;
  isPremium?: boolean;
  className?: string;
}

const ToolActionButtons: React.FC<ToolActionButtonsProps> = ({ 
  tool, 
  onDelete,
  onPromote,
  isPremium = false,
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
        {/* Edit Button - Show for tool owners and admins */}
        {canEdit && (
          <Link
            to={`/tools/${tool.id}/edit`}
            className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            title="Edit Tool"
          >
            <Edit className="h-4 w-4" />
          </Link>
        )}

        {/* External Link */}
        <a
          href={tool.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          title="Visit Website"
        >
          <ExternalLink className="h-4 w-4" />
        </a>


        {/* Promote Button - Before Delete */}
        {onPromote && (
          <button
            onClick={onPromote}
            className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg relative"
            title="Promote Tool"
          >
            {!isPremium && <Lock className="h-2 w-2 absolute top-1 right-1" />}
            <TrendingUp className="h-4 w-4" />
          </button>
        )}

        {/* Delete Button - Show for admins only */}
        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
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