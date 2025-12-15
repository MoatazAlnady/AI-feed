import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Tag, 
  Users, 
  Calendar,
  MoreHorizontal,
  Trash,
  Edit,
  CheckCircle,
  X,
  Filter,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Project {
  id: string;
  title: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  candidate_count?: number;
}

interface ProjectTag {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

interface ProjectCandidate {
  id: string;
  project_id: string;
  candidate_id: string;
  notes: string;
  created_at: string;
  candidate: {
    full_name: string;
    job_title: string;
    profile_photo: string;
  };
  tags: ProjectTag[];
}

const EmployerProjects: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [tags, setTags] = useState<ProjectTag[]>([]);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', color: '#3b82f6' });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectCandidates, setProjectCandidates] = useState<ProjectCandidate[]>([]);

  useEffect(() => {
    fetchProjects();
    fetchTags();
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('employer_projects')
        .select(`
          *,
          project_candidates(id)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      const projectsWithCount = data?.map(project => ({
        ...project,
        candidate_count: project.project_candidates?.length || 0
      })) || [];
      
      setProjects(projectsWithCount);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    if (!user) return;
    
    try {
      const { data: customTags, error: customTagsError } = await supabase
        .from('project_tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (customTagsError) throw customTagsError;
      
      const defaultTags: ProjectTag[] = [
        { id: 'default-1', name: 'Contacted', color: '#3b82f6', user_id: user.id },
        { id: 'default-2', name: 'Responded', color: '#10b981', user_id: user.id },
        { id: 'default-3', name: 'Interview Scheduled', color: '#f59e0b', user_id: user.id },
        { id: 'default-4', name: 'Hired', color: '#059669', user_id: user.id },
        { id: 'default-5', name: 'Rejected', color: '#ef4444', user_id: user.id }
      ];
      
      setTags([...defaultTags, ...(customTags || [])]);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchProjectCandidates = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_candidates')
        .select(`
          *,
          user_profiles!project_candidates_candidate_id_fkey(
            full_name,
            job_title,
            profile_photo
          )
        `)
        .eq('project_id', projectId);
      
      if (error) throw error;
      
      // Transform data to match interface
      const candidates = data?.map(candidate => ({
        ...candidate,
        candidate: {
          full_name: candidate.user_profiles?.full_name || 'Unknown',
          job_title: candidate.user_profiles?.job_title || '',
          profile_photo: candidate.user_profiles?.profile_photo || ''
        },
        tags: [] // Tags would be fetched separately
      })) || [];
      
      setProjectCandidates(candidates);
    } catch (error) {
      console.error('Error fetching project candidates:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!user || !newProject.title.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('employer_projects')
        .insert({
          title: newProject.title,
          description: newProject.description,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setProjects([{ ...data, candidate_count: 0 }, ...projects]);
      setNewProject({ title: '', description: '' });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleCreateTag = async () => {
    if (!user || !newTag.name.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('project_tags')
        .insert({
          name: newTag.name,
          color: newTag.color,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setTags([...tags, data]);
      setNewTag({ name: '', color: '#3b82f6' });
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (tagId.startsWith('default-')) return;
    
    try {
      const { error } = await supabase
        .from('project_tags')
        .delete()
        .eq('id', tagId);
      
      if (error) throw error;
      
      setTags(tags.filter(tag => tag.id !== tagId));
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('employer_projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
      
      setProjects(projects.filter(project => project.id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const openProjectDetails = (project: Project) => {
    setSelectedProject(project);
    fetchProjectCandidates(project.id);
  };

  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Project Management</h2>
          <p className="text-muted-foreground">Organize candidates and streamline your hiring process</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTagsModal(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Tag className="h-5 w-5 text-muted-foreground" />
            <span className="text-foreground">Manage Tags</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground text-lg">{project.title}</h3>
                  </div>
                  <div className="relative">
                    <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {project.description && (
                  <p className="text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{project.candidate_count} candidates</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => openProjectDetails(project)}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Delete Project"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm p-12 text-center">
          <Briefcase className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No Projects Yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Create your first project to organize candidates and streamline your hiring process.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Create Your First Project
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full border border-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Create Project</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    placeholder="e.g., Senior AI Engineer Hiring"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background text-foreground"
                    placeholder="Describe the purpose of this project..."
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 border border-border text-foreground rounded-xl hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateProject}
                    disabled={!newProject.title.trim()}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Tags Modal */}
      {showTagsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full border border-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Manage Tags</h2>
                <button
                  onClick={() => setShowTagsModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    placeholder="New tag name"
                  />
                  <input
                    type="color"
                    value={newTag.color}
                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                    className="h-10 w-10 rounded-lg border border-border cursor-pointer"
                  />
                  <button
                    onClick={handleCreateTag}
                    disabled={!newTag.name.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>

                <div className="border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  {tags.map((tag) => (
                    <div 
                      key={tag.id} 
                      className="flex items-center justify-between p-3 border-b border-border last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-foreground">{tag.name}</span>
                      </div>
                      {!tag.id.startsWith('default-') && (
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="text-destructive hover:text-destructive/80 transition-colors"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerProjects;