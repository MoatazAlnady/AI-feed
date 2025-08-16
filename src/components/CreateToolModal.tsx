import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Save } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  description?: string;
}

interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  color: string;
  description?: string;
}

interface CreateToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToolCreated?: () => void;
}

const CreateToolModal: React.FC<CreateToolModalProps> = ({ isOpen, onClose, onToolCreated }) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    pricing: 'free',
    category_id: '',
    sub_category_ids: [] as string[],
    features: [''],
    pros: [''],
    cons: [''],
    tags: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch sub-categories
      const { data: subCategoriesData, error: subCategoriesError } = await supabase
        .from('sub_categories')
        .select('*')
        .order('name');
      
      if (subCategoriesError) throw subCategoriesError;
      setSubCategories(subCategoriesData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load categories and sub-categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      website: '',
      pricing: 'free',
      category_id: '',
      sub_category_ids: [],
      features: [''],
      pros: [''],
      cons: [''],
      tags: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (index: number, value: string, field: 'features' | 'pros' | 'cons') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'features' | 'pros' | 'cons') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (index: number, field: 'features' | 'pros' | 'cons') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubCategoryToggle = (subCategoryId: string) => {
    setFormData(prev => ({
      ...prev,
      sub_category_ids: prev.sub_category_ids.includes(subCategoryId)
        ? prev.sub_category_ids.filter(id => id !== subCategoryId)
        : [...prev.sub_category_ids, subCategoryId]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.website.trim() || !formData.category_id) {
      toast({
        title: "Validation Error",
        description: "Name, description, website, and category are required",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicates by name or website
    try {
      const { data: existingTools, error: checkError } = await supabase
        .from('tools')
        .select('id, name, website')
        .or(`name.ilike.%${formData.name.trim()}%,website.eq.${formData.website.trim()}`);

      if (checkError) throw checkError;

      if (existingTools && existingTools.length > 0) {
        const duplicate = existingTools.find(
          tool => 
            tool.name.toLowerCase() === formData.name.trim().toLowerCase() ||
            tool.website === formData.website.trim()
        );

        if (duplicate) {
          toast({
            title: "Duplicate Tool Detected",
            description: `A tool with this ${duplicate.name.toLowerCase() === formData.name.trim().toLowerCase() ? 'name' : 'website'} already exists`,
            variant: "destructive"
          });
          return;
        }
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
    }

    try {
      setLoading(true);

      // Parse tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Filter out empty array items
      const features = formData.features.filter(item => item.trim().length > 0);
      const pros = formData.pros.filter(item => item.trim().length > 0);
      const cons = formData.cons.filter(item => item.trim().length > 0);

      const toolData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        website: formData.website.trim(),
        pricing: formData.pricing,
        category_id: formData.category_id,
        sub_category_ids: formData.sub_category_ids,
        features,
        pros,
        cons,
        tags,
        status: 'published'
      };

      const { error } = await supabase
        .from('tools')
        .insert(toolData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tool created successfully"
      });

      resetForm();
      onClose();
      onToolCreated?.();
    } catch (error: any) {
      console.error('Error creating tool:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create tool",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const availableSubCategories = subCategories.filter(sub => sub.category_id === formData.category_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New AI Tool</DialogTitle>
          <DialogDescription>
            Add a new AI tool to the directory with proper categorization
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={(e) => e.preventDefault()} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tool Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter tool name"
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                />
              </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this tool does"
                rows={3}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
            </div>
            
            <div>
              <Label htmlFor="website">Website URL *</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
                type="url"
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
            </div>
            
            <div>
              <Label htmlFor="pricing">Pricing Model</Label>
              <Select value={formData.pricing} onValueChange={(value) => handleInputChange('pricing', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pricing model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="freemium">Freemium</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="AI, machine learning, automation"
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
            </div>
           </div>

          {/* Categories and Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category * (Single Choice)</Label>
              <Select value={formData.category_id} onValueChange={(value) => {
                handleInputChange('category_id', value);
                setFormData(prev => ({ ...prev, sub_category_ids: [] })); // Reset sub-categories when category changes
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.category_id && availableSubCategories.length > 0 && (
              <div>
                <Label>Sub-Categories (Multiple Choice)</Label>
                <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                  {availableSubCategories.map((subCategory) => (
                    <div key={subCategory.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sub-${subCategory.id}`}
                        checked={formData.sub_category_ids.includes(subCategory.id)}
                        onCheckedChange={() => handleSubCategoryToggle(subCategory.id)}
                      />
                      <label htmlFor={`sub-${subCategory.id}`} className="flex items-center gap-2 text-sm cursor-pointer">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: subCategory.color }}
                        />
                        {subCategory.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Features</Label>
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={feature}
                    onChange={(e) => handleArrayChange(index, e.target.value, 'features')}
                    placeholder="Enter a feature"
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  />
                  {formData.features.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem(index, 'features')}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('features')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Feature
              </Button>
            </div>

            <div>
              <Label>Pros</Label>
              {formData.pros.map((pro, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={pro}
                    onChange={(e) => handleArrayChange(index, e.target.value, 'pros')}
                    placeholder="Enter a pro"
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  />
                  {formData.pros.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem(index, 'pros')}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('pros')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Pro
              </Button>
            </div>

            <div>
              <Label>Cons</Label>
              {formData.cons.map((con, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={con}
                    onChange={(e) => handleArrayChange(index, e.target.value, 'cons')}
                    placeholder="Enter a con"
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  />
                  {formData.cons.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem(index, 'cons')}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('cons')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Con
              </Button>
            </div>
          </div>
        </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} variant="gradient">
            {loading ? 'Creating...' : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Tool
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateToolModal;