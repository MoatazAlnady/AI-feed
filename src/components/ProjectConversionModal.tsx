import React, { useState } from 'react';
import { X, Briefcase, ArrowRight, Target, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PromoteContentModal from './PromoteContentModal';

interface ProjectConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobData: {
    title: string;
    company: string;
    description: string;
    requirements: string;
    location: string;
    experience: string;
  };
  onProjectCreated: (project: any) => void;
}

const ProjectConversionModal: React.FC<ProjectConversionModalProps> = ({
  isOpen,
  onClose,
  jobData,
  onProjectCreated
}) => {
  const [step, setStep] = useState<'choice' | 'promote' | 'convert'>('choice');
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [projectData, setProjectData] = useState({
    title: jobData.title,
    description: jobData.description,
    requirements: jobData.requirements,
    timeline: '',
    budget: '',
    skills_required: [],
    project_type: 'recruitment'
  });

  const handlePromote = () => {
    setStep('promote');
    setShowPromoteModal(true);
  };

  const handleConvert = () => {
    setStep('convert');
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProject = {
      id: Date.now().toString(),
      ...projectData,
      created_at: new Date().toISOString(),
      status: 'active',
      candidates: []
    };

    onProjectCreated(newProject);
    onClose();
  };

  const handlePromoteComplete = () => {
    setShowPromoteModal(false);
    onClose();
  };

  if (!isOpen) return null;

  if (step === 'choice') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Job Posted Successfully!</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Your job "<strong>{jobData.title}</strong>" has been posted. What would you like to do next?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handlePromote}>
                <CardHeader className="text-center">
                  <Target className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <CardTitle>Promote Job</CardTitle>
                  <CardDescription>
                    Boost visibility and reach more qualified candidates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Featured placement</li>
                    <li>• Increased visibility</li>
                    <li>• More applications</li>
                    <li>• Analytics insights</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleConvert}>
                <CardHeader className="text-center">
                  <Briefcase className="h-12 w-12 text-purple-500 mx-auto mb-2" />
                  <CardTitle>Convert to Project</CardTitle>
                  <CardDescription>
                    Turn this job into a talent management project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Manage candidates</li>
                    <li>• Track progress</li>
                    <li>• Team collaboration</li>
                    <li>• Bulk actions</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 text-center">
              <Button variant="outline" onClick={onClose}>
                Skip for now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'convert') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Briefcase className="h-6 w-6 text-purple-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Convert to Project</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleProjectSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Title *
                  </label>
                  <Input
                    value={projectData.title}
                    onChange={(e) => setProjectData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Hiring Senior AI Engineers"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Description *
                  </label>
                  <Textarea
                    value={projectData.description}
                    onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    placeholder="Describe the project goals and requirements..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timeline
                    </label>
                    <Input
                      value={projectData.timeline}
                      onChange={(e) => setProjectData(prev => ({ ...prev, timeline: e.target.value }))}
                      placeholder="e.g., 3 months"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Budget Range
                    </label>
                    <Input
                      value={projectData.budget}
                      onChange={(e) => setProjectData(prev => ({ ...prev, budget: e.target.value }))}
                      placeholder="e.g., $50,000 - $100,000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Requirements & Criteria
                  </label>
                  <Textarea
                    value={projectData.requirements}
                    onChange={(e) => setProjectData(prev => ({ ...prev, requirements: e.target.value }))}
                    rows={3}
                    placeholder="List the key requirements and selection criteria..."
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Project Benefits:</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Centralized candidate management</li>
                    <li>• Team collaboration tools</li>
                    <li>• Progress tracking and analytics</li>
                    <li>• Bulk actions for efficiency</li>
                    <li>• Integration with messaging system</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setStep('choice')}>
                    Back
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showPromoteModal && (
        <PromoteContentModal
          isOpen={showPromoteModal}
          onClose={handlePromoteComplete}
          contentType="job"
          contentId={1}
          contentTitle={jobData.title}
        />
      )}
    </>
  );
};

export default ProjectConversionModal;