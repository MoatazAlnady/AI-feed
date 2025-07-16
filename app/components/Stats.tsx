import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Star, Zap } from 'lucide-react';

const stats = [
  {
    icon: Zap,
    title: 'AI Tools',
    value: '500+',
    description: 'Curated AI tools across all categories',
    color: 'text-blue-500',
  },
  {
    icon: Users,
    title: 'Active Users',
    value: '50k+',
    description: 'Monthly active users discovering AI tools',
    color: 'text-green-500',
  },
  {
    icon: Star,
    title: 'Reviews',
    value: '10k+',
    description: 'Authentic reviews from real users',
    color: 'text-yellow-500',
  },
  {
    icon: TrendingUp,
    title: 'Growth',
    value: '250%',
    description: 'Platform growth in the last year',
    color: 'text-purple-500',
  },
];

export default function Stats() {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Platform Statistics</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of users who trust AI Nexus to discover the best AI tools
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-center mb-2">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <CardTitle className="text-2xl font-bold">{stat.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-2">{stat.title}</h3>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}