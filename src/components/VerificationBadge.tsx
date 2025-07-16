import React from 'react';
import { Target, Users, Lightbulb, Award } from 'lucide-react';

const About: React.FC = () => {
  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'Democratizing access to AI tools and knowledge for everyone.'
    },
    {
      icon: Users,
      title: 'Community-First',
      description: 'Building a supportive community of AI enthusiasts and professionals.'
    },
    {
      icon: Lightbulb,
      title: 'Innovation-Focused',
      description: 'Constantly discovering and featuring cutting-edge AI technologies.'
    },
    {
      icon: Award,
      title: 'Quality-Assured',
      description: 'Curating only the highest quality and most reliable AI tools.'
    }
  ];

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            About AI Nexus
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            We're on a mission to make artificial intelligence accessible to everyone by providing 
            a comprehensive directory of AI tools, insightful content, and a thriving community 
            of AI enthusiasts and professionals.
          </p>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="prose prose-lg text-gray-600">
            <p className="mb-4">
              AI Nexus was born from the realization that while AI tools are rapidly transforming 
              industries, discovering the right tool for specific needs remained challenging. 
              Founded in 2024, we set out to create the most comprehensive and user-friendly 
              platform for AI tool discovery.
            </p>
            <p className="mb-4">
              Today, we serve over 50,000 professionals, entrepreneurs, and enthusiasts who rely 
              on our curated directory to stay ahead in the AI revolution. Our platform features 
              over 1,200 carefully reviewed AI tools across dozens of categories.
            </p>
            <p>
              But we're more than just a directory. We're building a community where AI knowledge 
              is shared, trends are discussed, and the future of artificial intelligence is shaped 
              together.
            </p>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg mr-4">
                    <value.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {value.title}
                  </h3>
                </div>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Meet Our Team</h2>
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Users className="h-12 w-12 text-white" />
            </div>
            <p className="text-gray-600">
              Our diverse team of AI researchers, developers, and content creators work tirelessly 
              to bring you the most up-to-date and comprehensive AI tool directory.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Get In Touch</h2>
          <p className="text-gray-600 mb-8">
            Have questions, suggestions, or want to submit an AI tool? We'd love to hear from you.
          </p>
          <button className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow">
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;