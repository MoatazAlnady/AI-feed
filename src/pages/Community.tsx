import React from 'react';
import { MessageSquare, Users, Lightbulb, TrendingUp, Star, Calendar } from 'lucide-react';

const Community: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            AI Nexus Community
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with like-minded AI enthusiasts, share knowledge, and build the future together.
          </p>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-8 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-card rounded-lg border border-border">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">10K+</div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
            <div className="text-center p-6 bg-card rounded-lg border border-border">
              <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">50K+</div>
              <div className="text-sm text-muted-foreground">Discussions</div>
            </div>
            <div className="text-center p-6 bg-card rounded-lg border border-border">
              <Lightbulb className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div className="text-sm text-muted-foreground">Shared Projects</div>
            </div>
            <div className="text-center p-6 bg-card rounded-lg border border-border">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">95%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Features */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Join the Conversation</h2>
            <p className="text-xl text-muted-foreground">
              Engage with our vibrant community of AI creators and innovators
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg border border-border p-6">
              <Calendar className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Events</h3>
              <p className="text-muted-foreground mb-4">
                Join virtual and in-person events, workshops, and conferences.
              </p>
              <a href="/community/features" className="text-primary hover:underline">
                Browse Events →
              </a>
            </div>
            
            <div className="bg-card rounded-lg border border-border p-6">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Groups</h3>
              <p className="text-muted-foreground mb-4">
                Create and join specialized groups for focused discussions and networking.
              </p>
              <a href="/community/features" className="text-primary hover:underline">
                Explore Groups →
              </a>
            </div>
            
            <div className="bg-card rounded-lg border border-border p-6">
              <MessageSquare className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Discussions</h3>
              <p className="text-muted-foreground mb-4">
                Participate in group discussions and share knowledge with the community.
              </p>
              <a href="/community/features" className="text-primary hover:underline">
                Join Discussions →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to join our community?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Sign up today and start connecting with thousands of AI enthusiasts.
          </p>
          <a
            href="/auth"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Join Community
          </a>
        </div>
      </section>
    </div>
  );
};

export default Community;