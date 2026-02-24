import React from 'react';
import { Zap, Users, Target, Globe, FolderOpen, Briefcase, BookOpen, MessageSquare } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            About AI Feed
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The ultimate platform for discovering, comparing, and sharing AI tools. We help professionals, creators, and businesses find the right AI solutions — all in one place.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                AI is transforming every industry, but finding the right tool can be overwhelming. AI Feed was built to solve that — a curated, community-driven directory where you can explore thousands of AI tools, read honest reviews, and make informed decisions.
              </p>
              <p className="text-lg text-muted-foreground">
                Whether you're a developer looking for coding assistants, a designer seeking image generators, or a business leader exploring automation, AI Feed connects you with the tools that matter.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-card rounded-lg border">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Innovation</h3>
                <p className="text-sm text-muted-foreground">Cutting-edge AI tools updated daily</p>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Community</h3>
                <p className="text-sm text-muted-foreground">Connect with AI enthusiasts worldwide</p>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border">
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Purpose</h3>
                <p className="text-sm text-muted-foreground">Helping you find the right AI tools</p>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border">
                <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Global</h3>
                <p className="text-sm text-muted-foreground">AI tools from around the world</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-foreground text-center">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Tool Directory</h3>
              <p className="text-sm text-muted-foreground">Browse thousands of AI tools organized by category, pricing, and use case.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Community</h3>
              <p className="text-sm text-muted-foreground">Join groups, share posts, and discuss the latest in AI with like-minded professionals.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Jobs & Talent</h3>
              <p className="text-sm text-muted-foreground">Find AI jobs, hire talent, and grow your career in the AI industry.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Blog & Articles</h3>
              <p className="text-sm text-muted-foreground">Read and write articles about AI trends, tutorials, and tool reviews.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Join the AI Revolution</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Whether you're building with AI, researching tools, or sharing your expertise — AI Feed is your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/auth" 
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all duration-200"
            >
              Get Started
            </a>
            <a 
              href="/tools" 
              className="inline-flex items-center justify-center px-6 py-3 border border-border bg-card text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              Explore Tools
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
