import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Image, 
  Video, 
  Code, 
  BarChart, 
  Mic, 
  FileText, 
  Zap,
  ArrowRight 
} from 'lucide-react';

const CategoriesPreview: React.FC = () => {
  const categories = [
    {
      name: 'Conversational AI',
      description: 'Chatbots, virtual assistants, and dialogue systems',
      icon: MessageSquare,
      count: 145,
      color: 'from-blue-500 to-blue-600',
      tools: ['ChatGPT', 'Claude', 'Bard']
    },
    {
      name: 'Image Generation',
      description: 'AI-powered image creation and editing tools',
      icon: Image,
      count: 89,
      color: 'from-purple-500 to-purple-600',
      tools: ['Midjourney', 'DALL-E', 'Stable Diffusion']
    },
    {
      name: 'Video AI',
      description: 'Video generation, editing, and enhancement',
      icon: Video,
      count: 67,
      color: 'from-red-500 to-red-600',
      tools: ['Runway', 'Pika Labs', 'Synthesia']
    },
    {
      name: 'Code Assistant',
      description: 'Programming help, code generation, and debugging',
      icon: Code,
      count: 78,
      color: 'from-green-500 to-green-600',
      tools: ['GitHub Copilot', 'Cursor', 'Replit']
    },
    {
      name: 'Data Analysis',
      description: 'Analytics, visualization, and insights',
      icon: BarChart,
      count: 56,
      color: 'from-yellow-500 to-orange-500',
      tools: ['Julius', 'DataGPT', 'Columns']
    },
    {
      name: 'Audio AI',
      description: 'Voice synthesis, music, and audio processing',
      icon: Mic,
      count: 43,
      color: 'from-indigo-500 to-indigo-600',
      tools: ['ElevenLabs', 'Murf', 'Speechify']
    },
    {
      name: 'Writing & Content',
      description: 'Content creation, copywriting, and editing',
      icon: FileText,
      count: 92,
      color: 'from-teal-500 to-teal-600',
      tools: ['Jasper', 'Copy.ai', 'Writesonic']
    },
    {
      name: 'Productivity',
      description: 'Workflow automation and task management',
      icon: Zap,
      count: 134,
      color: 'from-pink-500 to-pink-600',
      tools: ['Notion AI', 'Zapier', 'Motion']
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Explore by Category
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Find the perfect AI tool for your specific needs across various categories and use cases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              to={`/categories/${category.name.toLowerCase().replace(' ', '-')}`}
              className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`inline-flex p-3 bg-gradient-to-r ${category.color} rounded-xl mb-4 group-hover:shadow-lg transition-shadow`}>
                <category.icon className="h-6 w-6 text-white" />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {category.name}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                {category.description}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                <span>{category.count} tools</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
              
              <div className="flex flex-wrap gap-1">
                {category.tools.slice(0, 2).map((tool) => (
                  <span
                    key={tool}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md"
                  >
                    {tool}
                  </span>
                ))}
                {category.tools.length > 2 && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md">
                    +{category.tools.length - 2}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/categories"
            className="inline-flex items-center px-8 py-3 border-2 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 font-semibold rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            View All Categories
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoriesPreview;