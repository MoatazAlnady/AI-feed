import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Grid, List, GitCompare, Star, ExternalLink, Bookmark, Zap, Plus, TrendingUp, MoreHorizontal } from 'lucide-react';
import ToolComparisonModal from '../components/ToolComparisonModal';
import PromoteContentModal from '../components/PromoteContentModal';
import { useAuth } from '../context/AuthContext';

interface Tool {
  id: number;
  name: string;
  description: string;
  category: string;
  rating: number;
  reviews: number;
  pricing: string;
  image: string;
  tags: string[];
  website: string;
}

const Tools: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showComparison, setShowComparison] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    'All Categories',
    'Conversational AI',
    'Image Generation',
    'Video AI',
    'Code Assistant',
    'Data Analysis',
    'Audio AI',
    'Writing & Content',
    'Productivity'
  ];

  useEffect(() => {
    const fetchTools = async () => {
      try {
        // In real app, fetch from API
        // const response = await fetch('/api/tools');
        // const data = await response.json();
        // setTools(data);
        setTools([]); // No dummy data
      } catch (error) {
        console.error('Error fetching tools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all-categories' || tool.category === selectedCategory;
    
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
                    <option key={category} value={category.toLowerCase().replace(' ', '-')}>
                      {category}
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
              {selectedCategory !== 'all-categories' && ` in ${selectedCategory.replace('-', ' ')}`}
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
                      <div className="relative">
                        <img
                          src={tool.image}
                          alt={tool.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                          <Bookmark className="h-4 w-4 text-gray-600" />
                        </button>
                        <div className="absolute bottom-4 left-4">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-sm font-medium text-gray-700 rounded-full">
                            {tool.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                            {tool.name}
                          </h3>
                          <div className="flex items-center space-x-1 text-sm text-yellow-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-gray-600 font-medium">{tool.rating}</span>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {tool.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {tool.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-primary-50 text-primary-600 text-xs font-medium rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm text-gray-500">
                            {tool.reviews.toLocaleString()} reviews
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            {tool.pricing}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Link
                            to={`/tools/${tool.id}`}
                            className="flex-1 bg-primary-500 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                          >
                            Learn More
                          </Link>
                          <button 
                            onClick={() => {
                              setSelectedTool(tool);
                              setShowPromoteModal(true);
                            }}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Promote Tool"
                          >
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                          </button>
                          <button 
                            onClick={() => setShowComparison(true)}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Compare"
                          >
                            <GitCompare className="h-4 w-4 text-gray-600" />
                          </button>
                          <a
                            href={tool.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Visit Website"
                          >
                            <ExternalLink className="h-4 w-4 text-gray-600" />
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
                        <img
                          src={tool.image}
                          alt={tool.name}
                          className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{tool.name}</h3>
                              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                                {tool.category}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-yellow-500">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="text-gray-600 font-medium">{tool.rating}</span>
                              <span className="text-gray-500">({tool.reviews.toLocaleString()})</span>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{tool.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {tool.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-gray-900">
                              {tool.pricing}
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                to={`/tools/${tool.id}`}
                                className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                              >
                                Learn More
                              </Link>
                              <button 
                                onClick={() => {
                                  setSelectedTool(tool);
                                  setShowPromoteModal(true);
                                }}
                                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                title="Promote Tool"
                              >
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                              </button>
                              <button 
                                onClick={() => setShowComparison(true)}
                                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                title="Compare"
                              >
                                <GitCompare className="h-4 w-4 text-gray-600" />
                              </button>
                              <a
                                href={tool.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                title="Visit Website"
                              >
                                <ExternalLink className="h-4 w-4 text-gray-600" />
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
      </div>

      {/* Tool Comparison Modal */}
      <ToolComparisonModal
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
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