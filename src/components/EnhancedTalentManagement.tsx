import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Users, 
  Mail, 
  MessageSquare, 
  Tag, 
  Trash2, 
  Edit, 
  BookmarkPlus,
  ExternalLink,
  CheckSquare,
  Square
} from 'lucide-react';

interface Talent {
  id: string;
  name: string;
  email: string;
  job_title: string;
  location: string;
  bio: string;
  skills: string[];
  experience: string;
  profile_photo?: string;
  linkedin?: string;
  github?: string;
  saved?: boolean;
  notes?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  talents: Talent[];
  created_at: string;
}

const EnhancedTalentManagement: React.FC = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      title: 'Senior AI Engineers Recruitment',
      description: 'Hiring experienced AI engineers for our machine learning team',
      status: 'active',
      talents: [
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          job_title: 'Senior AI Engineer',
          location: 'San Francisco, CA',
          bio: 'Experienced AI engineer with 8+ years in machine learning and deep learning.',
          skills: ['Python', 'TensorFlow', 'PyTorch', 'Computer Vision'],
          experience: '8+ years',
          saved: true,
          notes: 'Excellent technical background, strong portfolio'
        },
        {
          id: '2',
          name: 'David Chen',
          email: 'david@example.com',
          job_title: 'Machine Learning Scientist',
          location: 'Seattle, WA',
          bio: 'PhD in Computer Science with focus on NLP and transformer models.',
          skills: ['Python', 'NLP', 'Transformers', 'Research'],
          experience: '6+ years',
          saved: false,
          notes: 'Strong research background, published papers'
        }
      ],
      created_at: new Date().toISOString()
    }
  ]);
  
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedTalents, setSelectedTalents] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);

  const handleSaveTalent = (projectId: string, talentId: string) => {
    setProjects(projects.map(project => 
      project.id === projectId 
        ? {
            ...project,
            talents: project.talents.map(talent =>
              talent.id === talentId
                ? { ...talent, saved: !talent.saved }
                : talent
            )
          }
        : project
    ));
    
    toast({
      title: "Success",
      description: "Talent saved to your collection"
    });
  };

  const handleSelectTalent = (talentId: string) => {
    setSelectedTalents(prev => 
      prev.includes(talentId)
        ? prev.filter(id => id !== talentId)
        : [...prev, talentId]
    );
  };

  const handleSelectAll = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const allTalentIds = project.talents.map(t => t.id);
      const allSelected = allTalentIds.every(id => selectedTalents.includes(id));
      
      if (allSelected) {
        setSelectedTalents(prev => prev.filter(id => !allTalentIds.includes(id)));
      } else {
        setSelectedTalents(prev => [...new Set([...prev, ...allTalentIds])]);
      }
    }
  };

  const handleBulkMessage = () => {
    if (selectedTalents.length === 0) {
      toast({
        title: "Error",
        description: "Please select talents to message",
        variant: "destructive"
      });
      return;
    }

    if (!bulkMessage.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    // Simulate sending messages
    toast({
      title: "Success",
      description: `Message sent to ${selectedTalents.length} talents`
    });
    
    setBulkMessage('');
    setSelectedTalents([]);
    setShowBulkActions(false);
  };

  const handleBulkRemove = () => {
    if (selectedTalents.length === 0) {
      toast({
        title: "Error",
        description: "Please select talents to remove",
        variant: "destructive"
      });
      return;
    }

    setProjects(projects.map(project => ({
      ...project,
      talents: project.talents.filter(talent => !selectedTalents.includes(talent.id))
    })));

    toast({
      title: "Success",
      description: `Removed ${selectedTalents.length} talents from project`
    });

    setSelectedTalents([]);
    setShowBulkActions(false);
  };

  const renderTalentCard = (talent: Talent, projectId: string) => (
    <Card key={talent.id} className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTalents.includes(talent.id)}
                onChange={() => handleSelectTalent(talent.id)}
                className="rounded mr-3"
              />
              {talent.saved ? (
                <CheckSquare className="h-4 w-4 text-green-500" />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">{talent.name.charAt(0)}</span>
            </div>
            <div>
              <CardTitle className="text-lg">{talent.name}</CardTitle>
              <CardDescription>{talent.job_title}</CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSaveTalent(projectId, talent.id)}
            >
              <BookmarkPlus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{talent.location}</span>
            <span>•</span>
            <span>{talent.experience}</span>
          </div>
          
          <p className="text-sm text-muted-foreground">{talent.bio}</p>
          
          <div className="flex flex-wrap gap-1">
            {talent.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
          
          {talent.notes && (
            <div className="bg-muted p-2 rounded text-sm">
              <strong>Notes:</strong> {talent.notes}
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Talent Projects</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage candidates across your recruitment projects</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedTalents.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {selectedTalents.length} talent(s) selected
              </span>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  onClick={() => setShowBulkActions(!showBulkActions)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Bulk Message
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleBulkRemove}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
            
            {showBulkActions && (
              <div className="mt-4 space-y-3">
                <Textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder="Enter your message to send to selected talents..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleBulkMessage}>
                    Send Message
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowBulkActions(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      <div className="space-y-6">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {project.title}
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(project.id)}
                  >
                    Select All ({project.talents.length})
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {project.talents.map((talent) => renderTalentCard(talent, project.id))}
              </div>
              
              {project.talents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No talents added to this project yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Projects Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first talent management project to start organizing candidates.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedTalentManagement;