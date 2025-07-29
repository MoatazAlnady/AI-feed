import React, { useState, useEffect } from 'react';
import { Upload, Link, Tag, DollarSign, Star, Send, Plus, Minus, Download, FileText, AlertCircle } from 'lucide-react';
import { generateCSVTemplate } from '../utils/csvTemplate';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SubmitTool: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [submissionMode, setSubmissionMode] = useState<'form' | 'csv'>('form');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    toolType: [],
    freePlan: 'No',
    website: '',
    logoUrl: '',
    pricing: 'free',
    tags: '',
    features: '',
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

  // Fetch categories and sub-categories on component mount
  useEffect(() => {
    fetchCategories();
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

  // Get filtered sub-categories based on selected category
  const getSubCategoriesForCategory = (categoryId: string) => {
    return subCategories.filter(sub => sub.category_id === categoryId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear subcategory when category changes
    if (name === 'category') {
      setFormData(prev => ({ ...prev, subcategory: '' }));
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

  const addPro = () => {
    setFormData(prev => ({ ...prev, pros: [...prev.pros, ''] }));
  };

  const removePro = (index: number) => {
    if (formData.pros.length > 1) {
      const newPros = formData.pros.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, pros: newPros }));
    }
  };

  const addCon = () => {
    setFormData(prev => ({ ...prev, cons: [...prev.cons, ''] }));
  };

  const removeCon = (index: number) => {
    if (formData.cons.length > 1) {
      const newCons = formData.cons.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, cons: newCons }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Check for duplicates first
      const { count } = await supabase
        .from('tools')
        .select('id', { count: 'exact', head: true })
        .ilike('name', formData.name)
        .ilike('website', formData.website);

      if (count && count > 0) {
        toast({
          title: "Duplicate Tool Detected",
          description: "A tool with this name and website already exists in our database.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Filter out empty pros and cons
      const filteredPros = formData.pros.filter(pro => pro.trim());
      const filteredCons = formData.cons.filter(con => con.trim());
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      const featuresArray = formData.features.split(',').map(feature => feature.trim()).filter(Boolean);
      
      const submissionData = {
        name: formData.name,
        description: formData.description,
        website: formData.website,
        pricing: formData.pricing,
        subcategory: formData.subcategory,
        pros: filteredPros,
        cons: filteredCons,
        tags: tagsArray,
        features: featuresArray,
        is_light_logo: formData.is_light_logo,
        is_dark_logo: formData.is_dark_logo,
        user_id: user?.id,
        status: 'pending'
      };
      
      const { error } = await supabase
        .from('tools')
        .insert(submissionData);

      if (error) {
        console.error('Error submitting tool:', error);
        toast({
          title: "Submission Error",
          description: "There was an error submitting your tool. Please try again.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Tool Submitted Successfully!",
        description: "Your tool has been submitted for review and will be published once approved."
      });
      
      setSubmitted(true);
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
        subcategory: '',
        toolType: [],
        freePlan: 'No',
        website: '',
        logoUrl: '',
        pricing: 'free',
        tags: '',
        features: '',
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
    setSubmissionMode('form');
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
              {submissionMode === 'csv' ? 'Tools' : 'Tool'} Submitted Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for submitting {submissionMode === 'csv' ? `${csvData.length} AI tools` : 'your AI tool'}. 
              Our team will review {submissionMode === 'csv' ? 'them' : 'it'} within 24-48 hours. 
              Once approved, {submissionMode === 'csv' ? 'they' : 'it'} will be featured in our directory and included in our newsletter.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Posted by: {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous'}
            </p>
            <button
              onClick={resetForm}
              className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
            >
              Submit More Tools
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Submit AI Tools
          </h1>
          <p className="text-xl text-gray-600">
            Share amazing AI tools with our community. Submit individual tools or upload multiple tools via CSV.
          </p>
        </div>

        {/* Submission Mode Toggle */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Submission Method</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => setSubmissionMode('form')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                submissionMode === 'form'
                  ? 'bg-gradient-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Single Tool Form</span>
            </button>
            <button
              onClick={() => setSubmissionMode('csv')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                submissionMode === 'csv'
                  ? 'bg-gradient-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <Upload className="h-5 w-5" />
              <span>CSV Upload</span>
            </button>
          </div>
        </div>

        {submissionMode === 'form' ? (
          /* Individual Tool Form */
          <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl shadow-sm p-8">
            {/* Tool Name */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Tool Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter the AI tool name"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Describe what this AI tool does and its main features"
              />
            </div>

            {/* Category, Subcategory & Tool Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white appearance-none"
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
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <select
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={!formData.category}
                >
                  <option value="">Select a subcategory</option>
                  {formData.category && getSubCategoriesForCategory(
                    categories.find(cat => cat.name === formData.category)?.id || ''
                  ).map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.name}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tool Type
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, showToolTypeDropdown: !prev.showToolTypeDropdown }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-left flex items-center justify-between"
                  >
                    <span className="text-gray-900">
                      {formData.toolType.length > 0 ? `${formData.toolType.length} selected` : 'Select tool types'}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {formData.showToolTypeDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg">
                      {['Web App', 'Desktop App', 'Mobile App', 'API', 'Browser Extension', 'Plugin', 'Cloud Service', 'Library/Framework'].map((type) => (
                        <label key={type} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.toolType.includes(type)}
                            onChange={(e) => {
                              const newTypes = e.target.checked 
                                ? [...formData.toolType, type]
                                : formData.toolType.filter(t => t !== type);
                              setFormData(prev => ({ ...prev, toolType: newTypes }));
                            }}
                            className="mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-gray-900">{type}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Free Plan/Credits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Free Plan / Free Credits Available? *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="freePlan"
                      value="Yes"
                      checked={formData.freePlan === 'Yes'}
                      onChange={handleInputChange}
                      className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="freePlan"
                      value="No"
                      checked={formData.freePlan === 'No'}
                      onChange={handleInputChange}
                      className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">No</span>
                  </label>
                </div>
              </div>
              <div></div>
            </div>

            {/* Website URL */}
            <div className="mb-6">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL *
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Logo URL */}
            <div className="mb-6">
              <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL (Optional)
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  id="logoUrl"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-6">
              <label htmlFor="pricing" className="block text-sm font-medium text-gray-700 mb-2">
                Pricing Model *
              </label>
              <select
                id="pricing"
                name="pricing"
                value={formData.pricing}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pros
                </label>
                <div className="space-y-2">
                  {formData.pros.map((pro, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={pro}
                        onChange={(e) => handleProsChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter a positive aspect"
                      />
                      {formData.pros.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePro(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPro}
                    className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Add Pro</span>
                  </button>
                </div>
              </div>

              {/* Cons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cons
                </label>
                <div className="space-y-2">
                  {formData.cons.map((con, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={con}
                        onChange={(e) => handleConsChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter a limitation or drawback"
                      />
                      {formData.cons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCon(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCon}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Add Con</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="AI, Machine Learning, NLP (comma separated)"
                />
              </div>
            </div>

            {/* Key Features */}
            <div className="mb-6">
              <label htmlFor="features" className="block text-sm font-medium text-gray-700 mb-2">
                Key Features
              </label>
              <textarea
                id="features"
                name="features"
                value={formData.features}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="List the main features and capabilities"
              />
            </div>

            {/* Logo Upload */}
            <div className="mb-6">
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
                Tool Logo/Screenshot
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG up to 2MB
                </p>
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="logo"
                  className="mt-2 inline-block bg-primary-50 text-primary-600 px-4 py-2 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors"
                >
                  Choose File
                </label>
                {formData.logo && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {formData.logo.name}
                  </p>
                )}
              </div>
            </div>

            {/* Logo Detection Options */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Logo Characteristics (for dark/light theme compatibility)
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_light_logo"
                    checked={formData.is_light_logo}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_light_logo: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_light_logo" className="ml-2 text-sm text-gray-600">
                    Logo is primarily light/white (will be inverted in dark mode)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_dark_logo"
                    checked={formData.is_dark_logo}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_dark_logo: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_dark_logo" className="ml-2 text-sm text-gray-600">
                    Logo is primarily dark/black (will be inverted in light mode)
                  </label>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
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
                  <span>Submit Tool for Review</span>
                </>
              )}
            </button>

            <p className="text-sm text-gray-500 text-center mt-4">
              By submitting, you agree that the information is accurate and you have the right to share this tool.
            </p>
          </form>
        ) : (
          /* CSV Upload Section */
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Download Template */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Download CSV Template</h3>
                <div className="border border-gray-200 rounded-xl p-6 text-center">
                  <Download className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-4">
                    Download the CSV template with sample data and proper formatting
                  </p>
                   <button
                    onClick={() => {
                      const csvContent = generateCSVTemplate();
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'tools-template.csv';
                      a.click();
                      window.URL.revokeObjectURL(url);
                    }}
                    className="bg-secondary-500 text-white px-6 py-2 rounded-lg hover:bg-secondary-600 transition-colors"
                  >
                    Download Template
                  </button>
                </div>
              </div>

              {/* Upload CSV */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Your CSV File</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload CSV file to add multiple tools
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Use the template format for best results
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="inline-block bg-primary-50 text-primary-600 px-4 py-2 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors"
                  >
                    Choose CSV File
                  </label>
                  
                  {csvError && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                      {csvError}
                    </div>
                  )}
                  
                  {csvFile && !csvError && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Selected: {csvFile.name}
                      </p>
                      <p className="text-sm text-green-600 mb-3">
                        ✓ Found {csvData.length} valid tools
                      </p>
                      <button
                        onClick={handleCsvSubmit}
                        disabled={isProcessingCsv}
                        className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                      >
                        {isProcessingCsv ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span>Submit {csvData.length} Tools</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CSV Format Guide */}
            <div className="p-6 bg-gray-50 rounded-xl">
              <h4 className="font-medium text-gray-900 mb-4">CSV Format Guide</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Required Columns:</h5>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Category</li>
                    <li>• Subcategory</li>
                    <li>• Tool Name</li>
                    <li>• Link</li>
                    <li>• Tool Description</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Optional Columns:</h5>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Pricing</li>
                    <li>• Pros (separate with semicolons)</li>
                    <li>• Cons (separate with semicolons)</li>
                    <li>• Tags (separate with commas)</li>
                    <li>• Features (separate with semicolons)</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Tip:</strong> Use semicolons (;) to separate multiple pros/cons/features, and commas (,) to separate tags.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmitTool;