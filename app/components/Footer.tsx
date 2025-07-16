import { Link } from 'react-router-dom';
import { Zap, Twitter, Linkedin, Github, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-secondary/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">AI Nexus</span>
            </div>
            <p className="text-muted-foreground">
              Your ultimate destination for discovering and comparing AI tools.
            </p>
            <div className="flex space-x-4">
              <Twitter className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer" />
              <Linkedin className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer" />
              <Github className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer" />
              <Mail className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <div className="flex flex-col space-y-2">
              <Link to="/tools" className="text-muted-foreground hover:text-primary">Browse Tools</Link>
              <Link to="/categories" className="text-muted-foreground hover:text-primary">Categories</Link>
              <Link to="/blog" className="text-muted-foreground hover:text-primary">Blog</Link>
              <Link to="/about" className="text-muted-foreground hover:text-primary">About</Link>
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold">Resources</h4>
            <div className="flex flex-col space-y-2">
              <Link to="/api" className="text-muted-foreground hover:text-primary">API Documentation</Link>
              <Link to="/submit" className="text-muted-foreground hover:text-primary">Submit a Tool</Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link>
              <Link to="/terms" className="text-muted-foreground hover:text-primary">Terms of Service</Link>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact</h4>
            <div className="text-muted-foreground">
              <p>support@ainexus.com</p>
              <p>+1 (555) 123-4567</p>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 AI Nexus. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}