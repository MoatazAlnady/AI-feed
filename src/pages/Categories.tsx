import React from 'react';
import { 
  MessageSquare, 
  Image, 
  Video, 
  Code, 
  BarChart, 
  Mic, 
  FileText, 
  Zap 
} from 'lucide-react';

const Categories: React.FC = () => {
  const categories = [
    {
      name: 'Conversational AI',
      description: 'Chatbots, virtual assistants, and dialogue systems',
      icon: MessageSquare,
      count: 145,
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Image Generation',
      description: 'AI-powered image creation and editing tools',
      icon: Image,
      count: 89,
      color: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Video AI',
      description: 'Video generation, editing, and enhancement',
      icon: Video,
      count: 67,
      color: 'from-red-500 to-red-600',
    },
    {
      name: 'Code Assistant',
      description: 'Programming help, code generation, and debugging',
      icon: Code,
      count: 78,
      color: 'from-green-500 to-green-600',
    },
    {
      name: 'Data Analysis',
      description: 'Analytics, visualization, and insights',
      icon: BarChart,
      count: 56,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      name: 'Audio AI',
      description: 'Voice synthesis, music, and audio processing',
      icon: Mic,
      count: 43,
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      name: 'Writing & Content',
      description: 'Content creation, copywriting, and editing',
      icon: FileText,
      count: 92,
      color: 'from-teal-500 to-teal-600',
    },
    {
      name: 'Productivity',
      description: 'Workflow automation and task management',
      icon: Zap,
      count: 134,
      color: 'from-pink-500 to-pink-600',
    }
  ];

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            AI Tool Categories
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore AI tools organized by category to find exactly what you need for your projects.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <div
              key={category.name}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group cursor-pointer"
            >
              <div className="p-8">
                <div className={`inline-flex p-4 bg-gradient-to-r ${category.color} rounded-2xl mb-6 group-hover:shadow-lg transition-shadow`}>
                  <category.icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                  {category.name}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  {category.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {category.count} tools available
                  </span>
                  <span className="text-primary-600 font-medium group-hover:text-primary-700">
                    Explore →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;