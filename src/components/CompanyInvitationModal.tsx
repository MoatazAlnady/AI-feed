import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Mail, Shield, User, Check, AlertCircle, Loader2 } from 'lucide-react';

interface CompanyInvitationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyPageId: string;
  companyName: string;
  companyLogo?: string;
  currentEmployeeCount: number;
  maxEmployees: number;
  onInviteSent?: () => void;
}

const CompanyInvitationModal = ({
  open,
  onOpenChange,
  companyPageId,
  companyName,
  companyLogo,
  currentEmployeeCount,
  maxEmployees,
  onInviteSent,
}: CompanyInvitationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const remainingSlots = maxEmployees - currentEmployeeCount;
  const canInvite = remainingSlots > 0;

  const generateToken = () => {
    return crypto.randomUUID();
  };

  const sendInviteEmail = async (
    recipientEmail: string,
    token: string,
    selectedRole: 'admin' | 'employee'
  ): Promise<boolean> => {
    try {
      // Fetch inviter's name
      let inviterName = user?.email || 'A team member';
      if (user?.id) {
        const { data: inviterProfile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (inviterProfile?.full_name) {
          inviterName = inviterProfile.full_name;
        }
      }
      
      const { data, error } = await supabase.functions.invoke('send-company-invite', {
        body: {
          email: recipientEmail,
          inviteToken: token,
          companyName,
          companyLogo,
          role: selectedRole,
          inviterName,
        },
      });

      if (error) {
        console.error('Error sending invite email:', error);
        return false;
      }

      console.log('Invite email sent:', data);
      return true;
    } catch (error) {
      console.error('Error invoking send-company-invite:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canInvite) {
      toast({
        title: 'Limit reached',
        description: `You've reached the maximum of ${maxEmployees} employees. Upgrade to add more.`,
        variant: 'destructive',
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setEmailSent(false);
    setEmailError(false);

    try {
      // Check if invitation already exists for this email
      const { data: existingInvite } = await supabase
        .from('company_invitations')
        .select('id, status')
        .eq('company_page_id', companyPageId)
        .eq('email', email.trim().toLowerCase())
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        toast({
          title: 'Invitation exists',
          description: 'An invitation has already been sent to this email',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check if user is already an employee
      const { data: existingEmployee } = await supabase
        .from('company_employees')
        .select(`
          id,
          user_profiles!inner (email)
        `)
        .eq('company_page_id', companyPageId);

      const isAlreadyEmployee = existingEmployee?.some(
        (emp: any) => emp.user_profiles?.email?.toLowerCase() === email.trim().toLowerCase()
      );

      if (isAlreadyEmployee) {
        toast({
          title: 'Already a member',
          description: 'This person is already a team member',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const { error } = await supabase.from('company_invitations').insert({
        company_page_id: companyPageId,
        email: email.trim().toLowerCase(),
        token,
        role,
        invited_by: user?.id,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      });

      if (error) throw error;

      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);

      // Send the invitation email
      const emailSuccess = await sendInviteEmail(email.trim().toLowerCase(), token, role);
      
      if (emailSuccess) {
        setEmailSent(true);
        toast({
          title: 'Invitation sent!',
          description: `An email has been sent to ${email}`,
        });
      } else {
        setEmailError(true);
        toast({
          title: 'Invitation created',
          description: 'Email could not be sent, but you can share the link manually',
          variant: 'destructive',
        });
      }

      onInviteSent?.();
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invitation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Invitation link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('employee');
    setInviteLink(null);
    setCopied(false);
    setEmailSent(false);
    setEmailError(false);
    onOpenChange(false);
  };

  const resetForm = () => {
    setEmail('');
    setInviteLink(null);
    setEmailSent(false);
    setEmailError(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Invite someone to join {companyName}. They'll receive an email with a link to join.
          </DialogDescription>
        </DialogHeader>

        {!canInvite && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You've reached the maximum of {maxEmployees} team members. Upgrade
              your plan to invite more.
            </AlertDescription>
          </Alert>
        )}

        {inviteLink ? (
          <div className="space-y-4">
            {emailSent ? (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Invitation email sent to <strong>{email}</strong>!
                </AlertDescription>
              </Alert>
            ) : emailError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Couldn't send email. Share the link below manually:
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Invitation link (backup)</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              This link expires in 7 days.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
              <Button onClick={resetForm}>
                Invite Another
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={!canInvite || loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value: 'admin' | 'employee') => setRole(value)}
                disabled={!canInvite || loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div>Employee</div>
                        <div className="text-xs text-muted-foreground">
                          Can access company resources
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div>Admin</div>
                        <div className="text-xs text-muted-foreground">
                          Can manage team and settings
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              {remainingSlots} invitation{remainingSlots !== 1 ? 's' : ''} remaining
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!canInvite || loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompanyInvitationModal;
