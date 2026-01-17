import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Send, Mail, User, MessageSquare } from 'lucide-react';

interface ContactFormProps {
  className?: string;
}

const ContactForm = ({ className = '' }: ContactFormProps) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    subject: '',
    message: '' 
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSending(true);
    
    try {
      // Simulate sending - in production, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Your Name *
        </Label>
        <Input 
          id="name"
          placeholder="John Doe" 
          value={formData.name} 
          onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} 
          required 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Your Email *
        </Label>
        <Input 
          id="email"
          type="email" 
          placeholder="john@example.com" 
          value={formData.email}
          onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} 
          required 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input 
          id="subject"
          placeholder="How can we help?" 
          value={formData.subject}
          onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="message" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Your Message *
        </Label>
        <Textarea 
          id="message"
          placeholder="Tell us what's on your mind..." 
          value={formData.message}
          onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} 
          required 
          rows={5}
        />
      </div>
      
      <Button type="submit" disabled={sending} className="w-full">
        {sending ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </>
        )}
      </Button>
    </form>
  );
};

export default ContactForm;
