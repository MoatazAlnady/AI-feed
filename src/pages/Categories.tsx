import React from 'react';
import { 
  Brain, 
  Image, 
  Video, 
  Code, 
  BarChart3, 
  Music, 
  FileText, 
  Zap,
  MessageSquare,
  Gamepad2,
  Camera,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Categories: React.FC = () => {
  const categories = [
    {
      name: 'Conversational AI',
      description: 'Chatbots, virtual assistants, and dialogue systems',
      icon: MessageSquare,
      color: 'bg-blue-500',
      count: 45,
      tools: ['ChatGPT', 'Claude', 'Bard']
    },
    {
      name: 'Image Generation',
      description: 'AI-powered image creation and editing tools',
      icon: Image,
      color: 'bg-purple-500',
      count: 38,
      tools: ['DALL-E', 'Midjourney', 'Stable Diffusion']
    },
    {
      name: 'Video AI',
      description: 'Video generation, editing, and enhancement',
      icon: Video,
      color: 'bg-red-500',
      count: 22,
      tools: ['Runway', 'Synthesia', 'Luma AI']
    },
    {
      name: 'Code Assistant',
      description: 'Programming help, code generation, and debugging',
      icon: Code,
      color: 'bg-green-500',
      count: 31,
      tools: ['GitHub Copilot', 'Cursor', 'Replit']
    },
    {
      name: 'Data Analysis',
      description: 'Analytics, insights, and data visualization',
      icon: BarChart3,
      color: 'bg-yellow-500',
      count: 27,
      tools: ['Tableau', 'DataRobot', 'H2O.ai']
    },
    {
      name: 'Audio AI',
      description: 'Voice synthesis, music generation, and audio editing',
      icon: Music,
      color: 'bg-pink-500',
      count: 19,
      tools: ['ElevenLabs', 'Mubert', 'AIVA']
    }
  ];

  return (
    <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Tool Categories
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Explore our curated collection of AI tools organized by category. 
            Find the perfect tool for your specific needs.
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
                    <div className={`${category.color} p-3 rounded-lg text-white flex-shrink-0`}>
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
                          {category.count} tools
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          View all →
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
            Can't find what you're looking for?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Submit your favorite AI tool to help others discover amazing new technologies.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
          >
            Submit a Tool
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Categories;