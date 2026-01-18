import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Link, Tag, DollarSign, Star, Send, Plus, Minus, FileText, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate } from 'react-router-dom';
import ChatDock from '../components/ChatDock';
import PremiumUpgradeModal from '../components/PremiumUpgradeModal';
import AuthModal from '../components/AuthModal';
import CsvImportModal from '../components/CsvImportModal';
import { detectLanguage } from '@/utils/languageDetection';

const SubmitTool: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategoryId: '', // Now stores the ID instead of name
    toolType: [],
    freePlan: 'No',
    website: '',
    logoUrl: '',
    pricing: 'free',
    tags: '',
    features: [''],
    logo: null as File | null,
    pros: [''],
    cons: [''],
    is_light_logo: false,
    is_dark_logo: false,
    showToolTypeDropdown: false
  });

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string>('');
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Cleanup effect for object URLs
  useEffect(() => {
    return () => {
      // Clean up object URLs when component unmounts
      if (formData.logo && formData.logo instanceof File) {
        URL.revokeObjectURL(formData.logo as any);
      }
    };
  }, [formData.logo]);

  // Fetch categories and sub-categories on component mount
  useEffect(() => {
    fetchCategories();
    if (isEditMode && id) {
      fetchToolData(id);
    }
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.tool-type-dropdown')) {
        setFormData(prev => ({ ...prev, showToolTypeDropdown: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      const { data: subCategoriesData, error: subCategoriesError } = await supabase
        .from('sub_categories')
        .select('*')
        .order('name');

      if (subCategoriesError) throw subCategoriesError;

      setCategories(categoriesData || []);
      setSubCategories(subCategoriesData || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to hardcoded categories if fetch fails
      setCategories([
        { id: '1', name: 'Conversational AI' },
        { id: '2', name: 'Image Generation' },
        { id: '3', name: 'Video AI' },
        { id: '4', name: 'Code Assistant' },
        { id: '5', name: 'Data Analysis' },
        { id: '6', name: 'Audio AI' },
        { id: '7', name: 'Writing & Content' },
        { id: '8', name: 'Productivity' }
      ]);
    }
  };

  const fetchToolData = async (toolId: string) => {
    try {
      const { data: tool, error } = await supabase
        .from('tools')
        .select('*')
        .eq('id', toolId)
        .single();

      if (error) throw error;

      // Fetch subcategory from junction table
      let subcategoryId = '';
      const { data: junctionData } = await supabase
        .from('tool_sub_categories')
        .select('sub_category_id')
        .eq('tool_id', toolId)
        .limit(1);
      
      if (junctionData && junctionData.length > 0) {
        subcategoryId = junctionData[0].sub_category_id;
      }

      if (tool) {
        setFormData({
          name: tool.name || '',
          description: tool.description || '',
          category: categories.find(cat => cat.id === tool.category_id)?.name || '',
          subcategoryId: subcategoryId,
          toolType: [],
          freePlan: tool.free_plan || 'No',
          website: tool.website || '',
          logoUrl: tool.logo_url || '',
          pricing: tool.pricing || 'free',
          tags: (tool.tags || []).join(','),
          features: tool.features || [''],
          logo: null,
          pros: tool.pros || [''],
          cons: tool.cons || [''],
          is_light_logo: tool.is_light_logo || false,
          is_dark_logo: tool.is_dark_logo || false,
          showToolTypeDropdown: false
        });
      }
    } catch (error) {
      console.error('Error fetching tool data:', error);
      toast({
        title: "Error",
        description: "Failed to load tool data.",
        variant: "destructive"
      });
    }
  };

  // Get filtered sub-categories based on selected category
  const getSubCategoriesForCategory = (categoryId: string) => {
    return subCategories.filter(sub => sub.category_id === categoryId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear subcategory when category changes
    if (name === 'category') {
      setFormData(prev => ({ ...prev, subcategoryId: '' }));
    }
    
    // Handle multiple tool types
    if (name === 'toolType' && e.target instanceof HTMLSelectElement) {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData(prev => ({ ...prev, toolType: selectedOptions }));
      return;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    // Clean up previous object URL to prevent memory leaks
    if (formData.logo && formData.logo instanceof File) {
      URL.revokeObjectURL(formData.logo as any);
    }
    
    setFormData(prev => ({ ...prev, logo: file }));
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setCsvError('');
      try {
        // const data = await parseCSVFile(file);
        const data: any[] = []; // Placeholder for CSV parsing
        setCsvData(data);
      } catch (error) {
        setCsvError('Error parsing CSV file. Please check the format.');
        setCsvData([]);
      }
    } else {
      setCsvError('Please select a valid CSV file.');
    }
  };

  const handleProsChange = (index: number, value: string) => {
    const newPros = [...formData.pros];
    newPros[index] = value;
    setFormData(prev => ({ ...prev, pros: newPros }));
  };

  const handleConsChange = (index: number, value: string) => {
    const newCons = [...formData.cons];
    newCons[index] = value;
    setFormData(prev => ({ ...prev, cons: newCons }));
  };

  const handleFeaturesChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addPro = () => {
    setFormData(prev => ({ ...prev, pros: [...prev.pros, ''] }));
  };

  const addCon = () => {
    setFormData(prev => ({ ...prev, cons: [...prev.cons, ''] }));
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removePro = (index: number) => {
    if (formData.pros.length > 1) {
      const newPros = formData.pros.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, pros: newPros }));
    }
  };

  const removeCon = (index: number) => {
    if (formData.cons.length > 1) {
      const newCons = formData.cons.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, cons: newCons }));
    }
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, features: newFeatures }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Current user:', user);
      console.log('User ID:', user?.id);
      
      // Check if user is authenticated
      if (!user || !user.id) {
        toast({
          title: t('common.error'),
          description: t('submitTool.validation.authRequired'),
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Check for duplicates only if creating new tool
      if (!isEditMode) {
        const { count } = await supabase
          .from('tools')
          .select('id', { count: 'exact', head: true })
          .ilike('name', formData.name)
          .ilike('website', formData.website);

        console.log('Duplicate check result:', count);

        if (count && count > 0) {
          toast({
            title: t('common.error'),
            description: t('submitTool.validation.duplicateDetected'),
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Filter out empty pros and cons
      const filteredPros = formData.pros.filter(pro => pro.trim());
      const filteredCons = formData.cons.filter(con => con.trim());
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      const featuresArray = formData.features.filter(feature => feature.trim());
      
      // Get the selected category ID
      const selectedCategory = categories.find(cat => cat.name === formData.category);
      
      // Validation
      if (!formData.subcategoryId) {
        toast({
          title: t('common.error'),
          description: t('submitTool.validation.subcategoryRequired'),
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      if (formData.toolType.length === 0) {
        toast({
          title: t('common.error'),
          description: t('submitTool.validation.toolTypeRequired'),
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Handle logo upload if present
      let logoUrl = formData.logoUrl;
      if (formData.logo) {
        try {
          const fileName = `${Date.now()}_${formData.logo.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('tool-logos')
            .upload(`${fileName}`, formData.logo);

          if (uploadError) {
            console.error('Logo upload error:', uploadError);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('tool-logos')
              .getPublicUrl(`${fileName}`);
            logoUrl = publicUrl;
          }
        } catch (uploadErr) {
          console.error('Logo upload failed:', uploadErr);
        }
      }

      // Detect language from description
      const detected_language = detectLanguage(formData.description);

      const submissionData = {
        name: formData.name,
        description: formData.description,
        website: formData.website,
        pricing: formData.pricing,
        free_plan: formData.freePlan,
        category_id: selectedCategory?.id || null,
        pros: filteredPros,
        cons: filteredCons,
        tags: tagsArray,
        features: featuresArray,
        is_light_logo: formData.is_light_logo,
        is_dark_logo: formData.is_dark_logo,
        logo_url: logoUrl,
        user_id: user?.id,
        status: 'pending',
        detected_language
      };
      
      console.log('Submitting tool data:', submissionData);
      
      let result;
      let insertedToolId: string | null = null;
      
      if (isEditMode && id) {
        // Update existing tool
        const { data: updateResult, error } = await supabase
          .from('tools')
          .update(submissionData)
          .eq('id', id)
          .select('*');
        result = { insertResult: updateResult, error };
        insertedToolId = id;
      } else {
        // Create new tool
        const { data: insertResult, error } = await supabase
          .from('tools')
          .insert(submissionData)
          .select('*');
        result = { insertResult, error };
        if (insertResult && insertResult.length > 0) {
          insertedToolId = insertResult[0].id;
        }
      }
      
      // Insert subcategory relationship
      if (!result.error && insertedToolId && formData.subcategoryId) {
        // Delete existing relationships first (for edit mode)
        if (isEditMode) {
          await supabase
            .from('tool_sub_categories')
            .delete()
            .eq('tool_id', insertedToolId);
        }
        
        // Insert new relationship
        await supabase
          .from('tool_sub_categories')
          .insert({
            tool_id: insertedToolId,
            sub_category_id: formData.subcategoryId
          });
      }

      console.log('Result:', result);

      if (result.error) {
        console.error(`Error ${isEditMode ? 'updating' : 'submitting'} tool:`, result.error);
        toast({
          title: `${isEditMode ? 'Update' : 'Submission'} Error`,
          description: `There was an error ${isEditMode ? 'updating' : 'submitting'} your tool: ${result.error.message}`,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: `Tool ${isEditMode ? 'Updated' : 'Submitted'} Successfully!`,
        description: isEditMode 
          ? "Your tool has been updated successfully."
          : "Your tool has been submitted for review and will be published once approved."
      });
      
      if (isEditMode) {
        navigate(`/tools/${id}`);
      } else {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Submission Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
    
    setIsSubmitting(false);
  };

  const handleCsvSubmit = async () => {
    if (csvFile && csvData.length > 0) {
      setIsProcessingCsv(true);
      
      // Add submitted by info to each tool
      const toolsWithSubmitter = csvData.map(tool => ({
        ...tool,
        submittedBy: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous'
      }));
      
      console.log('Submitting CSV tools:', toolsWithSubmitter);
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsProcessingCsv(false);
      setCsvFile(null);
      setCsvData([]);
      setSubmitted(true);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
      setFormData({
        name: '',
        description: '',
        category: '',
        subcategoryId: '',
        toolType: [],
        freePlan: 'No',
        website: '',
        logoUrl: '',
        pricing: 'free',
        tags: '',
        features: [''],
        logo: null,
        pros: [''],
        cons: [''],
        is_light_logo: false,
        is_dark_logo: false,
        showToolTypeDropdown: false
      });
    setCsvFile(null);
    setCsvData([]);
    setCsvError('');
    setShowCsvModal(false);
  };

  if (submitted) {
    return (
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('submitTool.successTitle')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('submitTool.successMessage')}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {t('toolDetails.submittedBy')}: {user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('toolDetails.anonymous')}
            </p>
            <button
              onClick={resetForm}
              className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
            >
              {t('submitTool.submitAnother')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking premium status
  if (!isEditMode && (isPremiumLoading || (user && isPremiumLoading))) {
    return (
      <div className="py-8 bg-background min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check authentication FIRST - show auth modal if not logged in
  if (!isEditMode && !user) {
    return (
      <>
        <AuthModal
          isOpen={true}
          onClose={() => navigate(-1)}
          initialMode="signin"
        />
        <div className="py-8 bg-background min-h-screen" />
      </>
    );
  }

  // Then check premium status - show premium upgrade modal for non-premium users (except in edit mode)
  if (!isEditMode && !isPremium) {
    return (
      <>
        <PremiumUpgradeModal
          isOpen={true}
          onClose={() => navigate(-1)}
          featureName={t('premium.features.submitTools', 'Tool Submission')}
          trigger="premium_feature"
        />
        <div className="py-8 bg-background min-h-screen" />
      </>
    );
  }

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {isEditMode ? t('submitTool.editTitle') : t('submitTool.title')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('submitTool.subtitle')}
          </p>
        </div>

        {/* Submission Mode Toggle - Hide in edit mode */}
        {!isEditMode && (
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('submitTool.chooseMethod')}</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium bg-gradient-primary text-white shadow-md">
              <FileText className="h-5 w-5" />
              <span>{t('submitTool.singleToolForm')}</span>
            </div>
            <button
              onClick={() => setShowCsvModal(true)}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-colors bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 border border-secondary/20"
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span>{t('submitTool.bulkImport', 'Bulk Import')}</span>
            </button>
          </div>
        </div>
        )}

        {/* Individual Tool Form */}
        <form 
          onSubmit={handleFormSubmit} 
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              e.preventDefault();
            }
          }}
          className="bg-white dark:bg-card rounded-2xl shadow-sm p-8"
        >
          {/* Tool Name */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('submitTool.form.name')} *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800"
              placeholder={t('submitTool.form.namePlaceholder')}
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('submitTool.form.description')} *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white dark:bg-slate-800"
              placeholder={t('submitTool.form.descriptionPlaceholder')}
            />
          </div>

          {/* Category, Subcategory & Tool Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 appearance-none"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'><path fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /></svg>")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="subcategoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subcategory *
              </label>
              <select
                id="subcategoryId"
                name="subcategoryId"
                value={formData.subcategoryId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800"
                disabled={!formData.category}
              >
                <option value="">Select subcategory</option>
                {formData.category && categories.find(c => c.name === formData.category) && 
                  getSubCategoriesForCategory(categories.find(c => c.name === formData.category)?.id).map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))
                }
              </select>
            </div>
            <div className="relative tool-type-dropdown">
              <label htmlFor="toolType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tool Type *
              </label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, showToolTypeDropdown: !prev.showToolTypeDropdown }))}
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-left flex justify-between items-center"
              >
                <span className="truncate">
                  {formData.toolType.length > 0 ? formData.toolType.join(', ') : 'Select tool types'}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {formData.showToolTypeDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {['Web App', 'Desktop App', 'Mobile App', 'Chrome Extension', 'VS Code Extension', 'API', 'CLI Tool', 'Plugin'].map((type) => (
                    <label key={type} className="flex items-center px-4 py-2 hover:bg-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.toolType.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, toolType: [...prev.toolType, type] }));
                          } else {
                            setFormData(prev => ({ ...prev, toolType: prev.toolType.filter(t => t !== type) }));
                          }
                        }}
                        className="mr-2"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Free Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="pricing" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pricing Model
              </label>
              <select
                id="pricing"
                name="pricing"
                value={formData.pricing}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800"
              >
                <option value="free">Free</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Paid</option>
                <option value="contact">Contact for Pricing</option>
              </select>
            </div>
            <div>
              <label htmlFor="freePlan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Free Plan Available?
              </label>
              <select
                id="freePlan"
                name="freePlan"
                value={formData.freePlan}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          {/* Website */}
          <div className="mb-6">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('submitTool.form.website')} *
            </label>
            <div className="relative">
              <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                required
                className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('submitTool.form.logo')}
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors bg-white dark:bg-slate-800"
                >
                  <Upload className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {formData.logo ? formData.logo.name : t('submitTool.form.uploadLogo')}
                  </span>
                </label>
              </div>
              {(formData.logo || formData.logoUrl) && (
                <div className="w-16 h-16 border rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                  <img 
                    src={formData.logo ? URL.createObjectURL(formData.logo) : formData.logoUrl} 
                    alt="Logo preview" 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Pros */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('submitTool.form.pros')}
            </label>
            {formData.pros.map((pro, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={pro}
                  onChange={(e) => handleProsChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, addPro)}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800"
                  placeholder={`Pro ${index + 1}`}
                />
                {formData.pros.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePro(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addPro}
              className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm mt-2"
            >
              <Plus className="h-4 w-4" />
              <span>{t('submitTool.form.addPro')}</span>
            </button>
          </div>

          {/* Cons */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('submitTool.form.cons')}
            </label>
            {formData.cons.map((con, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={con}
                  onChange={(e) => handleConsChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, addCon)}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800"
                  placeholder={`Con ${index + 1}`}
                />
                {formData.cons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCon(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addCon}
              className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm mt-2"
            >
              <Plus className="h-4 w-4" />
              <span>{t('submitTool.form.addCon')}</span>
            </button>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('submitTool.form.tags')}
            </label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800"
                placeholder={t('submitTool.form.tagsPlaceholder')}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('submitTool.form.tagsHint')}
            </p>
          </div>

          {/* Features */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('submitTool.form.features')}
            </label>
            {formData.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeaturesChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, addFeature)}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800"
                  placeholder={`Feature ${index + 1}`}
                />
                {formData.features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addFeature}
              className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm mt-2"
            >
              <Plus className="h-4 w-4" />
              <span>{t('submitTool.form.addFeature')}</span>
            </button>
          </div>

          {/* Logo Type Selection */}
          <div className="mb-6 p-4 bg-muted/50 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Logo Visibility Settings
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_light_logo"
                  name="is_light_logo"
                  checked={formData.is_light_logo}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_light_logo: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_light_logo" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Logo is primarily light/white (will be inverted in dark mode)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_dark_logo"
                  name="is_dark_logo"
                  checked={formData.is_dark_logo}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_dark_logo: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_dark_logo" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Logo is primarily dark/black (will be inverted in light mode)
                </label>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Check the appropriate option to ensure your logo displays correctly in both light and dark themes
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-primary text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>{isEditMode ? 'Update Tool' : 'Submit Tool for Review'}</span>
              </>
            )}
          </button>

          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
            By submitting, you agree that the information is accurate and you have the right to share this tool.
          </p>
        </form>

        {/* CSV Import Modal */}
        <CsvImportModal
          isOpen={showCsvModal}
          onClose={() => setShowCsvModal(false)}
          onCsvSelect={(file, data) => {
            setCsvFile(file);
            setCsvData(data);
            setCsvError('');
          }}
          onSubmit={handleCsvSubmit}
          csvFile={csvFile}
          csvData={csvData}
          csvError={csvError}
          isProcessing={isProcessingCsv}
        />
      </div>

      {/* Chat Dock */}
      <ChatDock />
    </div>
  );
};

export default SubmitTool;