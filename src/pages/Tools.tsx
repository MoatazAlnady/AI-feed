import React, { useState, useEffect } from 'react';
import ChatDock from '../components/ChatDock';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Grid, List, GitCompare, Star, ExternalLink, Bookmark, Zap, Plus, TrendingUp, MoreHorizontal } from 'lucide-react';
import ToolComparisonModal from '../components/ToolComparisonModal';
import PromoteContentModal from '../components/PromoteContentModal';
import ToolStars from '../components/ToolStars';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/providers/ThemeProvider';

interface Tool {
  id: string;
  name: string;
  description: string;
  category_id: string;
  category_name?: string;
  subcategory?: string;
  pricing: string;
  website: string;
  features: string[];
  pros: string[];
  cons: string[];
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  average_rating: number;
  review_count: number;
}

const Tools: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showComparison, setShowComparison] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedToolsForComparison, setSelectedToolsForComparison] = useState<string[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchToolsAndCategories();
  }, []);

  const fetchToolsAndCategories = async () => {
    try {
      console.log('Fetching tools and categories...');
      
      // Fetch approved tools - use existing denormalized columns
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      console.log('Tools query result:', { toolsData, toolsError });

      if (toolsError) throw toolsError;

      // Fetch categories separately
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      console.log('Categories query result:', { categoriesData, categoriesError });

      if (categoriesError) throw categoriesError;

      // Create a map for quick category lookup
      const categoryMap = new Map(categoriesData?.map(cat => [cat.id, cat.name]) || []);

      // Transform tools data with category names and ratings
      const transformedTools = (toolsData || []).map(tool => ({
        ...tool,
        category_name: categoryMap.get(tool.category_id) || 'Uncategorized',
        average_rating: tool.average_rating || 0,
        review_count: tool.review_count || 0
      }));

      console.log('Transformed tools:', transformedTools);
      console.log('Categories for dropdown:', categoriesData);

      setTools(transformedTools);
      setCategories([{ id: 'all', name: 'All Categories' }, ...(categoriesData || [])]);
    } catch (error) {
      console.error('Error fetching tools and categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tool.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || tool.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  AI Tools Directory
                </h1>
                <p className="text-xl text-gray-600">
                  Discover and explore AI tools across various categories
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/tools/create"
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-primary text-white rounded-xl hover:opacity-90 transition-all duration-200 font-semibold shadow-md"
                >
                  <Plus className="h-5 w-5" />
                  <span>Submit A New AI Tool</span>
                </Link>
                <button
                  onClick={() => setShowComparison(true)}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-semibold"
                >
                  <GitCompare className="h-5 w-5" />
                  <span>Compare Tools</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search AI tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredTools.length} tools
              {searchTerm && ` for "${searchTerm}"`}
              {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name || ''}`}
            </p>
          </div>

          {/* Empty State */}
          {tools.length === 0 ? (
            <div className="text-center py-20">
              <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No AI Tools Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to submit an AI tool to our directory! Tools will appear here once they are submitted and approved.
              </p>
              <Link
                to="/tools/create"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-200 shadow-md"
              >
                <Plus className="h-5 w-5" />
                <span>Submit A New AI Tool</span>
              </Link>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-20">
              <Filter className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No tools found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
            </div>
          ) : (
            /* Tools Grid/List - Only show if there are tools */
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
                    >
                      <div className="relative h-48 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                        <div className="text-6xl text-primary-300">🤖</div>
                        <button 
                          className="absolute top-4 right-4 p-2 rounded-full border transition-colors"
                          style={{
                            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                            borderColor: theme === 'dark' ? '#334155' : '#d1d5db',
                            color: theme === 'dark' ? '#e2e8f0' : '#111827'
                          }}
                        >
                          <Bookmark className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-4 left-4">
                          <span 
                            className="px-3 py-1 text-sm font-medium rounded-full border"
                            style={{
                              backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                              borderColor: theme === 'dark' ? '#334155' : '#d1d5db',
                              color: theme === 'dark' ? '#e2e8f0' : '#111827'
                            }}
                          >
                            {tool.category_name}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                              {tool.name}
                            </h3>
                            <ToolStars 
                              value={tool.average_rating || 0}
                              reviewsCount={tool.review_count || 0}
                              size="sm"
                            />
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            {tool.pricing}
                          </div>
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {tool.description}
                        </p>

                        {tool.tags && tool.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                             {tool.tags.slice(0, 3).map((tag, index) => (
                               <span
                                 key={index}
                                 className="px-2 py-1 text-xs font-medium rounded-md border"
                                 style={{
                                   backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                   borderColor: theme === 'dark' ? '#334155' : '#d1d5db',
                                   color: theme === 'dark' ? '#e2e8f0' : '#111827'
                                 }}
                               >
                                 {tag}
                               </span>
                             ))}
                             {tool.tags.length > 3 && (
                               <span 
                                 className="px-2 py-1 text-xs font-medium rounded-md border"
                                 style={{
                                   backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                   borderColor: theme === 'dark' ? '#334155' : '#d1d5db',
                                   color: theme === 'dark' ? '#e2e8f0' : '#111827'
                                 }}
                               >
                                 +{tool.tags.length - 3} more
                               </span>
                             )}
                          </div>
                        )}

                        <div className="flex space-x-2">
                           <Link
                             to={`/tools/${tool.id}`}
                             className="flex-1 text-center py-2 px-4 rounded-lg font-medium transition-colors border"
                             style={{
                               backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                               borderColor: theme === 'dark' ? '#334155' : '#d1d5db',
                               color: theme === 'dark' ? '#e2e8f0' : '#111827'
                             }}
                           >
                             Learn More
                           </Link>
                           <button 
                             onClick={() => {
                               setSelectedTool(tool);
                               setShowPromoteModal(true);
                             }}
                             className="p-2 border rounded-lg transition-colors"
                             style={{
                               backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                               borderColor: theme === 'dark' ? '#334155' : '#d1d5db',
                               color: theme === 'dark' ? '#e2e8f0' : '#111827'
                             }}
                             title="Promote Tool"
                           >
                             <TrendingUp className="h-4 w-4" />
                           </button>
                           <a
                             href={tool.website}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="p-2 border rounded-lg transition-colors"
                             style={{
                               backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                               borderColor: theme === 'dark' ? '#334155' : '#d1d5db',
                               color: theme === 'dark' ? '#e2e8f0' : '#111827'
                             }}
                             title="Visit Website"
                           >
                             <ExternalLink className="h-4 w-4" />
                           </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6"
                    >
                      <div className="flex items-start space-x-6">
                        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center flex-shrink-0">
                          <div className="text-3xl">🤖</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{tool.name}</h3>
                              <div className="flex items-center gap-3 mb-2">
                                <ToolStars 
                                  value={tool.average_rating || 0}
                                  reviewsCount={tool.review_count || 0}
                                  size="sm"
                                />
                                <span 
                                  className="px-3 py-1 text-sm font-medium rounded-full border"
                                  style={{
                                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                    borderColor: theme === 'dark' ? '#334155' : '#d1d5db',
                                    color: theme === 'dark' ? '#e2e8f0' : '#111827'
                                  }}
                                >
                                  {tool.category_name}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              {tool.pricing}
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{tool.description}</p>
                          
                          {tool.tags && tool.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                               {tool.tags.slice(0, 5).map((tag, index) => (
                                 <span
                                   key={index}
                                   className="px-2 py-1 text-xs rounded-md border"
                                   style={{
                                     backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                     borderColor: theme === 'dark' ? '#334155' : '#d1d5db',
                                     color: theme === 'dark' ? '#e2e8f0' : '#111827'
                                   }}
                                 >
                                   {tag}
                                 </span>
                               ))}
                               {tool.tags.length > 5 && (
                                 <span 
                                   className="px-2 py-1 text-xs rounded-md border"
                                   style={{
                                     backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                     borderColor: theme === 'dark' ? '#334155' : '#d1d5db',
                                     color: theme === 'dark' ? '#e2e8f0' : '#111827'
                                   }}
                                 >
                                   +{tool.tags.length - 5} more
                                 </span>
                               )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                               <Link
                                 to={`/tools/${tool.id}`}
                                 className="py-2 px-4 rounded-lg font-medium transition-colors border"
                                 style={{
                                   backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                   borderColor: theme === 'dark' ? '#334155' : '#d1d5db',
                                   color: theme === 'dark' ? '#e2e8f0' : '#111827'
                                 }}
                               >
                                 Learn More
                               </Link>
                               <button 
                                 onClick={() => {
                                   setSelectedTool(tool);
                                   setShowPromoteModal(true);
                                 }}
                                 className="p-2 border rounded-lg transition-colors"
                                 style={{
                                   backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                   borderColor: theme === 'dark' ? '#334155' : '#d1d5db',
                                   color: theme === 'dark' ? '#e2e8f0' : '#111827'
                                 }}
                                 title="Promote Tool"
                               >
                                 <TrendingUp className="h-4 w-4" />
                               </button>
                               <a
                                 href={tool.website}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="p-2 border rounded-lg transition-colors"
                                 style={{
                                   backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                   borderColor: theme === 'dark' ? '#334155' : '#d1d5db',
                                   color: theme === 'dark' ? '#e2e8f0' : '#111827'
                                 }}
                                 title="Visit Website"
                               >
                                 <ExternalLink className="h-4 w-4" />
                               </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Chat Dock */}
        <ChatDock />
      </div>

      {/* Tool Comparison Modal */}
      <ToolComparisonModal
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        selectedTools={selectedToolsForComparison}
        tools={tools}
      />

      {/* Promote Modal */}
      {showPromoteModal && selectedTool && (
        <PromoteContentModal
          isOpen={showPromoteModal}
          onClose={() => setShowPromoteModal(false)}
          contentType="tool"
          contentId={selectedTool.id}
          contentTitle={selectedTool.name}
        />
      )}
    </>
  );
};

export default Tools;