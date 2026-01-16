import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Briefcase, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import AddExperienceModal, { UserExperience } from './AddExperienceModal';
import ExperienceCard from './ExperienceCard';
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

interface ParsedCVData {
  experiences?: Array<{
    job_title: string;
    company: string;
    location?: string;
    employment_type?: string;
    start_month?: number;
    start_year: number;
    end_month?: number;
    end_year?: number;
    is_current?: boolean;
    description?: string;
    skills_used?: string[];
  }>;
}

const ExperienceSection: React.FC = () => {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState<UserExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [cachedCVData, setCachedCVData] = useState<ParsedCVData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState<UserExperience | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchExperiences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_experience')
        .select('*')
        .eq('user_id', user.id)
        .order('is_current', { ascending: false })
        .order('end_year', { ascending: false, nullsFirst: true })
        .order('start_year', { ascending: false });
      
      if (error) throw error;
      setExperiences(data || []);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCachedCVData = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_cvs')
        .select('parsed_data')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle();
      
      if (data?.parsed_data) {
        const parsedData = data.parsed_data as ParsedCVData;
        if (parsedData.experiences && parsedData.experiences.length > 0) {
          setCachedCVData(parsedData);
        }
      }
    } catch (error) {
      console.error('Error fetching cached CV data:', error);
    }
  };

  useEffect(() => {
    fetchExperiences();
    fetchCachedCVData();
  }, [user]);

  const handleSaveExperience = async (experienceData: Omit<UserExperience, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      if (editingExperience?.id) {
        const { error } = await supabase
          .from('user_experience')
          .update({
            ...experienceData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingExperience.id);
        
        if (error) throw error;
        toast.success('Experience updated successfully');
      } else {
        const { error } = await supabase
          .from('user_experience')
          .insert({
            ...experienceData,
            user_id: user.id
          });
        
        if (error) throw error;
        toast.success('Experience added successfully');
      }
      
      setEditingExperience(null);
      fetchExperiences();
    } catch (error) {
      console.error('Error saving experience:', error);
      toast.error('Failed to save experience');
      throw error;
    }
  };

  const handleDeleteExperience = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('user_experience')
        .delete()
        .eq('id', deleteId);
      
      if (error) throw error;
      toast.success('Experience deleted');
      setDeleteId(null);
      fetchExperiences();
    } catch (error) {
      console.error('Error deleting experience:', error);
      toast.error('Failed to delete experience');
    }
  };

  const handleImportFromCV = async () => {
    if (!cachedCVData?.experiences || !user) return;

    setImporting(true);
    try {
      const experiencesToInsert = cachedCVData.experiences.map((exp, index) => ({
        user_id: user.id,
        job_title: exp.job_title,
        company: exp.company,
        location: exp.location || null,
        employment_type: exp.employment_type || 'full-time',
        start_month: exp.start_month || null,
        start_year: exp.start_year,
        end_month: exp.end_month || null,
        end_year: exp.end_year || null,
        is_current: exp.is_current || false,
        description: exp.description || null,
        skills_used: exp.skills_used || [],
        display_order: index,
        source: 'cv_import'
      }));

      const { error } = await supabase
        .from('user_experience')
        .insert(experiencesToInsert);

      if (error) throw error;

      toast.success(`Imported ${experiencesToInsert.length} experience(s) from your CV!`);
      setCachedCVData(null);
      fetchExperiences();
    } catch (error) {
      console.error('Error importing experiences:', error);
      toast.error('Failed to import experiences');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Import from CV Banner */}
      {cachedCVData?.experiences && cachedCVData.experiences.length > 0 && experiences.length === 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Import from your CV</p>
                  <p className="text-sm text-muted-foreground">
                    We found {cachedCVData.experiences.length} experience(s) from your uploaded CV
                  </p>
                </div>
              </div>
              <Button onClick={handleImportFromCV} disabled={importing}>
                <Download className="h-4 w-4 mr-2" />
                {importing ? 'Importing...' : 'Import All'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Work Experience</h3>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Experience
        </Button>
      </div>

      {/* Experience List */}
      {experiences.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">No work experience added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your professional experience to showcase your career journey
            </p>
            <Button onClick={() => setShowAddModal(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" /> Add Your First Experience
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {experiences.map(exp => (
            <ExperienceCard
              key={exp.id}
              experience={exp}
              onEdit={() => {
                setEditingExperience(exp);
                setShowAddModal(true);
              }}
              onDelete={() => setDeleteId(exp.id!)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddExperienceModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingExperience(null);
        }}
        experience={editingExperience}
        onSave={handleSaveExperience}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Experience</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this work experience? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExperience} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExperienceSection;
