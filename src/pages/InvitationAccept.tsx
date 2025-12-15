import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, CheckCircle, XCircle, Loader2, UserPlus, LogIn } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  company_page_id: string;
  company_pages: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
  };
}

const InvitationAccept: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select(`
          id,
          email,
          role,
          status,
          expires_at,
          company_page_id,
          company_pages (
            id,
            name,
            logo_url,
            industry
          )
        `)
        .eq('token', token)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Invitation not found');
        return;
      }

      // Check if invitation is expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      // Check if invitation is already used
      if (data.status !== 'pending') {
        setError('This invitation has already been used');
        return;
      }

      setInvitation(data as unknown as InvitationData);
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCompany = async () => {
    if (!invitation || !user) return;

    // Check if user email matches invitation email
    const { data: authData } = await supabase.auth.getUser();
    const userEmail = authData?.user?.email?.toLowerCase();
    const invitationEmail = invitation.email.toLowerCase();

    if (userEmail !== invitationEmail) {
      toast({
        title: 'Email mismatch',
        description: `This invitation was sent to ${invitation.email}. Please sign in with that email address.`,
        variant: 'destructive',
      });
      return;
    }

    setJoining(true);
    try {
      // Add user as employee
      const { error: employeeError } = await supabase
        .from('company_employees')
        .insert({
          company_page_id: invitation.company_page_id,
          user_id: user.id,
          role: invitation.role as 'admin' | 'employee',
        });

      if (employeeError) {
        if (employeeError.message.includes('duplicate')) {
          toast({
            title: 'Already a member',
            description: 'You are already a member of this company.',
            variant: 'destructive',
          });
          navigate('/employer');
          return;
        }
        throw employeeError;
      }

      // Update invitation status
      await supabase
        .from('company_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      // Update user profile with company_page_id
      await supabase
        .from('user_profiles')
        .update({ company_page_id: invitation.company_page_id })
        .eq('id', user.id);

      toast({
        title: 'Welcome to the team!',
        description: `You've successfully joined ${invitation.company_pages.name}.`,
      });

      navigate('/employer');
    } catch (err: any) {
      toast({
        title: 'Failed to join',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  };

  const handleSignIn = () => {
    // Redirect to home with invite token in URL so AuthModal can pick it up
    navigate(`/?invite=${token}`);
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  const companyName = invitation.company_pages?.name || 'Unknown Company';
  const companyLogo = invitation.company_pages?.logo_url;
  const companyIndustry = invitation.company_pages?.industry;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 overflow-hidden">
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt={companyName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="h-8 w-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-xl">You're Invited!</CardTitle>
          <CardDescription className="mt-2">
            You've been invited to join <strong className="text-foreground">{companyName}</strong>
            {companyIndustry && <span className="block text-sm mt-1">({companyIndustry})</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Invited as:</strong>{' '}
              <span className="capitalize">{invitation.role}</span>
            </p>
            <p className="text-muted-foreground mt-1">
              <strong className="text-foreground">Email:</strong>{' '}
              {invitation.email}
            </p>
          </div>

          {user ? (
            <Button 
              onClick={handleJoinCompany} 
              className="w-full" 
              size="lg"
              disabled={joining}
            >
              {joining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join {companyName}
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Sign in or create an account to accept this invitation
              </p>
              <Button 
                onClick={handleSignIn} 
                className="w-full" 
                size="lg"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Continue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode="signin"
      />
    </div>
  );
};

export default InvitationAccept;
