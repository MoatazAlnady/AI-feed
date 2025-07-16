import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const categories = [
  { name: 'AI Writing', count: 45, color: 'bg-blue-500' },
  { name: 'Design', count: 32, color: 'bg-purple-500' },
  { name: 'Marketing', count: 28, color: 'bg-green-500' },
  { name: 'Development', count: 41, color: 'bg-orange-500' },
  { name: 'Productivity', count: 37, color: 'bg-red-500' },
  { name: 'Analytics', count: 23, color: 'bg-indigo-500' },
];

export default function CategoriesPreview() {
  return (
    <section className="py-16 bg-secondary/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.name} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <Badge variant="secondary">{category.count}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`h-2 rounded-full ${category.color}`}></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}