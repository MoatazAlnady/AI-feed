import React from 'react';
import { MessageSquare, Users, Lightbulb, TrendingUp, Star, Calendar } from 'lucide-react';

const Community: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#111827] text-white">
      {/* Header */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            AI Nexus Community
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Connect with like-minded AI enthusiasts, share knowledge, and build the future together.
          </p>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-8 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-700">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">10K+</div>
              <div className="text-sm text-gray-400">Active Members</div>
            </div>
            <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-700">
              <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">50K+</div>
              <div className="text-sm text-gray-400">Discussions</div>
            </div>
            <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-700">
              <Lightbulb className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-sm text-gray-400">Shared Projects</div>
            </div>
            <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-700">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">95%</div>
              <div className="text-sm text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Features */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-white">Join the Conversation</h2>
            <p className="text-xl text-gray-300">
              Engage with our vibrant community of AI creators and innovators
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <MessageSquare className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-white">Discussion Forums</h3>
              <p className="text-gray-300 mb-4">
                Join topic-specific discussions about AI trends, tools, and techniques.
              </p>
              <button className="text-primary hover:underline">
                Browse Forums →
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-white">Networking</h3>
              <p className="text-gray-300 mb-4">
                Connect with fellow creators, share experiences, and find collaborators.
              </p>
              <button className="text-primary hover:underline">
                Find Members →
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <Lightbulb className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-white">Knowledge Sharing</h3>
              <p className="text-gray-300 mb-4">
                Share tutorials, tips, and best practices with the community.
              </p>
              <button className="text-primary hover:underline">
                Share Knowledge →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gray-900/50">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to join our community?</h2>
          <p className="text-lg text-gray-300 mb-8">
            Sign up today and start connecting with thousands of AI enthusiasts.
          </p>
          <a
            href="/auth"
            className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Join Community
          </a>
        </div>
      </section>
    </div>
  );
};

export default Community;