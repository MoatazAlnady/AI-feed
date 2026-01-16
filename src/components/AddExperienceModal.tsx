import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString());

const employmentTypes = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
];

const skillOptions = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Machine Learning',
  'Deep Learning', 'Data Science', 'AI', 'Cloud Computing', 'AWS', 'Azure',
  'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'Product Management', 'UX Design',
  'Project Management', 'Data Analysis', 'Marketing', 'Sales', 'Business Development',
  'Content Writing', 'Graphic Design', 'Video Editing', 'SEO', 'Social Media',
  'Java', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'TensorFlow',
  'PyTorch', 'NLP', 'Computer Vision', 'DevOps', 'CI/CD', 'Agile', 'Scrum'
];

export interface UserExperience {
  id?: string;
  user_id?: string;
  job_title: string;
  company: string;
  company_logo_url?: string | null;
  location?: string | null;
  employment_type?: string | null;
  start_month?: number | null;
  start_year: number;
  end_month?: number | null;
  end_year?: number | null;
  is_current?: boolean;
  description?: string | null;
  skills_used?: string[] | null;
  display_order?: number;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

interface AddExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience?: UserExperience | null;
  onSave: (experience: Omit<UserExperience, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const AddExperienceModal: React.FC<AddExperienceModalProps> = ({
  isOpen,
  onClose,
  experience,
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    job_title: '',
    company: '',
    location: '',
    employment_type: 'full-time',
    start_month: '',
    start_year: '',
    end_month: '',
    end_year: '',
    is_current: false,
    description: '',
    skills_used: [] as string[]
  });

  useEffect(() => {
    if (experience) {
      setFormData({
        job_title: experience.job_title || '',
        company: experience.company || '',
        location: experience.location || '',
        employment_type: experience.employment_type || 'full-time',
        start_month: experience.start_month?.toString() || '',
        start_year: experience.start_year?.toString() || '',
        end_month: experience.end_month?.toString() || '',
        end_year: experience.end_year?.toString() || '',
        is_current: experience.is_current || false,
        description: experience.description || '',
        skills_used: experience.skills_used || []
      });
    } else {
      setFormData({
        job_title: '',
        company: '',
        location: '',
        employment_type: 'full-time',
        start_month: '',
        start_year: '',
        end_month: '',
        end_year: '',
        is_current: false,
        description: '',
        skills_used: []
      });
    }
  }, [experience, isOpen]);

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills_used: prev.skills_used.includes(skill)
        ? prev.skills_used.filter(s => s !== skill)
        : [...prev.skills_used, skill]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.job_title.trim() || !formData.company.trim() || !formData.start_year) {
      return;
    }

    setLoading(true);
    try {
      await onSave({
        job_title: formData.job_title.trim(),
        company: formData.company.trim(),
        location: formData.location.trim() || null,
        employment_type: formData.employment_type,
        start_month: formData.start_month ? parseInt(formData.start_month) : null,
        start_year: parseInt(formData.start_year),
        end_month: formData.is_current ? null : (formData.end_month ? parseInt(formData.end_month) : null),
        end_year: formData.is_current ? null : (formData.end_year ? parseInt(formData.end_year) : null),
        is_current: formData.is_current,
        description: formData.description.trim() || null,
        skills_used: formData.skills_used.length > 0 ? formData.skills_used : null,
        source: experience?.source || 'manual'
      });
      onClose();
    } catch (error) {
      console.error('Error saving experience:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {experience ? 'Edit Experience' : 'Add Experience'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="job_title">Job Title *</Label>
            <Input
              id="job_title"
              value={formData.job_title}
              onChange={(e) => setFormData(p => ({ ...p, job_title: e.target.value }))}
              placeholder="e.g. Senior Software Engineer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))}
              placeholder="e.g. Google"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
              placeholder="e.g. San Francisco, CA"
            />
          </div>

          <div className="space-y-2">
            <Label>Employment Type</Label>
            <Select
              value={formData.employment_type}
              onValueChange={(v) => setFormData(p => ({ ...p, employment_type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {employmentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_current"
              checked={formData.is_current}
              onCheckedChange={(c) => setFormData(p => ({
                ...p,
                is_current: !!c,
                end_month: c ? '' : p.end_month,
                end_year: c ? '' : p.end_year
              }))}
            />
            <Label htmlFor="is_current" className="cursor-pointer">I currently work here</Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Month</Label>
              <Select
                value={formData.start_month}
                onValueChange={(v) => setFormData(p => ({ ...p, start_month: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Year *</Label>
              <Select
                value={formData.start_year}
                onValueChange={(v) => setFormData(p => ({ ...p, start_year: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!formData.is_current && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>End Month</Label>
                <Select
                  value={formData.end_month}
                  onValueChange={(v) => setFormData(p => ({ ...p, end_month: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Year</Label>
                <Select
                  value={formData.end_year}
                  onValueChange={(v) => setFormData(p => ({ ...p, end_year: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe your responsibilities and achievements..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Skills Used</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
              {skillOptions.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={cn(
                    "px-3 py-1 text-sm rounded-full border transition-colors",
                    formData.skills_used.includes(skill)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-border hover:bg-muted/80"
                  )}
                >
                  {skill}
                </button>
              ))}
            </div>
            {formData.skills_used.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-muted-foreground">Selected: </span>
                {formData.skills_used.map(skill => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !formData.job_title.trim() || !formData.company.trim() || !formData.start_year}
          >
            {loading ? 'Saving...' : (experience ? 'Save Changes' : 'Add Experience')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddExperienceModal;
