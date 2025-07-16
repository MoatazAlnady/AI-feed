import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <section className="py-24 bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4 mr-2" />
            Discover the Future of AI
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Find the Perfect{' '}
            <span className="text-primary">AI Tool</span>{' '}
            for Every Task
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our comprehensive directory of AI tools, read reviews, compare features, 
            and discover the perfect solution for your needs.
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <div className="flex gap-2">
              <Input 
                placeholder="What AI tool are you looking for?" 
                className="flex-1"
              />
              <Button>
                Search
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-muted-foreground">AI Tools</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">50k+</div>
              <div className="text-muted-foreground">Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">25+</div>
              <div className="text-muted-foreground">Categories</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}