import React, { useState } from 'react';
import { X, Plus, Minus, Check, AlertCircle, ExternalLink, Search, Filter } from 'lucide-react';

interface Tool {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  website: string;
  pricing: string;
  pros: string[];
  cons: string[];
  rating: number;
  image: string;
  tags: string[];
  features: string[];
}

interface ToolComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTool?: Tool;
}

const ToolComparisonModal: React.FC<ToolComparisonModalProps> = ({ isOpen, onClose, initialTool }) => {
  const [selectedTools, setSelectedTools] = useState<Tool[]>(initialTool ? [initialTool] : []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');

  // Mock tools data - in real app, this would come from your database
  const availableTools: Tool[] = [
    {
      id: 1,
      name: 'ChatGPT',
      category: 'Conversational AI',
      subcategory: 'Text Generation',
      description: 'Advanced conversational AI for various tasks including writing, coding, and analysis.',
      website: 'https://chat.openai.com',
      pricing: 'Freemium',
      pros: ['Excellent text generation', 'Wide range of capabilities', 'Regular updates', 'Large knowledge base'],
      cons: ['Can hallucinate information', 'Limited real-time data', 'Usage limits on free tier'],
      rating: 4.8,
      image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['AI', 'Chatbot', 'Writing', 'Coding'],
      features: ['Text generation', 'Code assistance', 'Language translation', 'Creative writing']
    },
    {
      id: 2,
      name: 'Claude',
      category: 'Conversational AI',
      subcategory: 'Text Generation',
      description: 'Anthropic\'s AI assistant focused on being helpful, harmless, and honest.',
      website: 'https://claude.ai',
      pricing: 'Freemium',
      pros: ['Strong reasoning abilities', 'Ethical guidelines', 'Long context window', 'Detailed responses'],
      cons: ['Slower response times', 'More conservative outputs', 'Limited availability'],
      rating: 4.7,
      image: 'https://images.pexels.com/photos/8386419/pexels-photo-8386419.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['AI', 'Chatbot', 'Analysis', 'Research'],
      features: ['Long context', 'Ethical AI', 'Document analysis', 'Code review']
    },
    {
      id: 3,
      name: 'Midjourney',
      category: 'Image Generation',
      subcategory: 'Art Creation',
      description: 'Create stunning AI-generated artwork and images from text descriptions.',
      website: 'https://midjourney.com',
      pricing: 'Paid',
      pros: ['High-quality images', 'Artistic style', 'Active community', 'Regular model updates'],
      cons: ['Discord-only interface', 'No free tier', 'Limited control options'],
      rating: 4.9,
      image: 'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['AI', 'Art', 'Images', 'Creative'],
      features: ['Text-to-image', 'Artistic styles', 'High resolution', 'Community gallery']
    },
    {
      id: 4,
      name: 'Stable Diffusion',
      category: 'Image Generation',
      subcategory: 'Art Creation',
      description: 'Open-source text-to-image AI model for generating detailed images.',
      website: 'https://stability.ai',
      pricing: 'Free',
      pros: ['Open source', 'Customizable', 'No usage limits', 'Active community'],
      cons: ['Requires technical setup', 'Hardware intensive', 'Learning curve'],
      rating: 4.4,
      image: 'https://images.pexels.com/photos/8386441/pexels-photo-8386441.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['AI', 'Art', 'Open Source', 'Images'],
      features: ['Open source', 'Local deployment', 'Custom models', 'API access']
    },
    {
      id: 5,
      name: 'GitHub Copilot',
      category: 'Code Assistant',
      subcategory: 'Code Generation',
      description: 'AI-powered code completion and generation tool for developers.',
      website: 'https://github.com/features/copilot',
      pricing: 'Paid',
      pros: ['Excellent code suggestions', 'IDE integration', 'Multiple languages', 'Context aware'],
      cons: ['Subscription required', 'Privacy concerns', 'Sometimes incorrect'],
      rating: 4.6,
      image: 'https://images.pexels.com/photos/8386435/pexels-photo-8386435.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['AI', 'Coding', 'Development', 'IDE'],
      features: ['Code completion', 'Multiple languages', 'IDE integration', 'Context awareness']
    },
    {
      id: 6,
      name: 'Cursor',
      category: 'Code Assistant',
      subcategory: 'Code Editor',
      description: 'AI-first code editor built for pair-programming with AI.',
      website: 'https://cursor.sh',
      pricing: 'Freemium',
      pros: ['AI-first design', 'Natural language editing', 'Fast performance', 'Modern interface'],
      cons: ['New platform', 'Limited extensions', 'Learning curve'],
      rating: 4.5,
      image: 'https://images.pexels.com/photos/8386450/pexels-photo-8386450.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['AI', 'Editor', 'Development', 'Coding'],
      features: ['AI chat', 'Code generation', 'Natural language', 'Fast editing']
    }
  ];

  const categories = ['all', 'Conversational AI', 'Image Generation', 'Code Assistant', 'Video AI', 'Data Analysis', 'Audio AI', 'Writing & Content', 'Productivity'];
  
  const subcategories = {
    'all': ['all'],
    'Conversational AI': ['all', 'Text Generation', 'Chatbots', 'Virtual Assistants'],
    'Image Generation': ['all', 'Art Creation', 'Photo Editing', 'Design Tools'],
    'Code Assistant': ['all', 'Code Generation', 'Code Editor', 'Debugging'],
    'Video AI': ['all', 'Video Generation', 'Video Editing', 'Animation'],
    'Data Analysis': ['all', 'Analytics', 'Visualization', 'Machine Learning'],
    'Audio AI': ['all', 'Voice Synthesis', 'Music Generation', 'Audio Processing'],
    'Writing & Content': ['all', 'Content Creation', 'Copywriting', 'Editing'],
    'Productivity': ['all', 'Task Management', 'Automation', 'Organization']
  };

  const filteredTools = availableTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'all' || tool.subcategory === selectedSubcategory;
    
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const addTool = (tool: Tool) => {
    if (selectedTools.length < 3 && !selectedTools.find(t => t.id === tool.id)) {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const removeTool = (toolId: number) => {
    setSelectedTools(selectedTools.filter(t => t.id !== toolId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Compare AI Tools</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Compare up to 3 AI tools side by side to make informed decisions.
          </p>
        </div>

        <div className="p-6">
          {/* Selected Tools Comparison */}
          {selectedTools.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Comparing {selectedTools.length} tool{selectedTools.length > 1 ? 's' : ''}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {selectedTools.map((tool) => (
                  <div key={tool.id} className="bg-white border-2 border-primary-200 rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={tool.image}
                          alt={tool.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-bold text-gray-900">{tool.name}</h3>
                          <p className="text-sm text-gray-600">{tool.category}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeTool(tool.id)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                        <p className="text-sm text-gray-600">{tool.description}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Pricing</h4>
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                          {tool.pricing}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Rating</h4>
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">{tool.rating}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-1" />
                          Pros
                        </h4>
                        <ul className="space-y-1">
                          {tool.pros.map((pro, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <Minus className="h-4 w-4 text-red-500 mr-1" />
                          Cons
                        </h4>
                        <ul className="space-y-1">
                          {tool.cons.map((con, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Key Features</h4>
                        <div className="flex flex-wrap gap-1">
                          {tool.features.map((feature, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <a
                          href={tool.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center space-x-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Visit Website</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Add more tools slots */}
              {selectedTools.length < 3 && (
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex items-center justify-center">
                  <div className="text-center">
                    <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">Add Another Tool</p>
                    <p className="text-sm text-gray-400">Up to 3 tools</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Compare Button */}
            {selectedTools.length >= 2 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    // Scroll to top of comparison
                    document.querySelector('.bg-white.border-2.border-primary-200')?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start' 
                    });
                  }}
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                >
                  View Detailed Comparison
                </button>
              </div>
            )}
          </div>
        )}

          {/* Tool Selection */}
          {selectedTools.length < 3 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedTools.length === 0 ? 'Choose Tools to Compare' : 'Add More Tools'}
              </h3>
              
              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory('all');
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
                
                {selectedCategory !== 'all' && (
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {subcategories[selectedCategory as keyof typeof subcategories]?.map((subcategory) => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory === 'all' ? 'All Subcategories' : subcategory}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTools.find(t => t.id === tool.id)
                        ? 'border-primary-200 bg-primary-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                    onClick={() => addTool(tool)}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={tool.image}
                        alt={tool.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{tool.name}</h4>
                        <p className="text-sm text-gray-600">{tool.category}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="text-yellow-500 text-sm">★</span>
                          <span className="text-sm text-gray-500">{tool.rating}</span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-500">{tool.pricing}</span>
                        </div>
                      </div>
                      {selectedTools.find(t => t.id === tool.id) ? (
                        <Check className="h-5 w-5 text-primary-500" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredTools.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No tools found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolComparisonModal;