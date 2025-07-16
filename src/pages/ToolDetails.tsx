import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ExternalLink, Bookmark, Share2, GitCompare, Check, Minus, ArrowLeft, Edit, AlertTriangle } from 'lucide-react';
import ToolComparisonModal from '../components/ToolComparisonModal';
import ToolReviewSystem from '../components/ToolReviewSystem';
import EditToolModal from '../components/EditToolModal';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Tool {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  website: string;
  pricing: string;
  rating: number;
  reviews: number;
  image: string;
  tags: string[];
  pros: string[];
  cons: string[];
  features: string[];
  submittedBy: string;
  submittedAt: string;
}

const ToolDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [showComparison, setShowComparison] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasPendingEditRequest, setHasPendingEditRequest] = useState(false);

  useEffect(() => {
    if (id) {
      fetchToolData();
      if (user) {
        checkPendingEditRequests();
      }
    }
  }, [id, user]);

  const fetchToolData = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, fetch from Supabase
      // const { data, error } = await supabase
      //   .from('tools')
      //   .select('*, tool_categories(name)')
      //   .eq('id', id)
      //   .single();
      
      // if (error) throw error;
      
      // For now, use mock data
      const mockTool: Tool = {
        id: id || '1',
        name: 'ChatGPT',
        category: 'Conversational AI',
        subcategory: 'Text Generation',
        description: 'ChatGPT is an advanced conversational AI developed by OpenAI that can assist with a wide variety of tasks including writing, coding, analysis, creative projects, and general question answering. Built on the GPT architecture, it provides human-like responses and can maintain context throughout conversations.',
        website: 'https://chat.openai.com',
        pricing: 'Freemium',
        rating: 4.8,
        reviews: 12500,
        image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=600',
        tags: ['AI', 'Chatbot', 'Writing', 'Coding', 'Analysis'],
        pros: [
          'Excellent text generation capabilities',
          'Wide range of use cases and applications',
          'Regular updates and improvements',
          'Large knowledge base covering many topics',
          'User-friendly interface',
          'Supports multiple languages'
        ],
        cons: [
          'Can occasionally generate inaccurate information',
          'Limited real-time data access',
          'Usage limits on free tier',
          'May struggle with very recent events',
          'Requires internet connection'
        ],
        features: [
          'Natural language processing',
          'Code generation and debugging',
          'Creative writing assistance',
          'Language translation',
          'Question answering',
          'Text summarization',
          'Educational support',
          'Business communication'
        ],
        submittedBy: 'OpenAI Team',
        submittedAt: '2023-11-30'
      };
      
      setTool(mockTool);
    } catch (error: any) {
      console.error('Error fetching tool:', error);
      setError('Failed to load tool data');
    } finally {
      setLoading(false);
    }
  };

  const checkPendingEditRequests = async () => {
    if (!user || !id) return;
    
    try {
      const { data, error } = await supabase
        .from('tool_edit_requests')
        .select('id')
        .eq('tool_id', id)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .limit(1);
      
      if (error) throw error;
      
      setHasPendingEditRequest(data && data.length > 0);
    } catch (error: any) {
      console.error('Error checking pending edit requests:', error);
    }
  };

  const handleCompareClick = () => {
    setShowComparison(true);
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleToolUpdated = () => {
    fetchToolData();
    checkPendingEditRequests();
  };

  if (loading) {
    return (
      <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Error Loading Tool
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || "We couldn't find the tool you're looking for."}
            </p>
            <button
              onClick={() => navigate('/tools')}
              className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              Back to Tools
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Tools</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="relative">
                  <img
                    src={tool.image}
                    alt={tool.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="px-3 py-1 bg-white/90 dark:bg-black/70 backdrop-blur-sm text-sm font-medium text-gray-700 dark:text-gray-300 rounded-full">
                        {tool.category}
                      </span>
                      <span className="px-3 py-1 bg-white/90 dark:bg-black/70 backdrop-blur-sm text-sm font-medium text-gray-700 dark:text-gray-300 rounded-full">
                        {tool.subcategory}
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{tool.name}</h1>
                    <div className="flex items-center space-x-4 text-white/90">
                      <div className="flex items-center space-x-1">
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="font-semibold">{tool.rating}</span>
                        <span>({tool.reviews.toLocaleString()} reviews)</span>
                      </div>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                        {tool.pricing}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  {/* Edit Button - For admins or logged in users */}
                  {user && (
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={handleEditClick}
                        disabled={!isAdmin && hasPendingEditRequest}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                          isAdmin 
                            ? 'bg-primary-500 text-white hover:bg-primary-600' 
                            : hasPendingEditRequest
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                              : 'border border-primary-200 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                        }`}
                        title={hasPendingEditRequest ? 'You already have a pending edit request for this tool' : ''}
                      >
                        <Edit className="h-4 w-4" />
                        <span>{isAdmin ? 'Edit Tool' : 'Suggest Edits'}</span>
                      </button>
                    </div>
                  )}

                  {/* Description */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About {tool.name}</h2>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{tool.description}</p>
                  </div>

                  {/* Tags */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {tool.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-medium cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-800/30 transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tool.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pros and Cons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Pros */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                        Pros
                      </h3>
                      <ul className="space-y-2">
                        {tool.pros.map((pro, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-gray-600 dark:text-gray-300">{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Cons */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Minus className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
                        Cons
                      </h3>
                      <ul className="space-y-2">
                        {tool.cons.map((con, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-gray-600 dark:text-gray-300">{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Submission Info */}
                  <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Submitted by <span className="font-medium">{tool.submittedBy}</span> on {new Date(tool.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Reviews Section */}
              <div className="mt-8">
                <ToolReviewSystem toolId={parseInt(tool.id) || 0} toolName={tool.name} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 sticky top-8">
                {/* Action Buttons */}
                <div className="space-y-3 mb-6">
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-shadow flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span>Visit {tool.name}</span>
                  </a>
                  
                  <button
                    onClick={handleCompareClick}
                    className="w-full bg-white dark:bg-gray-800 border-2 border-primary-200 dark:border-primary-700 text-primary-600 dark:text-primary-400 py-3 px-4 rounded-xl font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center justify-center space-x-2"
                  >
                    <GitCompare className="h-5 w-5" />
                    <span>Compare Tools</span>
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-2 mb-6">
                  <button className="flex-1 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                    <Bookmark className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Save</span>
                  </button>
                  <button className="flex-1 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                    <Share2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Share</span>
                  </button>
                </div>

                {/* Tool Info */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Category</h4>
                    <p className="text-gray-600 dark:text-gray-300">{tool.category}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Subcategory</h4>
                    <p className="text-gray-600 dark:text-gray-300">{tool.subcategory}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Pricing Model</h4>
                    <p className="text-gray-600 dark:text-gray-300">{tool.pricing}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">User Rating</h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="font-semibold text-gray-900 dark:text-white">{tool.rating}</span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400">({tool.reviews.toLocaleString()} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Related Tools */}
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Similar Tools</h4>
                  <div className="space-y-3">
                    {['Claude', 'Bard', 'Perplexity'].map((toolName, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">{toolName[0]}</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white">{toolName}</h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Conversational AI</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Comparison Modal */}
      <ToolComparisonModal
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        initialTool={{
          ...tool,
          id: parseInt(tool.id) || 0
        }}
      />

      {/* Edit Tool Modal */}
      <EditToolModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        toolId={tool.id}
        onToolUpdated={handleToolUpdated}
      />
    </>
  );
};

export default ToolDetail;