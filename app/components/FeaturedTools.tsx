import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink } from 'lucide-react';

const featuredTools = [
  {
    id: 1,
    name: 'ChatGPT',
    description: 'AI-powered conversational assistant for various tasks',
    category: 'AI Writing',
    rating: 4.8,
    pricing: 'Freemium',
    featured: true,
  },
  {
    id: 2,
    name: 'Midjourney',
    description: 'AI image generation tool for creative visuals',
    category: 'Design',
    rating: 4.9,
    pricing: 'Paid',
    featured: true,
  },
  {
    id: 3,
    name: 'Notion AI',
    description: 'AI-enhanced productivity and note-taking platform',
    category: 'Productivity',
    rating: 4.7,
    pricing: 'Freemium',
    featured: true,
  },
];

export default function FeaturedTools() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Featured AI Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredTools.map((tool) => (
            <Card key={tool.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{tool.name}</CardTitle>
                  <Badge variant="outline">{tool.pricing}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm text-muted-foreground">{tool.rating}</span>
                  </div>
                  <Badge variant="secondary">{tool.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{tool.description}</p>
                <Button className="w-full">
                  View Details
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}