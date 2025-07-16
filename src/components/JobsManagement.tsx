import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Plus, Briefcase, MapPin, DollarSign, Clock, Users, Edit, Trash2, Eye } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string;
  location: string;
  city: string;
  country: string;
  type: string;
  work_mode: string;
  experience: string;
  salary?: string;
  application_url: string;
  slots: number;
  applicants: number;
  created_at: string;
  updated_at: string;
}

const JobsManagement: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    location: '',
    city: '',
    country: '',
    type: 'full-time',
    work_mode: 'remote',
    experience: 'mid',
    salary: '',
    application_url: '',
    slots: 1
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load jobs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const jobData = {
        ...formData,
        user_id: user.id,
        applicants: 0
      };

      if (editingJob) {
        const { error } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', editingJob.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Job updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('jobs')
          .insert([jobData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Job created successfully"
        });
      }

      resetForm();
      await fetchJobs();
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: "Error",
        description: "Failed to save job",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements,
      location: job.location,
      city: job.city,
      country: job.country,
      type: job.type,
      work_mode: job.work_mode,
      experience: job.experience,
      salary: job.salary || '',
      application_url: job.application_url,
      slots: job.slots
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job deleted successfully"
      });

      await fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      description: '',
      requirements: '',
      location: '',
      city: '',
      country: '',
      type: 'full-time',
      work_mode: 'remote',
      experience: 'mid',
      salary: '',
      application_url: '',
      slots: 1
    });
    setEditingJob(null);
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Job Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Create and manage your job postings</p>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Job
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{jobs.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Applicants</p>
                <p className="text-2xl font-bold">{jobs.reduce((sum, job) => sum + job.applicants, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold">{jobs.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Applications</p>
                <p className="text-2xl font-bold">{jobs.length > 0 ? Math.round(jobs.reduce((sum, job) => sum + job.applicants, 0) / jobs.length) : 0}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingJob ? 'Edit Job' : 'Create New Job'}</CardTitle>
            <CardDescription>
              {editingJob ? 'Update your job posting details' : 'Fill out the details for your new job posting'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Job Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Senior AI Engineer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company *</label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Company name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Job Description *</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Requirements *</label>
                <Textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="List the required skills, experience, and qualifications..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g., San Francisco"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country *</label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="e.g., United States"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Full Location *</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., San Francisco, CA, USA"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Job Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    required
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Work Mode *</label>
                  <select
                    value={formData.work_mode}
                    onChange={(e) => setFormData(prev => ({ ...prev, work_mode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    required
                  >
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Experience Level *</label>
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    required
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="lead">Lead Level</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Salary Range</label>
                  <Input
                    value={formData.salary}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                    placeholder="e.g., $80,000 - $120,000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Number of Positions *</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.slots}
                    onChange={(e) => setFormData(prev => ({ ...prev, slots: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Application URL *</label>
                  <Input
                    type="url"
                    value={formData.application_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, application_url: e.target.value }))}
                    placeholder="https://example.com/apply"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingJob ? "Update Job" : "Create Job"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Jobs List */}
      <div className="space-y-4">
        {loading && jobs.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading jobs...</p>
          </div>
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {job.title}
                      </h3>
                      <Badge variant="outline">{job.type}</Badge>
                      <Badge variant="secondary">{job.work_mode}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {job.applicants} applicants
                      </span>
                      {job.salary && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {job.salary}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {job.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-500">
                      <span>Created: {new Date(job.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Updated: {new Date(job.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(job)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(job.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Jobs Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first job posting to start attracting talent.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Job
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default JobsManagement;