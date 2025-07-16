'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ExternalLink, Bookmark, Zap } from 'lucide-react';

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

const FeaturedTools: React.FC = () => {
  const [featuredTools, setFeaturedTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedTools = async () => {
      try {
        // In real app, fetch from API
        // const response = await fetch('/api/tools/featured');
        // const data = await response.json();
        // setFeaturedTools(data);
        setFeaturedTools([]); // No dummy data
      } catch (error) {
        console.error('Error fetching featured tools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedTools();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Featured AI Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the most popular and highly-rated AI tools trusted by users worldwide.
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (featuredTools.length === 0) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Featured AI Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the most popular and highly-rated AI tools trusted by users worldwide.
            </p>
          </div>
          
          <div className="text-center py-20">
            <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Featured Tools Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Featured tools will appear here once they are submitted and approved by our team.
            </p>
            <Link
              href="/submit-tool"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg transition-shadow"
            >
              Submit Your Tool
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Featured AI Tools
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the most popular and highly-rated AI tools trusted by users worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredTools.map((tool) => (
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
                    href={`/tools/${tool.id}`}
                    className="flex-1 bg-primary-500 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                  >
                    Learn More
                  </Link>
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-600" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/tools"
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg transition-shadow"
          >
            View All Tools
            <ExternalLink className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedTools;