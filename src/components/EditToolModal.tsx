import React, { useState, useEffect } from 'react';
import { X, Link, Tag, DollarSign, Plus, Minus, Send, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface EditToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolId: number | string;
  onToolUpdated?: () => void;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  category_id: string;
  sub_category_ids: string[];
  website: string;
  pricing: string;
  features: string[];
  pros: string[];
  cons: string[];
  tags: string[];
}

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

const EditToolModal: React.FC<EditToolModalProps> = ({ isOpen, onClose, toolId, onToolUpdated }) => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tool, setTool] = useState<Tool | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    sub_category_ids: [] as string[],
    website: '',
    pricing: 'free',
    features: [''],
    pros: [''],
    cons: [''],
    tags: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && toolId) {
      fetchToolData();
      fetchCategories();
    }
  }, [isOpen, toolId]);

  useEffect(() => {
    if (isOpen && toolId) {
      fetchSubCategories();
    }
  }, [isOpen, toolId]);

  const fetchToolData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('id', String(toolId))
        .single();

      if (error) throw error;
      
      // Fetch sub-categories from junction table
      let subCategoryIds: string[] = [];
      const { data: junctionData } = await supabase
        .from('tool_sub_categories')
        .select('sub_category_id')
        .eq('tool_id', String(toolId));
      
      if (junctionData) {
        subCategoryIds = junctionData.map(item => item.sub_category_id);
      }
      
      if (data) {
        setTool(data);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          category_id: data.category_id || '',
          sub_category_ids: subCategoryIds,
          website: data.website || '',
          pricing: data.pricing || 'free',
          features: data.features?.length ? data.features : [''],
          pros: data.pros?.length ? data.pros : [''],
          cons: data.cons?.length ? data.cons : [''],
          tags: data.tags?.join(', ') || ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching tool:', error);
      setError('Failed to load tool data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) {
        setCategories(data);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('sub_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) {
        setSubCategories(data);
      }
    } catch (error: any) {
      console.error('Error fetching sub-categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (index: number, value: string, field: 'pros' | 'cons' | 'features') => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: 'pros' | 'cons' | 'features') => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayItem = (index: number, field: 'pros' | 'cons' | 'features') => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, [field]: newArray }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Parse tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);

      // Filter out empty items from arrays
      const filteredPros = formData.pros.filter(item => item.trim());
      const filteredCons = formData.cons.filter(item => item.trim());
      const filteredFeatures = formData.features.filter(item => item.trim());

      const updateData = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        website: formData.website,
        pricing: formData.pricing,
        features: filteredFeatures,
        pros: filteredPros,
        cons: filteredCons,
        tags: tagsArray
      };

      if (isAdmin) {
        // Admin can directly update the tool
        const { error } = await supabase
          .from('tools')
          .update(updateData)
          .eq('id', String(toolId));

        if (error) throw error;
        
        // Update sub-categories in junction table
        // First delete existing relationships
        await supabase
          .from('tool_sub_categories')
          .delete()
          .eq('tool_id', String(toolId));
        
        // Then insert new relationships
        if (formData.sub_category_ids.length > 0) {
          await supabase
            .from('tool_sub_categories')
            .insert(
              formData.sub_category_ids.map(subCatId => ({
                tool_id: String(toolId),
                sub_category_id: subCatId
              }))
            );
        }
        
        setSuccess('Tool updated successfully!');
        if (onToolUpdated) onToolUpdated();
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // Regular users create an edit request
        const { error } = await supabase.rpc('create_tool_edit_request', {
          tool_id_param: String(toolId),
          name_param: formData.name,
          description_param: formData.description,
          category_id_param: formData.category_id,
          subcategory_param: formData.sub_category_ids.join(','),
          website_param: formData.website,
          pricing_param: formData.pricing,
          features_param: filteredFeatures,
          pros_param: filteredPros,
          cons_param: filteredCons,
          tags_param: tagsArray
        });

        if (error) throw error;
        setSuccess('Edit request submitted successfully! An admin will review your changes.');
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error updating tool:', error);
      setError(error.message || 'Failed to update tool');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {isAdmin ? 'Edit Tool' : 'Suggest Edits'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 rounded-lg flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  {success}
                </div>
              )}

              {!isAdmin && (
                <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <p className="text-primary">
                    Your edit suggestions will be reviewed by an admin before being applied. You'll receive a notification once your request has been processed.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Tool Name */}
                <div className="mb-6">
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Tool Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    placeholder="Enter the AI tool name"
                  />
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Describe what this AI tool does and its main features"
                  />
                </div>

                {/* Category & Subcategory */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      id="category_id"
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sub-categories (Multiple Choice)
                    </label>
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                      {subCategories
                        .filter(sub => sub.category_id === formData.category_id)
                        .map((subCategory) => (
                        <div key={subCategory.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`sub-${subCategory.id}`}
                            checked={formData.sub_category_ids.includes(subCategory.id)}
                            onChange={() => {
                              const newIds = formData.sub_category_ids.includes(subCategory.id)
                                ? formData.sub_category_ids.filter(id => id !== subCategory.id)
                                : [...formData.sub_category_ids, subCategory.id];
                              setFormData(prev => ({ ...prev, sub_category_ids: newIds }));
                            }}
                          />
                          <label htmlFor={`sub-${subCategory.id}`} className="text-sm cursor-pointer">
                            {subCategory.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Website URL */}
                <div className="mb-6">
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website URL *
                  </label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-6">
                  <label htmlFor="pricing" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pricing Model *
                  </label>
                  <select
                    id="pricing"
                    name="pricing"
                    value={formData.pricing}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="free">Free</option>
                    <option value="freemium">Freemium</option>
                    <option value="paid">Paid</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>

                {/* Pros and Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Pros */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pros
                    </label>
                    <div className="space-y-2">
                      {formData.pros.map((pro, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={pro}
                            onChange={(e) => handleArrayChange(index, e.target.value, 'pros')}
                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter a positive aspect"
                          />
                          {formData.pros.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayItem(index, 'pros')}
                              className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('pros')}
                        className="flex items-center space-x-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm">Add Pro</span>
                      </button>
                    </div>
                  </div>

                  {/* Cons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cons
                    </label>
                    <div className="space-y-2">
                      {formData.cons.map((con, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={con}
                            onChange={(e) => handleArrayChange(index, e.target.value, 'cons')}
                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter a limitation or drawback"
                          />
                          {formData.cons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayItem(index, 'cons')}
                              className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('cons')}
                        className="flex items-center space-x-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm">Add Con</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Key Features
                  </label>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleArrayChange(index, e.target.value, 'features')}
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Enter a key feature"
                        />
                        {formData.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem(index, 'features')}
                            className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('features')}
                      className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">Add Feature</span>
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-6">
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="AI, Machine Learning, NLP (comma separated)"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{isAdmin ? 'Updating...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>{isAdmin ? 'Update Tool' : 'Submit Edit Request'}</span>
                    </>
                  )}
                </button>

                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
                  {isAdmin 
                    ? 'Changes will be applied immediately.' 
                    : 'Your edit request will be reviewed by an admin before being applied.'}
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditToolModal;