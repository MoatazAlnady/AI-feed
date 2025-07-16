import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add newsletter subscription logic here
    setIsSubscribed(true);
    setEmail('');
  };

  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Stay Updated</CardTitle>
            <p className="text-muted-foreground">
              Get the latest AI tools and insights delivered to your inbox weekly
            </p>
          </CardHeader>
          <CardContent>
            {!isSubscribed ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input 
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full">
                  Subscribe to Newsletter
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <div>
                  <h3 className="font-semibold">Thank you for subscribing!</h3>
                  <p className="text-muted-foreground">
                    You'll receive our weekly newsletter with the latest AI tools and insights.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}