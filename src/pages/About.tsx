import React from 'react';
import { Zap, Users, Target, Globe, Award, Briefcase } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            About AI Nexus
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're building the world's most comprehensive platform for AI tools, talented creators, 
            and innovative employers to connect and collaborate.
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
                To democratize access to AI technology by creating a unified platform where creators 
                can showcase their skills, employers can find top talent, and everyone can discover 
                the best AI tools for their needs.
              </p>
              <p className="text-lg text-muted-foreground">
                We believe that the future of work is collaborative, intelligent, and accessible to all.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-card rounded-lg border">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Innovation</h3>
                <p className="text-sm text-muted-foreground">Cutting-edge AI solutions</p>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Community</h3>
                <p className="text-sm text-muted-foreground">Connecting brilliant minds</p>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border">
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Purpose</h3>
                <p className="text-sm text-muted-foreground">Meaningful impact</p>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border">
                <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Global</h3>
                <p className="text-sm text-muted-foreground">Worldwide accessibility</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Join Our Community</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Whether you're a creator looking to showcase your skills, an employer seeking talent, 
            or someone exploring AI tools, AI Nexus is your gateway to the future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/auth" 
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get Started Today
            </a>
            <a 
              href="/tools" 
              className="inline-flex items-center justify-center px-6 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
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