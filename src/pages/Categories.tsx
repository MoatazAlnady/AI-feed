import React, { useState, useEffect } from 'react';
import ChatDock from '@/components/ChatDock';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquare, Image, Video, Code, BarChart3, Music, FileText, 
  Brain, Zap, Gamepad2, Camera, Globe, Wrench, Cpu, Lightbulb,
  Smartphone, Monitor, Headphones, Mic, Edit, Search, Shield,
  Database, Cloud, Workflow, Settings, PieChart, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Categories: React.FC = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const iconMap: { [key: string]: any } = {
    'MessageSquare': MessageSquare,
    'Image': Image,
    'Video': Video,
    'Code': Code,
    'BarChart3': BarChart3,
    'Music': Music,
    'FileText': FileText,
    'Brain': Brain,
    'Zap': Zap,
    'Gamepad2': Gamepad2,
    'Camera': Camera,
    'Globe': Globe,
    'Wrench': Wrench,
    'Cpu': Cpu,
    'Lightbulb': Lightbulb,
    'Smartphone': Smartphone,
    'Monitor': Monitor,
    'Headphones': Headphones,
    'Mic': Mic,
    'Edit': Edit,
    'Search': Search,
    'Shield': Shield,
    'Database': Database,
    'Cloud': Cloud,
    'Workflow': Workflow,
    'Settings': Settings,
    'PieChart': PieChart,
    'TrendingUp': TrendingUp
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Fetch categories from database
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Get tool counts for each category
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('category_id')
        .eq('status', 'published');

      if (toolsError) throw toolsError;

      // Count tools per category
      const toolCounts = toolsData?.reduce((acc: any, tool) => {
        acc[tool.category_id] = (acc[tool.category_id] || 0) + 1;
        return acc;
      }, {}) || {};

      // Transform to display format
      const transformedCategories = categoriesData?.map(category => ({
        name: category.name,
        description: category.description || 'AI tools in this category',
        icon: iconMap[category.icon] || FileText,
        color: category.color || '#3b82f6',
        count: toolCounts[category.id] || 0,
        tools: [] // We could fetch sample tools here if needed
      })) || [];

      setCategories(transformedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to static data
      setCategories([
        {
          name: 'Conversational AI',
          description: 'Chatbots, virtual assistants, and dialogue systems',
          icon: MessageSquare,
          color: '#3b82f6',
          count: 0,
          tools: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('categories.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t('categories.subtitle')}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.name}
                to={`/tools?category=${category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="group"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 group-hover:border-primary-300 dark:group-hover:border-primary-700">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg text-white flex-shrink-0" style={{ backgroundColor: category.color }}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {category.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          {t('categories.toolCount', { count: category.count })}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {t('categories.viewAll')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Popular Tools Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap gap-1">
                      {category.tools.slice(0, 3).map((tool, index) => (
                        <span
                          key={tool}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('categories.ctaTitle')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            {t('categories.ctaDesc')}
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
          >
            {t('categories.submitTool')}
          </Link>
        </div>
      </div>

      {/* Chat Dock */}
      <ChatDock />
    </div>
  );
};

export default Categories;