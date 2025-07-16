import React, { useState, useEffect } from 'react';
import { Calendar, User, ArrowRight, Video, FileText, Edit } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  type: 'article' | 'video';
  image: string;
}

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // In real app, fetch from API
        // const response = await fetch('/api/blog/posts');
        // const data = await response.json();
        // setPosts(data);
        setPosts([]); // No dummy data
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            AI Insights Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay informed with the latest trends, tutorials, and insights from the world of artificial intelligence.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Articles Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to share your AI insights! Articles will appear here once they are submitted and approved.
            </p>
            <a
              href="/submit-article"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg transition-shadow"
            >
              <Edit className="h-5 w-5 mr-2" />
              Write an Article
            </a>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {posts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-12">
                <div className="lg:flex">
                  <div className="lg:w-1/2">
                    <img
                      src={posts[0].image}
                      alt={posts[0].title}
                      className="w-full h-64 lg:h-full object-cover"
                    />
                  </div>
                  <div className="lg:w-1/2 p-8 lg:p-12">
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                        Featured
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {posts[0].category}
                      </span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                      {posts[0].title}
                    </h2>
                    <p className="text-gray-600 mb-6">
                      {posts[0].excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{posts[0].author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{posts[0].date}</span>
                        </div>
                        <span>{posts[0].readTime}</span>
                      </div>
                      <button className="flex items-center text-primary-600 font-medium hover:text-primary-700">
                        Read More
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Blog Posts Grid */}
            {posts.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.slice(1).map((post) => (
                  <article
                    key={post.id}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
                  >
                    <div className="relative">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center space-x-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full">
                          {post.type === 'video' ? (
                            <Video className="h-3 w-3 text-red-500" />
                          ) : (
                            <FileText className="h-3 w-3 text-blue-500" />
                          )}
                          <span className="text-xs font-medium text-gray-700 capitalize">
                            {post.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                          {post.category}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          <span>{post.author}</span>
                          <span>{post.date}</span>
                        </div>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Load More */}
            <div className="text-center mt-12">
              <button className="px-8 py-3 border-2 border-primary-200 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors">
                Load More Articles
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Blog;