import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, FolderOpen, Loader2, Check } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface SaveToProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId?: string;
  candidateName?: string;
  candidateIds?: string[];
  onSuccess?: () => void;
}

const SaveToProjectModal = ({ 
  open, 
  onOpenChange, 
  candidateId, 
  candidateName,
  candidateIds = [],
  onSuccess 
}: SaveToProjectModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [savedProjects, setSavedProjects] = useState<Set<string>>(new Set());

  // Determine if bulk mode
  const isBulkMode = candidateIds.length > 0;
  const idsToSave = isBulkMode ? candidateIds : (candidateId ? [candidateId] : []);
  const displayName = isBulkMode 
    ? t('saveToProject.multipleCandidates', '{{count}} candidates', { count: candidateIds.length })
    : candidateName;

  useEffect(() => {
    if (open && user) {
      fetchProjects();
      if (!isBulkMode && candidateId) {
        checkExistingSaves();
      }
    }
  }, [open, user, candidateId, isBulkMode]);

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employer_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingSaves = async () => {
    if (!user || !candidateId) return;
    try {
      const { data, error } = await supabase
        .from('project_candidates')
        .select('project_id')
        .eq('candidate_id', candidateId);

      if (error) throw error;
      setSavedProjects(new Set(data?.map(pc => pc.project_id) || []));
    } catch (error) {
      console.error('Error checking existing saves:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!user || !newProjectTitle.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('employer_projects')
        .insert({
          user_id: user.id,
          title: newProjectTitle.trim(),
          description: newProjectDescription.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      setProjects([data, ...projects]);
      setSelectedProjectId(data.id);
      setShowCreateNew(false);
      setNewProjectTitle('');
      setNewProjectDescription('');
      
      toast({
        title: t('common.success'),
        description: t('saveToProject.projectCreated', 'Project created successfully'),
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: t('common.error'),
        description: t('saveToProject.createError', 'Failed to create project'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToProject = async () => {
    if (!user || !selectedProjectId || idsToSave.length === 0) return;
    
    if (!isBulkMode && savedProjects.has(selectedProjectId)) {
      toast({
        title: t('saveToProject.alreadySaved', 'Already saved'),
        description: t('saveToProject.alreadySavedDesc', 'This candidate is already saved to this project'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Insert all candidates
      const insertData = idsToSave.map(id => ({
        project_id: selectedProjectId,
        candidate_id: id,
        notes: notes.trim() || null,
      }));

      const { error } = await supabase
        .from('project_candidates')
        .upsert(insertData, { 
          onConflict: 'project_id,candidate_id',
          ignoreDuplicates: true 
        });

      if (error) throw error;
      
      if (!isBulkMode) {
        setSavedProjects(new Set([...savedProjects, selectedProjectId]));
      }
      
      toast({
        title: t('saveToProject.saved', 'Saved!'),
        description: isBulkMode 
          ? t('saveToProject.bulkSavedDesc', '{{count}} candidates saved to the project', { count: idsToSave.length })
          : t('saveToProject.savedDesc', '{{name}} has been saved to the project', { name: candidateName }),
      });
      
      onOpenChange(false);
      setSelectedProjectId(null);
      setNotes('');
      onSuccess?.();
    } catch (error) {
      console.error('Error saving to project:', error);
      toast({
        title: t('common.error'),
        description: t('saveToProject.saveError', 'Failed to save candidate'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('saveToProject.title', 'Save to Project')}</DialogTitle>
          <DialogDescription>
            {isBulkMode 
              ? t('saveToProject.bulkDescription', 'Save {{count}} candidates to one of your projects', { count: idsToSave.length })
              : t('saveToProject.description', 'Save {{name}} to one of your projects', { name: candidateName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('saveToProject.searchProjects', 'Search projects...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Projects List */}
          <ScrollArea className="h-48 rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchTerm 
                    ? t('saveToProject.noResults', 'No projects found') 
                    : t('saveToProject.noProjects', 'No projects yet')}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredProjects.map((project) => {
                  const isSelected = selectedProjectId === project.id;
                  const isSaved = savedProjects.has(project.id);
                  
                  return (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      disabled={isSaved}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground' 
                          : isSaved 
                            ? 'bg-muted opacity-50 cursor-not-allowed' 
                            : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{project.title}</p>
                          {project.description && (
                            <p className={`text-xs mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                              {project.description}
                            </p>
                          )}
                        </div>
                        {isSaved && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Create New Project */}
          {showCreateNew ? (
            <div className="space-y-3 p-4 border-2 border-dashed border-primary/30 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">{t('saveToProject.newProject', 'New Project')}</span>
              </div>
              <div className="space-y-2">
                <Label>{t('saveToProject.projectTitle', 'Project Title')}</Label>
                <Input
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder={t('saveToProject.projectTitlePlaceholder', 'e.g., Senior Developer Search')}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('saveToProject.projectDescription', 'Description (optional)')}</Label>
                <Input
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder={t('saveToProject.projectDescPlaceholder', 'Brief description...')}
                  className="bg-background"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateNew(false)}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateProject}
                  disabled={!newProjectTitle.trim() || saving}
                  className="flex-1"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {t('common.create')}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowCreateNew(true)}
              className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('saveToProject.createProject', 'Create New Project')}
            </Button>
          )}

          {/* Notes */}
          {selectedProjectId && (
            <div className="space-y-2">
              <Label>{t('saveToProject.addNotes', 'Add notes (optional)')}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('saveToProject.notesPlaceholder', 'Any notes about this candidate...')}
                rows={2}
              />
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSaveToProject}
            disabled={!selectedProjectId || saving || savedProjects.has(selectedProjectId || '')}
            className="w-full"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {t('saveToProject.save', 'Save to Project')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveToProjectModal;
